import React, { useState } from "react";

interface ModalProps {
  onClose: () => void;
  onCategoryAdded: (category: any) => void;
}

const ModalCategoria: React.FC<ModalProps> = ({ onClose, onCategoryAdded }) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    if (image) formData.append("image", image);

    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    onCategoryAdded(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-[#121A2F] border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative space-y-6" onClick={e => e.stopPropagation()}>
        <button type="button" className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors" onClick={onClose}>✕</button>
        <h3 className="text-2xl font-bold text-white mb-6">Nova Categoria</h3>
        
        <div>
           <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Nome da Categoria</label>
           <input
             type="text"
             placeholder="Digite o nome..."
             value={name}
             onChange={e => setName(e.target.value)}
             className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
             required
           />
        </div>

        <div>
           <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Imagem Principal</label>
           <input
             type="file"
             accept="image/*"
             onChange={e => setImage(e.target.files?.[0] || null)}
             className="w-full text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 transition-all cursor-pointer"
             required
           />
        </div>
        
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium border border-slate-700">Cancelar</button>
          <button type="submit" className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 rounded-xl transition-transform hover:-translate-y-0.5 active:translate-y-0 font-bold">Criar Categoria</button>
        </div>
      </form>
    </div>
  );
};

export default ModalCategoria;
