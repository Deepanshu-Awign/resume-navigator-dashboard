
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  console.log("=== PROTECTED ROUTE CHECK ===");
  const { user, loading } = useAuth();

  console.log("Protected Route - Auth state:", user ? "Authenticated" : "Not authenticated");
  console.log("Protected Route - Loading state:", loading);

  useEffect(() => {
    console.log("Protected Route - User:", user?.email || "No user");
    console.log("Protected Route - Loading:", loading);
    
    if (loading) {
      console.log("Protected Route - Still loading auth state");
    } else if (!user) {
      console.log("Protected Route - No user, should redirect to login");
    } else {
      console.log("Protected Route - Auth verified, allowing access");
    }
  }, [user, loading]);

  if (loading) {
    console.log("Protected Route - Rendering loading state");
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    console.log("Protected Route - Redirecting to /admin login page");
    return <Navigate to="/admin" replace />;
  }

  console.log("Protected Route - Rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
