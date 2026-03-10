import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { PersistentMusicPlayer } from "@/components/PersistentMusicPlayer";
import { CookieConsent } from "@/components/CookieConsent";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
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

// Retry wrapper for lazy imports (handles chunk loading failures in in-app browsers)
function lazyRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((error) => {
      // Only retry once
      const retried = sessionStorage.getItem('lazy_retry');
      if (!retried) {
        sessionStorage.setItem('lazy_retry', '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves, page will reload
      }
      sessionStorage.removeItem('lazy_retry');
      throw error;
    })
  );
}

// Lazy loaded pages (code splitting for performance)
const Dashboard = lazyRetry(() => import("./pages/Dashboard"));
const Profile = lazyRetry(() => import("./pages/Profile"));
const UploadTrack = lazyRetry(() => import("./pages/UploadTrack"));
const Subscribe = lazyRetry(() => import("./pages/Subscribe"));
const SubscriptionManage = lazyRetry(() => import("./pages/SubscriptionManage"));
const SubscriptionSuccess = lazyRetry(() => import("./pages/SubscriptionSuccess"));
const MusicCatalog = lazyRetry(() => import("./pages/MusicCatalog"));
const Wallet = lazyRetry(() => import("./pages/Wallet"));
const TrackDetails = lazyRetry(() => import("./pages/TrackDetails"));
const Admin = lazyRetry(() => import("./pages/Admin"));
const Streaming = lazyRetry(() => import("./pages/Streaming"));
const Competitions = lazyRetry(() => import("./pages/Competitions"));
const CompetitionsActive = lazyRetry(() => import("./pages/CompetitionsActive"));
const CompetitionDetails = lazyRetry(() => import("./pages/CompetitionDetails"));
const CreateCompetition = lazyRetry(() => import("./pages/admin/CreateCompetition"));
const BAKCoins = lazyRetry(() => import("./pages/BAKCoins"));
const AITools = lazyRetry(() => import("./pages/AITools"));
const AIIntelligence = lazyRetry(() => import("./pages/AIIntelligence"));
const Join = lazyRetry(() => import("./pages/Join"));
const HowToEarn = lazyRetry(() => import("./pages/HowToEarn"));
const SuccessStories = lazyRetry(() => import("./pages/SuccessStories"));
const Support = lazyRetry(() => import("./pages/Support"));
const About = lazyRetry(() => import("./pages/About"));
const Blog = lazyRetry(() => import("./pages/Blog"));
const BlogPost = lazyRetry(() => import("./pages/BlogPost"));
const Investors = lazyRetry(() => import("./pages/Investors"));
const PressKit = lazyRetry(() => import("./pages/PressKit"));
const Contact = lazyRetry(() => import("./pages/Contact"));
const Privacy = lazyRetry(() => import("./pages/Privacy"));
const Terms = lazyRetry(() => import("./pages/Terms"));
const Legal = lazyRetry(() => import("./pages/Legal"));
const CookiePolicy = lazyRetry(() => import("./pages/CookiePolicy"));
const FAQ = lazyRetry(() => import("./pages/FAQ"));
const BuyCoins = lazyRetry(() => import("./pages/BuyCoins"));
const PaymentCallback = lazyRetry(() => import("./pages/PaymentCallback"));
const PaymentSuccess = lazyRetry(() => import("./pages/PaymentSuccess"));
const PaymentPending = lazyRetry(() => import("./pages/PaymentPending"));
const PaymentFailed = lazyRetry(() => import("./pages/PaymentFailed"));
const VerifyEmail = lazyRetry(() => import("./pages/VerifyEmail"));
const VerifyAccount = lazyRetry(() => import("./pages/VerifyAccount"));
const EditCompetition = lazyRetry(() => import("./pages/admin/EditCompetition"));
const CashReserve = lazyRetry(() => import("./pages/admin/CashReserve"));
const Vouchers = lazyRetry(() => import("./pages/admin/Vouchers"));
const Deposits = lazyRetry(() => import("./pages/admin/Deposits"));
const Analytics = lazyRetry(() => import("./pages/Analytics"));
const ArtistProfile = lazyRetry(() => import("./pages/ArtistProfile"));
const Playlists = lazyRetry(() => import("./pages/Playlists"));
const PlaylistDetails = lazyRetry(() => import("./pages/PlaylistDetails"));
const ListeningHistory = lazyRetry(() => import("./pages/ListeningHistory"));
const LiveStreams = lazyRetry(() => import("./pages/LiveStreams"));
const FanDashboard = lazyRetry(() => import("./pages/fan/FanDashboard"));
const FanSubscribe = lazyRetry(() => import("./pages/fan/FanSubscribe"));
const FanDiscover = lazyRetry(() => import("./pages/fan/FanDiscover"));
const ArtistDashboard = lazyRetry(() => import("./pages/artist/ArtistDashboard"));
const ArtistCatalog = lazyRetry(() => import("./pages/artist/ArtistCatalog"));
const ArtistDiscover = lazyRetry(() => import("./pages/artist/ArtistDiscover"));
const ArtistCourse = lazyRetry(() => import("./pages/artist/ArtistCourse"));
const BrandDashboard = lazyRetry(() => import("./pages/brand/BrandDashboard"));
const BrandDiscover = lazyRetry(() => import("./pages/brand/BrandDiscover"));
const ProducerDashboard = lazyRetry(() => import("./pages/producer/ProducerDashboard"));
const ProducerCatalog = lazyRetry(() => import("./pages/producer/ProducerCatalog"));
const ProducerDiscover = lazyRetry(() => import("./pages/producer/ProducerDiscover"));
const ProducerUploadBeat = lazyRetry(() => import("./pages/producer/ProducerUploadBeat"));
const ProducerCollaborations = lazyRetry(() => import("./pages/producer/ProducerCollaborations"));
const ProducerCompetitions = lazyRetry(() => import("./pages/producer/ProducerCompetitions"));
const Upgrade = lazyRetry(() => import("./pages/Upgrade"));
const Leaderboard = lazyRetry(() => import("./pages/Leaderboard"));
const Apply = lazyRetry(() => import("./pages/Apply"));
const InstallApp = lazyRetry(() => import("./pages/InstallApp"));
const Careers = lazyRetry(() => import("./pages/Careers"));
const BeatsCatalog = lazyRetry(() => import("./pages/BeatsCatalog"));
const ProducerProfile = lazyRetry(() => import("./pages/ProducerProfile"));
const Portfolio = lazyRetry(() => import("./pages/Portfolio"));
const RisingStarsVoting = lazyRetry(() => import("./pages/RisingStarsVoting"));
import { InstallPrompt } from "./components/InstallPrompt";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
const AuthCallback = lazyRetry(() => import("./pages/AuthCallback"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="overflow-x-hidden w-full max-w-[100vw] pb-16 md:pb-0">
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CurrencyProvider>
            <MusicPlayerProvider>
              <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                {/* Per-route ErrorBoundary wrapping via RouteErrorBoundary */}
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
                <Route path="/rising-stars/voting" element={<RisingStarsVoting />} />
                <Route path="/install" element={<InstallApp />} />
                
                {/* Legacy routes - redirect to role-specific paths */}
                <Route path="/dashboard" element={<ProtectedRoute><RouteErrorBoundary><Dashboard /></RouteErrorBoundary></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><RoleBasedRedirect to="profile" /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><RoleBasedRedirect to="wallet" /></ProtectedRoute>} />
                <Route path="/wallet/buy-coins" element={<ProtectedRoute><RoleBasedRedirect to="wallet/buy-coins" /></ProtectedRoute>} />
                <Route path="/playlists" element={<ProtectedRoute><RoleBasedRedirect to="playlists" /></ProtectedRoute>} />
                <Route path="/playlist/:id" element={<ProtectedRoute><RoleBasedRedirect to="playlist/:id" /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><RoleBasedRedirect to="history" /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><UploadTrack /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/ai-intelligence" element={<ProtectedRoute><AIIntelligence /></ProtectedRoute>} />
                <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
                <Route path="/subscription/manage" element={<ProtectedRoute><SubscriptionManage /></ProtectedRoute>} />
                <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
                
                {/* Fan Routes */}
                <Route path="/fan/dashboard" element={<ProtectedRoute requiredRole="fan"><RouteErrorBoundary><FanDashboard /></RouteErrorBoundary></ProtectedRoute>} />
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
                <Route path="/artist/dashboard" element={<ProtectedRoute requiredRole="artist"><RouteErrorBoundary><ArtistDashboard /></RouteErrorBoundary></ProtectedRoute>} />
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
                <Route path="/brand/dashboard" element={<ProtectedRoute requiredRole="brand"><RouteErrorBoundary><BrandDashboard /></RouteErrorBoundary></ProtectedRoute>} />
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
                <Route path="/producer/dashboard" element={<ProtectedRoute requiredRole="producer"><RouteErrorBoundary><ProducerDashboard /></RouteErrorBoundary></ProtectedRoute>} />
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
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><RouteErrorBoundary><Admin /></RouteErrorBoundary></ProtectedRoute>} />
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
                <Route path="/portfolio" element={<Portfolio />} />
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
              <PushNotificationPrompt />
            </MusicPlayerProvider>
            </CurrencyProvider>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
