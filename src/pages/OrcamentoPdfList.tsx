import React, { useState, useEffect } from "react";
import { FiDownload, FiFileText } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const OrcamentoPdfList = ({ onClose }: { onClose?: () => void }) => {
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  const fetchOrcamentos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Usuário não autenticado");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/orcamento-pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrcamentos(data);
      } else {
        alert("Erro ao carregar orçamentos");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, numero: number) => {
    try {
      const response = await fetch(`${API_URL}/orcamento-pdf/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orcamento_${numero}.pdf`;
        a.click();
      } else {
        alert("Erro ao baixar PDF");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao baixar PDF");
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1121] overflow-hidden font-sans text-slate-300">
      <Sidebar onCategoryAdded={() => {}} setItems={() => {}} newItem={null} />

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative animate-fade-in custom-scrollbar md:pl-[260px]">
        <div className="p-4 md:p-8 space-y-8 w-full max-w-[1600px] mx-auto pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 leading-tight">
                Arquivos de Orçamento
              </h1>
              <p className="text-slate-400 mt-2 text-sm md:text-base">Histórico de PDFs detalhados gerados pelo sistema.</p>
            </div>
          </div>

          <div className="bg-[#121A2F]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#121A2F]/50 backdrop-blur-sm rounded-3xl">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    <th className="pb-4 pr-4 border-none">Número</th>
                    <th className="pb-4 pr-4 border-none">Cliente</th>
                    <th className="pb-4 pr-4 border-none">Data</th>
                    <th className="pb-4 pr-4 border-none">Valor Total</th>
                    <th className="pb-4 border-none">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orcamentos.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500 border-none">Nenhum orçamento em PDF foi gerado ainda.</td></tr>
                  ) : orcamentos.map((row) => (
                    <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 pr-4 font-bold text-emerald-400 border-none">#{row.numero}</td>
                      <td className="py-4 pr-4 text-slate-200 font-medium border-none">{row.cliente}</td>
                      <td className="py-4 pr-4 text-slate-400 border-none">{new Date(row.data).toLocaleDateString("pt-BR")}</td>
                      <td className="py-4 pr-4 font-semibold text-slate-300 border-none">
                        R$ {Number(row.valorTotal || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-4 flex gap-2 border-none">
                        <button 
                          onClick={() => handleDownload(row.id, row.numero)}
                          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg transition-colors text-xs font-bold flex items-center gap-2"
                        >
                          <FiDownload size={16} /> Baixar PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrcamentoPdfList;
