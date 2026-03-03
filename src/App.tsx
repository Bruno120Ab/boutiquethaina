import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { seedDatabase, seedNewDatabase } from "@/lib/database";
import { authService } from "@/lib/auth";
import Layout from "@/components/Layout";
import Login from "./pages/Login";
import PDV from "./pages/PDV";
import Estoque from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Credores from "./pages/Credores";
import Devolucoes from "./pages/Devolucoes";
import NotFound from "./pages/NotFound";
import ContasPagar from "./pages/ContasPagarReceber";
import { useAutoBackup } from "./lib/useAuto";
import { setupPWAInstallPrompt } from "./pwa";
import { Clientes } from "./pages/Clientes";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useAutoBackup(30);

  useEffect(() => {
    // Initialize database with seed data
    // seedDatabase();
      seedDatabase()

      setupPWAInstallPrompt();
    // seedNewDatabase()
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Login onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<PDV />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/devolucoes" element={<Devolucoes />} />
              <Route path="/credores" element={<Credores />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/contaspagar" element={<ContasPagar />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

