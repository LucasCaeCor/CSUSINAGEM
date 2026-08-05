import React, { useState } from "react";
import { createPortal } from "react-dom";
import { GiMoneyStack } from "react-icons/gi";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { v4 as uuidv4 } from 'uuid';
import EmpresaSelector from "../components/EmpresaSelector";
import { Empresa } from "../hooks/useEmpresas";

interface OrcamentoItem {
  quantidade: number;
  codCS: string;
  descricao: string;
  ncm: string;
  valorUnitario: number;
  total: number;
}

interface OrcamentoFormData {
  data: string;
  prazoEntrega: string;
  cliente: string;
  frete: string;
  condPagamento: string;
  cfop: string;
  valorIcms: number;
  valorIpi: number;
  valorIss: number;
  cnpj: string;
  observacao: string;
}

const OrcamentoFormModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<(OrcamentoItem & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const { user } = useAuth();

  const navigate = useNavigate();

  const [formData, setFormData] = useState<OrcamentoFormData>({
    data: new Date().toLocaleDateString('pt-BR'),
    prazoEntrega: "60 DIAS",
    cliente: "KLABIN",
    frete: "CIF",
    condPagamento: "30 DIAS",
    cfop: "5102",
    valorIcms: 0,
    valorIpi: 0,
    valorIss: 0,
    cnpj: "00.000.000/0000-00",
    observacao: "",
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: uuidv4(),
        quantidade: 1,
        codCS: "",
        descricao: "",
        ncm: "",
        valorUnitario: 0,
        total: 0,
      }
    ]);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleItemChange = (index: number, field: keyof OrcamentoItem, value: any) => {
    const updatedItems = [...items];
    if (field === "valorUnitario") {
      let numValue = value;
      if (typeof value === 'string') {
         numValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      }
      updatedItems[index].valorUnitario = numValue;
      updatedItems[index].total = updatedItems[index].quantidade * numValue;
    } else if (field === "quantidade") {
      updatedItems[index].quantidade = Number(value);
      updatedItems[index].total = Number(value) * updatedItems[index].valorUnitario;
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + item.total, 0);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data || !formData.cliente || items.length === 0) {
      alert("Preencha todos os campos obrigatórios e adicione pelo menos um item.");
      return;
    }

    try {
      setLoading(true);
      const dataISO = new Date(formData.data.split('/').reverse().join('-')).toISOString();

      const fullData = {
        ...formData,
        data: dataISO,
        items: items.map(item => ({
          ...item,
          valorUnitario: Number(item.valorUnitario),
          quantidade: Number(item.quantidade),
          total: Number(item.quantidade) * Number(item.valorUnitario)
        })),
        valorTotal: calculateTotal()
      };

      const response = await fetch(`${API_URL}/orcamento-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(fullData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Orçamento #${data.numero} criado com sucesso!`);

        const pdfResponse = await fetch(`${API_URL}/orcamento-pdf/${data.id}/pdf`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `orcamento_${data.numero}.pdf`;
          a.click();
        }
        setVisible(false);
        setItems([]);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao criar orçamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar orçamento");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "ADMIN" && user?.role !== "ELIABE") return null;

  return (
    <>
      <button
        onClick={() => setVisible(true)}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl shadow-lg transition-all font-semibold"
      >
        <GiMoneyStack size={20} />
        Criar Orçamento PDF
      </button>

      {visible && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setVisible(false)} />
          
          <div className="relative bg-[#121A2F] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <GiMoneyStack className="text-indigo-400" size={28} />
                Novo Orçamento
              </h2>
              <button 
                onClick={() => setVisible(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              <form id="orcamento-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Data *</label>
                    <input required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Prazo de Entrega *</label>
                    <input required value={formData.prazoEntrega} onChange={e => setFormData({...formData, prazoEntrega: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-semibold text-slate-300">Cliente *</label>
                      <button
                        type="button"
                        onClick={() => navigate('/empresas')}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-200 transition-colors"
                      >
                        + Criar Empresa
                      </button>
                    </div>
                    <EmpresaSelector
                      value={formData.cliente}
                      onChange={(nome) => setFormData({...formData, cliente: nome})}
                      onSelectEmpresa={(empresa) => {
                        setSelectedEmpresa(empresa);
                        setFormData((prev) => ({
                          ...prev,
                          cliente: empresa.nome,
                          cnpj: empresa.cnpj || prev.cnpj,
                        }));
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">CNPJ *</label>
                    <input required pattern="\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}" title="Use o formato 00.000.000/0000-00" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" placeholder="00.000.000/0000-00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Observação</label>
                  <textarea
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                    rows={4}
                    className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Observações do orçamento..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Frete *</label>
                    <input required value={formData.frete} onChange={e => setFormData({...formData, frete: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Cond. Pagamento *</label>
                    <input required value={formData.condPagamento} onChange={e => setFormData({...formData, condPagamento: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">CFOP *</label>
                    <input required value={formData.cfop} onChange={e => setFormData({...formData, cfop: e.target.value})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Valor ICMS (%) *</label>
                    <input required type="number" step="0.01" value={formData.valorIcms} onChange={e => setFormData({...formData, valorIcms: Number(e.target.value)})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Valor IPI (%) *</label>
                    <input required type="number" step="0.01" value={formData.valorIpi} onChange={e => setFormData({...formData, valorIpi: Number(e.target.value)})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Valor ISS (%) *</label>
                    <input required type="number" step="0.01" value={formData.valorIss} onChange={e => setFormData({...formData, valorIss: Number(e.target.value)})} className="w-full bg-[#0B1121] border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Itens do Orçamento</h3>
                    <button type="button" onClick={handleAddItem} className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-4 py-2 rounded-xl transition-colors font-medium text-sm border border-indigo-500/30">
                      <FiPlus /> Adicionar Item
                    </button>
                  </div>

                  <div className="overflow-x-auto bg-[#0B1121] border border-slate-800 rounded-2xl shadow-inner">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-[#0f172a]">
                          <th className="p-4 font-semibold">Qtd</th>
                          <th className="p-4 font-semibold">Código C&S</th>
                          <th className="p-4 font-semibold">Descrição</th>
                          <th className="p-4 font-semibold">NCM</th>
                          <th className="p-4 font-semibold w-40">Valor Un. (R$)</th>
                          <th className="p-4 font-semibold w-32">Total</th>
                          <th className="p-4 font-semibold w-16">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-slate-500">Nenhum item adicionado.</td></tr>
                        ) : items.map((item, index) => (
                          <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <td className="p-2">
                              <input type="number" min={1} required value={item.quantidade} onChange={e => handleItemChange(index, "quantidade", e.target.value)} className="w-full bg-[#121A2F] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </td>
                            <td className="p-2">
                              <input value={item.codCS} onChange={e => handleItemChange(index, "codCS", e.target.value)} className="w-full bg-[#121A2F] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </td>
                            <td className="p-2">
                              <input required value={item.descricao} onChange={e => handleItemChange(index, "descricao", e.target.value)} className="w-full bg-[#121A2F] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </td>
                            <td className="p-2">
                              <input value={item.ncm} onChange={e => handleItemChange(index, "ncm", e.target.value)} className="w-full bg-[#121A2F] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </td>
                            <td className="p-2">
                              <input required type="text" value={item.valorUnitario} onChange={e => handleItemChange(index, "valorUnitario", e.target.value)} className="w-full bg-[#121A2F] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </td>
                            <td className="p-4 font-semibold text-slate-300">
                              R$ {formatNumber(item.total)}
                            </td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors">
                                <FiTrash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 uppercase tracking-widest text-xs font-bold">Valor Total</span>
                <span className="text-3xl font-extrabold text-white">R$ {formatNumber(calculateTotal())}</span>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  type="button" 
                  onClick={() => setVisible(false)}
                  className="flex-1 md:flex-none px-6 py-3 bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  form="orcamento-form"
                  disabled={loading}
                  className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Gerar PDF"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
};

export default OrcamentoFormModal;