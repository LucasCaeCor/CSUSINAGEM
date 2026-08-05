import React, { useState } from 'react';
import { Item } from '../pages/CategoryPage';
import { FiX } from 'react-icons/fi';
import EmpresaSelector from './EmpresaSelector';

interface OrcamentoModalProps {
  item: Item;
  onClose: () => void;
  onConfirm: (pedidoData: {
    itemId: string;
    cliente: string;
    quantidade: number;
    material: string;
    dataEmissao: string;
    operacao: string;
    status: string;
    tipo: 'orcamentos';
    valor?: number;
  }) => void;
}

const OrcamentoModal: React.FC<OrcamentoModalProps> = ({ item, onClose, onConfirm }) => {
  const [cliente, setCliente] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [material, setMaterial] = useState('');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [operacao, setOperacao] = useState('');
  const [valor, setValor] = useState<number | undefined>(undefined);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim()) { setError('Selecione ou crie uma empresa.'); return; }
    setError('');
    onConfirm({ itemId: item.id, cliente, quantidade, material, dataEmissao, operacao, status: 'PENDENTE', tipo: 'orcamentos', valor });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Novo Orçamento</h2>
            <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[260px]">{item.name}</p>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Empresa */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresa / Cliente *</label>
            <EmpresaSelector value={cliente} onChange={setCliente} required />
          </div>

          {/* Quantidade + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantidade *</label>
              <input
                type="number" min="1" value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))} required
                className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data *</label>
              <input
                type="date" value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)} required
                className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Material */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Material *</label>
            <input
              type="text" placeholder="Ex: Aço 1045" value={material}
              onChange={(e) => setMaterial(e.target.value)} required
              className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
            />
          </div>

          {/* Operação */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operação *</label>
            <input
              type="text" placeholder="Ex: Usinagem" value={operacao}
              onChange={(e) => setOperacao(e.target.value)} required
              className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
            />
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor Orçado (R$)</label>
            <input
              type="number" placeholder="0,00" step="0.01" value={valor || ''}
              onChange={(e) => setValor(e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
            />
          </div>

          {error && <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
              Confirmar Orçamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrcamentoModal;
