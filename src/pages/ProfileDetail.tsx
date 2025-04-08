
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import { updateProfileStatus } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ConfirmDialog from "@/components/ConfirmDialog";
import { PDFObject } from "@/components/PDFObject";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ProfileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const { 
    jobId, 
    filteredProfiles, 
    currentProfileIndex,
    setCurrentProfileIndex, 
    activeCategory,
    goToNextProfile,
    goToPreviousProfile,
    hasMoreProfiles,
    hasPreviousProfiles,
    updateProfileStatusLocally
  } = useProfiles();

  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"shortlist" | "reject" | null>(null);

  // Get profile either from location state or find in filteredProfiles
  const profile = location.state?.profile || 
    filteredProfiles[currentProfileIndex] || 
    null;

  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

    if (!profile) {
      navigate(`/profiles/${activeCategory}`);
    }
  }, [jobId, profile, navigate, activeCategory]);

  const handleAction = async (action: "shortlist" | "reject") => {
    if (!profile || !profile.email) return;
    
    setConfirmAction(action);
  };

  const downloadResume = () => {
    if (!profile?.pdfUrl) return;
    
    // Create proper download URL for Google Docs or Google Drive
    let downloadUrl = profile.pdfUrl;
    
    if (downloadUrl.includes('docs.google.com/document')) {
      // Replace /edit or /preview with /export?format=pdf
      downloadUrl = downloadUrl.replace(/\/(edit|preview).*$/, '/export?format=pdf');
    }
    else if (downloadUrl.includes('drive.google.com/file/d/')) {
      // Extract file ID from Google Drive URL
      const fileIdMatch = downloadUrl.match(/\/d\/([^\/]+)\//);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        // Format for direct download
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    
    console.log("Downloading resume from URL:", downloadUrl);
    
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
          description: `Resume ${status.toLowerCase()} successfully.`,
        });
        
        if (confirmAction === "shortlist") {
          // Download PDF
          downloadResume();
        }
        
        // Find next new profile
        const newProfiles = filteredProfiles.filter(p => p.status === "New");
        const currentNewIndex = newProfiles.findIndex(p => p.id === profile.id);
        
        if (currentNewIndex < newProfiles.length - 1) {
          // There's another new profile after this one
          const nextNewProfile = newProfiles[currentNewIndex + 1];
          const nextIndexInFiltered = filteredProfiles.findIndex(p => p.id === nextNewProfile.id);
          
          setCurrentProfileIndex(nextIndexInFiltered);
          navigate(`/profile/${nextNewProfile.id}`, { state: { profile: nextNewProfile } });
        } else {
          // No more new profiles
          toast({
            description: "No more new resumes available.",
          });
          navigate(`/profiles/new`);
        }
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to update resume status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleNextProfile = () => {
    // Only navigate to profiles with "New" status
    const newProfiles = filteredProfiles.filter(p => p.status === "New");
    const currentNewIndex = newProfiles.findIndex(p => p.id === profile.id);
    
    if (currentNewIndex < newProfiles.length - 1) {
      const nextNewProfile = newProfiles[currentNewIndex + 1];
      const nextIndexInFiltered = filteredProfiles.findIndex(p => p.id === nextNewProfile.id);
      
      setCurrentProfileIndex(nextIndexInFiltered);
      navigate(`/profile/${nextNewProfile.id}`, { state: { profile: nextNewProfile } });
    }
  };

  const handlePreviousProfile = () => {
    // Only navigate to profiles with "New" status
    const newProfiles = filteredProfiles.filter(p => p.status === "New");
    const currentNewIndex = newProfiles.findIndex(p => p.id === profile.id);
    
    if (currentNewIndex > 0) {
      const prevNewProfile = newProfiles[currentNewIndex - 1];
      const prevIndexInFiltered = filteredProfiles.findIndex(p => p.id === prevNewProfile.id);
      
      setCurrentProfileIndex(prevIndexInFiltered);
      navigate(`/profile/${prevNewProfile.id}`, { state: { profile: prevNewProfile } });
    }
  };

  // Determine button states based on profile status and availability of new profiles
  const isShortlisted = profile?.status === "Shortlisted";
  const isRejected = profile?.status === "Rejected";
  
  // Check if there are more new profiles
  const newProfiles = filteredProfiles.filter(p => p.status === "New");
  const currentNewIndex = profile ? newProfiles.findIndex(p => p.id === profile.id) : -1;
  const hasMoreNewProfiles = currentNewIndex < newProfiles.length - 1;
  const hasPreviousNewProfiles = currentNewIndex > 0;

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Resume" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={`Resume: ${profile.name}`} showBackButton backTo="/dashboard" />
      
      <div className="container mx-auto p-4 flex-1 flex flex-col">
        {profile.status !== "New" && (
          <div className="mb-2 flex items-center justify-center">
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium 
              ${profile.status === "Shortlisted" ? "bg-green-100 text-green-800" : ""}
              ${profile.status === "Rejected" ? "bg-red-100 text-red-800" : ""}
            `}>
              Status: {profile.status}
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-1">
          <div className={`${isMobile ? 'h-[calc(100vh-280px)]' : 'h-[calc(100vh-220px)]'} border border-gray-200 rounded-md overflow-hidden relative`}>
            <PDFObject url={profile.pdfUrl} />
          </div>
        </div>

        {isMobile && (
          <div className="mb-16">
            <Button 
              onClick={downloadResume}
              variant="outline" 
              className="w-full mb-4" 
              disabled={loading}
            >
              <Download className="mr-2 h-4 w-4" /> Download Resume
            </Button>
          </div>
        )}
      </div>
      
      <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-md ${isMobile ? 'p-3 pb-6' : 'p-4'}`}>
        <div className="container mx-auto">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <Button
                onClick={() => handleAction("reject")}
                variant="destructive"
                disabled={loading || isRejected}
                className="w-[48%]"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleAction("shortlist")}
                variant="default"
                disabled={loading || isShortlisted}
                className="w-[48%]"
              >
                Shortlist
              </Button>
            </div>
            
            <div className="flex flex-col">
              <div className="flex justify-between">
                <Button
                  onClick={handlePreviousProfile}
                  variant="outline"
                  disabled={!hasPreviousNewProfiles || loading}
                  className="w-[48%]"
                >
                  <ChevronLeft className="mr-1" /> Previous
                </Button>
                <Button
                  onClick={handleNextProfile}
                  variant="outline"
                  disabled={!hasMoreNewProfiles || loading}
                  className="w-[48%]"
                >
                  Next <ChevronRight className="ml-1" />
                </Button>
              </div>
              
              {!hasMoreNewProfiles && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Last profile
                </p>
              )}
            </div>
          </div>
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
    </div>
  );
};

export default ProfileDetail;
