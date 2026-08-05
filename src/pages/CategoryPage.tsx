import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import EditItemModal from "../components/EditItemModal";
import PedidoModal from "../components/PedidoModal";
import OrcamentoModal from "../components/OrcamentoModal";
import ItemDetailsModal from "../components/ItemDetailsModal";

export interface ItemFile {
  id: string;
  path: string;
  type: 'PDF' | 'DWG' | 'IMAGE';
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  subname: string;
  files: ItemFile[];
  createdAt: string;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO";
  pedidos?: {
    id?: string;
    cliente?: string;
    quantidade: number;
    material: string;
    dataEmissao: string;
    operacao: string;
    observacao?: string;
    description?: string;
    status: string;
  }[];
}

interface CategoryPageProps { }

const Modal: React.FC<{ onClose: () => void; children?: React.ReactNode }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose}>
    <div className="bg-[#121A2F] border border-slate-800 rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700" onClick={e => e.stopPropagation()}>
      <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors" onClick={onClose} aria-label="Close">
        ✕
      </button>
      {children}
    </div>
  </div>
);

const CategoryPage: React.FC<CategoryPageProps> = () => {
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const [categoryName, setCategoryName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [subname, setSubname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [pedidoModalItem, setPedidoModalItem] = useState<Item | null>(null);
  const [selectedOption, setSelectedOption] = useState<{ [key: string]: 'pedido' | 'orcamentos' | null }>({});
  const [showOrcamentoModal, setShowOrcamentoModal] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [dwgFiles, setDwgFiles] = useState<File[]>([]);
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const [newPdfFiles, setNewPdfFiles] = useState<File[]>([]);
  const [newDwgFiles, setNewDwgFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<ItemFile[]>([]);

  // Limite de tamanho por arquivo (50MB) e total (100MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB por arquivo
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resCategory = await fetch(`${API_URL}/categories/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!resCategory.ok) throw new Error("Categoria não encontrada");
        const category = await resCategory.json();
        setCategoryName(category.name);

        const resItems = await fetch(`${API_URL}/categories/${id}/items`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const dataItems = await resItems.json();

        const itemsWithFiles = dataItems.map((item: any) => ({
          ...item,
          files: item.files || []
        }));

        setItems(Array.isArray(itemsWithFiles) ? itemsWithFiles : []);
      } catch (err: any) {
        setItems([]);
        setError("Erro ao carregar dados: " + err.message);
      }
    };
    fetchData();
  }, [id, API_URL]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateFiles = (files: File[], type: 'PDF' | 'DWG'): boolean => {
    let totalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0) +
                    dwgFiles.reduce((sum, file) => sum + file.size, 0);
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`O arquivo ${file.name} excede o limite de ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
        return false;
      }
      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        setError(`O tamanho total dos arquivos excede o limite de ${MAX_TOTAL_SIZE / 1024 / 1024}MB.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !subname) {
      setError("Todos os campos textuais são obrigatórios.");
      return;
    }

    if (pdfFiles.length === 0 && dwgFiles.length === 0) {
      setError("Você deve enviar pelo menos um arquivo (DWG/PNG ou PDF).");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Usuário não autenticado. Faça login novamente.");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("subname", subname);
      formData.append("categoryId", id!);

      dwgFiles.forEach((file) => {
        formData.append(`dwgFiles`, file);
      });

      pdfFiles.forEach((file) => {
        formData.append(`pdfFiles`, file);
      });

      const response = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 413) {
          throw new Error("Os arquivos são muito grandes. Tente arquivos menores.");
        }
        throw new Error(data.error || "Erro ao criar o item.");
      }

      const newItem = await response.json();
      setItems(prev => [newItem, ...prev]);

      setName("");
      setSubname("");
      setPdfFiles([]);
      setDwgFiles([]);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setShowForm(true);
  };

  const handleUpdateItem = async (updatedItem: Item) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Usuário não autenticado. Faça login novamente.");

      const formData = new FormData();
      formData.append("name", updatedItem.name);
      formData.append("subname", updatedItem.subname);
      formData.append("status", updatedItem.status);

      newPdfFiles.forEach(file => {
        formData.append("newPdfFiles", file);
      });

      newDwgFiles.forEach(file => {
        formData.append("newDwgFiles", file);
      });

      existingFiles.forEach(file => {
        formData.append("keepFiles", file.id);
      });

      const response = await fetch(`${API_URL}/items/${updatedItem.id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar item");
      }

      const data = await response.json();
      setItems(items.map(item => item.id === data.id ? data : item));
      setEditingItem(null);
      setNewPdfFiles([]);
      setNewDwgFiles([]);
      setExistingFiles([]);
    } catch (error: any) {
      console.error("Erro ao atualizar item:", error);
      setError(error.message || "Erro ao atualizar item");
    }
  };

  const handleConfirmPedido = async (pedidoData: {
  itemId: string;
  cliente: string;
  quantidade: number;
  material: string;
  dataEmissao: string;
  operacao: string;
  status: string;
  tipo: 'pedido' | 'orcamentos';
  valor?: number;
  description?: string; // Adicionar description
}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Usuário não autenticado. Faça login novamente.");

    const endpoint = pedidoData.tipo === 'orcamentos' ? '/orcamentos' : '/pedidos';
    const body = {
      itemId: pedidoData.itemId,
      cliente: pedidoData.cliente,
      quantidade: pedidoData.quantidade,
      material: pedidoData.material,
      dataEmissao: pedidoData.dataEmissao,
      operacao: pedidoData.operacao,
      description: pedidoData.description, // Incluir description
      status: pedidoData.tipo === 'pedido' ? 'EM_ANDAMENTO' : pedidoData.status,
      ...(pedidoData.tipo === 'orcamentos' && { valor: pedidoData.valor }),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ao criar ${pedidoData.tipo}`);
    }

    const data = await response.json();

    if (pedidoData.tipo === 'pedido') {
      const updatedItem = items.find((item) => item.id === pedidoData.itemId);
      if (updatedItem) {
        const formData = new FormData();
        formData.append('name', updatedItem.name);
        formData.append('subname', updatedItem.subname);
        formData.append('status', 'EM_ANDAMENTO');

        updatedItem.files.forEach((file) => {
          formData.append('keepFiles', file.id);
        });

        const itemResponse = await fetch(`${API_URL}/items/${pedidoData.itemId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!itemResponse.ok) {
          const errorData = await itemResponse.json();
          throw new Error(errorData.message || 'Erro ao atualizar status do item');
        }

        const updatedItemData = await itemResponse.json();
        setItems((prev) =>
          prev.map((item) => (item.id === updatedItemData.id ? updatedItemData : item))
        );
      }
    }

    const resItems = await fetch(`${API_URL}/categories/${id}/items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const dataItems = await resItems.json();
    const itemsWithFiles = dataItems.map((item: any) => ({
      ...item,
      files: item.files || [],
    }));
    setItems(Array.isArray(itemsWithFiles) ? itemsWithFiles : []);

    alert(`${pedidoData.tipo === 'orcamentos' ? 'Orçamento' : 'Pedido'} criado com sucesso!`);
    setPedidoModalItem(null);
    setShowOrcamentoModal(null);
  } catch (error: any) {
    console.error('Erro:', error);
    setError(error.message || `Erro ao processar ${pedidoData.tipo}`);
  }
};

  const handleDeleteItem = async () => {
  if (!itemToDelete) {
    setError('Nenhum item selecionado para exclusão.');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    if (!itemToDelete.id || typeof itemToDelete.id !== 'string' || itemToDelete.id.trim() === '') {
      throw new Error('ID do item inválido.');
    }

    console.log(`Tentando excluir item: ${itemToDelete.id}, Nome: ${itemToDelete.name}`);

    const response = await fetch(`${API_URL}/items/${itemToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'Erro desconhecido do servidor' };
      }
      console.error('Resposta do backend:', errorData);

      switch (response.status) {
        case 400:
          throw new Error(errorData.error || 'Requisição inválida. Verifique os dados enviados.');
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Sessão expirada. Redirecionando para login.');
        case 403:
          throw new Error('Permissão negada para excluir este item.');
        case 404:
          throw new Error('Item não encontrado.');
        case 409:
          throw new Error(errorData.error || 'Não é possível excluir o item devido a associações com pedidos ou orçamentos.');
        default:
          throw new Error(errorData.error || 'Erro ao excluir item.');
      }
    }

    const responseData = await response.json();
    setItems(items.filter(item => item.id !== itemToDelete.id));
    setItemToDelete(null);
    alert(responseData.message || 'Item excluído com sucesso!');
  } catch (error: any) {
    console.error('Erro ao excluir item:', error);
    if (error.message.includes('Failed to fetch')) {
      setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3333.');
    } else {
      setError(error.message || 'Erro desconhecido ao excluir item.');
    }
  }
};

  return (
    <div className="flex min-h-screen bg-[#070D19] text-white font-sans md:ml-[260px]">
      <Sidebar onCategoryAdded={() => {}} setItems={() => {}} />
      <main className="flex-1 flex flex-col w-full min-h-screen p-4 md:p-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 w-full max-w-7xl mx-auto px-2">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 leading-tight">Inventário</h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">Listagem da categoria: <span className="text-indigo-300 font-bold">{categoryName}</span></p>
          </div>
          <div className="w-full md:w-96 relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Buscar por nome ou subnome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A233A]/60 backdrop-blur-sm border border-slate-700 text-white rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500 transition-all font-medium"
            />
          </div>
        </div>

        <button 
          className="fixed bottom-8 right-8 z-[60] flex items-center justify-center w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white text-3xl font-light rounded-full shadow-lg shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all" 
          onClick={handleAddItem}
          aria-label="Adicionar Item"
        >
          +
        </button>

        {showForm && (
          <Modal onClose={() => setShowForm(false)}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Criar Novo Item</h2>
              <p className="text-slate-400 text-sm mt-1">Preencha os detalhes e insira as pranchas técnicas.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Nome Principal</label>
                  <input type="text" placeholder="Nome da peça" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Código CS</label>
                  <input type="text" placeholder="Código interno" value={subname} onChange={e => setSubname(e.target.value)} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" required />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Arquivos de Desenho (DWG/PNG)</span>
                  <input
                    type="file"
                    accept=".dwg,.png,.jpg,.jpeg"
                    multiple
                    className="w-full text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 transition-all cursor-pointer"
                    onChange={e => {
                      if (e.target.files && validateFiles(Array.from(e.target.files), 'DWG')) {
                        setDwgFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                  {dwgFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dwgFiles.map((file, index) => (
                        <span key={index} className="px-3 py-1 bg-slate-800 text-emerald-400 text-xs rounded-lg whitespace-nowrap">{file.name}</span>
                      ))}
                    </div>
                  )}
                </label>

                <label className="block mt-4">
                  <span className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Laudos e PDFs</span>
                  <input
                    type="file"
                    accept=".pdf,.PDF"
                    multiple
                    className="w-full text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-500/10 file:text-red-400 hover:file:bg-red-500/20 transition-all cursor-pointer"
                    onChange={e => {
                      if (e.target.files && validateFiles(Array.from(e.target.files), 'PDF')) {
                        setPdfFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                  {pdfFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pdfFiles.map((file, index) => (
                        <span key={index} className="px-3 py-1 bg-slate-800 text-red-400 text-xs rounded-lg whitespace-nowrap">{file.name}</span>
                      ))}
                    </div>
                  )}
                </label>
              </div>

              {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">{error}</div>}
              
              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button type="submit" className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 disabled:opacity-50" disabled={loading}>
                  {loading ? "Montando Item..." : "Cadastrar Item"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        <ul className="w-full max-w-7xl mx-auto space-y-4 px-2">
          {filteredItems.map(item => (
            <li key={item.id} className="bg-[#121A2F]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 group relative overflow-hidden" onClick={() => setSelectedItem(item)}>
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-xl font-bold text-slate-100">{item.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'CONCLUIDO' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                    item.status === 'EM_ANDAMENTO' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                    'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-slate-400 font-medium text-sm"><span className="text-slate-500 shrink-0">Cod:</span> {item.subname}</p>
              </div>

              <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 lg:opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button className="p-3 bg-[#0B1121] hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/50 hover:border-indigo-500 rounded-xl transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setExistingFiles(item.files); }}>
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="p-3 bg-[#0B1121] hover:bg-red-500 text-slate-300 hover:text-white border border-slate-700/50 hover:border-red-500 rounded-xl transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                {item.status !== 'CONCLUIDO' && (
                  <div className="flex gap-2 lg:border-l border-slate-700 lg:pl-3 w-full lg:w-auto mt-2 lg:mt-0">
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 rounded-xl transition-all font-semibold text-sm" onClick={(e) => { e.stopPropagation(); setPedidoModalItem(item); setSelectedOption(prev => ({ ...prev, [item.id]: 'pedido' })); }}>
                      <i className="fas fa-file-alt"></i> Pedido
                    </button>
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20 hover:border-cyan-500 rounded-xl transition-all font-semibold text-sm" onClick={(e) => { e.stopPropagation(); setShowOrcamentoModal(item); }}>
                      <i className="fas fa-calculator"></i> Orçamento
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {filteredItems.length === 0 && (
             <div className="flex flex-col items-center justify-center py-24 text-slate-500">
               <i className="fas fa-box-open text-5xl mb-4 opacity-20"></i>
               <p className="text-lg">Nenhum item na categoria até o momento.</p>
             </div>
          )}
        </ul>

        {itemToDelete && (
          <Modal onClose={() => setItemToDelete(null)}>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Confirmar Exclusão</h3>
              <p className="text-slate-400">Tem certeza que deseja excluir o item <strong className="text-white">{itemToDelete.name}</strong> pertencente à área de inventário?</p>
            </div>
            {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">{error}</div>}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
              <button className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium border border-slate-700" onClick={() => setItemToDelete(null)}>Cancelar</button>
              <button className="px-5 py-3 bg-red-500/10 text-red-500 hover:text-white border border-red-500/20 hover:bg-red-500 rounded-xl transition-all font-bold" onClick={handleDeleteItem} disabled={loading}>
                {loading ? "Excluindo..." : "Excluir Definitivamente"}
              </button>
            </div>
          </Modal>
        )}

        {selectedItem && (
          <ItemDetailsModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            API_URL={API_URL}
          />
        )}

        {editingItem && (
          <EditItemModal
            item={editingItem}
            onClose={() => {
              setEditingItem(null);
              setNewPdfFiles([]);
              setNewDwgFiles([]);
              setExistingFiles([]);
            }}
            onSave={(updatedItem) => {
              handleUpdateItem(updatedItem);
            }}
            onFileUpload={(files, type) => {
              if (validateFiles(files, type)) {
                if (type === 'PDF') {
                  setNewPdfFiles(prev => [...prev, ...files]);
                } else {
                  setNewDwgFiles(prev => [...prev, ...files]);
                }
              }
            }}
            newPdfFiles={newPdfFiles}
            newDwgFiles={newDwgFiles}
            onRemoveFile={(fileId: any, type) => {
              if (type === 'existing') {
                setExistingFiles(prev => prev.filter(f => f.id !== fileId));
              } else if (type === 'PDF') {
                setNewPdfFiles(prev => prev.filter((_, index) => index !== fileId));
              } else {
                setNewDwgFiles(prev => prev.filter((_, index) => index !== fileId));
              }
            }}
          />
        )}

        {pedidoModalItem && (
          <PedidoModal
            item={pedidoModalItem}
            onClose={() => setPedidoModalItem(null)}
            onConfirm={handleConfirmPedido}
          />
        )}

        {showOrcamentoModal && (
          <OrcamentoModal
            item={showOrcamentoModal}
            onClose={() => setShowOrcamentoModal(null)}
            onConfirm={handleConfirmPedido}
          />
        )}

        {showImageModal && (
          <Modal onClose={() => setShowImageModal(null)}>
            {showImageModal.endsWith('.ipt') ? (
              <div className="ipt-file-viewer"></div>
            ) : (
              <img
                src={`${API_URL}/uploads/${showImageModal}`}
                alt="Imagem expandida"
                className="expanded-image"
              />
            )}
          </Modal>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;