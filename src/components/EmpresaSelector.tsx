import React, { useState, useRef, useEffect } from "react";
import { useEmpresas, Empresa } from "../hooks/useEmpresas";
import { FiChevronDown, FiPlus, FiCheck } from "react-icons/fi";

interface EmpresaSelectorProps {
  value: string;
  onChange: (nome: string) => void;
  onSelectEmpresa?: (empresa: Empresa) => void;
  required?: boolean;
  disabled?: boolean;
}

const EmpresaSelector: React.FC<EmpresaSelectorProps> = ({
  value,
  onChange,
  onSelectEmpresa,
  required,
  disabled,
}) => {
  const { empresas, addEmpresa } = useEmpresas();
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newCnpj, setNewCnpj] = useState("");
  const [newContato, setNewContato] = useState("");
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNew(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = empresas.filter((e) =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (empresa: Empresa) => {
    onChange(empresa.nome);
    onSelectEmpresa?.(empresa);
    setOpen(false);
    setSearch("");
    setShowNew(false);
  };

  const handleCreateInline = async () => {
    if (!newNome.trim()) return;
    const nova = await addEmpresa({ nome: newNome.trim(), cnpj: newCnpj.trim(), contato: newContato.trim() });
    if (!nova) return;
    onChange(nova.nome);
    onSelectEmpresa?.(nova);
    setNewNome("");
    setNewCnpj("");
    setNewContato("");
    setShowNew(false);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className={`w-full flex items-center justify-between bg-[#0B1121] border text-left rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none
          ${open ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-700"}
          ${value ? "text-white" : "text-slate-500"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-slate-600"}`}
      >
        <span className="truncate">{value || "Selecionar empresa..."}</span>
        <FiChevronDown className={`shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[200] mt-1 w-full bg-[#0D1526] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-700/60">
            <input
              autoFocus
              type="text"
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
            />
          </div>

          {/* List */}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-slate-500 text-sm text-center">Nenhuma empresa encontrada</li>
            )}
            {filtered.map((e) => (
              <li
                key={e.id}
                onClick={() => handleSelect(e)}
                className="flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-500/10 transition-colors"
              >
                <div>
                  <p className="text-slate-200 font-medium">{e.nome}</p>
                  {e.cnpj && <p className="text-slate-500 text-xs">{e.cnpj}</p>}
                </div>
                {value === e.nome && <FiCheck className="text-indigo-400 shrink-0" />}
              </li>
            ))}
          </ul>

          {/* Divider + Nova empresa */}
          <div className="border-t border-slate-700/60">
            {!showNew ? (
              <button
                type="button"
                onClick={() => setShowNew(true)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-indigo-400 hover:bg-indigo-500/10 font-semibold transition-colors"
              >
                <FiPlus className="shrink-0" />
                Nova empresa
              </button>
            ) : (
              <div className="p-3 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nova Empresa</p>
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome *"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="CNPJ (opcional)"
                  value={newCnpj}
                  onChange={(e) => setNewCnpj(e.target.value)}
                  className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Contato (opcional)"
                  value={newContato}
                  onChange={(e) => setNewContato(e.target.value)}
                  className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNew(false)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateInline}
                    disabled={!newNome.trim()}
                    className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Criar e Selecionar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden required input for form validation */}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => {}}
          className="absolute opacity-0 h-0 w-0"
          aria-hidden
        />
      )}
    </div>
  );
};

export default EmpresaSelector;
