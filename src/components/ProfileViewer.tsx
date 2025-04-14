
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import { updateProfileStatus } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { PDFObject } from "@/components/PDFObject";
import { Menu, User, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

const ProfileViewer = () => {
  const { id, category } = useParams<{ id: string; category: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { logout } = useAuth();
  
  const { 
    jobId, 
    profiles,
    filteredProfiles, 
    currentProfileIndex,
    activeCategory,
    setActiveCategory,
    goToNextProfile,
    goToPreviousProfile,
    hasMoreProfiles,
    hasPreviousProfiles,
    updateProfileStatusLocally,
    stats
  } = useProfiles();

  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"shortlist" | "reject" | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

    if (category && !id) {
      setActiveCategory(category as "all" | "pending" | "shortlisted" | "rejected");
      
      const categoryProfiles = getCategoryProfiles(category);
      if (categoryProfiles.length > 0) {
        navigate(`/profile/${categoryProfiles[0].id}`);
      }
    }
  }, [jobId, id, category, navigate]);
  
  const profile = id 
    ? profiles.find(p => p.id === id) 
    : filteredProfiles[currentProfileIndex] || null;
  
  const pendingProfiles = profiles.filter(p => p.status === "New");
  const shortlistedProfiles = profiles.filter(p => p.status === "Shortlisted");
  const rejectedProfiles = profiles.filter(p => p.status === "Rejected");
  
  const getCategoryProfiles = (cat: string | undefined) => {
    switch (cat) {
      case "pending": return pendingProfiles;
      case "shortlisted": return shortlistedProfiles;
      case "rejected": return rejectedProfiles;
      default: return filteredProfiles;
    }
  };
  
  const categoryProfiles = getCategoryProfiles(activeCategory);
  const currentPage = profile ? categoryProfiles.findIndex(p => p.id === profile.id) + 1 : 0;
  const totalPages = categoryProfiles.length;
  
  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

    if (!profile && profiles.length > 0) {
      const catProfiles = getCategoryProfiles(activeCategory);
      if (catProfiles.length > 0) {
        navigate(`/profile/${catProfiles[0].id}`);
      } else if (profiles.length > 0) {
        if (pendingProfiles.length > 0) {
          setActiveCategory("pending");
          navigate(`/profile/${pendingProfiles[0].id}`);
        } else if (shortlistedProfiles.length > 0) {
          setActiveCategory("shortlisted");
          navigate(`/profile/${shortlistedProfiles[0].id}`);
        } else if (rejectedProfiles.length > 0) {
          setActiveCategory("rejected");
          navigate(`/profile/${rejectedProfiles[0].id}`);
        }
      } else {
        navigate("/");
      }
    }
  }, [profile, profiles, jobId, navigate, activeCategory]);
  
  const handleTabChange = (value: string) => {
    setActiveCategory(value as "pending" | "shortlisted" | "rejected");
    
    const targetProfiles = getCategoryProfiles(value);
    
    if (targetProfiles.length > 0) {
      navigate(`/profile/${targetProfiles[0].id}`);
    }
  };

  const handleAction = async (action: "shortlist" | "reject") => {
    if (!profile || !profile.email) return;
    setConfirmAction(action);
  };

  const handleConfirmAction = async () => {
    if (!profile || !profile.id || !confirmAction) return;
    
    setLoading(true);
    try {
      const status = confirmAction === "shortlist" ? "Shortlisted" : "Rejected";
      const success = await updateProfileStatus(profile.id, status);
      
      if (success) {
        updateProfileStatusLocally(profile.id, status);
        toast({
          title: "Success",
          description: `Profile ${status.toLowerCase()} successfully.`,
        });
        
        const currentCatProfiles = getCategoryProfiles(activeCategory);
        const filteredProfiles = currentCatProfiles.filter(p => p.id !== profile.id);
        
        if (filteredProfiles.length > 0) {
          navigate(`/profile/${filteredProfiles[0].id}`);
        } else {
          if (pendingProfiles.length > 0 && activeCategory !== "pending") {
            setActiveCategory("pending");
            navigate(`/profile/${pendingProfiles[0].id}`);
          } else if (shortlistedProfiles.length > 0 && activeCategory !== "shortlisted") {
            setActiveCategory("shortlisted");
            navigate(`/profile/${shortlistedProfiles[0].id}`);
          } else if (rejectedProfiles.length > 0 && activeCategory !== "rejected") {
            setActiveCategory("rejected");
            navigate(`/profile/${rejectedProfiles[0].id}`);
          } else {
            navigate("/");
          }
        }
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleNavigate = (direction: "next" | "prev") => {
    const targetProfiles = getCategoryProfiles(activeCategory);
    const currentIdx = profile ? targetProfiles.findIndex(p => p.id === profile.id) : -1;
    
    if (direction === "next" && currentIdx < targetProfiles.length - 1) {
      navigate(`/profile/${targetProfiles[currentIdx + 1].id}`);
    } else if (direction === "prev" && currentIdx > 0) {
      navigate(`/profile/${targetProfiles[currentIdx - 1].id}`);
    }
  };

  const handlePageClick = (pageNum: number) => {
    const targetProfiles = getCategoryProfiles(activeCategory);
    
    if (pageNum >= 1 && pageNum <= targetProfiles.length) {
      navigate(`/profile/${targetProfiles[pageNum - 1].id}`);
    }
  };

  const handleLogout = () => {
    setLogoutConfirm(true);
  };
  
  const confirmLogout = () => {
    logout();
    navigate("/");
    setLogoutConfirm(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-lg text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const renderPagination = () => {
    const paginationItems = [];
    const currentPage = categoryProfiles.findIndex(p => p.id === profile.id) + 1;
    
    paginationItems.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => handleNavigate("prev")} 
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        paginationItems.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => handlePageClick(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      paginationItems.push(
        <PaginationItem key={1}>
          <PaginationLink 
            onClick={() => handlePageClick(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (currentPage > 3) {
        paginationItems.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        paginationItems.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => handlePageClick(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      if (currentPage < totalPages - 2) {
        paginationItems.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      paginationItems.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            onClick={() => handlePageClick(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    paginationItems.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => handleNavigate("next")} 
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    return <PaginationContent>{paginationItems}</PaginationContent>;
  };

  const isShortlisted = profile.status === "Shortlisted";
  const isRejected = profile.status === "Rejected";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Awign Experts</h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <div className="border-b bg-white sticky top-14 z-10">
        <div className="container mx-auto px-4">
          <Tabs 
            value={activeCategory} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex">
                <span>Pending</span>
                <span className="text-xs ml-2 font-normal">({stats.new})</span>
              </TabsTrigger>
              <TabsTrigger value="shortlisted" className="flex">
                <span>Selected</span>
                <span className="text-xs ml-2 font-normal">({stats.shortlisted})</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex">
                <span>Rejected</span>
                <span className="text-xs ml-2 font-normal">({stats.rejected})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-3 flex justify-between">
        <Button 
          variant="destructive" 
          onClick={() => handleAction("reject")}
          disabled={loading || isRejected}
          className="w-[48%]"
        >
          {isRejected ? "Rejected" : "Reject"}
        </Button>
        <Button 
          variant="default" 
          className="w-[48%] bg-green-500 hover:bg-green-600"
          onClick={() => handleAction("shortlist")}
          disabled={loading || isShortlisted}
        >
          {isShortlisted ? "Shortlisted" : "Shortlist"}
        </Button>
      </div>
      
      <div className="container mx-auto px-4 flex-1 py-2">
        <div className="bg-gray-200 rounded-md overflow-hidden w-full" style={{ height: 'calc(100vh - 220px)' }}>
          <PDFObject url={profile.pdfUrl} />
        </div>
      </div>
      
      <div className="sticky bottom-0 bg-white border-t shadow-md py-3">
        <div className="container mx-auto px-4">
          <Pagination className="justify-center">
            {renderPagination()}
          </Pagination>
          {currentPage >= totalPages && totalPages > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Last profile
            </p>
          )}
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={`Confirm ${confirmAction === "shortlist" ? "Shortlist" : "Reject"}`}
        description={`Are you sure you want to ${confirmAction === "shortlist" ? "shortlist" : "reject"} this candidate?`}
        confirmLabel={confirmAction === "shortlist" ? "Yes, Shortlist" : "Yes, Reject"}
      />
      
      <ConfirmDialog
        isOpen={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        description="Are you sure you want to logout?"
        confirmLabel="Yes, Logout"
      />
    </div>
  );
};

export default ProfileViewer;
