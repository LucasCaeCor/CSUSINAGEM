import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

interface Item {
  id: string;
  name: string;
  status: string;
  files?: any[];
  pedidos?: { id: string; quantidade: number; material: string; dataEmissao: string; status: string; tipo: "pedido" | "orcamento"; cliente: string; valor?: number }[];
  category?: { id: string; name: string };
  categoryId?: string;
}

interface Orcamento {
  id: string;
  status: string;
  item?: { id: string; name?: string };
  itemId?: string;
  cliente?: string;
  quantidade?: number;
  material?: string;
  dataEmissao?: string;
  valor?: number;
  observacao?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER" | "ELIABE";
}

interface DecodedToken {
  sub: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER" | "ELIABE";
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  allItems: Item[];
  orcamentos: Orcamento[];
  setAllItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setOrcamentos: React.Dispatch<React.SetStateAction<Orcamento[]>>;
  fetchAllItems: () => Promise<void>;
  fetchOrcamentos: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);

  const fetchAllItems = async () => {
    try {
      console.log("[AuthProvider] Fetching all items and categories...");
      const token = localStorage.getItem("token") || "";
      const [res1, res2] = await Promise.all([
        fetch(`${API_URL}/items`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/items/pending-with-pedido`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!res1.ok || !res2.ok) throw new Error("Failed to fetch items");

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      console.log("[AuthProvider] Items from /items:", data1);
      console.log("[AuthProvider] Items from /items/pending-with-pedido:", data2);

      const resCategories = await fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resCategories.ok) throw new Error("Falha ao buscar categorias.");

      const categories: { id: string; name: string }[] = await resCategories.json();
      console.log("[AuthProvider] Categories:", categories);

      const fetchPromises = categories.map(category =>
        fetch(`${API_URL}/categories/${category.id}/items`, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
          if (!res.ok) {
            console.warn(`[AuthProvider] Could not fetch items for category ${category.name}`);
            return [];
          }
          return res.json();
        })
      );

      const itemsByCategories = await Promise.all(fetchPromises);
      console.log("[AuthProvider] Items from categories:", itemsByCategories);

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
      console.log("[AuthProvider] Final unified items:", combinedData);
      setAllItems(combinedData);
    } catch (error) {
      console.error("[AuthProvider] Error fetching items:", error);
      setAllItems([]);
    }
  };

  const fetchOrcamentos = async () => {
    try {
      console.log("[AuthProvider] Fetching orçamentos...");
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/orcamentos`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch orcamentos");
      const data = await res.json();
      console.log("[AuthProvider] Fetched orçamentos:", data);
      setOrcamentos(data);
    } catch (error) {
      console.error("[AuthProvider] Error fetching orcamentos:", error);
      setOrcamentos([]);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      console.log("[AuthProvider] Initializing auth, token found:", !!token);

      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          console.log("[AuthProvider] Decoded token:", {
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
          });
          setUser({
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
          });
          console.log("[AuthProvider] User set with role:", decoded.role);
          // Carregar dados após autenticação
          await Promise.all([fetchAllItems(), fetchOrcamentos()]);
        } catch (error) {
          console.error("[AuthProvider] Error decoding token:", error);
          localStorage.removeItem("token");
          console.log("[AuthProvider] Token removed due to decoding error");
        }
      } else {
        console.log("[AuthProvider] No token found, user remains null");
      }
      setLoading(false);
      console.log("[AuthProvider] Auth initialization complete, loading:", false);
    };

    initializeAuth();
  }, []);

  const login = (token: string) => {
    console.log("[AuthProvider] Login called with token:", token.slice(0, 10) + "...");
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log("[AuthProvider] Decoded token on login:", {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      });
      localStorage.setItem("token", token);
      setUser({
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      });
      console.log("[AuthProvider] User logged in with role:", decoded.role);
      // Carregar dados após login
      Promise.all([fetchAllItems(), fetchOrcamentos()]);
    } catch (error) {
      console.error("[AuthProvider] Error decoding token on login:", error);
      localStorage.removeItem("token");
      console.log("[AuthProvider] Token removed due to login error");
    }
  };

  const logout = () => {
    console.log("[AuthProvider] Logout called, current user role:", user?.role || "none");
    localStorage.removeItem("token");
    setUser(null);
    setAllItems([]);
    setOrcamentos([]);
    console.log("[AuthProvider] User logged out, user and data cleared");
  };

  const isAuthenticated = !!user;
  console.log("[AuthProvider] isAuthenticated:", isAuthenticated, "user role:", user?.role || "none");

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading, allItems, setAllItems, orcamentos, setOrcamentos, fetchAllItems, fetchOrcamentos }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("[useAuth] useAuth called outside AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  console.log("[useAuth] Context accessed, user role:", context.user?.role || "none");
  return context;
};