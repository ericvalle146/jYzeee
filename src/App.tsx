import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MainLayout } from "./components/layout/MainLayout";
import { GlobalAutoPrintProvider } from "./contexts/GlobalAutoPrintContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard-analytics";
import Integracoes from "./pages/Integracoes";
import IntegracoesFallback from "./pages/IntegracoesFallback";
import Chat from "./pages/Chat";
import Agente from "./pages/Agente";
import Documentacao from "./pages/Documentacao";
import Pedidos from "./pages/Pedidos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      <TooltipProvider>
        <GlobalAutoPrintProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<MainLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="integracoes" element={<Integracoes />} />
                <Route path="chat" element={<Chat />} />
                <Route path="agente" element={<Agente />} />
                <Route path="documentacao" element={<Documentacao />} />
                <Route path="pedidos" element={<Pedidos />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </GlobalAutoPrintProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
