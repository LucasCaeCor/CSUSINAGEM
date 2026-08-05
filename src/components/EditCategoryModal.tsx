import React, { useState, useRef } from 'react';
import { Category } from './CategoriesList';

interface EditCategoryModalProps {
  category: Category;
  onClose: () => void;
  onSave: (updatedCategory: Category) => void;
}
 const API_URL = import.meta.env.VITE_BACKEND_URL;

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ 
  category, 
  onClose, 
  onSave 
}) => {
  const [name, setName] = useState(category.name);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(`${API_URL}/uploads/${category.imagePath}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', name);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch(`${API_URL}/categories/${category.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar categoria');
      }

      const updatedCategory = await response.json();
      onSave(updatedCategory);
      onClose();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar categoria');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose}>
      <div className="bg-[#121A2F] border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors" onClick={onClose}>✕</button>
        <h2 className="text-2xl font-bold text-white mb-6">Editar Categoria</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Nome da Categoria</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Imagem da Categoria</label>
            <div className="flex flex-col items-center gap-4 bg-[#0B1121] border-2 border-slate-700 border-dashed rounded-2xl p-6 transition-colors hover:border-slate-500">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-xl shadow-lg border border-slate-800"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
              />
              <button 
                type="button" 
                className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500 hover:text-white transition-colors text-sm font-semibold"
                onClick={() => fileInputRef.current?.click()}
              >
                Alterar Imagem
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium border border-slate-700">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 rounded-xl transition-transform hover:-translate-y-0.5 active:translate-y-0 font-bold">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;