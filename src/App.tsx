import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PersistentMusicPlayer } from "@/components/PersistentMusicPlayer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import UploadTrack from "./pages/UploadTrack";
import Subscribe from "./pages/Subscribe";
import SubscriptionManage from "./pages/SubscriptionManage";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import MusicCatalog from "./pages/MusicCatalog";
import Wallet from "./pages/Wallet";
import TrackDetails from "./pages/TrackDetails";
import Admin from "./pages/Admin";
import Streaming from "./pages/Streaming";
import Competitions from "./pages/Competitions";
import CompetitionsActive from "./pages/CompetitionsActive";
import CompetitionDetails from "./pages/CompetitionDetails";
import CreateCompetition from "./pages/admin/CreateCompetition";
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
import BuyCoins from "./pages/BuyCoins";
import PaymentCallback from "./pages/PaymentCallback";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentPending from "./pages/PaymentPending";
import PaymentFailed from "./pages/PaymentFailed";
import VerifyEmail from "./pages/VerifyEmail";
import EditCompetition from "./pages/admin/EditCompetition";
import CashReserve from "./pages/admin/CashReserve";
import Analytics from "./pages/Analytics";
import ArtistProfile from "./pages/ArtistProfile";
import Playlists from "./pages/Playlists";
import PlaylistDetails from "./pages/PlaylistDetails";
import ListeningHistory from "./pages/ListeningHistory";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import FanDashboard from "./pages/fan/FanDashboard";
import ArtistDashboard from "./pages/artist/ArtistDashboard";
import BrandDashboard from "./pages/brand/BrandDashboard";
import Upgrade from "./pages/Upgrade";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="overflow-x-hidden w-full">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MusicPlayerProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Legacy routes - redirect to role-specific paths */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><RoleBasedRedirect to="profile" /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><RoleBasedRedirect to="wallet" /></ProtectedRoute>} />
                <Route path="/wallet/buy-coins" element={<ProtectedRoute><RoleBasedRedirect to="wallet/buy-coins" /></ProtectedRoute>} />
                <Route path="/playlists" element={<ProtectedRoute><RoleBasedRedirect to="playlists" /></ProtectedRoute>} />
                <Route path="/playlist/:id" element={<ProtectedRoute><RoleBasedRedirect to="playlist/:id" /></ProtectedRoute>} />
                <Route path="/track/:id" element={<ProtectedRoute><RoleBasedRedirect to="track/:id" /></ProtectedRoute>} />
                <Route path="/artist/:id" element={<ProtectedRoute><RoleBasedRedirect to="artist/:id" /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><RoleBasedRedirect to="history" /></ProtectedRoute>} />
                <Route path="/competitions" element={<RoleBasedRedirect to="competitions" />} />
                <Route path="/competitions/active" element={<RoleBasedRedirect to="competitions/active" />} />
                <Route path="/competition/:id" element={<RoleBasedRedirect to="competition/:id" />} />
                <Route path="/upload" element={<ProtectedRoute><UploadTrack /></ProtectedRoute>} />
                <Route path="/catalog" element={<MusicCatalog />} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
                <Route path="/subscription/manage" element={<ProtectedRoute><SubscriptionManage /></ProtectedRoute>} />
                <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
                
                {/* Fan Routes */}
                <Route path="/fan/dashboard" element={<ProtectedRoute requiredRole="fan"><FanDashboard /></ProtectedRoute>} />
                <Route path="/fan/discover" element={<ProtectedRoute requiredRole="fan"><MusicCatalog /></ProtectedRoute>} />
                <Route path="/fan/playlists" element={<ProtectedRoute requiredRole="fan"><Playlists /></ProtectedRoute>} />
                <Route path="/fan/playlist/:id" element={<ProtectedRoute requiredRole="fan"><PlaylistDetails /></ProtectedRoute>} />
                <Route path="/fan/history" element={<ProtectedRoute requiredRole="fan"><ListeningHistory /></ProtectedRoute>} />
                <Route path="/fan/track/:id" element={<ProtectedRoute requiredRole="fan"><TrackDetails /></ProtectedRoute>} />
                <Route path="/fan/artist/:id" element={<ProtectedRoute requiredRole="fan"><ArtistProfile /></ProtectedRoute>} />
                <Route path="/fan/wallet" element={<ProtectedRoute requiredRole="fan"><Wallet /></ProtectedRoute>} />
                <Route path="/fan/wallet/buy-coins" element={<ProtectedRoute requiredRole="fan"><BuyCoins /></ProtectedRoute>} />
                <Route path="/fan/profile" element={<ProtectedRoute requiredRole="fan"><Profile /></ProtectedRoute>} />
                <Route path="/fan/competitions" element={<ProtectedRoute requiredRole="fan"><Competitions /></ProtectedRoute>} />
                <Route path="/fan/competitions/active" element={<ProtectedRoute requiredRole="fan"><CompetitionsActive /></ProtectedRoute>} />
                <Route path="/fan/competition/:id" element={<ProtectedRoute requiredRole="fan"><CompetitionDetails /></ProtectedRoute>} />

                {/* Artist Routes */}
                <Route path="/artist/dashboard" element={<ProtectedRoute requiredRole="artist"><ArtistDashboard /></ProtectedRoute>} />
                <Route path="/artist/upload" element={<ProtectedRoute requiredRole="artist"><UploadTrack /></ProtectedRoute>} />
                <Route path="/artist/catalog" element={<ProtectedRoute requiredRole="artist"><MusicCatalog /></ProtectedRoute>} />
                <Route path="/artist/discover" element={<ProtectedRoute requiredRole="artist"><MusicCatalog /></ProtectedRoute>} />
                <Route path="/artist/track/:id" element={<ProtectedRoute requiredRole="artist"><TrackDetails /></ProtectedRoute>} />
                <Route path="/artist/artist/:id" element={<ProtectedRoute requiredRole="artist"><ArtistProfile /></ProtectedRoute>} />
                <Route path="/artist/analytics" element={<ProtectedRoute requiredRole="artist"><Analytics /></ProtectedRoute>} />
                <Route path="/artist/playlists" element={<ProtectedRoute requiredRole="artist"><Playlists /></ProtectedRoute>} />
                <Route path="/artist/playlist/:id" element={<ProtectedRoute requiredRole="artist"><PlaylistDetails /></ProtectedRoute>} />
                <Route path="/artist/history" element={<ProtectedRoute requiredRole="artist"><ListeningHistory /></ProtectedRoute>} />
                <Route path="/artist/competitions" element={<ProtectedRoute requiredRole="artist"><Competitions /></ProtectedRoute>} />
                <Route path="/artist/competitions/active" element={<ProtectedRoute requiredRole="artist"><CompetitionsActive /></ProtectedRoute>} />
                <Route path="/artist/competition/:id" element={<ProtectedRoute requiredRole="artist"><CompetitionDetails /></ProtectedRoute>} />
                <Route path="/artist/subscribe" element={<ProtectedRoute requiredRole="artist"><Subscribe /></ProtectedRoute>} />
                <Route path="/artist/subscription/manage" element={<ProtectedRoute requiredRole="artist"><SubscriptionManage /></ProtectedRoute>} />
                <Route path="/artist/subscription/success" element={<ProtectedRoute requiredRole="artist"><SubscriptionSuccess /></ProtectedRoute>} />
                <Route path="/artist/wallet" element={<ProtectedRoute requiredRole="artist"><Wallet /></ProtectedRoute>} />
                <Route path="/artist/wallet/buy-coins" element={<ProtectedRoute requiredRole="artist"><BuyCoins /></ProtectedRoute>} />
                <Route path="/artist/profile" element={<ProtectedRoute requiredRole="artist"><Profile /></ProtectedRoute>} />

                {/* Brand Routes */}
                <Route path="/brand/dashboard" element={<ProtectedRoute requiredRole="brand"><BrandDashboard /></ProtectedRoute>} />
                <Route path="/brand/discover" element={<ProtectedRoute requiredRole="brand"><MusicCatalog /></ProtectedRoute>} />
                <Route path="/brand/artist/:id" element={<ProtectedRoute requiredRole="brand"><ArtistProfile /></ProtectedRoute>} />
                <Route path="/brand/competitions" element={<ProtectedRoute requiredRole="brand"><Competitions /></ProtectedRoute>} />
                <Route path="/brand/competitions/create" element={<ProtectedRoute requiredRole="brand"><CreateCompetition /></ProtectedRoute>} />
                <Route path="/brand/competitions/active" element={<ProtectedRoute requiredRole="brand"><CompetitionsActive /></ProtectedRoute>} />
                <Route path="/brand/competition/:id" element={<ProtectedRoute requiredRole="brand"><CompetitionDetails /></ProtectedRoute>} />
                <Route path="/brand/wallet" element={<ProtectedRoute requiredRole="brand"><Wallet /></ProtectedRoute>} />
                <Route path="/brand/wallet/buy-coins" element={<ProtectedRoute requiredRole="brand"><BuyCoins /></ProtectedRoute>} />
                <Route path="/brand/profile" element={<ProtectedRoute requiredRole="brand"><Profile /></ProtectedRoute>} />

                {/* Role upgrade route */}
                <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
                <Route path="/payment/callback" element={<PaymentCallback />} />
                <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                <Route path="/payment/pending" element={<ProtectedRoute><PaymentPending /></ProtectedRoute>} />
                <Route path="/payment/failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
                <Route path="/admin/cash-reserve" element={<ProtectedRoute requiredRole="admin"><CashReserve /></ProtectedRoute>} />
                <Route path="/streaming" element={<Streaming />} />
          <Route path="/admin/create-competition" element={
            <ProtectedRoute requiredRoles={['admin', 'brand']}>
              <CreateCompetition />
            </ProtectedRoute>
          } />
                <Route path="/admin/edit-competition/:id" element={
                  <ProtectedRoute requiredRole="admin">
                    <EditCompetition />
                  </ProtectedRoute>
                } />
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
              <PersistentMusicPlayer />
            </MusicPlayerProvider>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
