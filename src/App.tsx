import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import UploadTrack from "./pages/UploadTrack";
import MusicCatalog from "./pages/MusicCatalog";
import Streaming from "./pages/Streaming";
import Competitions from "./pages/Competitions";
import BAKCoins from "./pages/BAKCoins";
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
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadTrack /></ProtectedRoute>} />
            <Route path="/catalog" element={<MusicCatalog />} />
            <Route path="/tracks" element={<ProtectedRoute><div>Tracks page coming soon</div></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><div>Wallet page coming soon</div></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><div>Admin page coming soon</div></ProtectedRoute>} />
            <Route path="/streaming" element={<Streaming />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/bakcoins" element={<BAKCoins />} />
            <Route path="/ai-tools" element={<AITools />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-to-earn" element={<HowToEarn />} />
            <Route path="/join" element={<Join />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/press-kit" element={<PressKit />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/support" element={<Support />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
