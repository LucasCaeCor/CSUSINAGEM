import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CustomersList = lazy(() => import("./pages/CustomersList"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ConfirmStatusPage = lazy(() => import("./pages/ConfirmStatusPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const OrcamentoPdfList = lazy(() => import("./pages/OrcamentoPdfList"));
const RestorePage = lazy(() => import("./components/RestorePage"));
const Indicadores = lazy(() => import("./pages/Indicadores"));
const PedidoDetails = lazy(() => import("./components/PedidoDetails"));
const EmpresasPage = lazy(() => import("./pages/EmpresasPage"));
const EstoquePage = lazy(() => import("./pages/EstoquePage"));

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  eliabeOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, eliabeOnly = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" />;
  }

  if (eliabeOnly && user?.role !== "ELIABE") {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#2c5aa0' }}>Carregando...</div>}>
          <Routes>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
          </Route>
          <Route path="feature" element={<Indicadores />} />
          <Route path="pedidos/:id" element={<PedidoDetails />} />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/category/:id"
            element={
              <ProtectedRoute>
                <CategoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/confirmar-status/:itemId"
            element={
              <ProtectedRoute>
                <ConfirmStatusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orcamentos-pdf"
            element={
              <ProtectedRoute eliabeOnly>
                <OrcamentoPdfList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restore"
            element={
              <ProtectedRoute adminOnly>
                <RestorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:itemId/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route
            path="/empresas"
            element={
              <ProtectedRoute>
                <EmpresasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <ProtectedRoute eliabeOnly>
                <EstoquePage />
              </ProtectedRoute>
            }
          />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}