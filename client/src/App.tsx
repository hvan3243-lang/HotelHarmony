import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { authManager } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";

import Home from "@/pages/Home";
import Booking from "@/pages/Booking";
import Auth from "@/pages/AuthTranslated";
import Customer from "@/pages/Customer";
import Admin from "@/pages/Admin";
import Checkout from "@/pages/Checkout";
import PaymentMethod from "@/pages/PaymentMethod";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import WalkInBooking from "@/pages/WalkInBooking";
import CheckIn from "@/pages/CheckIn";
import Settings from "@/pages/Settings";
import ReviewForm from "@/pages/ReviewForm";
import NotFound from "@/pages/not-found";

function Router() {
  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        authManager.login(user, token);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Refresh page to update auth state
        window.location.reload();
      } catch (error) {
        console.error('Error processing Google OAuth callback:', error);
      }
    }
  }, []);

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
      <Route path="/walkin-booking" component={WalkInBooking} />
      <Route path="/checkin" component={CheckIn} />
      <Route path="/settings" component={Settings} />
      <Route path="/review/:bookingId" component={ReviewForm} />
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
