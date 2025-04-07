
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import Index from "./pages/Index";
import ProfileViewer from "./components/ProfileViewer";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <ProfileProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile/:id" element={<ProfileViewer />} />
              <Route path="/profiles/:category" element={<ProfileViewer />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Index />} />
            </Routes>
          </ProfileProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
