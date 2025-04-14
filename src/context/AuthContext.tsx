
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, signIn, signOut } from "@/services/api";
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
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        if (session?.user) {
          setUser(session.user);
          setIsAdmin(true);
          // Store mock user in sessionStorage for persistence
          sessionStorage.setItem('mockUser', JSON.stringify(session.user));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
          // Remove mock user from sessionStorage
          sessionStorage.removeItem('mockUser');
          // Clear job ID from localStorage for full reset
          localStorage.removeItem('jobId');
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        // First, check Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Session found in Supabase:", session.user.email);
          setUser(session.user);
          setIsAdmin(true);
          sessionStorage.setItem('mockUser', JSON.stringify(session.user));
        } else {
          // Fallback to our mock authentication
          const storedUser = sessionStorage.getItem('mockUser');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log("Session found in sessionStorage:", parsedUser.email);
              setUser(parsedUser);
              setIsAdmin(true);
            } catch (e) {
              console.error("Error parsing stored user:", e);
              sessionStorage.removeItem('mockUser');
            }
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Try to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // If Supabase auth fails, fall back to mock auth for development
        if (email === 'admin@example.com' && password === 'password') {
          const mockUser = {
            id: '123',
            email: 'admin@example.com',
            role: 'admin',
            user_metadata: { name: 'Admin User' }
          };
          setUser(mockUser);
          setIsAdmin(true);
          sessionStorage.setItem('mockUser', JSON.stringify(mockUser));
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
        setUser(data.user);
        setIsAdmin(true);
        sessionStorage.setItem('mockUser', JSON.stringify(data.user));
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        return true;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login. Please check your credentials.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear user state
      setUser(null);
      setIsAdmin(false);
      
      // Remove mock user from sessionStorage
      sessionStorage.removeItem('mockUser');
      
      // Clear job ID from localStorage to fully reset the app state
      localStorage.removeItem('jobId');
      
      toast({
        title: "Success",
        description: "Logged out successfully!",
      });
    } catch (error: any) {
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
