import { useState, useEffect, useCallback } from "react";

export type TipoFerramenta = "broca" | "interna" | "externa" | "intercambiavel" | "material";

export interface Ferramenta {
  id: string;
  nome: string;
  tipo: TipoFerramenta;
  descricao?: string;
  quantidade: number;
  quantidadeMinima: number;
  unidade: string;
  fabricante?: string;
  referencia?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PedidoCompra {
  id: string;
  ferramentaId?: string;
  ferramentaNome: string;
  quantidade: number;
  observacao?: string;
  status: "pendente" | "aprovado" | "recebido";
  isAvulso?: boolean;
  solicitante?: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_BACKEND_URL;

export function useEstoque() {
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompra[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [resF, resP] = await Promise.all([
        fetch(`${API_URL}/ferramentas`, { headers }),
        fetch(`${API_URL}/pedidos-compra`, { headers })
      ]);
      if (resF.ok) setFerramentas(await resF.json());
      if (resP.ok) setPedidosCompra(await resP.json());
    } catch (error) {
      console.error("Erro ao buscar estoque", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addFerramenta = useCallback(async (data: Omit<Ferramenta, "id" | "createdAt" | "updatedAt">): Promise<Ferramenta | null> => {
    try {
      const res = await fetch(`${API_URL}/ferramentas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Erro na API");
      const nova = await res.json();
      setFerramentas(prev => [nova, ...prev]);
      return nova;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const updateFerramenta = useCallback(async (updated: Ferramenta) => {
    const res = await fetch(`${API_URL}/ferramentas/${updated.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      const saved = await res.json();
      setFerramentas(prev => prev.map(f => f.id === saved.id ? saved : f));
    }
  }, []);

  const removeFerramenta = useCallback(async (id: string) => {
    const res = await fetch(`${API_URL}/ferramentas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      setFerramentas(prev => prev.filter(f => f.id !== id));
    }
  }, []);

  const ajustarQuantidade = useCallback(async (id: string, delta: number) => {
    const res = await fetch(`${API_URL}/ferramentas/${id}/quantidade`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ delta })
    });
    if (res.ok) {
      const updated = await res.json();
      setFerramentas(prev => prev.map(f => f.id === id ? updated : f));
    }
  }, []);

  const addPedidoCompra = useCallback(async (data: Omit<PedidoCompra, "id" | "createdAt" | "status">): Promise<PedidoCompra | null> => {
    try {
      const res = await fetch(`${API_URL}/pedidos-compra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Erro na API");
      const novo = await res.json();
      setPedidosCompra(prev => [novo, ...prev]);
      return novo;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const updateStatusPedido = useCallback(async (id: string, status: PedidoCompra["status"], qtdRecebida?: number) => {
    const res = await fetch(`${API_URL}/pedidos-compra/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      const updated = await res.json();
      setPedidosCompra(prev => prev.map(p => p.id === id ? updated : p));
      
      if (status === "recebido" && qtdRecebida && updated.ferramentaId) {
        ajustarQuantidade(updated.ferramentaId, qtdRecebida);
      }
    }
  }, [ajustarQuantidade]);

  const alertas = ferramentas.filter(f => f.quantidade <= f.quantidadeMinima);
  const pedidosAvulsosPendentes = pedidosCompra.filter(p => p.isAvulso && p.status === "pendente").length;

  return { ferramentas, addFerramenta, updateFerramenta, removeFerramenta, ajustarQuantidade, pedidosCompra, addPedidoCompra, updateStatusPedido, alertas, pedidosAvulsosPendentes };
}
