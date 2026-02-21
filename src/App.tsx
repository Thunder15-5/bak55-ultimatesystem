import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PersistentMusicPlayer } from "@/components/PersistentMusicPlayer";
import { CookieConsent } from "@/components/CookieConsent";
import { BottomNavigation } from "@/components/BottomNavigation";
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/PageLoader";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (code splitting for performance)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const UploadTrack = lazy(() => import("./pages/UploadTrack"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const SubscriptionManage = lazy(() => import("./pages/SubscriptionManage"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const MusicCatalog = lazy(() => import("./pages/MusicCatalog"));
const Wallet = lazy(() => import("./pages/Wallet"));
const TrackDetails = lazy(() => import("./pages/TrackDetails"));
const Admin = lazy(() => import("./pages/Admin"));
const Streaming = lazy(() => import("./pages/Streaming"));
const Competitions = lazy(() => import("./pages/Competitions"));
const CompetitionsActive = lazy(() => import("./pages/CompetitionsActive"));
const CompetitionDetails = lazy(() => import("./pages/CompetitionDetails"));
const CreateCompetition = lazy(() => import("./pages/admin/CreateCompetition"));
const BAKCoins = lazy(() => import("./pages/BAKCoins"));
const AITools = lazy(() => import("./pages/AITools"));
const Join = lazy(() => import("./pages/Join"));
const HowToEarn = lazy(() => import("./pages/HowToEarn"));
const SuccessStories = lazy(() => import("./pages/SuccessStories"));
const Support = lazy(() => import("./pages/Support"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Investors = lazy(() => import("./pages/Investors"));
const PressKit = lazy(() => import("./pages/PressKit"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Legal = lazy(() => import("./pages/Legal"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const BuyCoins = lazy(() => import("./pages/BuyCoins"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentPending = lazy(() => import("./pages/PaymentPending"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const VerifyAccount = lazy(() => import("./pages/VerifyAccount"));
const EditCompetition = lazy(() => import("./pages/admin/EditCompetition"));
const CashReserve = lazy(() => import("./pages/admin/CashReserve"));
const Vouchers = lazy(() => import("./pages/admin/Vouchers"));
const Deposits = lazy(() => import("./pages/admin/Deposits"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const Playlists = lazy(() => import("./pages/Playlists"));
const PlaylistDetails = lazy(() => import("./pages/PlaylistDetails"));
const ListeningHistory = lazy(() => import("./pages/ListeningHistory"));
const LiveStreams = lazy(() => import("./pages/LiveStreams"));
const FanDashboard = lazy(() => import("./pages/fan/FanDashboard"));
const FanSubscribe = lazy(() => import("./pages/fan/FanSubscribe"));
const FanDiscover = lazy(() => import("./pages/fan/FanDiscover"));
const ArtistDashboard = lazy(() => import("./pages/artist/ArtistDashboard"));
const ArtistCatalog = lazy(() => import("./pages/artist/ArtistCatalog"));
const ArtistDiscover = lazy(() => import("./pages/artist/ArtistDiscover"));
const ArtistCourse = lazy(() => import("./pages/artist/ArtistCourse"));
const BrandDashboard = lazy(() => import("./pages/brand/BrandDashboard"));
const BrandDiscover = lazy(() => import("./pages/brand/BrandDiscover"));
const ProducerDashboard = lazy(() => import("./pages/producer/ProducerDashboard"));
const ProducerCatalog = lazy(() => import("./pages/producer/ProducerCatalog"));
const ProducerDiscover = lazy(() => import("./pages/producer/ProducerDiscover"));
const ProducerUploadBeat = lazy(() => import("./pages/producer/ProducerUploadBeat"));
const ProducerCollaborations = lazy(() => import("./pages/producer/ProducerCollaborations"));
const ProducerCompetitions = lazy(() => import("./pages/producer/ProducerCompetitions"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Apply = lazy(() => import("./pages/Apply"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const Careers = lazy(() => import("./pages/Careers"));
const BeatsCatalog = lazy(() => import("./pages/BeatsCatalog"));
const ProducerProfile = lazy(() => import("./pages/ProducerProfile"));
import { InstallPrompt } from "./components/InstallPrompt";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="overflow-x-hidden w-full max-w-[100vw] pb-16 md:pb-0">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MusicPlayerProvider>
              <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/faq" element={<FAQ />} />
                
                {/* PUBLIC SHAREABLE ROUTES - No auth required */}
                <Route path="/track/:id" element={<TrackDetails />} />
                <Route path="/artist/:id" element={<ArtistProfile />} />
          <Route path="/catalog" element={<MusicCatalog />} />
          <Route path="/streaming" element={<Streaming />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/competitions/active" element={<CompetitionsActive />} />
          <Route path="/competition/:id" element={<CompetitionDetails />} />
           <Route path="/apply" element={<Apply />} />
           <Route path="/beats" element={<BeatsCatalog />} />
           <Route path="/producer/:id" element={<ProducerProfile />} />
           <Route path="/live-streams" element={<LiveStreams />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/install" element={<InstallApp />} />
                
                {/* Legacy routes - redirect to role-specific paths */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><RoleBasedRedirect to="profile" /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><RoleBasedRedirect to="wallet" /></ProtectedRoute>} />
                <Route path="/wallet/buy-coins" element={<ProtectedRoute><RoleBasedRedirect to="wallet/buy-coins" /></ProtectedRoute>} />
                <Route path="/playlists" element={<ProtectedRoute><RoleBasedRedirect to="playlists" /></ProtectedRoute>} />
                <Route path="/playlist/:id" element={<ProtectedRoute><RoleBasedRedirect to="playlist/:id" /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><RoleBasedRedirect to="history" /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><UploadTrack /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
                <Route path="/subscription/manage" element={<ProtectedRoute><SubscriptionManage /></ProtectedRoute>} />
                <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
                
                {/* Fan Routes */}
                <Route path="/fan/dashboard" element={<ProtectedRoute requiredRole="fan"><FanDashboard /></ProtectedRoute>} />
                <Route path="/fan/discover" element={<ProtectedRoute requiredRole="fan"><FanDiscover /></ProtectedRoute>} />
                <Route path="/fan/playlists" element={<ProtectedRoute requiredRole="fan"><Playlists /></ProtectedRoute>} />
                <Route path="/fan/playlist/:id" element={<ProtectedRoute requiredRole="fan"><PlaylistDetails /></ProtectedRoute>} />
                <Route path="/fan/history" element={<ProtectedRoute requiredRole="fan"><ListeningHistory /></ProtectedRoute>} />
                <Route path="/fan/track/:id" element={<ProtectedRoute requiredRole="fan"><TrackDetails /></ProtectedRoute>} />
                <Route path="/fan/artist/:id" element={<ProtectedRoute requiredRole="fan"><ArtistProfile /></ProtectedRoute>} />
                <Route path="/fan/live-streams" element={<ProtectedRoute requiredRole="fan"><LiveStreams /></ProtectedRoute>} />
                <Route path="/fan/wallet" element={<ProtectedRoute requiredRole="fan"><Wallet /></ProtectedRoute>} />
                <Route path="/fan/wallet/buy-coins" element={<ProtectedRoute requiredRole="fan"><BuyCoins /></ProtectedRoute>} />
                <Route path="/fan/profile" element={<ProtectedRoute requiredRole="fan"><Profile /></ProtectedRoute>} />
                <Route path="/fan/competitions" element={<ProtectedRoute requiredRole="fan"><Competitions /></ProtectedRoute>} />
                <Route path="/fan/competitions/active" element={<ProtectedRoute requiredRole="fan"><CompetitionsActive /></ProtectedRoute>} />
                <Route path="/fan/competition/:id" element={<ProtectedRoute requiredRole="fan"><CompetitionDetails /></ProtectedRoute>} />
                <Route path="/fan/subscribe" element={<ProtectedRoute requiredRole="fan"><FanSubscribe /></ProtectedRoute>} />
                <Route path="/fan/leaderboard" element={<ProtectedRoute requiredRole="fan"><Leaderboard /></ProtectedRoute>} />

                {/* Artist Routes */}
                <Route path="/artist/dashboard" element={<ProtectedRoute requiredRole="artist"><ArtistDashboard /></ProtectedRoute>} />
                <Route path="/artist/upload" element={<ProtectedRoute requiredRole="artist"><UploadTrack /></ProtectedRoute>} />
                <Route path="/artist/catalog" element={<ProtectedRoute requiredRole="artist"><ArtistCatalog /></ProtectedRoute>} />
                <Route path="/artist/discover" element={<ProtectedRoute requiredRole="artist"><ArtistDiscover /></ProtectedRoute>} />
                <Route path="/artist/track/:id" element={<ProtectedRoute requiredRole="artist"><TrackDetails /></ProtectedRoute>} />
                <Route path="/artist/artist/:id" element={<ProtectedRoute requiredRole="artist"><ArtistProfile /></ProtectedRoute>} />
                <Route path="/artist/analytics" element={<ProtectedRoute requiredRole="artist"><Analytics /></ProtectedRoute>} />
                <Route path="/artist/playlists" element={<ProtectedRoute requiredRole="artist"><Playlists /></ProtectedRoute>} />
                <Route path="/artist/playlist/:id" element={<ProtectedRoute requiredRole="artist"><PlaylistDetails /></ProtectedRoute>} />
                <Route path="/artist/history" element={<ProtectedRoute requiredRole="artist"><ListeningHistory /></ProtectedRoute>} />
                <Route path="/artist/live-streams" element={<ProtectedRoute requiredRole="artist"><LiveStreams /></ProtectedRoute>} />
                <Route path="/artist/competitions" element={<ProtectedRoute requiredRole="artist"><Competitions /></ProtectedRoute>} />
                <Route path="/artist/competitions/active" element={<ProtectedRoute requiredRole="artist"><CompetitionsActive /></ProtectedRoute>} />
                <Route path="/artist/competition/:id" element={<ProtectedRoute requiredRole="artist"><CompetitionDetails /></ProtectedRoute>} />
                <Route path="/artist/subscribe" element={<ProtectedRoute requiredRole="artist"><Subscribe /></ProtectedRoute>} />
                <Route path="/artist/subscription/manage" element={<ProtectedRoute requiredRole="artist"><SubscriptionManage /></ProtectedRoute>} />
                <Route path="/artist/subscription/success" element={<ProtectedRoute requiredRole="artist"><SubscriptionSuccess /></ProtectedRoute>} />
                <Route path="/artist/wallet" element={<ProtectedRoute requiredRole="artist"><Wallet /></ProtectedRoute>} />
                <Route path="/artist/wallet/buy-coins" element={<ProtectedRoute requiredRole="artist"><BuyCoins /></ProtectedRoute>} />
                <Route path="/artist/leaderboard" element={<ProtectedRoute requiredRole="artist"><Leaderboard /></ProtectedRoute>} />
                <Route path="/artist/profile" element={<ProtectedRoute requiredRole="artist"><Profile /></ProtectedRoute>} />
                <Route path="/artist/course" element={<ProtectedRoute requiredRole="artist"><ArtistCourse /></ProtectedRoute>} />

                {/* Brand Routes */}
                <Route path="/brand/dashboard" element={<ProtectedRoute requiredRole="brand"><BrandDashboard /></ProtectedRoute>} />
                <Route path="/brand/discover" element={<ProtectedRoute requiredRole="brand"><BrandDiscover /></ProtectedRoute>} />
                <Route path="/brand/artist/:id" element={<ProtectedRoute requiredRole="brand"><ArtistProfile /></ProtectedRoute>} />
                <Route path="/brand/track/:id" element={<ProtectedRoute requiredRole="brand"><TrackDetails /></ProtectedRoute>} />
                <Route path="/brand/competitions" element={<ProtectedRoute requiredRole="brand"><Competitions /></ProtectedRoute>} />
                <Route path="/brand/competitions/create" element={<ProtectedRoute requiredRole="brand"><CreateCompetition /></ProtectedRoute>} />
                <Route path="/brand/competitions/active" element={<ProtectedRoute requiredRole="brand"><CompetitionsActive /></ProtectedRoute>} />
                <Route path="/brand/competition/:id" element={<ProtectedRoute requiredRole="brand"><CompetitionDetails /></ProtectedRoute>} />
                <Route path="/brand/analytics" element={<ProtectedRoute requiredRole="brand"><Analytics /></ProtectedRoute>} />
                <Route path="/brand/playlists" element={<ProtectedRoute requiredRole="brand"><Playlists /></ProtectedRoute>} />
                <Route path="/brand/playlist/:id" element={<ProtectedRoute requiredRole="brand"><PlaylistDetails /></ProtectedRoute>} />
                <Route path="/brand/wallet" element={<ProtectedRoute requiredRole="brand"><Wallet /></ProtectedRoute>} />
                <Route path="/brand/wallet/buy-coins" element={<ProtectedRoute requiredRole="brand"><BuyCoins /></ProtectedRoute>} />
                <Route path="/brand/subscribe" element={<ProtectedRoute requiredRole="brand"><Subscribe /></ProtectedRoute>} />
                <Route path="/brand/profile" element={<ProtectedRoute requiredRole="brand"><Profile /></ProtectedRoute>} />

                {/* Producer Routes */}
                <Route path="/producer/dashboard" element={<ProtectedRoute requiredRole="producer"><ProducerDashboard /></ProtectedRoute>} />
                <Route path="/producer/upload" element={<ProtectedRoute requiredRole="producer"><ProducerUploadBeat /></ProtectedRoute>} />
                <Route path="/producer/catalog" element={<ProtectedRoute requiredRole="producer"><ProducerCatalog /></ProtectedRoute>} />
                <Route path="/producer/discover" element={<ProtectedRoute requiredRole="producer"><ProducerDiscover /></ProtectedRoute>} />
                <Route path="/producer/collaborations" element={<ProtectedRoute requiredRole="producer"><ProducerCollaborations /></ProtectedRoute>} />
                <Route path="/producer/competitions" element={<ProtectedRoute requiredRole="producer"><ProducerCompetitions /></ProtectedRoute>} />
                <Route path="/producer/competitions/create" element={<ProtectedRoute requiredRole="producer"><CreateCompetition /></ProtectedRoute>} />
                <Route path="/producer/competitions/active" element={<ProtectedRoute requiredRole="producer"><CompetitionsActive /></ProtectedRoute>} />
                <Route path="/producer/competition/:id" element={<ProtectedRoute requiredRole="producer"><CompetitionDetails /></ProtectedRoute>} />
                <Route path="/producer/track/:id" element={<ProtectedRoute requiredRole="producer"><TrackDetails /></ProtectedRoute>} />
                <Route path="/producer/artist/:id" element={<ProtectedRoute requiredRole="producer"><ArtistProfile /></ProtectedRoute>} />
                <Route path="/producer/analytics" element={<ProtectedRoute requiredRole="producer"><Analytics /></ProtectedRoute>} />
                <Route path="/producer/playlists" element={<ProtectedRoute requiredRole="producer"><Playlists /></ProtectedRoute>} />
                <Route path="/producer/playlist/:id" element={<ProtectedRoute requiredRole="producer"><PlaylistDetails /></ProtectedRoute>} />
                <Route path="/producer/history" element={<ProtectedRoute requiredRole="producer"><ListeningHistory /></ProtectedRoute>} />
                <Route path="/producer/subscribe" element={<ProtectedRoute requiredRole="producer"><Subscribe /></ProtectedRoute>} />
                <Route path="/producer/subscription/manage" element={<ProtectedRoute requiredRole="producer"><SubscriptionManage /></ProtectedRoute>} />
                <Route path="/producer/subscription/success" element={<ProtectedRoute requiredRole="producer"><SubscriptionSuccess /></ProtectedRoute>} />
                <Route path="/producer/wallet" element={<ProtectedRoute requiredRole="producer"><Wallet /></ProtectedRoute>} />
                <Route path="/producer/wallet/buy-coins" element={<ProtectedRoute requiredRole="producer"><BuyCoins /></ProtectedRoute>} />
                <Route path="/producer/profile" element={<ProtectedRoute requiredRole="producer"><Profile /></ProtectedRoute>} />

                {/* Role upgrade route */}
                <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
                <Route path="/payment/callback" element={<PaymentCallback />} />
                <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                <Route path="/payment/pending" element={<ProtectedRoute><PaymentPending /></ProtectedRoute>} />
                <Route path="/payment/failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
                <Route path="/admin/streaming" element={<ProtectedRoute requiredRole="admin"><Streaming /></ProtectedRoute>} />
                <Route path="/admin/profile" element={<ProtectedRoute requiredRole="admin"><Profile /></ProtectedRoute>} />
                <Route path="/admin/wallet" element={<ProtectedRoute requiredRole="admin"><Wallet /></ProtectedRoute>} />
                <Route path="/admin/wallet/buy-coins" element={<ProtectedRoute requiredRole="admin"><BuyCoins /></ProtectedRoute>} />
                <Route path="/admin/track/:id" element={<ProtectedRoute requiredRole="admin"><TrackDetails /></ProtectedRoute>} />
                <Route path="/admin/artist/:id" element={<ProtectedRoute requiredRole="admin"><ArtistProfile /></ProtectedRoute>} />
                <Route path="/admin/competitions" element={<ProtectedRoute requiredRole="admin"><Competitions /></ProtectedRoute>} />
                <Route path="/admin/competitions/active" element={<ProtectedRoute requiredRole="admin"><CompetitionsActive /></ProtectedRoute>} />
                <Route path="/admin/competition/:id" element={<ProtectedRoute requiredRole="admin"><CompetitionDetails /></ProtectedRoute>} />
                <Route path="/admin/cash-reserve" element={<ProtectedRoute requiredRole="admin"><CashReserve /></ProtectedRoute>} />
                <Route path="/admin/vouchers" element={<ProtectedRoute requiredRole="admin"><Vouchers /></ProtectedRoute>} />
                <Route path="/admin/deposits" element={<ProtectedRoute requiredRole="admin"><Deposits /></ProtectedRoute>} />

                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-account" element={<ProtectedRoute><VerifyAccount /></ProtectedRoute>} />
          <Route path="/admin/create-competition" element={
            <ProtectedRoute requiredRoles={['admin', 'brand', 'producer']}>
              <CreateCompetition />
            </ProtectedRoute>
          } />
          <Route path="/admin/competitions/create" element={
            <ProtectedRoute requiredRole="admin">
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
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/how-to-earn" element={<HowToEarn />} />
                <Route path="/join" element={<Join />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/press-kit" element={<PressKit />} />
                <Route path="/investors" element={<Investors />} />
                <Route path="/success-stories" element={<SuccessStories />} />
                <Route path="/support" element={<Support />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/buy-coins" element={<ProtectedRoute><BuyCoins /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
               </Routes>
              </Suspense>
              </ErrorBoundary>
              <PersistentMusicPlayer />
              <BottomNavigation />
              <InstallPrompt />
              <CookieConsent />
            </MusicPlayerProvider>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
