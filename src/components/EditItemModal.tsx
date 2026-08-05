import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Item } from '../pages/CategoryPage';
import { FiX, FiInfo, FiFolderPlus, FiTrash2, FiFileText, FiImage } from 'react-icons/fi';

interface EditItemModalProps {
  item: Item;
  onClose: () => void;
  onSave: (item: Item) => void;
  onFileUpload: (files: File[], type: 'PDF' | 'DWG') => void;
  newPdfFiles: File[];
  newDwgFiles: File[];
  onRemoveFile: (fileId: string, type: 'existing' | 'PDF' | 'DWG') => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  onClose,
  onSave,
  onFileUpload,
  newPdfFiles,
  newDwgFiles,
  onRemoveFile,
}) => {
  const [name, setName] = useState(item.name);
  const [subname, setSubname] = useState(item.subname || '');
  const [status, setStatus] = useState(item.status);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'files'>('info');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !subname) {
      setError('Nome e código CS são obrigatórios');
      return;
    }

    onSave({
      ...item,
      name,
      subname,
      status,
    });
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(Array.from(e.target.files), 'PDF');
      e.target.value = ''; // Reset input
    }
  };

  const handleDwgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(Array.from(e.target.files), 'DWG');
      e.target.value = ''; // Reset input
    }
  };

  const renderFileItem = (file: { id: string; name?: string; path: string }, index: number, type: 'existing' | 'PDF' | 'DWG') => {
    const fileId = type === 'existing' ? file.id : index.toString();
    const fileName = file.name || file.path.split('/').pop() || 'Arquivo sem nome';
    const isPdf = type === 'existing' ? file.path.toLowerCase().endsWith('.pdf') : type === 'PDF';
    
    return (
      <div key={type === 'existing' ? file.id : index} className="flex items-center justify-between bg-[#0B1121] border border-slate-700/50 p-3 rounded-lg group">
        <div className="flex items-center gap-3 overflow-hidden">
          {isPdf ? <FiFileText className="text-red-400 shrink-0" size={18} /> : <FiImage className="text-emerald-400 shrink-0" size={18} />}
          <span className="text-slate-300 text-sm truncate" title={fileName}>
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-slate-800 text-slate-400 rounded-md">
            {type === 'existing' ? (isPdf ? 'PDF' : 'DWG/IMG') : type}
          </span>
          <button 
            type="button" 
            onClick={() => onRemoveFile(fileId, type)}
            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
            title="Remover arquivo"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiInfo className="text-indigo-400" />
            Editar Item
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="px-6 pt-4 border-b border-slate-800 shrink-0">
          <div className="flex gap-4">
            <button
              type="button"
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'info' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              onClick={() => setActiveTab('info')}
            >
              Informações
            </button>
            <button
              type="button"
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'files' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              onClick={() => setActiveTab('files')}
            >
              Arquivos 
              <span className="bg-slate-800 text-xs py-0.5 px-2 rounded-full">
                {(item.files?.length || 0) + newPdfFiles.length + newDwgFiles.length}
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-[300px]">
          <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
            {activeTab === 'info' ? (
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest" htmlFor="item-name">Nome do Item *</label>
                  <input
                    id="item-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Eixo do Motor"
                    className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest" htmlFor="item-subname">Código CS *</label>
                  <input
                    id="item-subname"
                    type="text"
                    value={subname}
                    onChange={(e) => setSubname(e.target.value)}
                    placeholder="Ex: CS-1002"
                    className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest" htmlFor="item-status">Status</label>
                  <select
                    id="item-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'PENDENTE' | 'CONCLUIDO')}
                    className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* PDF Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <FiFileText className="text-indigo-400"/> Arquivos PDF
                    </h3>
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-slate-700 hover:border-slate-600">
                      <FiFolderPlus /> Adicionar PDF
                      <input
                        type="file"
                        accept=".pdf,.PDF"
                        multiple
                        onChange={handlePdfChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="space-y-2 flex flex-col">
                    {(item.files || []).filter(f => f.type === 'PDF' || f.path.toLowerCase().endsWith('.pdf')).map(file => 
                      renderFileItem(file, 0, 'existing')
                    )}
                    {newPdfFiles.map((file, index) => 
                      renderFileItem(file, index, 'PDF')
                    )}
                    
                    {[(item.files || []).filter(f => f.type === 'PDF' || f.path.toLowerCase().endsWith('.pdf'))].flat().length === 0 && newPdfFiles.length === 0 && (
                      <p className="text-slate-600 text-sm italic py-4 text-center border border-dashed border-slate-700/50 rounded-xl bg-[#0B1121]/50">Nenhum PDF anexado.</p>
                    )}
                  </div>
                </div>

                {/* DWG/Img Section */}
                <div className="pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <FiImage className="text-indigo-400"/> Desenhos & Imagens
                    </h3>
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-slate-700 hover:border-slate-600">
                      <FiFolderPlus /> Adicionar Imagens
                      <input
                        type="file"
                        accept=".dwg,.png,.jpg,.jpeg"
                        multiple
                        onChange={handleDwgChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="space-y-2 flex flex-col">
                    {(item.files || []).filter(f => f.type !== 'PDF' && !f.path.toLowerCase().endsWith('.pdf')).map(file => 
                      renderFileItem(file, 0, 'existing')
                    )}
                    {newDwgFiles.map((file, index) => 
                      renderFileItem(file, index, 'DWG')
                    )}

                    {[(item.files || []).filter(f => f.type !== 'PDF' && !f.path.toLowerCase().endsWith('.pdf'))].flat().length === 0 && newDwgFiles.length === 0 && (
                      <p className="text-slate-600 text-sm italic py-4 text-center border border-dashed border-slate-700/50 rounded-xl bg-[#0B1121]/50">Nenhuma imagem/dwg anexada.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-800 bg-[#0B1121] shrink-0 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-slate-300 bg-transparent border border-slate-700 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#121A2F]"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditItemModal;