import React, { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useEmpresas, Empresa } from "../hooks/useEmpresas";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck } from "react-icons/fi";

const API_URL = import.meta.env.VITE_BACKEND_URL;
const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16"];

interface EmpresaStats extends Empresa {
  totalPedidos: number; totalOrcamentos: number; qtdTotal: number; valorTotal: number;
}

const EMPTY_FORM = { nome: "", cnpj: "", contato: "" };

const EmpresasPage: React.FC = () => {
  const { allItems, orcamentos } = useAuth();
  const { empresas, addEmpresa, updateEmpresa, removeEmpresa } = useEmpresas();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EmpresaStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Empresa | null>(null);

  const statsMap = useMemo(() => {
    const m: Record<string, { pedidos: number; orcamentos: number; qtd: number; valor: number }> = {};
    allItems.forEach(item => {
      (item.pedidos || []).forEach((p: any) => {
        const n = (p.cliente || "").trim(); if (!n) return;
        if (!m[n]) m[n] = { pedidos: 0, orcamentos: 0, qtd: 0, valor: 0 };
        m[n].pedidos++; m[n].qtd += p.quantidade || 0; m[n].valor += p.valor || 0;
      });
    });
    orcamentos.forEach((o: any) => {
      const n = (o.cliente || "").trim(); if (!n) return;
      if (!m[n]) m[n] = { pedidos: 0, orcamentos: 0, qtd: 0, valor: 0 };
      m[n].orcamentos++; m[n].qtd += o.quantidade || 0; m[n].valor += o.valor || 0;
    });
    return m;
  }, [allItems, orcamentos]);

  const empresasComStats: EmpresaStats[] = useMemo(() =>
    empresas.map(e => ({ ...e, ...(statsMap[e.nome] || { totalPedidos: 0, totalOrcamentos: 0, qtdTotal: 0, valorTotal: 0 }), totalPedidos: statsMap[e.nome]?.pedidos || 0, totalOrcamentos: statsMap[e.nome]?.orcamentos || 0, qtdTotal: statsMap[e.nome]?.qtd || 0, valorTotal: statsMap[e.nome]?.valor || 0 }))
    .sort((a, b) => b.qtdTotal - a.qtdTotal),
    [empresas, statsMap]
  );

  const filtered = empresasComStats.filter(e => (e?.nome || "").toLowerCase().includes(search.toLowerCase()));
  const topBar = empresasComStats.slice(0, 8).map(e => ({ nome: (e?.nome || "").split(" ")[0], qtd: e.qtdTotal, valor: e.valorTotal }));
  const pieData = empresasComStats.slice(0, 6).map(e => ({ name: (e?.nome || "Sem Nome").split(" ")[0], value: e.totalPedidos + e.totalOrcamentos }));
  const totalValor = empresasComStats.reduce((s, e) => s + e.valorTotal, 0);
  const totalQtd = empresasComStats.reduce((s, e) => s + e.qtdTotal, 0);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setShowForm(true); };
  const openEdit = (e: Empresa) => { setEditing(e); setForm({ nome: e.nome, cnpj: e.cnpj || "", contato: e.contato || "" }); setFormError(""); setShowForm(true); };

  const handleSave = async () => {
    if (!form.nome.trim()) { setFormError("Nome é obrigatório."); return; }
    if (editing) {
      const saved = await updateEmpresa({ ...editing, nome: form.nome.trim(), cnpj: form.cnpj.trim(), contato: form.contato.trim() });
      if (!saved) {
        setFormError("Falha ao salvar. Verifique a conexão e tente novamente.");
        return;
      }
      if (selected?.id === saved.id) {
        setSelected({ ...selected, nome: saved.nome, cnpj: saved.cnpj || "", contato: saved.contato || "" });
      }
    } else {
      const saved = await addEmpresa({ nome: form.nome.trim(), cnpj: form.cnpj.trim(), contato: form.contato.trim() });
      if (!saved) {
        setFormError("Falha ao criar empresa. Verifique a conexão e tente novamente.");
        return;
      }
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    removeEmpresa(confirmDelete.id);
    if (selected?.id === confirmDelete.id) setSelected(null);
    setConfirmDelete(null);
  };

  const inputCls = "w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-600";

  return (
    <div className="flex min-h-screen bg-[#070D19] text-white font-sans md:ml-[260px]">
      <Sidebar onCategoryAdded={() => {}} setItems={() => {}} />
      <main className="flex-1 w-full min-h-screen p-4 md:p-8 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Empresas</h1>
            <p className="text-slate-400 mt-1 text-sm">{empresas.length} empresa{empresas.length !== 1 ? "s" : ""} cadastrada{empresas.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-[#1A233A]/60 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 w-52" />
            </div>
            <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
              <FiPlus /> Nova Empresa
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Empresas", value: empresas.length, icon: "🏭", color: "bg-indigo-500/20 text-indigo-400" },
              { label: "Total Pedidos", value: empresasComStats.reduce((s, e) => s + e.totalPedidos, 0), icon: "📦", color: "bg-emerald-500/20 text-emerald-400" },
              { label: "Qtd. Peças", value: totalQtd.toLocaleString("pt-BR"), icon: "⚙️", color: "bg-amber-500/20 text-amber-400" },
              { label: "Valor Total", value: `R$ ${totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "💰", color: "bg-cyan-500/20 text-cyan-400" },
            ].map(k => (
              <div key={k.label} className="bg-[#121A2F]/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${k.color}`}>{k.icon}</div>
                <div><p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{k.label}</p><p className="text-white text-xl font-extrabold">{k.value}</p></div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {topBar.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#121A2F]/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Quantidade de Peças por Empresa</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topBar} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="nome" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-30} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0B1121", borderColor: "#1e293b", color: "#f8fafc", borderRadius: "12px" }} />
                    <Bar dataKey="qtd" name="Peças" radius={[6,6,0,0]}>{topBar.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[#121A2F]/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Participação por Empresa</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4}>
                      {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0B1121", borderColor: "#1e293b", color: "#f8fafc", borderRadius: "12px" }} />
                    <Legend formatter={v => <span className="text-slate-300 text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cards */}
          <div>
            <h2 className="text-base font-bold text-slate-300 mb-4">Todas as Empresas</h2>
            {empresas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-3xl">
                <span className="text-5xl mb-4 opacity-30">🏭</span>
                <p className="text-lg mb-4">Nenhuma empresa cadastrada.</p>
                <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all">
                  <FiPlus /> Cadastrar primeira empresa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((e, i) => (
                  <div key={e.id} className="bg-[#121A2F]/80 border border-slate-800 rounded-3xl p-5 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group cursor-pointer" onClick={() => setSelected(e)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-extrabold" style={{ background: COLORS[i%COLORS.length]+"25", border: `1px solid ${COLORS[i%COLORS.length]}40` }}>
                        <span style={{ color: COLORS[i%COLORS.length] }}>{e.nome[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={ev => ev.stopPropagation()}>
                        <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><FiEdit2 size={14} /></button>
                        <button onClick={() => setConfirmDelete(e)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><FiTrash2 size={14} /></button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-100 text-sm mb-1 truncate">{e.nome}</h3>
                    {e.cnpj && <p className="text-slate-500 text-xs mb-3">{e.cnpj}</p>}
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800">
                      {[["Pedidos", e.totalPedidos, "text-indigo-400"], ["Qtd. Peças", e.qtdTotal, "text-amber-400"], ["Valor", `R$ ${e.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "text-emerald-400"]].map(([l, v, c]) => (
                        <div key={String(l)} className="flex justify-between text-xs"><span className="text-slate-500">{l}</span><span className={`font-bold ${c}`}>{v}</span></div>
                      ))}
                    </div>
                    <p className="mt-3 text-indigo-400 text-xs font-semibold group-hover:text-cyan-400 transition-colors">Ver detalhes →</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Form Modal (new/edit) */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editing ? "Editar Empresa" : "Nova Empresa"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><FiX size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome *</label>
                <input type="text" placeholder="Nome da empresa" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CNPJ</label>
                <input type="text" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contato</label>
                <input type="text" placeholder="Telefone, e-mail..." value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} className={inputCls} />
              </div>
              {formError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
                <FiCheck className="inline mr-1" />{editing ? "Salvar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">Excluir Empresa</h2>
            <p className="text-slate-400 text-sm">Tem certeza que deseja excluir <strong className="text-white">{confirmDelete.nome}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-400 rounded-xl transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[520px] bg-[#0B1121] border-l border-slate-800 shadow-2xl z-[60] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
              <div>
                <h2 className="text-lg font-extrabold text-white">{selected.nome}</h2>
                {selected.cnpj && <p className="text-slate-400 text-xs mt-0.5">{selected.cnpj}</p>}
                {selected.contato && <p className="text-slate-500 text-xs">{selected.contato}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { openEdit(selected); setSelected(null); }} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><FiEdit2 /></button>
                <button onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><FiX /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[["Pedidos", selected.totalPedidos, "text-indigo-400"], ["Orçamentos", selected.totalOrcamentos, "text-cyan-400"], ["Qtd. Peças", selected.qtdTotal, "text-amber-400"], ["Valor Total", `R$ ${selected.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "text-emerald-400"]].map(([l, v, c]) => (
                  <div key={String(l)} className="bg-[#121A2F]/80 border border-slate-800 rounded-2xl p-4 text-center">
                    <p className={`text-xl font-extrabold ${c}`}>{v}</p>
                    <p className="text-slate-500 text-xs mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmpresasPage;
