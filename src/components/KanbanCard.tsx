import React, { useState } from 'react';
import { Item } from './ListaPedidosModal';
import { formatDate } from '../utils/dateUtils';
import { FiDownload, FiInfo, FiChevronDown } from 'react-icons/fi';

const KanbanCard: React.FC<{
  item: Item;
  onStatusChange: (
    itemId: string,
    newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ) => void;
  onDownloadPdf: (filePath: string) => void;
  onDownloadDwg: (filePath: string) => void;
  onClick: () => void;
}> = ({ item, onStatusChange, onDownloadPdf, onDownloadDwg, onClick }) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const pdfFile = item.files?.find((f) => f.type.toUpperCase() === 'PDF');
  const dwgOrImgFile = item.files?.find(
    (f) => f.type.toUpperCase() === 'DWG' || f.type.toUpperCase() === 'IMAGE'
  );

  const handleStatusUpdate = async (
    newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ) => {
    setIsChangingStatus(true);
    try {
      await onStatusChange(item.id, newStatus);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const statusColor = (status: string | undefined) => {
    switch (status) {
      case 'PENDENTE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'EM_ANDAMENTO': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CONCLUIDO': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CANCELADO': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const friendlyStatus = (status: string | undefined) => {
    if (!status) return 'Desconhecido';
    return status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div 
      className="bg-[#121A2F]/90 border border-slate-700/60 rounded-xl p-4 shadow-lg hover:shadow-indigo-500/10 hover:border-slate-500 transition-all cursor-pointer group flex flex-col gap-3 relative"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-bold text-white text-base leading-tight group-hover:text-indigo-300 transition-colors">
          {item.name || 'Sem nome'}
        </h4>
      </div>
      
      {/* Code */}
      <div className="px-2 py-1 bg-slate-800/50 rounded flex w-max border border-slate-700">
        <p className="text-xs font-mono text-slate-400">{item.subname || 'Sem código'}</p>
      </div>

      {/* Basic details */}
      <div className="space-y-1.5 text-sm">
        {item.pedidos?.[0]?.cliente && (
          <p className="flex justify-between text-slate-300">
            <span className="text-slate-500 font-medium text-xs">Cl.:</span> 
            <span className="font-medium truncate ml-1">{item.pedidos[0].cliente}</span>
          </p>
        )}
        {item.pedidos?.[0]?.quantidade && (
          <p className="flex justify-between text-slate-300">
            <span className="text-slate-500 font-medium text-xs">Qtd:</span> 
            <span className="font-bold text-white">{item.pedidos[0].quantidade}</span>
          </p>
        )}
        {item.pedidos?.[0]?.dataEmissao && (
          <p className="flex justify-between text-slate-300">
            <span className="text-slate-500 font-medium text-xs">Data:</span> 
            <span className="text-slate-400">{formatDate(item.pedidos[0].dataEmissao)}</span>
          </p>
        )}
      </div>

      {/* Description Snippet (first line) */}
      {item.pedidos?.[0]?.description && (
        <div className="text-xs text-slate-500 line-clamp-2 italic bg-[#0B1121] p-2 rounded border border-slate-800">
          "{item.pedidos[0].description}"
        </div>
      )}

      {/* Select Status */}
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <select
            value={item.pedidos?.[0]?.status || item.status}
            onChange={(e) => handleStatusUpdate(e.target.value as 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO')}
            disabled={isChangingStatus}
            className={`w-full appearance-none px-3 py-2 text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors uppercase tracking-wider ${statusColor(item.pedidos?.[0]?.status || item.status)} ${isChangingStatus ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          >
            <option value="PENDENTE" className="bg-slate-900 text-slate-200">Pendente</option>
            <option value="EM_ANDAMENTO" className="bg-slate-900 text-slate-200">Em Andamento</option>
            <option value="CONCLUIDO" className="bg-slate-900 text-slate-200">Concluído</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            {isChangingStatus ? (
              <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiChevronDown />
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(pdfFile || dwgOrImgFile) && (
        <div className="flex gap-2 mt-1 border-t border-slate-800 pt-3">
          {pdfFile && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownloadPdf(pdfFile.path); }}
              className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-1.5 px-2 rounded transition-colors text-xs font-bold"
              title="Baixar PDF"
            >
              <FiDownload size={14} /> PDF
            </button>
          )}
          {dwgOrImgFile && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownloadDwg(dwgOrImgFile.path); }}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 py-1.5 px-2 rounded transition-colors text-xs font-bold"
              title="Baixar Desenho/Imagem"
            >
              <FiDownload size={14} /> DWG/IMG
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
