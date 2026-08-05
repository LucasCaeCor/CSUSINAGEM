// src/components/RestorePage.tsx
import { useState, useEffect } from "react";
import { FiDatabase, FiHardDrive, FiDownload, FiRotateCcw, FiRefreshCw } from "react-icons/fi";
import { useBackups } from "../hooks/useBackups";
import Sidebar from "../components/Sidebar";

interface Backup {
  id: string;
  name: string;
  createdTime: string;
  type: "database" | "files" | "full";
}

const RestorePage = () => {
  const [restoreType, setRestoreType] = useState<"full" | "database" | "files">("database");
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [filteredBackups, setFilteredBackups] = useState<Backup[]>([]);

  const { backups, loading: loadingBackups, error: backupsError } = useBackups();

  useEffect(() => {
    if (!backups || !Array.isArray(backups)) {
      setFilteredBackups([]);
      return;
    }
    try {
      const filtered = backups.filter((backup) => {
        if (!backup || typeof backup !== "object" || !backup.name || !backup.type) return false;
        return restoreType === "full"
          ? backup.type === "full" || backup.name.toLowerCase().includes("completo")
          : backup.type === restoreType;
      });
      setFilteredBackups([...filtered]);
    } catch (error) {
      console.error("Erro ao filtrar backups:", error);
      setFilteredBackups([]);
      setMessage({ text: "Erro ao carregar backups", type: "error" });
    }
  }, [backups, restoreType]);

  const handleRestore = async () => {
    if (!selectedBackup) {
      setMessage({ text: "Selecione um backup para restaurar", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ backupId: selectedBackup, type: restoreType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.message || `Erro ${response.status}`);
      setMessage({
        text: `Restauração ${getRestoreTypeName(restoreType)} realizada com sucesso! ${
          data.details?.restoredFiles?.length ? `(${data.details.restoredFiles.length} arquivos restaurados)` : ""
        }`,
        type: "success",
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Erro desconhecido na restauração",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRestoreTypeName = (type: string) => {
    switch (type) {
      case "full": return "completa";
      case "database": return "do banco de dados";
      case "files": return "de arquivos";
      default: return "";
    }
  };

  const tabBtn = (label: string, icon: React.ReactNode, value: "full" | "database" | "files") => (
    <button
      className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all border ${
        restoreType === value
          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          : "bg-[#0B1121] border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
      }`}
      onClick={() => setRestoreType(value)}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#0B1121]">
      <Sidebar onCategoryAdded={() => {}} setItems={() => {}} newItem={null} />

      <main className="flex-1 md:ml-[260px] p-6 lg:p-10 relative">
        {/* Background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <header className="mb-10">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400 flex items-center gap-3">
              <FiRefreshCw className="text-indigo-400" />
              Restauração de Backup
            </h1>
            <p className="mt-2 text-slate-400 text-sm">Recupere o sistema a partir de snapshots anteriores.</p>
          </header>

          <div className="bg-[#121A2F]/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-8 space-y-8">

            {/* Type Selector */}
            <div className="flex flex-wrap gap-3">
              {tabBtn("Banco de Dados", <FiDatabase size={17} />, "database")}
              {tabBtn("Arquivos", <FiHardDrive size={17} />, "files")}
              {tabBtn("Completo", <FiDownload size={17} />, "full")}
            </div>

            {/* Backup List */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Selecione um backup para restaurar:
              </h3>

              {backupsError ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
                  Erro ao carregar backups: {backupsError}
                </div>
              ) : loadingBackups ? (
                <div className="flex items-center justify-center py-12">
                  <FiRotateCcw className="animate-spin text-indigo-400 text-3xl" />
                </div>
              ) : filteredBackups.length === 0 ? (
                <div className="bg-[#0B1121] border border-dashed border-slate-700 rounded-xl p-10 text-center text-slate-500 text-sm">
                  <FiDatabase className="mx-auto text-4xl mb-3 opacity-40" />
                  Nenhum backup disponível para esta categoria.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBackups.map((backup) => (
                    <label
                      key={backup.id}
                      className={`flex items-center gap-4 w-full cursor-pointer p-4 rounded-xl border transition-all ${
                        selectedBackup === backup.id
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-700 bg-[#0B1121] hover:border-slate-500"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedBackup === backup.id ? "border-indigo-400" : "border-slate-600"
                      }`}>
                        {selectedBackup === backup.id && (
                          <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="backup"
                        className="hidden"
                        checked={selectedBackup === backup.id}
                        onChange={() => setSelectedBackup(backup.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold truncate">{backup.name}</span>
                          <span className="bg-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">{backup.type}</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">{new Date(backup.createdTime).toLocaleString()}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleRestore}
              disabled={!selectedBackup || loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <><FiRotateCcw className="animate-spin" /> Restaurando Sistema...</>
              ) : (
                <><FiDownload /> Confirmar e Restaurar</>
              )}
            </button>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium border ${
                message.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestorePage;
