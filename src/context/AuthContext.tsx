
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, signIn, signOut } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

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
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAdmin(!!currentUser);
          // Store mock user in sessionStorage for persistence
          sessionStorage.setItem('mockUser', JSON.stringify(currentUser));
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    // Check for existing user on mount
    const storedUser = sessionStorage.getItem('mockUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAdmin(true);
        setLoading(false);
      } catch (e) {
        console.error("Error parsing stored user:", e);
        sessionStorage.removeItem('mockUser');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    
    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user } = await signIn(email, password);
      setUser(user);
      setIsAdmin(true);
      // Store mock user in sessionStorage for persistence
      sessionStorage.setItem('mockUser', JSON.stringify(user));
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      return true;
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
      await signOut();
      setUser(null);
      setIsAdmin(false);
      
      // Remove mock user from sessionStorage
      sessionStorage.removeItem('mockUser');
      
      // Clear job ID from localStorage to fully reset the app state
      localStorage.removeItem('jobId');
      
      // Force navigation to home page after logout
      window.location.href = '/';
      
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
