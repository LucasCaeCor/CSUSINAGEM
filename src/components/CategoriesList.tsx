import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import ModalCategoria from "./ModalCategoria";
import EditCategoryModal from "./EditCategoryModal";
import ConfirmationModal from "./ConfirmationModal";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";

export interface Category {
  id: string;
  name: string;
  imagePath: string;
}

const API_URL = import.meta.env.VITE_BACKEND_URL;

const MainContent: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        const sortedData = data.sort((a: Category, b: Category) => 
          a.name.localeCompare(b.name)
        );
        setCategories(sortedData);
        // Fetch item counts per category
        const counts: Record<string, number> = {};
        await Promise.all(sortedData.map(async (cat: Category) => {
          try {
            const r = await fetch(`${API_URL}/categories/${cat.id}/items`);
            if (r.ok) { const items = await r.json(); counts[cat.id] = Array.isArray(items) ? items.length : 0; }
          } catch { counts[cat.id] = 0; }
        }));
        setItemCounts(counts);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    };
    loadCategories();
  }, []);

  const handleNewCategory = (category: Category) => {
    setCategories(prev => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(categories.map(cat =>
      cat.id === updatedCategory.id ? updatedCategory : cat
    ).sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      const response = await fetch(`${API_URL}/categories/${categoryToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Erro ao deletar categoria");
      setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Provide a cool fallback gradient if image fails
    e.currentTarget.style.display = 'none';
    e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-indigo-900', 'to-slate-800');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 leading-tight">Categorias</h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">Mapeamento e controle de seções do sistema.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A233A]/60 backdrop-blur-sm border border-slate-700 text-white rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500 transition-all shadow-inner"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-2xl shadow-lg shadow-indigo-500/30 transition-transform duration-200 hover:scale-105 active:scale-95"
            aria-label="Adicionar categoria"
          >
            <FaPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-[#1A233A]/50 border border-slate-800 rounded-3xl overflow-hidden shadow-md h-[280px]">
              <div className="h-44 bg-slate-800/50" />
              <div className="p-5 flex justify-between items-center">
                <div className="h-6 w-32 bg-slate-700/50 rounded-lg" />
                <div className="h-8 w-24 bg-slate-700/50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
          {filteredCategories.map(cat => (
            <div 
              key={cat.id} 
              className="bg-[#121A2F]/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden hover:scale-[1.03] hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer relative"
              onClick={() => navigate(`/category/${cat.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1121] via-transparent to-transparent opacity-60 z-10 pointer-events-none"></div>
              
              <div className="relative h-48 w-full overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={`${API_URL}/uploads/${cat.imagePath}`} 
                  alt={cat.name} 
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
                />
                
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setEditingCategory(cat)}
                    className="p-2.5 bg-slate-900/80 backdrop-blur-md rounded-xl text-indigo-400 hover:text-white hover:bg-indigo-600 transition"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => setCategoryToDelete(cat)}
                    className="p-2.5 bg-slate-900/80 backdrop-blur-md rounded-xl text-red-400 hover:text-white hover:bg-red-500 transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-end relative z-20">
                <h3 className="text-xl font-bold text-slate-100 mb-2 truncate">{cat.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm text-indigo-400 font-medium group-hover:text-cyan-400 transition-colors">Acessar Inventário &rarr;</span>
                  {itemCounts[cat.id] !== undefined && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {itemCounts[cat.id]} {itemCounts[cat.id] === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
              <FaSearch className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg">Nenhuma categoria encontrada.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <ModalCategoria
          onClose={() => setIsModalOpen(false)}
          onCategoryAdded={(data) => {
            handleNewCategory(data);
            setIsModalOpen(false);
          }}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={(updatedCategory) => {
            handleUpdateCategory(updatedCategory);
            setEditingCategory(null);
          }}
        />
      )}

      {categoryToDelete && (
        <ConfirmationModal
          isOpen={!!categoryToDelete}
          title="Confirmar Exclusão"
          message={`A exclusão de "${categoryToDelete.name}" é permanente. Confirmar?`}
          onConfirm={handleDeleteCategory}
          onCancel={() => setCategoryToDelete(null)}
          confirmText="Excluir Categoria"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
};

export default MainContent;