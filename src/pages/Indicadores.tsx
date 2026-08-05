import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, Treemap, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Category } from '../components/CategoriesList';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Indicadores: React.FC = () => {
  const { user, allItems, orcamentos, setAllItems, setOrcamentos } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'pedido' | 'orcamento'>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryStats, setCategoryStats] = useState<{ name: string; itemCount: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'categorias' | 'empresas'>('pedidos');

  useEffect(() => {
    if (startDate && endDate) {
      setDateRange([startDate, endDate]);
    } else {
      setDateRange(null);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Erro ao buscar categorias');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('[Indicadores] Erro ao buscar categorias:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (!Array.isArray(allItems)) {
    return <div className="p-8 text-red-400 bg-red-500/10 rounded-xl m-8">Erro: Dados de itens inválidos</div>;
  }

  const filteredItems = allItems
    .filter(i => Array.isArray(i.pedidos) && i.pedidos.length > 0)
    .map(i => ({ ...i, pedido: i.pedidos![0] }))
    .concat(
      orcamentos.map(o => ({
        id: o.itemId || o.item?.id || '',
        name: o.item?.name || '',
        status: o.status,
        pedido: {
          id: o.id,
          quantidade: o.quantidade || 0,
          material: o.material || 'Não especificado',
          description: o.observacao,
          dataEmissao: o.dataEmissao || new Date().toISOString(),
          status: o.status,
          tipo: 'orcamento' as const,
          valor: o.valor,
          cliente: o.cliente || 'Não especificado',
        },
      }))
    )
    .filter(i => i.pedido)
    .filter(i => filterTipo === 'all' || i.pedido!.tipo === filterTipo)
    .filter(i => {
      if (!dateRange) return true;
      const date = new Date(i.pedido!.dataEmissao);
      return date >= new Date(dateRange[0]) && date <= new Date(dateRange[1]);
    });

  const pedidosByClienteAndTipo = filteredItems.reduce((acc, i) => {
    const cliente = i.pedido!.cliente || 'Não especificado';
    const tipo = i.pedido!.tipo;
    if (!acc[cliente]) acc[cliente] = { cliente, pedido: 0, orcamento: 0 };
    acc[cliente][tipo] += i.pedido!.quantidade;
    return acc;
  }, {} as Record<string, { cliente: string; pedido: number; orcamento: number }>);
  
  const clienteBarData = Object.values(pedidosByClienteAndTipo).sort((a, b) => b.pedido + b.orcamento - (a.pedido + a.orcamento)).slice(0, 5);

  const pedidosByStatus = filteredItems.reduce((acc, i) => {
    const status = i.pedido!.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusPieData = Object.entries(pedidosByStatus).map(([status, count]) => ({ status, count }));

  const pedidosByMonth = filteredItems.reduce((acc, i) => {
    const month = new Date(i.pedido!.dataEmissao).toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
    const tipo = i.pedido!.tipo;
    if (!acc[month]) acc[month] = { month, pedido: 0, orcamento: 0 };
    acc[month][tipo] += i.pedido!.valor || 0;
    return acc;
  }, {} as Record<string, { month: string; pedido: number; orcamento: number }>);
  const areaChartData = Object.values(pedidosByMonth);

  const scatterData = filteredItems
    .filter(i => i.pedido!.tipo === 'orcamento' && i.pedido!.valor)
    .map(i => ({
      quantidade: i.pedido!.quantidade,
      valor: i.pedido!.valor,
      processingTime: 0,
      status: i.pedido!.status,
      cliente: i.pedido!.cliente,
      id: i.pedido!.id,
    }));

  const pedidosByMaterial = filteredItems.reduce((acc, i) => {
    const material = i.pedido!.material || 'Não especificado';
    acc[material] = (acc[material] || 0) + i.pedido!.quantidade;
    return acc;
  }, {} as Record<string, number>);
  const treemapData = Object.entries(pedidosByMaterial).map(([material, quantidade]) => ({ name: material, value: quantidade }));

  const tableData = filteredItems.map(i => ({
    key: i.pedido!.id,
    pedidoId: i.pedido!.id,
    name: i.name,
    cliente: i.pedido!.cliente,
    quantidade: i.pedido!.quantidade,
    material: i.pedido!.material,
    status: i.pedido!.status,
    tipo: i.pedido!.tipo,
    dataEmissao: i.pedido!.dataEmissao,
  })).slice(0, 5); // Limit 5 for recent

  const handleTransformarEmPedido = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_URL}/orcamentos/${id}/transformar-em-pedido`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Erro ao transformar orçamento');
      const data = await res.json();
      setAllItems(prev => prev.map(item =>
        item.id === data.itemAtualizado?.id
          ? { ...item, status: data.itemAtualizado.novoStatus, pedidos: [data.pedido] }
          : item
      ));
      setOrcamentos(prev => prev.filter(o => o.id !== id));
      alert('Orçamento transformado em pedido com sucesso!');
    } catch (error) {
      console.error('[Indicadores] Erro ao transformar orçamento:', error);
      alert('Erro ao transformar orçamento');
    }
  };

  const fetchItemsByCategory = async () => {
    setLoading(true);
    try {
      const categoryData = await Promise.all(
        categories.map(async (cat) => {
          const res = await fetch(`${API_URL}/categories/${cat.id}/items`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          const items = await res.json();
          return { name: cat.name, itemCount: items.length };
        })
      );
      setCategoryStats(categoryData);
    } catch (error) {
      console.error('[Indicadores] Erro ao buscar itens por categoria:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemsByCategory();
  }, [categories]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  // --- Empresa stats ---
  interface EmpresaStat { nome: string; pedidos: number; orcamentos: number; qtd: number; valor: number; }
  const empresaMap: Record<string, EmpresaStat> = {};
  allItems.forEach(item => {
    (item.pedidos || []).forEach((p: any) => {
      const nome = (p.cliente || 'Não informado').trim();
      if (!empresaMap[nome]) empresaMap[nome] = { nome, pedidos: 0, orcamentos: 0, qtd: 0, valor: 0 };
      empresaMap[nome].pedidos++;
      empresaMap[nome].qtd += p.quantidade || 0;
      empresaMap[nome].valor += p.valor || 0;
    });
  });
  orcamentos.forEach((o: any) => {
    const nome = (o.cliente || 'Não informado').trim();
    if (!empresaMap[nome]) empresaMap[nome] = { nome, pedidos: 0, orcamentos: 0, qtd: 0, valor: 0 };
    empresaMap[nome].orcamentos++;
    empresaMap[nome].qtd += o.quantidade || 0;
    empresaMap[nome].valor += o.valor || 0;
  });
  const empresaStats: EmpresaStat[] = Object.values(empresaMap).sort((a, b) => b.qtd - a.qtd);
  const empresaQtdData = empresaStats.slice(0, 8).map(e => ({ nome: e.nome.split(' ')[0], quantidade: e.qtd }));
  const empresaValorData = empresaStats.slice(0, 8).map(e => ({ nome: e.nome.split(' ')[0], valor: e.valor }));
  const empresaPieData = empresaStats.slice(0, 6).map(e => ({ name: e.nome.split(' ')[0], value: e.pedidos + e.orcamentos }));

  const CustomCard: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-[#121A2F]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
      <h3 className="text-lg font-bold text-slate-100 mb-6">{title}</h3>
      <div className="flex-1 min-h-[300px] w-full relative">
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-white w-full max-w-[1600px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 leading-tight">
            Indicadores <span className="bg-indigo-500/20 text-indigo-400 text-sm px-3 py-1 rounded-full border border-indigo-500/30 ml-2 align-middle">New</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">Métricas, gráficos e balanços de produção.</p>
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-[#121A2F]/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 px-2">
            <input 
              type="date" 
              className="bg-[#0B1121] border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span className="text-slate-500">até</span>
            <input 
              type="date" 
              className="bg-[#0B1121] border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <select 
            className="bg-[#0B1121] border border-slate-700 text-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="pedido">Pedidos</option>
            <option value="orcamento">Orçamentos</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-800 pb-px">
        <button 
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'pedidos' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('pedidos')}
        >
          Pedidos e Orçamentos
        </button>
        <button 
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'empresas' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('empresas')}
        >
          Por Empresa
        </button>
        <button 
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'categorias' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('categorias')}
        >
          Categorias
        </button>
      </div>

      {activeTab === 'pedidos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CustomCard title="Quantidade por Cliente e Tipo">
            {clienteBarData.length === 0 ? <p className="text-slate-500 mt-10">Nenhum dado disponível.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clienteBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="cliente" stroke="#64748b" tick={{fill: '#94a3b8'}} />
                  <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} />
                  <Bar dataKey="pedido" fill="#6366f1" name="Pedidos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orcamento" fill="#10b981" name="Orçamentos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CustomCard>

          <CustomCard title="Distribuição por Status">
            {statusPieData.length === 0 ? <p className="text-slate-500 mt-10">Nenhum dado disponível.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5}>
                    {statusPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CustomCard>

          <CustomCard title="Valor Total por Mês">
            {areaChartData.length === 0 ? <p className="text-slate-500 mt-10">Nenhum dado disponível.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={areaChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{fill: '#94a3b8'}} />
                  <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                  <Line type="monotone" dataKey="pedido" stroke="#6366f1" strokeWidth={3} name="Pedidos" dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="orcamento" stroke="#10b981" strokeWidth={3} name="Orçamentos" dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CustomCard>

          <CustomCard title="Quantidade vs. Valor vs. Tempo">
            {scatterData.length === 0 ? <p className="text-slate-500 mt-10">Nenhum orçamento encontrado.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="quantidade" type="number" name="Quantidade" stroke="#64748b" />
                  <YAxis dataKey="valor" type="number" name="Valor (R$)" stroke="#64748b" />
                  <ZAxis dataKey="processingTime" range={[100, 500]} name="Tempo (dias)" />
                  <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} />
                  <Scatter name="Orçamentos" data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.status === 'PENDENTE' ? '#f59e0b' : entry.status === 'APROVADO' ? '#10b981' : '#6366f1'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CustomCard>

          <CustomCard title="Distribuição por Material">
            {treemapData.length === 0 ? <p className="text-slate-500 mt-10">Nenhum material encontrado.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <Treemap data={treemapData} dataKey="value" nameKey="name" stroke="#0B1121" fill="#6366f1">
                  <Tooltip contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} formatter={(val: number) => `${val} unidades`} />
                  {treemapData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Treemap>
              </ResponsiveContainer>
            )}
          </CustomCard>

          <div className="col-span-1 lg:col-span-2 bg-[#121A2F]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-6">Pedidos e Orçamentos Recentes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    <th className="pb-4 pr-4">Item</th>
                    <th className="pb-4 pr-4">Cliente</th>
                    <th className="pb-4 pr-4">Qtd</th>
                    <th className="pb-4 pr-4">Material</th>
                    <th className="pb-4 pr-4">Status</th>
                    <th className="pb-4 pr-4">Tipo</th>
                    <th className="pb-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {tableData.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                  ) : tableData.map((row) => (
                    <tr key={row.key} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 pr-4 font-medium text-slate-200">{row.name}</td>
                      <td className="py-4 pr-4 text-slate-400">{row.cliente}</td>
                      <td className="py-4 pr-4 text-slate-400">{row.quantidade}</td>
                      <td className="py-4 pr-4 text-slate-400">{row.material}</td>
                      <td className="py-4 pr-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          row.status === 'APROVADO' || row.status === 'CONCLUIDO' ? 'bg-emerald-500/10 text-emerald-400' :
                          row.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-indigo-500/10 text-indigo-400'
                        }`}>{row.status}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`px-2 py-1 bg-slate-800 rounded-md text-slate-300 text-xs font-semibold capitalize`}>
                          {row.tipo}
                        </span>
                      </td>
                      <td className="py-4 flex gap-2">
                        <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-xs font-semibold" onClick={() => navigate(`/pedidos/${row.pedidoId}`)}>
                          Ver Detalhes
                        </button>
                        {row.tipo === 'orcamento' && row.status === 'APROVADO' && (
                          <button className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-lg transition-colors text-xs font-semibold" onClick={() => handleTransformarEmPedido(row.pedidoId)}>
                            + Pedido
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'empresas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomCard title="Quantidade de Peças por Empresa">
              {empresaQtdData.length === 0 ? <p className="text-slate-500 mt-10">Nenhum dado disponível.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={empresaQtdData} margin={{ top: 0, right: 0, bottom: 50, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="nome" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 11}} angle={-35} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} />
                    <Bar dataKey="quantidade" name="Peças" radius={[6,6,0,0]}>
                      {empresaQtdData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CustomCard>

            <CustomCard title="Valor Total (R$) por Empresa">
              {empresaValorData.length === 0 ? <p className="text-slate-500 mt-10">Nenhum dado disponível.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={empresaValorData} margin={{ top: 0, right: 0, bottom: 50, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="nome" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 11}} angle={-35} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                    <Bar dataKey="valor" name="Valor (R$)" radius={[6,6,0,0]}>
                      {empresaValorData.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CustomCard>

            <CustomCard title="Participação por Empresa (%)">
              {empresaPieData.length === 0 ? <p className="text-slate-500 mt-10">Nenhum dado disponível.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={empresaPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4}>
                      {empresaPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CustomCard>

            <div className="bg-[#121A2F]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Ranking de Empresas</h3>
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 text-left">#</th>
                      <th className="pb-3 text-left">Empresa</th>
                      <th className="pb-3 text-right">Pedidos</th>
                      <th className="pb-3 text-right">Orç.</th>
                      <th className="pb-3 text-right">Qtd</th>
                      <th className="pb-3 text-right">Valor R$</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresaStats.map((e, i) => (
                      <tr key={e.nome} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 pr-2 text-slate-500 font-bold">{i + 1}</td>
                        <td className="py-3 pr-4 text-slate-200 font-medium truncate max-w-[130px]">{e.nome}</td>
                        <td className="py-3 pr-4 text-right text-indigo-400 font-semibold">{e.pedidos}</td>
                        <td className="py-3 pr-4 text-right text-cyan-400 font-semibold">{e.orcamentos}</td>
                        <td className="py-3 pr-4 text-right text-amber-400 font-semibold">{e.qtd}</td>
                        <td className="py-3 text-right text-emerald-400 font-semibold">R$ {e.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                    {empresaStats.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nenhum dado encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="grid grid-cols-1 gap-6">
          <CustomCard title="Itens por Categoria">
            {loading ? <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div> :
              categoryStats.length === 0 ? <p className="text-slate-500 mt-10">Nenhuma categoria encontrada.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8'}} angle={-45} textAnchor="end" />
                  <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{backgroundColor: '#0B1121', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="itemCount" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                    {categoryStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CustomCard>
        </div>
      )}
    </div>
  );
};

export default Indicadores;