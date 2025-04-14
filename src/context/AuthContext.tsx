
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    console.log("=== AUTH PROVIDER INITIALIZATION ===");
    
    // First check for existing session
    const initializeAuth = async () => {
      console.log("Initializing auth - checking for existing session");
      try {
        // Check Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log("Supabase session check result:", session ? "Session found" : "No session found");
        
        if (session?.user) {
          console.log("Valid Supabase session found:", session.user.email);
          setUser(session.user);
          setIsAdmin(true);
          localStorage.setItem('mockUser', JSON.stringify(session.user));
          console.log("User state set from Supabase session");
        } else {
          // Fallback to our mock authentication
          console.log("No Supabase session, checking localStorage for mockUser");
          const storedUser = localStorage.getItem('mockUser');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log("Mock user found in localStorage:", parsedUser.email);
              setUser(parsedUser);
              setIsAdmin(true);
              console.log("User state set from localStorage mockUser");
            } catch (e) {
              console.error("Error parsing stored user:", e);
              localStorage.removeItem('mockUser');
              console.log("Removed invalid mockUser from localStorage");
            }
          } else {
            console.log("No mockUser found in localStorage");
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
        console.log("Auth initialization completed, loading set to false");
      }
    };

    initializeAuth();

    // Set up the auth state listener AFTER checking for existing session
    console.log("Setting up Supabase auth state change listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        if (session?.user) {
          console.log("Setting user from auth state change event");
          setUser(session.user);
          setIsAdmin(true);
          // Store mock user in localStorage for persistence
          localStorage.setItem('mockUser', JSON.stringify(session.user));
          console.log("Updated mockUser in localStorage");
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing user state");
          setUser(null);
          setIsAdmin(false);
          // Remove mock user from localStorage
          localStorage.removeItem('mockUser');
          console.log("Removed mockUser from localStorage");
          // Clear job ID from localStorage for full reset
          localStorage.removeItem('jobId');
          console.log("Removed jobId from localStorage");
        }
      }
    );

    return () => {
      console.log("Auth provider unmounting, unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("Login attempt for:", email);
    try {
      // Try to sign in with Supabase
      console.log("Attempting Supabase authentication");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.log("Supabase auth failed, error:", error.message);
        
        // If Supabase auth fails, fall back to mock auth for development
        if (email === 'admin@example.com' && password === 'password') {
          console.log("Using mock authentication for admin@example.com");
          const mockUser = {
            id: '123',
            email: 'admin@example.com',
            role: 'admin',
            user_metadata: { name: 'Admin User' }
          };
          setUser(mockUser);
          setIsAdmin(true);
          localStorage.setItem('mockUser', JSON.stringify(mockUser));
          console.log("Mock user stored in localStorage");
          toast({
            title: "Success",
            description: "Logged in successfully with mock account!",
          });
          return true;
        } else {
          throw error;
        }
      } else {
        // Supabase auth succeeded
        console.log("Supabase auth succeeded for:", data.user?.email);
        setUser(data.user);
        setIsAdmin(true);
        localStorage.setItem('mockUser', JSON.stringify(data.user));
        console.log("User stored in localStorage");
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        return true;
      }
    } catch (error: any) {
      console.error("Login error:", error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to login. Please check your credentials.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    console.log("Logout initiated");
    try {
      // Sign out from Supabase
      console.log("Signing out from Supabase");
      await supabase.auth.signOut();
      
      // Clear user state
      console.log("Clearing user state");
      setUser(null);
      setIsAdmin(false);
      
      // Remove mock user from localStorage
      console.log("Removing mockUser from localStorage");
      localStorage.removeItem('mockUser');
      
      // Clear job ID from localStorage to fully reset the app state
      console.log("Removing jobId from localStorage");
      localStorage.removeItem('jobId');
      
      console.log("Logout completed successfully");
      toast({
        title: "Success",
        description: "Logged out successfully!",
      });
    } catch (error: any) {
      console.error("Logout error:", error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to logout.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
