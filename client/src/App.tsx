import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";

import Home from "@/pages/Home";
import Booking from "@/pages/Booking";
import Auth from "@/pages/Auth";
import Customer from "@/pages/Customer";
import Admin from "@/pages/Admin";
import Checkout from "@/pages/Checkout";
import PaymentMethod from "@/pages/PaymentMethod";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/booking" component={Booking} />
      <Route path="/auth" component={Auth} />
      <Route path="/customer" component={Customer} />
      <Route path="/admin" component={Admin} />
      <Route path="/checkout/:bookingId" component={Checkout} />
      <Route path="/payment" component={PaymentMethod} />
      <Route path="/contact" component={Contact} />
      <Route path="/blog" component={Blog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="hotel-theme">
        <TooltipProvider>
          <Layout>
            <Router />
          </Layout>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
