import React, { useState } from "react";
import { FiDownload, FiDatabase, FiFileText } from "react-icons/fi";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackupResponse {
  success: boolean;
  message: string;
  backupIds?: {
    database?: string;
    files?: string;
  };
}

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 mr-2 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const [loading, setLoading] = useState(false);
  const [backupType, setBackupType] = useState<
    "" | "full" | "database" | "files"
  >("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleBackup = async (type: "full" | "database" | "files") => {
    setLoading(true);
    setBackupType(type);
    setMessage({ text: "", type: "" });

    try {
      let endpoint = "";
      switch (type) {
        case "full":
          endpoint = "/backup/full";
          break;
        case "database":
          endpoint = "/backup/table/customers";
          break;
        case "files":
          endpoint = "/backup/files";
          break;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data: BackupResponse = await response.json();

      if (response.ok) {
        setMessage({
          text: `Backup ${
            type === "full"
              ? "completo"
              : type === "database"
              ? "do banco"
              : "de arquivos"
          } realizado com sucesso!`,
          type: "success",
        });

        if (data.backupIds?.database) {
          window.open(
            `https://drive.google.com/file/d/${data.backupIds.database}/view`,
            "_blank"
          );
        }
      } else {
        throw new Error(data.message || "Erro ao realizar backup");
      }
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao realizar backup",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-[#102544] p-8 rounded-xl w-full max-w-lg shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-6">Opções de Backup</h3>

        <div className="flex flex-col gap-4">
          <button
            className="flex items-center justify-center gap-3 w-full h-14 bg-[#eaf1fb] text-[#102544] font-semibold text-lg rounded-lg hover:bg-[#d1e1f7] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
            onClick={() => handleBackup("full")}
            disabled={loading && backupType === "full"}
          >
            {loading && backupType === "full" ? (
              <>
                <Spinner /> Processando...
              </>
            ) : (
              <>
                <FiDownload size={22} /> Backup Completo
              </>
            )}
          </button>

          <button
            className="flex items-center justify-center gap-3 w-full h-14 bg-[#eaf1fb] text-[#102544] font-semibold text-lg rounded-lg hover:bg-[#d1e1f7] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
            onClick={() => handleBackup("database")}
            disabled={loading && backupType === "database"}
          >
            {loading && backupType === "database" ? (
              <>
                <Spinner /> Processando...
              </>
            ) : (
              <>
                <FiDatabase size={22} /> Backup do Banco
              </>
            )}
          </button>

          <button
            className="flex items-center justify-center gap-3 w-full h-14 bg-[#eaf1fb] text-[#102544] font-semibold text-lg rounded-lg hover:bg-[#d1e1f7] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
            onClick={() => handleBackup("files")}
            disabled={loading && backupType === "files"}
          >
            {loading && backupType === "files" ? (
              <>
                <Spinner /> Processando...
              </>
            ) : (
              <>
                <FiFileText size={22} /> Backup de Arquivos
              </>
            )}
          </button>
        </div>

        {message.text && (
          <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium ${
            message.type === 'success' 
              ? 'bg-[#d4edda] text-[#155724] border border-[#c3e6cb]' 
              : 'bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb]'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupModal;
