import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';

// Tipos para os dados
interface Historico {
    id: string;
    acao: string;
    entidade: string;
    entidadeId: string;
    dados: string | null;
    usuarioNome: string | null;
    createdAt: string;
}

interface Item {
    id: string;
    name: string;
    subname?: string;
    status: string;
}

interface Orcamento {
    id: string;
    valor: number;
    status: string;
    dataEmissao: string;
}

interface Pedido {
    id: string;
    status: string;
    dataEmissao: string;
}

interface TimelineItem {
    id: string;
    type: 'ITEM' | 'ORCAMENTO' | 'PEDIDO';
    title: string;
    description: string;
    date: string;
    status: string;
    data?: any;
    history?: Historico[];
}

const HistoryPage: React.FC = () => {
    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'ITEMS' | 'ORCAMENTOS' | 'PEDIDOS'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const API_URL = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();

   useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);

                // Busca todos os históricos recentes
                const response = await fetch(`${API_URL}/historico?porPagina=50`);
                if (!response.ok) throw new Error('Erro ao buscar histórico');

                const data = await response.json();

                // Processa os dados para criar a linha do tempo
                const processedItems = await processHistoryData(data.dados);

                setTimelineItems(processedItems);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido');
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const processHistoryData = async (historyData: Historico[]): Promise<TimelineItem[]> => {
        const itemsMap = new Map<string, TimelineItem>();

        for (const history of historyData) {
            const key = `${history.entidade}-${history.entidadeId}`;

            if (!itemsMap.has(key)) {
                let entityDetails: any = {};
                try {
                    let endpoint = '';
                    let response;

                    switch (history.entidade) {
                        case 'ITEM':
                            endpoint = `item`;
                            break;
                        case 'ORCAMENTO':
                            try {
                                // Tenta buscar o orçamento da API
                                const responseOrcamento = await fetch(`${API_URL}/orcamentos/${history.entidadeId}`);

                                if (responseOrcamento.ok) {
                                    entityDetails = await responseOrcamento.json();
                                } else {
                                    // Se não encontrar na API, extrai do histórico
                                    try {
                                        if (history.dados) {
                                            const historicoDados = JSON.parse(history.dados);
                                            // Verifica se tem dados nos campos "antigos" ou "novos"
                                            const dadosOrcamento = historicoDados.novos || historicoDados.antigos || historicoDados;

                                            entityDetails = {
                                                id: history.entidadeId,
                                                valor: dadosOrcamento.valor,
                                                cliente: dadosOrcamento.cliente,
                                                quantidade: dadosOrcamento.quantidade,
                                                material: dadosOrcamento.material,
                                                operacao: dadosOrcamento.operacao,
                                                dataEmissao: dadosOrcamento.dataEmissao,
                                                status: dadosOrcamento.status || 'PENDENTE',
                                                item: dadosOrcamento.item ? {
                                                    id: dadosOrcamento.item.id,
                                                    name: dadosOrcamento.item.name,
                                                    subname: dadosOrcamento.item.subname
                                                } : null
                                            };
                                        }
                                    } catch (parseError) {
                                        console.error('Erro ao parsear dados do histórico:', parseError);
                                        entityDetails = {
                                            id: history.entidadeId,
                                            status: 'NÃO_ENCONTRADO'
                                        };
                                    }
                                }

                                // Normalização de status
                                if (entityDetails.status) {
                                    let statusNormalizado = entityDetails.status.toString()
                                        .toUpperCase()
                                        .replace(/\s+/g, '_')
                                        .replace('-', '_');
                                    const statusValidos = ['PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO', 'CONVERTIDO', 'EM_ANDAMENTO', 'NÃO_ENCONTRADO'];
                                    if (!statusValidos.includes(statusNormalizado)) {
                                        statusNormalizado = 'PENDENTE';
                                    }
                                    entityDetails.status = statusNormalizado;
                                }
                            } catch (err) {
                                console.error('Erro ao buscar orçamento:', err);
                                entityDetails = {
                                    id: history.entidadeId,
                                    status: 'ERRO'
                                };
                            }
                            break;
                        case 'PEDIDO':
                            endpoint = `pedido`;
                            break;
                        default:
                            continue;
                    }

                    // Se não preencheu os detalhes ainda (caso não seja orçamento)
                    if (!entityDetails.id && endpoint) {
                        response = await fetch(`${API_URL}/${endpoint}/${history.entidadeId}`);
                        if (response.ok) {
                            entityDetails = await response.json();
                        }
                    }

                    // Normalização de status para orçamentos
                    if (history.entidade === 'ORCAMENTO' && entityDetails.status) {
                        let statusNormalizado = entityDetails.status.toString().toUpperCase().replace(/\s+/g, '_');
                        const statusValidos = ['PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO', 'CONVERTIDO'];
                        if (!statusValidos.includes(statusNormalizado)) {
                            statusNormalizado = 'PENDENTE';
                        }
                        entityDetails.status = statusNormalizado;
                    }
                } catch (err) {
                    console.error(`Erro ao buscar detalhes de ${history.entidade}:`, err);
                }

                // Cria o item da linha do tempo
                const timelineItem: TimelineItem = {
                    id: history.entidadeId,
                    type: (entityDetails.isConverted ? 'PEDIDO' : history.entidade) as 'ITEM' | 'ORCAMENTO' | 'PEDIDO',
                    title: getEntityTitle(history.entidade, entityDetails),
                    description: getEntityDescription(history.entidade, entityDetails),
                    date: new Date(history.createdAt).toLocaleString(),
                    status: entityDetails.status || 'N/A',
                    data: entityDetails,
                    history: []
                };

                itemsMap.set(key, timelineItem);
            }
            // Adiciona o histórico ao item
            const item = itemsMap.get(key);
            if (item && item.history) {
                item.history.push(history);
                // Atualiza a data para a mais recente
                item.date = new Date(history.createdAt).toLocaleString();
            }
        }

        return Array.from(itemsMap.values()).sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    };


    const getEntityTitle = (entityType: string, data: any): string => {
        switch (entityType) {
            case 'ITEM':
                return `${data.name}${data.subname ? ` - ${data.subname}` : ''}`;
            case 'ORCAMENTO':
                // Verifica se tem cliente nos dados diretos ou no histórico
                const cliente = data.cliente ||
                    (data.data?.cliente) ||
                    (typeof data.dados === 'string' ? JSON.parse(data.dados)?.cliente : data.dados?.cliente) ||
                    'Sem cliente';
                return `Orçamento #${data.id.slice(-4)} - ${cliente}`;
            case 'PEDIDO':
                return `Pedido #${data.id.slice(-4)} - ${data.cliente || 'Sem cliente'}`;
            default:
                return `${entityType} #${data.id.slice(-4)}`;
        }
    };

    const getEntityDescription = (entityType: string, data: any): string => {
        switch (entityType) {
            case 'ITEM':
                return `Status: ${data.status}`;
            case 'ORCAMENTO':
                // Extrai valor de diferentes possíveis localizações
                const valor = data.valor ||
                    (data.data?.valor) ||
                    (typeof data.dados === 'string' ? JSON.parse(data.dados)?.valor : data.dados?.valor);

                const valorFormatado = valor ? `R$ ${Number(valor).toFixed(2)}` : 'Valor não disponível';
                return `${valorFormatado} | Status: ${data.status || 'N/A'}`;
            case 'PEDIDO':
                return `Material: ${data.material} | Status: ${data.status}`;
            default:
                return `Tipo: ${entityType}`;
        }
    };

    const handleItemClick = (item: TimelineItem) => {
        setSelectedItem(item);
    };

    const handleBackToList = () => {
        setSelectedItem(null);
    };

    const filteredItems = timelineItems.filter(item => {
        const matchesFilter = filter === 'ALL' ||
            (filter === 'ITEMS' && item.type === 'ITEM') ||
            (filter === 'ORCAMENTOS' && item.type === 'ORCAMENTO') ||
            (filter === 'PEDIDOS' && item.type === 'PEDIDO');

        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    if (loading) return <div className="history-loading">Carregando histórico...</div>;
    if (error) return <div className="history-error">Erro: {error}</div>;

    return (
        <div className="flex h-screen bg-[#0B1121] overflow-hidden text-slate-300">
            <Sidebar onCategoryAdded={() => {}} setItems={() => {}} />
            <div className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B1121] to-[#0B1121]">
                {!selectedItem ? (
                    <div className="flex flex-col h-full">
                        {/* Header Section */}
                        <div className="px-8 py-6 border-b border-slate-800/50 bg-[#121A2F]/50 backdrop-blur-md shrink-0">
                            <h1 className="text-3xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Histórico de Atividades
                            </h1>
                            
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                {/* Filters */}
                                <div className="flex bg-[#0B1121] p-1 rounded-lg border border-slate-700/50 w-full sm:w-auto">
                                    {(['ALL', 'ITEMS', 'ORCAMENTOS', 'PEDIDOS'] as const).map(f => (
                                        <button
                                            key={f}
                                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex-1 sm:flex-none ${filter === f ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                                            onClick={() => setFilter(f)}
                                        >
                                            {f === 'ALL' ? 'Todos' : f === 'ITEMS' ? 'Itens' : f === 'ORCAMENTOS' ? 'Orçamentos' : 'Pedidos'}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Search */}
                                <div className="relative w-full sm:w-64">
                                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Pesquisar atividades..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-[#1A2338] border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder-slate-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-4">
                                {filteredItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#121A2F]/50 rounded-2xl border border-slate-800 border-dashed">
                                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-1">Nenhuma atividade encontrada</h3>
                                        <p className="text-slate-500 text-sm">Tente mudar seus filtros ou termos de pesquisa.</p>
                                    </div>
                                ) : (
                                    filteredItems.map((item) => {
                                        let typeColor = '';
                                        switch(item.type) {
                                            case 'ITEM': typeColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20'; break;
                                            case 'ORCAMENTO': typeColor = 'text-purple-400 bg-purple-400/10 border-purple-400/20'; break;
                                            case 'PEDIDO': typeColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'; break;
                                        }

                                        return (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                className="bg-[#121A2F]/70 border border-slate-700/60 p-5 rounded-2xl hover:border-indigo-500/50 hover:bg-[#1A2338] transition-all cursor-pointer group shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                                onClick={() => handleItemClick(item)}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeColor}`}>
                                                            {item.type}
                                                        </span>
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            {item.date}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{item.title}</h3>
                                                    <p className="text-sm text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                                                </div>
                                                
                                                <div className="shrink-0">
                                                    <span className="inline-flex px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                                        {item.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Detail View */
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Detail Header */}
                        <div className="px-8 py-6 border-b border-slate-800/50 bg-[#121A2F]/50 backdrop-blur-md shrink-0">
                            <button 
                                onClick={handleBackToList} 
                                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm mb-4 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Voltar para linha do tempo
                            </button>
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">{selectedItem.title}</h2>
                                    <p className="text-slate-400 mt-1">{selectedItem.type}</p>
                                </div>
                                <div className="px-4 py-1.5 bg-slate-800 border border-slate-600 rounded-full text-sm font-bold uppercase tracking-wider text-slate-200">
                                    Status: {selectedItem.status.replace(/_/g, ' ')}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* Info Panel */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Dados Atuais do Recurso
                                    </h3>
                                    <div className="bg-[#121A2F] border border-slate-700/60 rounded-2xl p-6 shadow-sm overflow-hidden">
                                        <pre className="text-xs text-indigo-200 font-mono overflow-auto custom-scrollbar">
                                            {JSON.stringify(selectedItem.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                {/* Timeline Panel */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        Linha do Tempo
                                    </h3>
                                    <div className="bg-[#121A2F]/40 border border-slate-800 rounded-2xl p-6 sm:p-8">
                                        {selectedItem.history && selectedItem.history.length > 0 ? (
                                            <div className="relative border-l border-slate-700 ml-3 space-y-8">
                                                {selectedItem.history.map((event, index) => (
                                                    <div key={event.id} className="relative pl-6">
                                                        {/* Dot */}
                                                        <span className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] bg-indigo-500 rounded-full ring-4 ring-[#0B1121]"></span>
                                                        
                                                        {/* Content */}
                                                        <div className="bg-[#1A2338] border border-slate-700 rounded-xl p-4 shadow-sm group hover:border-indigo-500/30 transition-colors">
                                                            <div className="flex flex-col sm:flex-row justify-between mb-2 gap-1">
                                                                <strong className="text-sm text-indigo-300 uppercase tracking-wide">
                                                                    {event.acao.replace(/_/g, ' ')}
                                                                </strong>
                                                                <time className="text-xs text-slate-500 font-medium font-mono">
                                                                    {new Date(event.createdAt).toLocaleString()}
                                                                </time>
                                                            </div>
                                                            <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                Operador: <span className="text-slate-300 font-medium">{event.usuarioNome || 'Sistema'}</span>
                                                            </div>
                                                            {event.dados && (
                                                                <div className="mt-3 bg-black/40 p-3 rounded-lg border border-slate-800">
                                                                    <pre className="text-[10px] text-slate-300 font-mono overflow-auto custom-scrollbar">
                                                                        {JSON.stringify(JSON.parse(event.dados), null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 text-sm text-center py-4">Nenhum histórico disponível para este item.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;