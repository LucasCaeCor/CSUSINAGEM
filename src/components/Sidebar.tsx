import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import logo from "../assets/csusinagem.png";
import { AiOutlineHome } from "react-icons/ai";
import { BiTime } from "react-icons/bi";
import { FiBarChart2, FiDatabase, FiLogOut } from "react-icons/fi";
import { RiShoppingCartLine } from "react-icons/ri";
import { GiMoneyStack } from "react-icons/gi";
import { FiFileText } from "react-icons/fi";
import { FiRefreshCw, FiTool, FiShoppingCart } from "react-icons/fi";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { useEstoque } from "../hooks/useEstoque";
import ConfirmationModal from "./ConfirmationModal";
import NotificationModal from "./ListaPedidosModal";
import SolicitacaoCompraModal from "./SolicitacaoCompraModal";
import OrcamentoModal from "./Orcamento";
import ModalCategoria from "./ModalCategoria";
import OrcamentoFormModal from "../pages/OrcamentoFormModal";
import OrcamentoPdfList from "../pages/OrcamentoPdfList";
import BackupModal from "./BackupModal";
import Indicadores from "../pages/Indicadores";
import { Category } from "./CategoriesList";
import { Item } from "../pages/CategoryPage";
import { useAuth } from "../context/AuthContext";

interface SidebarItemProps {
  text: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  path?: string;
  isActive?: boolean;
  danger?: boolean;
  badgeCount?: number;
  adminOnly?: boolean;
  eliabeOnly?: boolean;
  isNew?: boolean; // Adiciona isNew ao tipo
}

interface Orcamento {
  id: string;
  status: string;
  item?: { id: string; name?: string };
  itemId?: string;
  cliente?: string;
  quantidade?: number;
  material?: string;
  operacao?: string;
  dataEmissao?: string;
  valor?: number;
  observacao?: string;
}

