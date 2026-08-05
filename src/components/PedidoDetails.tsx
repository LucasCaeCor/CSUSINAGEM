import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_BACKEND_URL;

interface Pedido {
  id: string;
  quantidade: number;
  material: string;
  description?: string;
  dataEmissao: string;
  status: string;
  tipo: 'pedido' | 'orcamento';
  valor?: number;
  cliente: string;
  item: { id: string; name: string };
}

const PedidoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const fetchPedido = async () => {
      setLoading(true);
      try {
        // Tentar buscar como pedido
        let res = await fetch(`${API_URL}/pedido/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) {
          // Tentar buscar como orçamento
          res = await fetch(`${API_URL}/orcamento-pdf/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
        }
        if (!res.ok) throw new Error('Erro ao buscar pedido/orçamento');
        const data = await res.json();
        console.log('Dados do pedido/orçamento:', data);
        setPedido(data);
        setStatus(data.status || '');
      } catch (error) {
        console.error('Erro ao buscar pedido/orçamento:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id]);

  const handleStatusChange = async () => {
    try {
      const endpoint = pedido?.tipo === 'pedido' ? `/pedidos/${id}/status` : `/items/${pedido?.item.id}/status`;
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      const updatedData = await res.json();
      setPedido(updatedData);
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Detalhes do Pedido/Orçamento</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : pedido ? (
          <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
            <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
              <h3 className="text-xl font-semibold text-white">{pedido.item.name}</h3>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-400">Cliente</dt>
                  <dd className="mt-1 text-sm text-slate-100">{pedido.cliente}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-400">Quantidade</dt>
                  <dd className="mt-1 text-sm text-slate-100">{pedido.quantidade}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-400">Material</dt>
                  <dd className="mt-1 text-sm text-slate-100">{pedido.material}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-400">Descrição</dt>
                  <dd className="mt-1 text-sm text-slate-100">{pedido.description || 'N/A'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-400">Data de Emissão</dt>
                  <dd className="mt-1 text-sm text-slate-100">
                    {new Date(pedido.dataEmissao).toLocaleDateString('pt-BR')}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-400">Status</dt>
                  <dd className="mt-1 flex items-center space-x-2">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-slate-700 text-white"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="CONCLUIDO">Concluído</option>
                    </select>
                    <button 
                      onClick={handleStatusChange}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      Atualizar
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-400">Tipo</dt>
                  <dd className="mt-1 text-sm text-slate-100 uppercase">{pedido.tipo}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-400">Valor</dt>
                  <dd className="mt-1 text-sm text-slate-100">
                    {pedido.valor ? `R$ ${pedido.valor.toFixed(2)}` : 'N/A'}
                  </dd>
                </div>
              </dl>
              <div className="mt-8 pt-6 border-t border-slate-700">
                <button 
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 transition-colors"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 p-6 rounded-lg text-center text-slate-400">
            <p>Pedido/Orçamento não encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PedidoDetails;