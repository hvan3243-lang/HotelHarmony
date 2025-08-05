import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authManager } from "@/lib/auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";

import { WebsiteChatbot } from "@/components/WebsiteChatbot";
import Admin from "@/pages/Admin";
import Auth from "@/pages/AuthTranslated";
import Blog from "@/pages/Blog";
import Booking from "@/pages/Booking";
import CheckIn from "@/pages/CheckIn";
import Checkout from "@/pages/Checkout";
import Contact from "@/pages/Contact";
import Customer from "@/pages/Customer";
import Home from "@/pages/Home";
import PaymentMethod from "@/pages/PaymentMethod";
import ReviewForm from "@/pages/ReviewForm";
import Settings from "@/pages/Settings";
import WalkInBooking from "@/pages/WalkInBooking";
import NotFound from "@/pages/not-found";

function Router() {
  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userParam = urlParams.get("user");

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        authManager.login(user, token);

        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Refresh page to update auth state
        window.location.reload();
      } catch (error) {
        console.error("Error processing Google OAuth callback:", error);
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
          <WebsiteChatbot />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
