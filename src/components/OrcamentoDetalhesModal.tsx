import React from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';


interface ItemFile {
  id: string;
  path: string;
  type: 'PDF' | 'DWG' | 'IMAGE';
}

interface Item {
  id: string;
  name: string;
  subname: string;
  files?: ItemFile[];
}

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
  API_URL?: string;
}

interface OrcamentoDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  orcamento: Orcamento | null;
  onDownload?: () => void;
}

const OrcamentoDetalhesModal: React.FC<OrcamentoDetalhesModalProps> = ({ 
  isOpen, 
  onClose, 
  orcamento,
  onDownload
}) => {
  const generatePDF = () => {
    if (!orcamento) return;

    const doc = new jsPDF();
    
    // Configurações iniciais
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    
    // Cabeçalho
    doc.text('ORÇAMENTO', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${orcamento.id}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 36);
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 42, 196, 42);
    
    // Informações do Item
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DO ITEM', 14, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${orcamento.item?.name || 'Não informado'}`, 14, 58);
    doc.text(`Código CS: ${orcamento.item?.subname || 'Não informado'}`, 14, 64);
    
    // Informações do Orçamento
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHES DO ORÇAMENTO', 14, 76);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${orcamento.cliente || 'Não informado'}`, 14, 84);
    doc.text(`Valor: ${orcamento.valor ? `R$ ${orcamento.valor.toFixed(2)}` : 'Não definido'}`, 14, 90);
    doc.text(`Quantidade: ${orcamento.quantidade || 'Não especificada'}`, 14, 96);
    doc.text(`Material: ${orcamento.material || 'Não especificado'}`, 14, 102);
    doc.text(`Operação: ${orcamento.operacao || 'Não especificada'}`, 14, 108);
    
    if (orcamento.dataEmissao) {
      doc.text(`Data de Emissão: ${new Date(orcamento.dataEmissao).toLocaleDateString()}`, 14, 114);
    }
    
    doc.text(`Status: ${orcamento.status || 'Pendente'}`, 14, 120);
    
    // Lista de Arquivos
    if (orcamento.item?.files && orcamento.item.files.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('ARQUIVOS RELACIONADOS', 14, 132);
      
      doc.setFont('helvetica', 'normal');
      let yPosition = 140;
      orcamento.item.files.forEach((file, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        const fileName = file.path.split('/').pop() || `arquivo-${index + 1}`;
        doc.text(`${index + 1}. ${fileName} (${file.type})`, 14, yPosition);
        yPosition += 6;
      });
    }
    
    // Rodapé
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Gerado em ' + new Date().toLocaleString(), 105, 290, { align: 'center' });
    
    // Salva o PDF
    doc.save(`orcamento-${orcamento.id}.pdf`);
    
    if (onDownload) {
      onDownload();
    }
  };

  if (!isOpen || !orcamento) return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose}>
      <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-white tracking-wide">Detalhes do Orçamento</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar space-y-6">
          <div className="bg-[#0B1121] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Informações do Item</h3>
            <p className="text-sm text-slate-400"><strong>Nome:</strong> <span className="text-slate-200">{orcamento.item?.name || 'Não informado'}</span></p>
            <p className="text-sm text-slate-400"><strong>Código CS:</strong> <span className="text-slate-200">{orcamento.item?.subname || 'Não informado'}</span></p>
            
            {orcamento.item?.files && orcamento.item.files.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Arquivos Anexados</h4>
                <ul className="space-y-2">
                  {orcamento.item.files.map((file, index) => (
                    <li key={index}>
                      <a 
                        href={`${orcamento.API_URL || import.meta.env.VITE_BACKEND_URL}/uploads/${file.path}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        {file.path.split('/').pop()} <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md ml-1">{file.type}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-[#0B1121] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Informações Comerciais</h3>
            <div className="grid grid-cols-2 gap-4">
              <p className="text-sm text-slate-400 break-words"><strong>Cliente:</strong> <br/><span className="text-slate-200 font-medium">{orcamento.cliente || 'Não informado'}</span></p>
              <p className="text-sm text-slate-400 break-words"><strong>Valor:</strong> <br/><span className="text-emerald-400 font-bold">{orcamento.valor ? `R$ ${orcamento.valor.toFixed(2)}` : 'Não definido'}</span></p>
              <p className="text-sm text-slate-400 break-words"><strong>Quantidade:</strong> <br/><span className="text-slate-200">{orcamento.quantidade || 'Não especificada'}</span></p>
              <p className="text-sm text-slate-400 break-words"><strong>Material:</strong> <br/><span className="text-slate-200">{orcamento.material || 'Não especificado'}</span></p>
              <p className="text-sm text-slate-400 col-span-2 break-words"><strong>Operação:</strong> <span className="text-slate-200">{orcamento.operacao || 'Não especificada'}</span></p>
              {orcamento.dataEmissao && (
                <p className="text-sm text-slate-400 col-span-2 break-words"><strong>Data de Emissão:</strong> <span className="text-slate-200">{new Date(orcamento.dataEmissao).toLocaleDateString()}</span></p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Status Atual</span>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                  {orcamento.status || 'Pendente'}
                </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <button onClick={generatePDF} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 hover:border-indigo-500/50 shadow-lg transition-all font-semibold shrink-0">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Baixar Resumo (PDF)
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrcamentoDetalhesModal;