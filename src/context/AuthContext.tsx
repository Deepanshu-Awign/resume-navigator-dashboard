
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

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
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    console.log("AuthProvider initializing");
    
    // First set up auth state change listener to catch any auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        
        // Update session state
        setSession(newSession);
        
        if (newSession?.user) {
          console.log("User authenticated:", newSession.user.email);
          setUser(newSession.user);
          setIsAdmin(true);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUser(null);
          setIsAdmin(false);
          // Clear storage on signout
          localStorage.removeItem('mockUser');
          localStorage.removeItem('jobId');
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession?.user) {
          console.log("Found existing session for:", existingSession.user.email);
          setUser(existingSession.user);
          setSession(existingSession);
          setIsAdmin(true);
        } else {
          // Fallback to mockUser in localStorage for development
          const storedUser = localStorage.getItem('mockUser');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log("Using mock user from localStorage:", parsedUser.email);
              setUser(parsedUser);
              setIsAdmin(true);
            } catch (e) {
              console.error("Invalid stored user:", e);
              localStorage.removeItem('mockUser');
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

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("Login attempt for:", email);
    try {
      // Try Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // Fallback to mock auth for development
        if (email === 'admin@example.com' && password === 'password') {
          console.log("Using mock authentication");
          const mockUser = {
            id: '123',
            email: 'admin@example.com',
            role: 'admin',
            user_metadata: { name: 'Admin User' }
          };
          setUser(mockUser);
          setIsAdmin(true);
          localStorage.setItem('mockUser', JSON.stringify(mockUser));
          
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
        setSession(data.session);
        setIsAdmin(true);
        
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
      await supabase.auth.signOut();
      
      // Clear user state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      // Clear localStorage items
      localStorage.removeItem('mockUser');
      localStorage.removeItem('jobId');
      
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
