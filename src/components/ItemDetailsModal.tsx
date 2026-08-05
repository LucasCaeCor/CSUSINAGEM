import React from 'react';
import { Item, ItemFile } from '../pages/CategoryPage';
import { FiX, FiFileText, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface ItemDetailsModalProps {
  item: Item;
  onClose: () => void;
  API_URL: string;
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PENDENTE': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'EM_ANDAMENTO': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'CONCLUIDO': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'CANCELADO': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PENDENTE': return <FiClock />;
    case 'EM_ANDAMENTO': return <FiAlertCircle />;
    case 'CONCLUIDO': return <FiCheckCircle />;
    default: return null;
  }
};

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, onClose, API_URL }) => {
  const printPDF = (filePath: string) => {
    window.open(`${API_URL}/uploads/${filePath}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0B1121]/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Detalhes do Item
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-[#0B1121] p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Nome do Item</span>
              <span className="text-lg font-bold text-white leading-tight">{item.name}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0B1121] p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Código C&S</span>
                <span className="text-base font-medium text-slate-300">{item.subname || '-'}</span>
              </div>
              <div className="bg-[#0B1121] p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Data Criação</span>
                <span className="text-base font-medium text-slate-300">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0B1121] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Status Atual</span>
            <span className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 uppercase ${getStatusColor(item.status)}`}>
              {getStatusIcon(item.status)}
              {item.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Files List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FiFileText />
              Arquivos ({item.files?.length || 0})
            </h3>
            
            {!item.files || item.files.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-700/50 rounded-xl bg-slate-800/10">
                <p className="text-slate-500 text-sm">Nenhum arquivo associado a este item.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {item.files.map((file: ItemFile) => (
                  <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-700 bg-[#1A2338] hover:bg-slate-800 transition-colors gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                        <FiFileText size={20} />
                      </div>
                      <span className="text-sm font-medium text-slate-300 truncate" title={file.path.split('/').pop()}>
                        {file.path.split('/').pop()}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => file.type === 'PDF' 
                        ? printPDF(file.path) 
                        : window.open(`${API_URL}/uploads/${file.path}`, '_blank')
                      }
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shrink-0 shadow-lg shadow-indigo-500/20"
                    >
                      {file.type === 'PDF' ? 'Visualizar PDF' : 'Visualizar Arquivo'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;