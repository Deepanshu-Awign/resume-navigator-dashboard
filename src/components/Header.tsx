
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
}

const Header = ({ title, showBackButton = false, backTo }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={goBack}
              className="mr-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              <span className="sr-only">Back</span>
            </Button>
          )}
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-brand-600">
                Dashboard
              </Link>
              <Link to="/admin/dashboard" className="text-gray-700 hover:text-brand-600">
                Admin
              </Link>
              <Button variant="outline" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Link to="/" className="text-gray-700 hover:text-brand-600">
              Home
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white p-4 border-t border-gray-200">
          <ul className="space-y-4">
            {user ? (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className="block py-2 text-gray-700 hover:text-brand-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/dashboard"
                    className="block py-2 text-gray-700 hover:text-brand-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                </li>
                <li>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  to="/"
                  className="block py-2 text-gray-700 hover:text-brand-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;
