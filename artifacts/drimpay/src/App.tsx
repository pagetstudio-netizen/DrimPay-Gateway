import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LangProvider, type Lang } from "@/lib/i18n";
import { useEffect } from "react";

import Home from "@/pages/home";
import About from "@/pages/about";
import HowItWorks from "@/pages/how-it-works";
import Pricing from "@/pages/pricing";
import Countries from "@/pages/countries";
import Security from "@/pages/security";
import Docs from "@/pages/docs";
import Businesses from "@/pages/businesses";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Careers from "@/pages/careers";
import CareerDetail from "@/pages/career-detail";
import Contact from "@/pages/contact";
import Partners from "@/pages/partners";
import Help from "@/pages/help";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import DashboardPreview from "@/pages/dashboard-preview";
import News from "@/pages/news";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";

import DocsPayin from "@/pages/docs-payin";
import DocsPayout from "@/pages/docs-payout";

import DashboardOverview from "@/pages/dashboard/index";
import DashboardWallets from "@/pages/dashboard/wallets";
import DashboardReversement from "@/pages/dashboard/reversement";
import DashboardPayments from "@/pages/dashboard/payments";
import DashboardApiKeys from "@/pages/dashboard/api-keys";
import DashboardKyb from "@/pages/dashboard/kyb";
import DashboardSettings from "@/pages/dashboard/settings";
import DashboardProfile from "@/pages/dashboard/profile";
import DocPayin from "@/pages/dashboard/docs/payin";
import DocPayout from "@/pages/dashboard/docs/payout";
import DocVirtualCards from "@/pages/dashboard/docs/virtual-cards";
import DocCredits from "@/pages/dashboard/docs/credits";
import DocMassPayout from "@/pages/dashboard/docs/mass-payout";
import DashboardPaymentLinks from "@/pages/dashboard/payment-links";
import DashboardMassPayout from "@/pages/dashboard/mass-payout";
import PayPage from "@/pages/pay";

import AdminDashboard from "@/pages/admin/index";
import AdminMerchants from "@/pages/admin/merchants";
import AdminKyb from "@/pages/admin/kyb";
import AdminTransactions from "@/pages/admin/transactions";
import AdminWallets from "@/pages/admin/wallets";
import AdminAggregators from "@/pages/admin/aggregators";
import AdminOperators from "@/pages/admin/operators";
import AdminApiKeys from "@/pages/admin/api-keys";
import AdminPaymentLinks from "@/pages/admin/payment-links";
import AdminKybContracts from "@/pages/admin/kyb-contracts";
import AdminLogs from "@/pages/admin/logs";
import AdminNotifications from "@/pages/admin/notifications";
import AdminSettings from "@/pages/admin/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function isDashboardPath(path: string) {
  return path.startsWith("/dashboard");
}

function isAdminPath(path: string) {
  return path.startsWith("/admin");
}

function Redirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(to, { replace: true } as any);
  }, [to]);
  return null;
}

/**
 * Detect the best language for the user based on:
 * 1. Browser/OS language setting
 * 2. Timezone (to catch French-speaking West/Central Africa users)
 * Defaults to French since DrimPay is primarily a Francophone Africa platform.
 */
function detectLang(): Lang {
  try {
    const browserLang = (
      navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      ""
    ).toLowerCase();

    if (browserLang.startsWith("fr")) return "fr";
    if (browserLang.startsWith("en")) return "en";

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const frenchAfricaZones = [
      "Africa/Abidjan",
      "Africa/Porto-Novo",
      "Africa/Cotonou",
      "Africa/Douala",
      "Africa/Yaoundé",
      "Africa/Ouagadougou",
      "Africa/Bamako",
      "Africa/Dakar",
      "Africa/Lome",
      "Africa/Kinshasa",
      "Africa/Lubumbashi",
      "Africa/Libreville",
      "Africa/Malabo",
      "Africa/Niamey",
      "Africa/Ndjamena",
      "Africa/Brazzaville",
      "Africa/Bangui",
      "Africa/Bujumbura",
      "Africa/Kigali",
      "Africa/Djibouti",
      "Indian/Comoro",
      "Indian/Mayotte",
      "Africa/Tunis",
      "Africa/Algiers",
      "Africa/Casablanca",
      "Africa/Nouakchott",
      "Africa/Conakry",
    ];
    if (frenchAfricaZones.includes(tz)) return "fr";
  } catch {}

  return "fr";
}

