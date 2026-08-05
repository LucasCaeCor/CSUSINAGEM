import { useState, useEffect } from 'react';

interface Backup {
  id: string;
  name: string;
  createdTime: string;
  size: string;
  type: 'database' | 'files' | 'full';
  webViewLink?: string;
}

interface UseBackupsResult {
  backups: Backup[];
  loading: boolean;
  error: string | null;
}

interface Backup {
  id: string;
  name: string;
  createdTime: string;
  size: string;
  type: 'database' | 'files' | 'full';
  webViewLink?: string;
}

export const useBackups = (): UseBackupsResult => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validação corrigida
      if (!data || typeof data !== 'object') {
        throw new Error('Resposta inválida do servidor');
      }

      setBackups(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('Erro ao buscar backups:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 300000);
    return () => clearInterval(interval);
  }, []);

  return { backups, loading, error };
};