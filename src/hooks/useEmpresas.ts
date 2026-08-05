import { useState, useEffect, useCallback } from "react";

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
}

const API_URL = import.meta.env.VITE_BACKEND_URL;

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const fetchEmpresas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/empresas`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setEmpresas(await res.json());
      }
    } catch (error) {
      console.error("Erro ao buscar empresas", error);
    }
  }, []);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  const addEmpresa = useCallback(async (data: Omit<Empresa, "id">): Promise<Empresa | null> => {
    try {
      const res = await fetch(`${API_URL}/empresas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Erro na API");
      const nova = await res.json();
      setEmpresas(prev => [nova, ...prev]);
      return nova;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  const updateEmpresa = useCallback(async (updated: Empresa) => {
    try {
      const res = await fetch(`${API_URL}/empresas/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome: updated.nome, cnpj: updated.cnpj, contato: updated.contato })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error('Erro ao atualizar empresa', errorData);
        return null;
      }
      const saved = await res.json();
      setEmpresas(prev => prev.map(e => e.id === saved.id ? saved : e));
      return saved;
    } catch (error) {
      console.error('Erro ao atualizar empresa', error);
      return null;
    }
  }, []);

  const removeEmpresa = useCallback(async (id: string) => {
    const res = await fetch(`${API_URL}/empresas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      setEmpresas(prev => prev.filter(e => e.id !== id));
    }
  }, []);

  return { empresas, addEmpresa, updateEmpresa, removeEmpresa };
}
