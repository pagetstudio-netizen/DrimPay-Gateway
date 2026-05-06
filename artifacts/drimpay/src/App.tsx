import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

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
import DocPayin from "@/pages/dashboard/docs/payin";
import DocPayout from "@/pages/dashboard/docs/payout";
import DocVirtualCards from "@/pages/dashboard/docs/virtual-cards";
import DocCredits from "@/pages/dashboard/docs/credits";
import DocMassPayout from "@/pages/dashboard/docs/mass-payout";

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

function Router() {
  const [location] = useLocation();

  if (isDashboardPath(location)) {
    return (
      <Switch>
        <Route path="/dashboard" component={DashboardOverview} />
        <Route path="/dashboard/wallets" component={DashboardWallets} />
        <Route path="/dashboard/payments" component={DashboardPayments} />
        <Route path="/dashboard/reversement" component={DashboardReversement} />
        <Route path="/dashboard/api-keys" component={DashboardApiKeys} />
        <Route path="/dashboard/kyb" component={DashboardKyb} />
        <Route path="/dashboard/docs/payin" component={DocPayin} />
        <Route path="/dashboard/docs/payout" component={DocPayout} />
        <Route path="/dashboard/docs/virtual-cards" component={DocVirtualCards} />
        <Route path="/dashboard/docs/credits" component={DocCredits} />
        <Route path="/dashboard/docs/mass-payout" component={DocMassPayout} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
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
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
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