interface SidebarProps {
  onCategoryAdded: (category: Category) => void;
  onHelpClick?: () => void;
  newItem?: Item | null;
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  text,
  Icon,
  onClick,
  path,
  isActive = false,
  danger = false,
  badgeCount = 0,
  isNew = false,
}) => (
  <div
    className={`flex items-center px-4 py-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 group relative ${
      isActive 
        ? "bg-indigo-600/15 text-indigo-400 shadow-sm border border-indigo-500/20" 
        : danger 
          ? "hover:bg-red-500/10 text-slate-400 hover:text-red-400"
          : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-100"
    }`}
    onClick={onClick}
  >
    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span className="ml-3 font-medium text-sm flex-1 tracking-wide">{text}</span>
    {isNew && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">New</span>}
    {badgeCount > 0 && <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white ring-2 ring-slate-900">{badgeCount}</span>}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({
  onCategoryAdded,
  onHelpClick,
  newItem,
  setItems,
}) => {
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user, setAllItems, setOrcamentos } = useAuth();
  const userRole = user?.role;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = windowWidth <= 768;
  const [allItems, setAllItemsState] = useState<Item[]>([]);
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showOrcamentos, setShowOrcamentos] = useState(false);
  const [orcamentos, setOrcamentosState] = useState<Orcamento[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [showOrcamentoDetails, setShowOrcamentoDetails] = useState(false);
  const [pedidosCount, setPedidosCount] = useState(0);
  const [orcamentosCount, setOrcamentosCount] = useState(0);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showIndicadores, setShowIndicadores] = useState(false);
  const [showSolicitacaoModal, setShowSolicitacaoModal] = useState(false);
  const { alertas, pedidosAvulsosPendentes } = useEstoque();

  const updateCounts = () => {
    const pendingPedidos = allItems.filter(
      (item) => item.status === "EM_ANDAMENTO"
    ).length;
    const pendingOrcamentos = orcamentos.filter(
      (orcamento) => orcamento.status === "PENDENTE"
    ).length;
    setPedidosCount(pendingPedidos);
    setOrcamentosCount(pendingOrcamentos);
  };

  useEffect(() => {
    updateCounts();
  }, [allItems, orcamentos]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (newItem) {
      setPendingItems((prev) => [newItem, ...prev]);
      setAllItemsState((prev) => [newItem, ...prev]);
      setAllItems((prev) => [newItem, ...prev]);
    }
  }, [newItem, setAllItems]);

  const showNotificationMsg = (msg: string, type: "success" | "error") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchAllItems = async () => {
    try {
      console.log("[Sidebar] Fetching all items and categories...");
      const [res1, res2] = await Promise.all([
        fetch(`${API_URL}/items`),
        fetch(`${API_URL}/items/pending-with-pedido`),
      ]);

      if (!res1.ok || !res2.ok) throw new Error("Failed to fetch items");

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      console.log("[Sidebar] Items from /items:", data1);
      console.log("[Sidebar] Items from /items/pending-with-pedido:", data2);

      const resCategories = await fetch(`${API_URL}/categories`);
      if (!resCategories.ok) throw new Error("Falha ao buscar categorias.");

      const categories: Category[] = await resCategories.json();
      console.log("[Sidebar] Categories:", categories);

      const fetchPromises = categories.map((category) =>
        fetch(`${API_URL}/categories/${category.id}/items`).then((res) => {
          if (!res.ok) {
            console.warn(`Could not fetch items for category ${category.name}`);
            return [];
          }
          return res.json();
        })
      );

      const itemsByCategories = await Promise.all(fetchPromises);
      console.log("[Sidebar] Items from categories:", itemsByCategories);

      const itemsMap = new Map<string, Item>();
      const normalizeItem = (item: Item) => ({
        ...item,
        files: Array.isArray(item.files) ? item.files : [],
        pedidos: Array.isArray(item.pedidos) ? item.pedidos : [],
      });

      [...data1, ...data2].forEach((item: Item) => {
        itemsMap.set(item.id, normalizeItem(item));
      });

      itemsByCategories.flat().forEach((item: Item) => {
        const existingItem = itemsMap.get(item.id);
        itemsMap.set(item.id, {
          ...existingItem,
          ...normalizeItem(item),
          files: existingItem?.files?.length ? existingItem.files : (Array.isArray(item.files) ? item.files : []),
          pedidos: existingItem?.pedidos?.length ? existingItem.pedidos : (Array.isArray(item.pedidos) ? item.pedidos : []),
        });
      });

      const combinedData = Array.from(itemsMap.values());
      console.log("[Sidebar] Final unified items:", combinedData);
      setAllItemsState(combinedData);
      setAllItems(combinedData);
    } catch (error) {
      console.error("[Sidebar] Error fetching items:", error);
      setAllItemsState([]);
      setAllItems([]);
      showNotificationMsg(
        error instanceof Error ? error.message : "Erro ao carregar itens",
        "error"
      );
    }
  };

  const fetchOrcamentos = async () => {
    try {
      console.log("[Sidebar] Fetching orçamentos...");
      const res = await fetch(`${API_URL}/orcamentos`);
      if (!res.ok) throw new Error("Failed to fetch orcamentos");
      const data = await res.json();
      console.log("[Sidebar] Fetched orçamentos:", data);
      setOrcamentosState(data);
      setOrcamentos(data);
      return data;
    } catch (error) {
      console.error("[Sidebar] Error fetching orçamentos:", error);
      setOrcamentosState([]);
      setOrcamentos([]);
      showNotificationMsg(
        error instanceof Error ? error.message : "Erro ao carregar orçamentos",
        "error"
      );
      return [];
    }
  };

  useEffect(() => {
    fetchAllItems();
    fetchOrcamentos();
  }, []);

  const handleNotificationClick = async () => {
    console.log("[Sidebar] Opening NotificationModal for pedidos...");
    try {
      await Promise.all([fetchAllItems(), fetchOrcamentos()]);
      console.log("[Sidebar] Fetched data before opening modal:", {
        allItems,
        orcamentos,
      });
      setShowNotifications(true);
    } catch (error) {
      console.error("[Sidebar] Error fetching data for NotificationModal:", error);
      showNotificationMsg(
        error instanceof Error ? error.message : "Erro ao carregar dados",
        "error"
      );
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchPendingItems = async () => {
    try {
      console.log("[Sidebar] Fetching pending items with pedidos...");
      const res = await fetch(`${API_URL}/items/pending-with-pedido`);
      if (!res.ok) throw new Error("Failed to fetch pending items");
      const data = await res.json();
      console.log("[Sidebar] Fetched pending items:", data);
      setPendingItems(
        data.map((item: Item) => ({
          ...item,
          files: item.files || [],
          pedidos: item.pedidos || [],
        }))
      );
    } catch (error) {
      console.error("[Sidebar] Error fetching pending items:", error);
      setPendingItems([]);
    }
  };

  const handleConfirmPedido = async (orcamentosId: string) => {
    try {
      console.log(`[Sidebar] Transforming orçamento ${orcamentosId} into pedido...`);
      const orcamento = orcamentos.find((o) => o.id === orcamentosId);
      if (!orcamento || (!orcamento.item?.id && !orcamento.itemId)) {
        throw new Error("Orçamento ou item não encontrado");
      }
      console.log("[Sidebar] Orçamento found:", orcamento);

      const response = await fetch(
        `${API_URL}/orcamentos/${orcamentosId}/transformar-em-pedido`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ status: "CONVERTIDO" }),
        }
      );

      const data = await response.json();
      console.log("[Sidebar] Transform response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erro ao converter orçamento");
      }

      const itemId = orcamento.item?.id || orcamento.itemId;
      console.log(`[Sidebar] Updating item ${itemId} status to EM_ANDAMENTO...`);
      await fetch(`${API_URL}/items/${itemId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: "EM_ANDAMENTO" }),
      });
      console.log(`[Sidebar] Item ${itemId} status updated`);

      if (data.pedidoId) {
        console.log(
          `[Sidebar] Updating pedido ${data.pedidoId} status to EM_ANDAMENTO...`
        );
        await fetch(`${API_URL}/pedidos/${data.pedidoId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            status: "EM_ANDAMENTO",
            orcamentoId: orcamentosId,
          }),
        });
        console.log(`[Sidebar] Pedido ${data.pedidoId} status updated`);
      } else {
        console.warn("[Sidebar] pedidoId não retornado pela API");
      }

      console.log("[Sidebar] Updating local lists after transformation...");
      setOrcamentosState((prev) => prev.filter((o) => o.id !== orcamentosId));
      setOrcamentos((prev) => prev.filter((o) => o.id !== orcamentosId));
      await Promise.all([
        fetchPendingItems(),
        fetchAllItems(),
        fetchOrcamentos(),
      ]);
      console.log("[Sidebar] Local lists updated");
      showNotification(
        "Pedido criado e item movido para EM_ANDAMENTO!",
        "success"
      );
    } catch (error) {
      console.error("[Sidebar] Falha na conversão:", error);
      showNotification(
        error instanceof Error ? error.message : "Falha na atualização",
        "error"
      );
    }
  };

  const handleLogout = () => {
    console.log("[Sidebar] User logging out...");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNavigation = (path: string) => {
    console.log(`[Sidebar] Navigating to ${path}...`);
    if (isMobile) setIsMobileMenuOpen(false);

    switch (path) {
      case "logout":
        setShowLogoutConfirm(true);
        break;
      case "add-category":
        setShowCategoryModal(true);
        break;
      case "orcamentos":
        console.log("[Sidebar] Opening OrcamentoModal...");
        fetchOrcamentos();
        setShowOrcamentos(true);
        break;
      case "orcamentos-pdf":
        console.log("Navigating to OrcamentoPdfList...");
        navigate("/orcamentos-pdf");
        break;
      case "notifications":
        handleNotificationClick();
        break;
      case "backup":
        setShowBackupModal(true);
        break;
      case "feature":
        console.log("[Sidebar] Opening Indicadores sidebar...");
        setShowIndicadores(true);
        break;
      case "solicitar-compra":
        setShowSolicitacaoModal(true);
        break;
      default:
        navigate(path);
    }
  };

  const groups = [
    {
      name: "Geral",
      items: [
        { text: "Home", Icon: AiOutlineHome, path: "/dashboard" },
        { text: "Empresas", Icon: HiOutlineOfficeBuilding, path: "/empresas" },
        { text: "Solicitar Compra", Icon: FiShoppingCart, path: "solicitar-compra" },
        { text: "Estoque", Icon: FiTool, path: "/estoque", count: alertas.length + pedidosAvulsosPendentes, eliabeOnly: true },
        { text: "Histórico", Icon: BiTime, path: "/history" },
      ]
    },
    {
      name: "Comercial",
      items: [
        { text: "Indicadores", Icon: FiBarChart2, path: "feature" },
        { text: "Pedidos Kanban", Icon: RiShoppingCartLine, path: "notifications", count: pedidosCount },
        { text: "Orçamentos", Icon: GiMoneyStack, path: "orcamentos", count: orcamentosCount },
        { text: "Lista PDF", Icon: FiFileText, path: "orcamentos-pdf", eliabeOnly: true },
      ]
    },
    {
      name: "Administração",
      items: [
        { text: "Backup", Icon: FiDatabase, path: "backup", adminOnly: true },
        { text: "Restauração", Icon: FiRefreshCw, path: "/restore", adminOnly: true },
      ]
    }
  ];

  return (
    <>
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-50 p-2.5 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl text-white shadow-xl md:hidden hover:bg-slate-700 transition duration-200"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      )}

      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 bg-[#0B1121] border-r border-slate-800 w-[260px] shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${isMobile ? (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}`}
      >
        <div className="flex items-center justify-center h-24 border-b border-slate-800/60 p-6 relative shrink-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-20 bg-indigo-500/10 blur-3xl rounded-full"></div>
          <img src={logo} alt="Logo" className="w-[140px] h-auto object-contain relative z-10 transition-transform hover:scale-105 duration-300" />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent py-4 px-4 space-y-6">
          {groups.map((group, idx) => {
            const filteredItems = group.items.filter((item) => {
              if (userRole === "ELIABE") return !item.adminOnly;
              if (userRole === "ADMIN") return !item.eliabeOnly;
              return !item.adminOnly && !item.eliabeOnly;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={idx}>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
                  {group.name}
                </div>
                <div>
                  {filteredItems.map(({ text, Icon, path, count, isNew }) => (
                    <SidebarItem
                      key={text}
                      text={text}
                      Icon={Icon}
                      badgeCount={count}
                      isNew={isNew}
                      onClick={() => path && handleNavigation(path)}
                      isActive={path === currentPath || (path === "feature" && showIndicadores)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {(userRole === "ADMIN" || userRole === "ELIABE") && (
          <div className="px-4 pb-4">
            <OrcamentoFormModal />
          </div>
        )}

        <div className="p-4 border-t border-slate-800/60 shrink-0">
          <SidebarItem
            text="Sair do Sistema"
            Icon={FiLogOut}
            onClick={() => handleNavigation("logout")}
            danger
          />
        </div>
      </div>

      {showIndicadores && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[55] md:hidden" onClick={() => setShowIndicadores(false)} />
          <div className="fixed inset-y-0 right-0 bg-slate-900 border-l border-slate-800 shadow-2xl w-full md:w-[70vw] lg:w-[60vw] max-w-4xl transition-transform duration-300 z-[60] flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white tracking-wide">Painel de Indicadores</h2>
              <button
                className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors border border-slate-700/50"
                onClick={() => setShowIndicadores(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Indicadores />
            </div>
          </div>
        </>
      )}

      <BackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        title="Confirmar Logout"
        message="Tem certeza que deseja sair do sistema?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Sair"
        cancelText="Cancelar"
      />
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => {
          console.log("[Sidebar] Closing NotificationModal...");
          setShowNotifications(false);
        }}
        items={allItems.map((item) => ({
          ...item,
          pedidos: item.pedidos as any,
          dataCriacao: item.createdAt,
          files: item.files || [],
          category: item.category || {
            id: item.categoryId,
            name: item.category?.name || "Não informada",
          },
        }))}
        onDownloadPdf={(f) => {
          console.log(`[Sidebar] Downloading PDF for file: ${f}`);
          window.open(`${API_URL}/uploads/${f}`, "_blank");
        }}
        onDownloadDwg={(f) => {
          console.log(`[Sidebar] Downloading DWG for file: ${f}`);
          window.open(`${API_URL}/uploads/${f}`, "_blank");
        }}
        onStatusChange={async (id, status) => {
          console.log(`[Sidebar] Updating item ${id} status to ${status}...`);
          try {
            const response = await fetch(`${API_URL}/items/${id}/status`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error("Failed to update item status");
            console.log(`[Sidebar] Item ${id} status updated to ${status}`);
            await Promise.all([fetchAllItems(), fetchOrcamentos()]);
          } catch (error) {
            console.error(`[Sidebar] Error updating item ${id} status:`, error);
            showNotification(
              error instanceof Error
                ? error.message
                : "Erro ao atualizar status",
              "error"
            );
          }
        }}
        onPedidoStatusChange={async (pedidoId, status) => {
          console.log(`[Sidebar] Need to update pedido ${pedidoId} to ${status}`);
        }}
      />
      <OrcamentoModal
        isOpen={showOrcamentos}
        onClose={() => setShowOrcamentos(false)}
        orcamentos={orcamentos}
        onExpand={(orcamento) => {
          setSelectedOrcamento(orcamento);
          setShowOrcamentoDetails(true);
        }}
        onConfirmPedido={handleConfirmPedido}
      />
      {showCategoryModal && (
        <ModalCategoria
          onClose={() => {
            console.log("[Sidebar] Closing ModalCategoria...");
            setShowCategoryModal(false);
          }}
          onCategoryAdded={(c) => {
            console.log("[Sidebar] Category added:", c);
            onCategoryAdded(c);
            setShowCategoryModal(false);
          }}
        />
      )}

      <SolicitacaoCompraModal 
        isOpen={showSolicitacaoModal} 
        onClose={() => setShowSolicitacaoModal(false)} 
      />

    </>
  );
};

export default Sidebar;