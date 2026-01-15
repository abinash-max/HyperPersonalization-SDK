import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import IntroductionPage from "./pages/IntroductionPage";
import UsagePage from "./pages/UsagePage";
import PermissionsPage from "./pages/PermissionsPage";
import ImageAnalysisPage from "./pages/ImageAnalysisPage";
import VendorIntegrationPage from "./pages/VendorIntegrationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/introduction" replace />} />
          <Route path="/introduction" element={<IntroductionPage />} />
          <Route path="/usage" element={<UsagePage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/image-analysis" element={<ImageAnalysisPage />} />
          <Route path="/vendor-integration" element={<VendorIntegrationPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