function PublicSwitch() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/countries" component={Countries} />
            <Route path="/security" component={Security} />
            <Route path="/docs" component={Docs} />
            <Route path="/businesses" component={Businesses} />
            <Route path="/blog" component={Blog} />
            <Route path="/blog/:slug" component={BlogPost} />
            <Route path="/news" component={News} />
            <Route path="/careers" component={Careers} />
            <Route path="/careers/:id" component={CareerDetail} />
            <Route path="/contact" component={Contact} />
            <Route path="/partners" component={Partners} />
            <Route path="/help" component={Help} />
            <Route path="/terms" component={Terms} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/dashboard-preview" component={DashboardPreview} />
            <Route path="/docs/payin" component={DocsPayin} />
            <Route path="/docs/payout" component={DocsPayout} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function AdminSwitch() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.replace("/fr/login");
    return null;
  }

  if (user.role !== "admin") {
    window.location.replace("/dashboard");
    return null;
  }

  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/merchants" component={AdminMerchants} />
      <Route path="/admin/kyb" component={AdminKyb} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/wallets" component={AdminWallets} />
      <Route path="/admin/aggregators" component={AdminAggregators} />
      <Route path="/admin/operators" component={AdminOperators} />
      <Route path="/admin/api-keys" component={AdminApiKeys} />
      <Route path="/admin/payment-links" component={AdminPaymentLinks} />
      <Route path="/admin/kyb-contracts" component={AdminKybContracts} />
      <Route path="/admin/logs" component={AdminLogs} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route component={AdminDashboard} />
    </Switch>
  );
}

function DashboardSwitch() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.replace(`/fr/login`);
    return null;
  }

  return (
    <Switch>
      <Route path="/dashboard" component={DashboardOverview} />
      <Route path="/dashboard/wallets" component={DashboardWallets} />
      <Route path="/dashboard/payments" component={DashboardPayments} />
      <Route path="/dashboard/reversement" component={DashboardReversement} />
      <Route path="/dashboard/api-keys" component={DashboardApiKeys} />
      <Route path="/dashboard/kyb" component={DashboardKyb} />
      <Route path="/dashboard/settings" component={DashboardSettings} />
      <Route path="/dashboard/profile" component={DashboardProfile} />
      <Route path="/dashboard/docs/payin" component={DocPayin} />
      <Route path="/dashboard/docs/payout" component={DocPayout} />
      <Route path="/dashboard/docs/virtual-cards" component={DocVirtualCards} />
      <Route path="/dashboard/docs/credits" component={DocCredits} />
      <Route path="/dashboard/docs/mass-payout" component={DocMassPayout} />
      <Route path="/dashboard/payment-links" component={DashboardPaymentLinks} />
      <Route path="/dashboard/mass-payout" component={DashboardMassPayout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const [location] = useLocation();

  // Strip language prefix from dashboard or admin paths
  const langDashboardMatch = location.match(/^\/(fr|en)(\/dashboard.*)/);
  if (langDashboardMatch) {
    return <Redirect to={langDashboardMatch[2]} />;
  }

  const langAdminMatch = location.match(/^\/(fr|en)(\/admin.*)/);
  if (langAdminMatch) {
    return <Redirect to={langAdminMatch[2]} />;
  }

  if (isAdminPath(location)) {
    return <AdminSwitch />;
  }

  if (isDashboardPath(location)) {
    return <DashboardSwitch />;
  }

  // Payment link public page — standalone, no layout wrapper
  const payMatch = location.match(/^\/(fr|en)\/pay\/(.+)/);
  if (payMatch) {
    return <PayPage />;
  }

  if (location.startsWith("/fr") || location.startsWith("/en")) {
    const lang: Lang = location.startsWith("/en") ? "en" : "fr";
    return (
      <LangProvider lang={lang}>
        <WouterRouter base={`/${lang}`}>
          <PublicSwitch />
        </WouterRouter>
      </LangProvider>
    );
  }

  const lang = detectLang();
  return <Redirect to={`/${lang}${location === "/" ? "" : location}`} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
