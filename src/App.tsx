import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BlueOceanRadar from "./pages/BlueOceanRadar";
import IndicatorRadar from "./pages/IndicatorRadar";
import ResourceRadar from "./pages/ResourceRadar";
import EdTechRiskRadar from "./pages/EdTechRiskRadar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BlueOceanRadar />} />
          <Route path="/leadership-radar" element={<Index />} />
          <Route path="/indicator-radar" element={<IndicatorRadar />} />
          <Route path="/blue-ocean" element={<BlueOceanRadar />} />
          <Route path="/resource-radar" element={<ResourceRadar />} />
          <Route path="/edtech-risk" element={<EdTechRiskRadar />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
