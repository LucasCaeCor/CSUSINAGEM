import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import EmpresaSelector from './EmpresaSelector';

interface PedidoModalProps {
  item: { id: string; name: string; pedido?: any };
  onClose: () => void;
  onConfirm: (data: {
    itemId: string;
    cliente: string;
    quantidade: number;
    material: string;
    dataEmissao: string;
    operacao: string;
    status: string;
    tipo: 'pedido' | 'orcamentos';
    valor?: number;
    description?: string;
  }) => void;
}

const STATUS_OPTIONS = {
  pedido: ['EM_ANDAMENTO', 'CONCLUIDO'],
  orcamento: ['PENDENTE', 'APROVADO', 'REJEITADO'],
};

const STATUS_LABEL: Record<string, string> = {
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
};

const PedidoModal: React.FC<PedidoModalProps> = ({ item, onClose, onConfirm }) => {
  const [quantidade, setQuantidade] = useState(1);
  const [material, setMaterial] = useState('');
  const [description, setDescription] = useState('');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [operacao, setOperacao] = useState('');
  const [status, setStatus] = useState('EM_ANDAMENTO');
  const [cliente, setCliente] = useState('');
  const [valor, setValor] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item.pedido) {
      setQuantidade(item.pedido.quantidade || 1);
      setMaterial(item.pedido.material || '');
      setDescription(item.pedido.description || '');
      setDataEmissao(item.pedido.dataEmissao ? item.pedido.dataEmissao.split('T')[0] : new Date().toISOString().split('T')[0]);
      setOperacao(item.pedido.operacao || '');
      setCliente(item.pedido.cliente || '');
      const s = (item.pedido.status || 'EM_ANDAMENTO').toUpperCase().replace(/[ -]/g, '_');
      setStatus(s);
      if (item.pedido.valor) setValor(item.pedido.valor);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cliente.trim()) { setError('Selecione ou crie uma empresa.'); return; }
    if (!operacao.trim()) { setError('Informe a operação.'); return; }

    const normalizedStatus = status.toUpperCase().replace(/[ -]/g, '_');

    setIsSubmitting(true);
    try {
      await onConfirm({
        itemId: item.id,
        cliente: cliente.trim(),
        quantidade,
        material,
        description,
        dataEmissao,
        operacao: operacao.trim(),
        status: normalizedStatus,
        tipo: 'pedido',
        valor: valor !== '' ? Number(valor) : undefined,
      });
      onClose();
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600 disabled:opacity-50";
  const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-fade-in max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 sticky top-0 bg-[#121A2F] z-10">
          <div>
            <h2 className="text-lg font-bold text-white">Novo Pedido</h2>
            <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[300px]">{item.name}</p>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Empresa */}
          <div className="space-y-1.5">
            <label className={labelCls}>Empresa / Cliente *</label>
            <EmpresaSelector value={cliente} onChange={setCliente} required disabled={isSubmitting} />
          </div>

          {/* Quantidade + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Quantidade *</label>
              <input
                type="number" min="1" max="10000" value={quantidade} required disabled={isSubmitting}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Data Emissão *</label>
              <input
                type="date" value={dataEmissao} required disabled={isSubmitting}
                onChange={(e) => setDataEmissao(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Material */}
          <div className="space-y-1.5">
            <label className={labelCls}>Material *</label>
            <input
              type="text" placeholder="Ex: Aço Inox 304" value={material} required disabled={isSubmitting}
              onChange={(e) => setMaterial(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Operação */}
          <div className="space-y-1.5">
            <label className={labelCls}>Operação *</label>
            <input
              type="text" placeholder="Ex: Torneamento, Fresamento..." value={operacao} required disabled={isSubmitting}
              onChange={(e) => setOperacao(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className={labelCls}>Descrição</label>
            <input
              type="text" placeholder="Observações adicionais..." value={description} disabled={isSubmitting}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className={labelCls}>Status *</label>
            <select
              value={status} required disabled={isSubmitting}
              onChange={(e) => setStatus(e.target.value)}
              className={inputCls}
            >
              {STATUS_OPTIONS['pedido'].map((opt) => (
                <option key={opt} value={opt}>{STATUS_LABEL[opt] || opt}</option>
              ))}
            </select>
          </div>

          {/* Valor (opcional) */}
          <div className="space-y-1.5">
            <label className={labelCls}>Valor (R$) — opcional</label>
            <input
              type="number" placeholder="0,00" step="0.01" value={valor} disabled={isSubmitting}
              onChange={(e) => setValor(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PedidoModal;