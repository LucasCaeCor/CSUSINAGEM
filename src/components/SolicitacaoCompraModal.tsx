import React, { useState } from 'react';
import { FiX, FiShoppingCart } from 'react-icons/fi';
import { useEstoque } from '../hooks/useEstoque';
import { useAuth } from '../context/AuthContext';

interface SolicitacaoCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SolicitacaoCompraModal: React.FC<SolicitacaoCompraModalProps> = ({ isOpen, onClose }) => {
  const { addPedidoCompra } = useEstoque();
  const { user } = useAuth();
  
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    addPedidoCompra({
      ferramentaNome: nome.trim(),
      quantidade,
      observacao: observacao.trim(),
      isAvulso: true,
      solicitante: user?.name || user?.email || 'Usuário Comum',
    });

    onClose();
    setNome('');
    setQuantidade(1);
    setObservacao('');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FiShoppingCart size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Solicitar Compra</h2>
              <p className="text-slate-400 text-xs mt-0.5">Ferramentas ou Materiais</p>
            </div>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Item desejado *</label>
            <input 
              type="text" 
              placeholder="Ex: Eixo de Aço Carbono, Broca 10mm..." 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              required 
              autoFocus
              className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantidade *</label>
            <input 
              type="number" 
              min="1" 
              value={quantidade} 
              onChange={e => setQuantidade(Math.max(1, Number(e.target.value)))} 
              required 
              className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Observação</label>
            <textarea 
              placeholder="Qual a urgência? Para qual máquina ou projeto?" 
              value={observacao} 
              onChange={e => setObservacao(e.target.value)} 
              rows={3}
              className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={!nome.trim()} className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
              Enviar Solicitação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SolicitacaoCompraModal;
