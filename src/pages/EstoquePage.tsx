import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useEstoque, Ferramenta, PedidoCompra, TipoFerramenta } from "../hooks/useEstoque";
import { FiPlus, FiAlertCircle, FiBox, FiShoppingCart, FiCheck, FiX, FiTrash2, FiEdit2, FiMinus } from "react-icons/fi";

const EMPTY_FERRAMENTA: Omit<Ferramenta, "id" | "createdAt" | "updatedAt"> = {
  nome: "",
  tipo: "broca",
  quantidade: 0,
  quantidadeMinima: 1,
  unidade: "un",
  fabricante: "",
  referencia: "",
  descricao: "",
};

const EstoquePage: React.FC = () => {
  const { ferramentas, addFerramenta, updateFerramenta, removeFerramenta, ajustarQuantidade, pedidosCompra, addPedidoCompra, updateStatusPedido, alertas } = useEstoque();
  
  const [activeTab, setActiveTab] = useState<"ferramentas" | "pedidos" | "alertas">("ferramentas");
  const [activeSubTab, setActiveSubTab] = useState<TipoFerramenta | "todas">("todas");
  const [search, setSearch] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FERRAMENTA);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [pedidoForm, setPedidoForm] = useState({ ferramentaId: "", ferramentaNome: "", quantidade: 1, observacao: "" });

  const filteredFerramentas = ferramentas.filter(f => 
    (activeSubTab === "todas" || f.tipo === activeSubTab) &&
    f.nome.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm(EMPTY_FERRAMENTA);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (f: Ferramenta) => {
    setForm({
      nome: f.nome, tipo: f.tipo, quantidade: f.quantidade, quantidadeMinima: f.quantidadeMinima,
      unidade: f.unidade, fabricante: f.fabricante || "", referencia: f.referencia || "", descricao: f.descricao || ""
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const saveFerramenta = () => {
    if (!form.nome) return;
    if (editingId) {
      updateFerramenta({ ...form, id: editingId, createdAt: "", updatedAt: "" } as Ferramenta);
    } else {
      addFerramenta(form);
    }
    setShowForm(false);
  };

  const openSolicitarCompra = (f: Ferramenta) => {
    setPedidoForm({ ferramentaId: f.id, ferramentaNome: f.nome, quantidade: Math.max(1, f.quantidadeMinima - f.quantidade + 1), observacao: "" });
    setShowPedidoForm(true);
  };

  const savePedido = () => {
    addPedidoCompra({ ...pedidoForm });
    setShowPedidoForm(false);
    setActiveTab("pedidos");
  };

  const renderProgressBar = (qtd: number, min: number) => {
    const percent = Math.min(100, Math.max(0, (qtd / (min * 2)) * 100));
    let color = "bg-emerald-500";
    if (qtd <= min) color = "bg-red-500";
    else if (qtd <= min * 1.5) color = "bg-amber-500";
    
    return (
      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#070D19] text-white font-sans md:ml-[260px]">
      <Sidebar onCategoryAdded={() => {}} setItems={() => {}} />
      <main className="flex-1 w-full p-4 md:p-8 animate-fade-in max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Estoque de Ferramentas</h1>
            <p className="text-slate-400 mt-1 text-sm">Gerencie o inventário e solicite reposição</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
              <FiPlus /> Cadastrar Ferramenta
            </button>
          </div>
        </div>

        {/* Resumo / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#121A2F]/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setActiveTab("ferramentas")}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-indigo-500/20 text-indigo-400"><FiBox /></div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total em Estoque</p>
              <p className="text-white text-2xl font-extrabold">{ferramentas.length}</p>
            </div>
          </div>
          <div className="bg-[#121A2F]/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => setActiveTab("alertas")}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-red-500/20 text-red-400"><FiAlertCircle /></div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Abaixo do Mínimo</p>
              <p className="text-white text-2xl font-extrabold">{alertas.length}</p>
            </div>
          </div>
          <div className="bg-[#121A2F]/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-cyan-500/50 transition-colors" onClick={() => setActiveTab("pedidos")}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-cyan-500/20 text-cyan-400"><FiShoppingCart /></div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Pedidos Pendentes</p>
              <p className="text-white text-2xl font-extrabold">{pedidosCompra.filter(p => p.status === "pendente").length}</p>
            </div>
          </div>
        </div>

        {/* Tabs Main */}
        <div className="flex gap-6 border-b border-slate-800 mb-6">
          <button className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'ferramentas' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('ferramentas')}>Ferramentas</button>
          <button className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'alertas' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('alertas')}>
            Alertas {alertas.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{alertas.length}</span>}
          </button>
          <button className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'pedidos' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('pedidos')}>Pedidos de Compra</button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === "ferramentas" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { id: "todas", label: "Todas" },
                  { id: "broca", label: "Brocas" },
                  { id: "interna", label: "Internas" },
                  { id: "externa", label: "Externas" },
                  { id: "intercambiavel", label: "Intercambiáveis" },
                  { id: "material", label: "Materiais" },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveSubTab(t.id as any)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeSubTab === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Buscar ferramenta..." value={search} onChange={e => setSearch(e.target.value)} className="bg-[#1A233A]/60 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 md:w-64" />
            </div>

            {filteredFerramentas.length === 0 ? (
              <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl">Nenhuma ferramenta encontrada.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFerramentas.map(f => (
                  <div key={f.id} className="bg-[#121A2F]/80 border border-slate-800 rounded-3xl p-5 hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-100">{f.nome}</h3>
                        <p className="text-xs text-slate-500">{f.referencia ? `Ref: ${f.referencia}` : ''} {f.fabricante ? `| Fab: ${f.fabricante}` : ''}</p>
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(f)} className="p-1.5 text-slate-400 hover:text-indigo-400"><FiEdit2 size={14}/></button>
                        <button onClick={() => removeFerramenta(f.id)} className="p-1.5 text-slate-400 hover:text-red-400"><FiTrash2 size={14}/></button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <p className="text-3xl font-extrabold text-white">{f.quantidade} <span className="text-sm text-slate-500 font-medium">{f.unidade}</span></p>
                        <p className="text-xs text-slate-400 mt-1">Mínimo: {f.quantidadeMinima}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        <button onClick={() => ajustarQuantidade(f.id, -1)} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"><FiMinus size={16}/></button>
                        <button onClick={() => ajustarQuantidade(f.id, 1)} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"><FiPlus size={16}/></button>
                      </div>
                    </div>
                    {renderProgressBar(f.quantidade, f.quantidadeMinima)}
                    
                    {f.quantidade <= f.quantidadeMinima && (
                      <button onClick={() => openSolicitarCompra(f)} className="w-full mt-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-colors flex items-center justify-center gap-2">
                        <FiShoppingCart /> Solicitar Compra
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "alertas" && (
          <div className="space-y-4">
            {alertas.length === 0 ? (
              <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl">Nenhum alerta de estoque no momento.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alertas.map(f => (
                  <div key={f.id} className="bg-red-500/5 border border-red-500/20 rounded-3xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-100">{f.nome}</h3>
                        <p className="text-xs text-slate-500 mt-1">Ref: {f.referencia || "N/A"}</p>
                      </div>
                      <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-md border border-red-500/30">Baixo</span>
                    </div>
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-2xl font-extrabold text-red-400">{f.quantidade} <span className="text-sm font-medium text-red-400/70">{f.unidade}</span></p>
                        <p className="text-xs text-slate-400">Mínimo necessário: {f.quantidadeMinima}</p>
                      </div>
                    </div>
                    <button onClick={() => openSolicitarCompra(f)} className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                      <FiShoppingCart /> Solicitar Reposição
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "pedidos" && (
          <div className="bg-[#121A2F]/80 border border-slate-800 rounded-3xl overflow-hidden">
            {pedidosCompra.length === 0 ? (
              <div className="text-center py-20 text-slate-500">Nenhum pedido de compra registrado.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Ferramenta</th>
                    <th className="px-6 py-4">Qtd</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Solicitante</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosCompra.map(p => (
                    <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-200">
                        {p.ferramentaNome}
                        {p.isAvulso && <span className="ml-2 text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded uppercase">Avulso</span>}
                      </td>
                      <td className="px-6 py-4 text-amber-400 font-bold">{p.quantidade}</td>
                      <td className="px-6 py-4">
                        {p.status === 'pendente' && <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">Pendente</span>}
                        {p.status === 'aprovado' && <span className="text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded border border-cyan-400/20">Aprovado</span>}
                        {p.status === 'recebido' && <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Recebido</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{p.solicitante || "Sistema"}</td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'pendente' && (
                          <button onClick={() => updateStatusPedido(p.id, 'aprovado')} className="text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Aprovar</button>
                        )}
                        {p.status === 'aprovado' && (
                          <button onClick={() => {
                            updateStatusPedido(p.id, 'recebido', p.quantidade);
                            if (p.isAvulso) {
                              setForm({ ...EMPTY_FERRAMENTA, nome: p.ferramentaNome, quantidade: p.quantidade, tipo: 'material' });
                              setEditingId(null);
                              setShowForm(true);
                            }
                          }} className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                            Marcar Recebido
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </main>

      {/* Modal Ferramenta */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">{editingId ? "Editar Ferramenta" : "Nova Ferramenta"}</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Nome *</label>
                <input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as any})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="broca">Broca</option>
                    <option value="interna">Ferramenta Interna</option>
                    <option value="externa">Ferramenta Externa</option>
                    <option value="intercambiavel">Intercambiável</option>
                    <option value="material">Material (Eixo, Nylon, etc)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Unidade</label>
                  <input type="text" value={form.unidade} placeholder="Ex: un, cx" onChange={e => setForm({...form, unidade: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Qtd Atual</label>
                  <input type="number" min="0" value={form.quantidade} onChange={e => setForm({...form, quantidade: Number(e.target.value)})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Qtd Mínima</label>
                  <input type="number" min="0" value={form.quantidadeMinima} onChange={e => setForm({...form, quantidadeMinima: Number(e.target.value)})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Fabricante</label>
                  <input type="text" value={form.fabricante} onChange={e => setForm({...form, fabricante: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Referência</label>
                  <input type="text" value={form.referencia} onChange={e => setForm({...form, referencia: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
                <button onClick={saveFerramenta} className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all">Salvar Ferramenta</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pedido de Compra */}
      {showPedidoForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPedidoForm(false)} />
          <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Solicitar Compra</h2>
            <p className="text-slate-400 text-sm mb-6">{pedidoForm.ferramentaNome}</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Quantidade Solicitada *</label>
                <input type="number" min="1" value={pedidoForm.quantidade} onChange={e => setPedidoForm({...pedidoForm, quantidade: Number(e.target.value)})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Observação</label>
                <input type="text" placeholder="Urgência, fornecedor específico..." value={pedidoForm.observacao} onChange={e => setPedidoForm({...pedidoForm, observacao: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowPedidoForm(false)} className="flex-1 py-3 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
                <button onClick={savePedido} className="flex-1 py-3 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all">Confirmar Solicitação</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EstoquePage;
