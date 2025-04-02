
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
        setUser(currentUser);
        setIsAdmin(!!currentUser);
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user } = await signIn(email, password);
      setUser(user);
      setIsAdmin(true);
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
