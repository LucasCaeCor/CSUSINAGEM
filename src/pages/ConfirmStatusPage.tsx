// pages/ConfirmStatusPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';


interface Item {
  id: string;
  name: string;
  subname: string;
  status: string;
  pedidos?: Array<{
    id: string;
    status: string;
    cliente: string;
    quantidade: number;
    material: string;
    operacao: string;
    dataEmissao: string;
    observacao?: string;
  }>;
}

const ConfirmStatusPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`${API_URL}/item/${itemId}`);
        if (!response.ok) throw new Error('Item não encontrado');
        const data = await response.json();
        setItem(data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Erro ao carregar item');
      }
    };
    fetchItem();
  }, [itemId]);

  const confirmStatus = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // Atualiza status do item
      const itemResponse = await fetch(`${API_URL}/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CONCLUIDO' }),
      });

      if (!itemResponse.ok) throw new Error('Falha ao atualizar status do item');

      // Se houver pedido associado, atualiza seu status também
      if (item?.pedidos?.[0]?.id) {
        const pedidoResponse = await fetch(`${API_URL}/pedidos/${item.pedidos[0].id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'CONCLUIDO' }),
        });

        if (!pedidoResponse.ok) throw new Error('Falha ao atualizar status do pedido');
      }

      setMessage('Status atualizado com sucesso!');
      // Atualiza os dados locais
      setItem(prev => prev ? { ...prev, status: 'CONCLUIDO' } : null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao confirmar status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="confirm-status-page">
      <div className="confirm-status-container">
        <h2>Confirmar Status do Item</h2>
        
        {message && (
          <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {item ? (
          <>
            <div className="item-info">
              <h3>{item.name || 'Item sem nome'}</h3>
              <p><strong>Código:</strong> {item.subname || 'Não informado'}</p>
              <p>
                <strong>Status atual:</strong> 
                <span className={`status ${item.status.toLowerCase()}`}>
                  {item.status === 'CONCLUIDO' ? 'Concluído' : 
                   item.status === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Pendente'}
                </span>
              </p>
            </div>

            {item.pedidos?.[0] && (
              <div className="pedido-info">
                <h4>Informações do Pedido</h4>
                <p><strong>Cliente:</strong> {item.pedidos[0].cliente || 'Não informado'}</p>
                <p><strong>Quantidade:</strong> {item.pedidos[0].quantidade || 'Não informado'}</p>
                {item.pedidos[0].dataEmissao && (
                  <p><strong>Data de Emissão:</strong> {new Date(item.pedidos[0].dataEmissao).toLocaleDateString()}</p>
                )}
              </div>
            )}

            <button 
              onClick={confirmStatus}
              disabled={item.status === 'CONCLUIDO' || isLoading}
              className={`confirm-btn ${item.status === 'CONCLUIDO' ? 'completed' : ''}`}
            >
              {isLoading ? 'Processando...' : 
               item.status === 'CONCLUIDO' ? 'Item já concluído' : 'Confirmar como Concluído'}
            </button>
          </>
        ) : (
          <p>Carregando informações do item...</p>
        )}

        <button onClick={() => navigate('/')} className="back-btn">
          Voltar para a página inicial
        </button>
      </div>
    </div>
  );
};

export default ConfirmStatusPage;