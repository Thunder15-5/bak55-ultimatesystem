import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Streaming from "./pages/Streaming";
import Competitions from "./pages/Competitions";
import BAKCoinsPage from "./pages/BAKCoins";
import AITools from "./pages/AITools";
import Join from "./pages/Join";
import HowToEarn from "./pages/HowToEarn";
import SuccessStories from "./pages/SuccessStories";
import Support from "./pages/Support";
import About from "./pages/About";
import Investors from "./pages/Investors";
import PressKit from "./pages/PressKit";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/streaming" element={<Streaming />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/bakcoins" element={<BAKCoinsPage />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/join" element={<Join />} />
          <Route path="/how-to-earn" element={<HowToEarn />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/support" element={<Support />} />
          <Route path="/about" element={<About />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/press-kit" element={<PressKit />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/legal" element={<Legal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
