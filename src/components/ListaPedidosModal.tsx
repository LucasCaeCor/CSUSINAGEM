import React, { useState } from 'react';

import { formatDate } from '../utils/dateUtils';
import KanbanCard from './KanbanCard';
import PrintButton from './PrintButton';

// Interfaces
interface ItemFile {
  id: string;
  path: string;
  type: 'PDF' | 'DWG' | 'IMAGE' | string;
}

export interface Pedido {
  id: string;
  cliente: string;
  quantidade: number;
  material: string;
  operacao: string;
  dataEmissao: string;
  observacao?: string;
  description?: string;
  status: string;
}

export interface Item {
  id: string;
  name: string;
  subname: string;
  status: string;
  files: ItemFile[];
  pedidos?: Pedido[];
  createdAt?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  onDownloadPdf: (filePath: string) => void;
  onDownloadDwg: (filePath: string) => void;
  onStatusChange: (
    itemId: string,
    status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ) => void;
  onPedidoStatusChange: (pedidoId: string, status: string) => void;
}

// Inline implementations extracted

// Componente NotificationModal
const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  items = [],
  onDownloadPdf,
  onDownloadDwg,
  onStatusChange,
  onPedidoStatusChange,
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);

  if (!isOpen) return null;

  // Função para ordenar itens por data
  const sortItemsByDate = (items: Item[]): Item[] => {
    return [...items].sort((a, b) => {
      const dateA = a.pedidos?.[0]?.dataEmissao
        ? new Date(a.pedidos[0].dataEmissao)
        : a.createdAt
        ? new Date(a.createdAt)
        : new Date(0);
      const dateB = b.pedidos?.[0]?.dataEmissao
        ? new Date(b.pedidos[0].dataEmissao)
        : b.createdAt
        ? new Date(b.createdAt)
        : new Date(0);
      return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
    });
  };

  // Organizar itens por status e ordenar por data
  const itemsByStatus = {
    PENDENTE: sortItemsByDate(
      items.filter(
        (item) => (item.pedidos?.[0]?.status || item.status) === 'PENDENTE'
      )
    ),
    EM_ANDAMENTO: sortItemsByDate(
      items.filter(
        (item) => (item.pedidos?.[0]?.status || item.status) === 'EM_ANDAMENTO'
      )
    ),
    CONCLUIDO: sortItemsByDate(
      items.filter(
        (item) => (item.pedidos?.[0]?.status || item.status) === 'CONCLUIDO'
      )
    ),
  };

  const handleStatusChange = async (
    itemId: string,
    newStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) throw new Error('Item não encontrado');
      await onStatusChange(itemId, newStatus);
      if (item.pedidos?.[0]?.id) {
        await onPedidoStatusChange(item.pedidos[0].id, newStatus);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDragStart = (item: Item) => {
    setDraggedItem(item);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = async (
    e: React.DragEvent,
    targetStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ) => {
    e.preventDefault();
    if (draggedItem) {
      await handleStatusChange(draggedItem.id, targetStatus);
      setDraggedItem(null);
    }
  };

  const statusClass = (status: string | undefined) => {
    switch (status) {
      case 'PENDENTE':
        return 'pending';
      case 'EM_ANDAMENTO':
        return 'in-progress';
      case 'CONCLUIDO':
        return 'completed';
      default:
        return '';
    }
  };

  const friendlyStatus = (status: string | undefined) => {
    if (!status) return 'Desconhecido';
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;
    const pedido = selectedItem.pedidos?.[0];

    return (
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 sm:p-6" onClick={() => setSelectedItem(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-[#121A2F] border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0B1121]/50 rounded-t-2xl shrink-0">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
               Detalhes Completos do Item
            </h3>
            <button
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setSelectedItem(null)}
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">Informações Básicas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Nome</span>
                  <span className="font-medium text-white">{selectedItem.name || 'Não informado'}</span>
                </div>
                <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Código</span>
                  <span className="font-medium text-slate-300">{selectedItem.subname || 'Não informado'}</span>
                </div>
                <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Status</span>
                  <span className="inline-flex px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs font-bold uppercase">
                    {friendlyStatus(pedido?.status || selectedItem.status)}
                  </span>
                </div>
              </div>
            </div>

            {pedido && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">Dados do Pedido</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Cliente</span>
                    <span className="font-medium text-slate-300">{pedido.cliente || 'Não informado'}</span>
                  </div>
                  <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Quantidade</span>
                    <span className="font-bold text-white">{pedido.quantidade || 'Não informado'}</span>
                  </div>
                  <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Material</span>
                    <span className="font-medium text-slate-300">{pedido.material || 'Não informado'}</span>
                  </div>
                  <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Operação</span>
                    <span className="font-medium text-slate-300">{pedido.operacao || 'Não informado'}</span>
                  </div>
                  <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Data de Emissão</span>
                    <span className="font-medium text-slate-300">{formatDate(pedido.dataEmissao)}</span>
                  </div>
                  {selectedItem.createdAt && (
                    <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800">
                      <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Data de Criação</span>
                      <span className="font-medium text-slate-300">{formatDate(selectedItem.createdAt)}</span>
                    </div>
                  )}
                  {pedido.description && (
                    <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800 sm:col-span-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Descrição</span>
                      <span className="text-sm text-slate-300">{pedido.description}</span>
                    </div>
                  )}
                  {pedido.observacao && (
                    <div className="bg-[#0B1121] p-3 rounded-xl border border-slate-800 sm:col-span-2 bg-yellow-500/5 border-yellow-500/20">
                      <span className="text-xs font-semibold text-yellow-500/70 uppercase block mb-1">Observações</span>
                      <span className="text-sm text-yellow-200/90">{pedido.observacao}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
                <span>Arquivos & Ações</span>
                <div className="scale-75 origin-right"><PrintButton item={selectedItem} /></div>
              </h4>
              <div className="flex flex-wrap gap-3">
                {selectedItem.files?.length > 0 ? (
                  selectedItem.files.map((file) => {
                    const fileType = file.type.toUpperCase();
                    return (
                      <button
                        key={file.id}
                        onClick={() => fileType === 'PDF' ? onDownloadPdf(file.path) : onDownloadDwg(file.path)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${
                          fileType === 'PDF' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                        }`}
                      >
                        Baixar {fileType}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-sm py-2">Nenhum arquivo disponível</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex p-2 sm:p-6 justify-center items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#0B1121] border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121A2F]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Quadro Kanban</h2>
          </div>
          <button 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Kanban Board Container */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-900/50">
          <div className="flex gap-6 p-6 h-full min-w-max">
            {Object.entries(itemsByStatus).map(([status, statusItems]) => {
              const borderColors: Record<string, string> = {
                'PENDENTE': 'border-amber-500/30',
                'EM_ANDAMENTO': 'border-blue-500/30',
                'CONCLUIDO': 'border-emerald-500/30'
              };
              const headerColors: Record<string, string> = {
                'PENDENTE': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                'EM_ANDAMENTO': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                'CONCLUIDO': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              };

              return (
                <div
                  key={status}
                  className={`w-80 sm:w-96 flex flex-col bg-[#121A2F]/80 rounded-2xl border ${borderColors[status] || 'border-slate-700'} shadow-lg h-full overflow-hidden shrink-0`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status as 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO')}
                >
                  <div className={`px-4 py-3 flex items-center justify-between border-b ${headerColors[status] || 'bg-slate-800 text-slate-300'} shrink-0`} draggable onDragStart={() => setDraggedItem(null)}>
                    <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                       {status.replace(/_/g, ' ')}
                    </h3>
                    <span className="bg-black/30 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-inner">
                      {statusItems.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {statusItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item)}
                        className="transform transition-transform hover:-translate-y-1"
                      >
                        <KanbanCard
                          item={item}
                          onStatusChange={handleStatusChange}
                          onDownloadPdf={onDownloadPdf}
                          onDownloadDwg={onDownloadDwg}
                          onClick={() => setSelectedItem(item)}
                        />
                      </div>
                    ))}
                    {statusItems.length === 0 && (
                      <div className="h-24 flex items-center justify-center border border-dashed border-slate-700/50 rounded-xl text-slate-600 text-xs font-semibold uppercase">
                        Vazio
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {renderItemDetails()}
      </div>
    </div>
  );
};

export default NotificationModal;