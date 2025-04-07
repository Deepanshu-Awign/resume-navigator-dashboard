
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import { updateProfileStatus } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { PDFObject } from "@/components/PDFObject";
import { Menu, User, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { logout } = useAuth();
  
  const { 
    jobId, 
    profiles,
    filteredProfiles, 
    currentProfileIndex,
    setCurrentProfileIndex, 
    activeCategory,
    setActiveCategory,
    goToNextProfile,
    goToPreviousProfile,
    hasMoreProfiles,
    hasPreviousProfiles,
    updateProfileStatusLocally
  } = useProfiles();

  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"shortlist" | "reject" | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get current profile or find by ID
  const profile = profiles.find(p => p.id === id) || filteredProfiles[currentProfileIndex] || null;
  
  // Get filtered profiles by tab/category
  const allProfiles = profiles;
  const newProfiles = profiles.filter(p => p.status === "New");
  const shortlistedProfiles = profiles.filter(p => p.status === "Shortlisted");
  const rejectedProfiles = profiles.filter(p => p.status === "Rejected");
  
  // Calculate pagination values
  const categoryProfiles = 
    activeCategory === "all" ? allProfiles :
    activeCategory === "new" ? newProfiles : 
    activeCategory === "shortlisted" ? shortlistedProfiles : 
    activeCategory === "rejected" ? rejectedProfiles : 
    profiles;
  
  const currentPage = categoryProfiles.findIndex(p => p.id === id) + 1;
  const totalPages = categoryProfiles.length;
  
  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

    if (!profile) {
      navigate(`/profiles/${activeCategory}`);
    }
  }, [jobId, profile, navigate, activeCategory]);
  
  const handleTabChange = (value: string) => {
    setActiveCategory(value as "all" | "new" | "shortlisted" | "rejected");
    
    const targetProfiles = 
      value === "all" ? allProfiles :
      value === "new" ? newProfiles : 
      value === "shortlisted" ? shortlistedProfiles : 
      value === "rejected" ? rejectedProfiles : 
      profiles;
    
    if (targetProfiles.length > 0) {
      navigate(`/profile/${targetProfiles[0].id}`);
    }
  };

  const handleAction = async (action: "shortlist" | "reject") => {
    if (!profile || !profile.email) return;
    setConfirmAction(action);
  };

  const downloadResume = () => {
    if (!profile?.pdfUrl) return;
    
    // Create proper download URL for Google Docs
    let downloadUrl = profile.pdfUrl;
    if (downloadUrl.includes('docs.google.com/document')) {
      // Replace /edit or /preview with /export?format=pdf
      downloadUrl = downloadUrl.replace(/\/(edit|preview).*$/, '/export?format=pdf');
    }
    
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${profile.name}_resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `${profile.name}'s resume is being downloaded.`,
    });
  };

  const handleConfirmAction = async () => {
    if (!profile || !profile.email || !confirmAction) return;
    
    setLoading(true);
    try {
      const status = confirmAction === "shortlist" ? "Shortlisted" : "Rejected";
      const success = await updateProfileStatus(profile.email, status);
      
      if (success) {
        updateProfileStatusLocally(profile.id, status);
        toast({
          title: "Success",
          description: `Profile ${status.toLowerCase()} successfully.`,
        });
        
        if (confirmAction === "shortlist") {
          // Download PDF
          downloadResume();
        }
        
        // Find next profile in the current category
        const currentCategoryProfiles = 
          activeCategory === "new" ? newProfiles.filter(p => p.id !== profile.id) : 
          activeCategory === "shortlisted" ? shortlistedProfiles : 
          activeCategory === "rejected" ? rejectedProfiles : 
          profiles;
        
        if (currentCategoryProfiles.length > 0) {
          navigate(`/profile/${currentCategoryProfiles[0].id}`);
        } else {
          // Navigate to category page when no more profiles in this category
          navigate(`/profiles/${activeCategory}`);
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
    const targetProfiles = 
      activeCategory === "all" ? allProfiles :
      activeCategory === "new" ? newProfiles : 
      activeCategory === "shortlisted" ? shortlistedProfiles : 
      activeCategory === "rejected" ? rejectedProfiles : 
      profiles;
    
    const currentIdx = targetProfiles.findIndex(p => p.id === profile?.id);
    
    if (direction === "next" && currentIdx < targetProfiles.length - 1) {
      navigate(`/profile/${targetProfiles[currentIdx + 1].id}`);
    } else if (direction === "prev" && currentIdx > 0) {
      navigate(`/profile/${targetProfiles[currentIdx - 1].id}`);
    }
  };

  const handlePageClick = (pageNum: number) => {
    const targetProfiles = 
      activeCategory === "all" ? allProfiles :
      activeCategory === "new" ? newProfiles : 
      activeCategory === "shortlisted" ? shortlistedProfiles : 
      activeCategory === "rejected" ? rejectedProfiles : 
      profiles;
    
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
    const totalPages = categoryProfiles.length;
    const currentPage = categoryProfiles.findIndex(p => p.id === id) + 1;
    
    // Previous button
    paginationItems.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => handleNavigate("prev")} 
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    // Page numbers logic
    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
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
      // Always show first page
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
      
      // Show ellipsis if current page is more than 3
      if (currentPage > 3) {
        paginationItems.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Calculate range around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      // Add range of numbers
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
      
      // Show ellipsis if current page is less than total-2
      if (currentPage < totalPages - 2) {
        paginationItems.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Always show last page
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
    
    // Next button
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

  // Determine button states based on profile status
  const isShortlisted = profile.status === "Shortlisted";
  const isRejected = profile.status === "Rejected";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
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
      
      {/* Tab Navigation */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4">
          <Tabs 
            value={activeCategory} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="shortlisted">Selected</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Action Buttons (Shortlist/Reject) */}
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
      
      {/* PDF Viewer */}
      <div className="container mx-auto px-4 flex-1 py-2">
        <div className="bg-gray-200 rounded-md overflow-hidden w-full" style={{ height: 'calc(100vh - 220px)' }}>
          <PDFObject url={profile.pdfUrl} />
        </div>
      </div>
      
      {/* Pagination */}
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
      
      {/* Confirmation Dialogs */}
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
