import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import OrcamentoDetalhesModal from './OrcamentoDetalhesModal';

interface Orcamento {
  id: string;
  quantidade?: number;
  material?: string;
  dataEmissao?: string;
  operacao?: string;
  cliente?: string;
  valor?: number;
  status?: string;
  item?: Item;
}

interface Item {
  id: string;
  name: string;
  subname: string;
}

interface OrcamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orcamentos: Orcamento[];
  onConfirmPedido: (orcamentoId: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const OrcamentoModal: React.FC<OrcamentoModalProps> = ({
  isOpen,
  onClose,
  orcamentos,
  onConfirmPedido,
  isLoading = false,
  error = null
}) => {
  const [orcamentoDetalhes, setOrcamentoDetalhes] = useState<Orcamento | null>(null);
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [orcamentosFiltrados, setOrcamentosFiltrados] = useState<Orcamento[]>([]);

  // Filtra os orçamentos que não foram convertidos
  useEffect(() => {
    const naoConvertidos = orcamentos.filter(orcamento =>
      orcamento.status === 'PENDENTE' // Apenas orçamentos pendentes
    );
    setOrcamentosFiltrados(naoConvertidos);
  }, [orcamentos]);

  const handleExpand = (orcamento: Orcamento) => {
    setOrcamentoDetalhes(orcamento);
    setDetalhesModalOpen(true);
  };

  const handleDownload = () => {
    if (!orcamentoDetalhes) return;

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orçamento - ${orcamentoDetalhes.item?.name || ''}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
        }
        h1, h2, h3 { 
          color: #333; 
          border-bottom: 1px solid #ccc; 
          padding-bottom: 5px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 10px;
          margin-top: 15px;
        }
        .details-grid strong {
          color: #555;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 0.8em;
          color: #777;
        }
      </style>
    </head>
    <body>
      <h1>Detalhes do Orçamento</h1>

      <h3>Informações do Item</h3>
      <div class="details-grid">
        <strong>Nome do Item:</strong>
        <span>${orcamentoDetalhes.item?.name || 'Não informado'}</span>

        <strong>Código do Item:</strong>
        <span>${orcamentoDetalhes.item?.subname || 'Não informado'}</span>
      </div>

      <h3>Informações do Orçamento</h3>
      <div class="details-grid">
        <strong>Cliente:</strong>
        <span>${orcamentoDetalhes.cliente || 'Não informado'}</span>

        <strong>Valor:</strong>
        <span>${orcamentoDetalhes.valor ? `R$ ${orcamentoDetalhes.valor.toFixed(2)}` : 'Não definido'}</span>

        <strong>Quantidade:</strong>
        <span>${orcamentoDetalhes.quantidade || 'Não especificada'}</span>

        <strong>Material:</strong>
        <span>${orcamentoDetalhes.material || 'Não especificado'}</span>

        <strong>Operação:</strong>
        <span>${orcamentoDetalhes.operacao || 'Não especificada'}</span>

        <strong>Data de Emissão:</strong>
        <span>${orcamentoDetalhes.dataEmissao ? new Date(orcamentoDetalhes.dataEmissao).toLocaleDateString() : 'Não informada'}</span>
        
        <strong>Status:</strong>
        <span>${orcamentoDetalhes.status || 'Pendente'}</span>
      </div>

      <div class="footer">
        Emitido em: ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      alert('Por favor, habilite os pop-ups para imprimir o orçamento.');
    }
  };

  const handleConfirmPedido = async (orcamentoId: string) => {
    try {
      await onConfirmPedido(orcamentoId);
      // Remover o orçamento da lista local após confirmação
      setOrcamentosFiltrados(prev =>
        prev.filter(orcamento => orcamento.id !== orcamentoId)
      );
    } catch (err) {
      console.error('Erro ao confirmar pedido:', err);
      alert('Falha ao confirmar o pedido. Tente novamente.');
    }
  };

  return (
    <>
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
          <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-2xl font-bold text-white tracking-wide">Orçamentos Pendentes</h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-500/20 border border-red-500 text-red-300 rounded-xl text-center">
                  Erro ao carregar orçamentos: {error}
                </div>
              ) : (
                <div className="space-y-4">
                  {orcamentosFiltrados.length === 0 ? (
                    <p className="text-center text-slate-500 py-10 text-lg">Nenhum orçamento pendente no momento.</p>
                  ) : (
                    orcamentosFiltrados.map((orcamento) => (
                      <div key={orcamento.id} className="bg-[#0B1121] border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg font-bold text-indigo-400">{orcamento.item?.name || 'Item não especificado'}</h3>
                          <p className="text-slate-300 text-sm"><strong className="text-slate-500">Cliente:</strong> <span className="font-medium text-slate-200">{orcamento.cliente || 'Não informado'}</span></p>
                          <p className="text-slate-300 text-sm"><strong className="text-slate-500">Valor Estimado:</strong> <span className="font-medium text-emerald-400">{orcamento.valor ? `R$ ${orcamento.valor.toFixed(2)}` : 'Não definido'}</span></p>
                        </div>

                        <div className="flex sm:flex-col gap-2 justify-center shrink-0">
                          <button
                            onClick={() => handleExpand(orcamento)}
                            className="flex-1 sm:flex-none px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors font-semibold text-sm"
                          >
                            Ver Detalhes
                          </button>
                          <button
                            onClick={() => handleConfirmPedido(orcamento.id)}
                            disabled={!orcamento.item}
                            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all font-semibold text-sm"
                          >
                            Confirmar Pedido
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      <OrcamentoDetalhesModal
        isOpen={detalhesModalOpen}
        onClose={() => setDetalhesModalOpen(false)}
        orcamento={orcamentoDetalhes}
        onDownload={handleDownload}
      />
    </>
  );
};

export default OrcamentoModal;