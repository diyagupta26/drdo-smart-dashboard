import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

// Auth pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// User pages
import UserDashboard from "@/pages/user/Dashboard";
import BookVenue from "@/pages/user/BookVenue";
import Bookings from "@/pages/user/Bookings";
import TrackStatus from "@/pages/user/TrackStatus";
import Feedback from "@/pages/user/Feedback";

// Admin pages
import DirectorApproval from "@/pages/admin/DirectorApproval";
import SecretaryApproval from "@/pages/admin/SecretaryApproval";
import ITSetup from "@/pages/admin/ITSetup";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Protected user routes */}
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <UserDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/user">
        <ProtectedRoute>
          <Layout>
            <UserDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/user/book">
        <ProtectedRoute>
          <Layout>
            <BookVenue />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/user/bookings">
        <ProtectedRoute>
          <Layout>
            <Bookings />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/user/track">
        <ProtectedRoute>
          <Layout>
            <TrackStatus />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/user/feedback">
        <ProtectedRoute>
          <Layout>
            <Feedback />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Protected admin routes */}
      <Route path="/director">
        <ProtectedRoute allowedRoles={['group_director']}>
          <Layout>
            <DirectorApproval />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/secretary">
        <ProtectedRoute allowedRoles={['secretary']}>
          <Layout>
            <SecretaryApproval />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/it">
        <ProtectedRoute allowedRoles={['it_team']}>
          <Layout>
            <ITSetup />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Fallback */}
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
