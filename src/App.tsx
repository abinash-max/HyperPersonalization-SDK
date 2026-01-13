import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import IntroductionPage from "./pages/IntroductionPage";
import UsagePage from "./pages/UsagePage";
import PermissionsPage from "./pages/PermissionsPage";
import ModelArchitecturePage from "./pages/ModelArchitecturePage";
import RoomAnalysisPage from "./pages/RoomAnalysisPage";
import HumanAnalysisPage from "./pages/HumanAnalysisPage";
import VendorIntegrationPage from "./pages/VendorIntegrationPage";
import PerformancePage from "./pages/PerformancePage";
import PrivacyPage from "./pages/PrivacyPage";
import AdvancedIntegrationPage from "./pages/AdvancedIntegrationPage";
import TestingSupportPage from "./pages/TestingSupportPage";
import UILifecyclePage from "./pages/UILifecyclePage";
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
          <Route path="/model-architecture" element={<ModelArchitecturePage />} />
          <Route path="/room-analysis" element={<RoomAnalysisPage />} />
          <Route path="/human-analysis" element={<HumanAnalysisPage />} />
          <Route path="/vendor-integration" element={<VendorIntegrationPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/advanced-integration" element={<AdvancedIntegrationPage />} />
          <Route path="/testing-support" element={<TestingSupportPage />} />
          <Route path="/ui-lifecycle" element={<UILifecyclePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
