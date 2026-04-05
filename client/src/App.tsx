import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { WebsiteLogin } from "@/pages/WebsiteLogin";
import { Dashboard } from "@/pages/Dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { getCsrfToken } from "@/lib/csrf";

const Loader = () => (
  <div className="min-h-screen bg-[#fbfaee] flex items-center justify-center">
    <span className="text-[#495f84] [font-family:'Manrope',Helvetica]">Loading...</span>
  </div>
);

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Redirect to="/" />;
  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (isAuthenticated) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  useEffect(() => {
    // Initialize CSRF token on app load
    getCsrfToken();
  }, []);

  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={WebsiteLogin} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
