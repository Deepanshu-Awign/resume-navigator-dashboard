import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import { updateProfileStatus, downloadResume as downloadResumeFile } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ConfirmDialog from "@/components/ConfirmDialog";
import { PDFObject } from "@/components/PDFObject";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ProfileDetail = () => {
  console.log("=== PROFILE DETAIL PAGE MOUNTED ===");
  const { id } = useParams<{ id: string }>();
  console.log("Profile Detail - Profile ID from URL:", id);
  
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

  console.log("Profile Detail - Current JobID:", jobId);
  console.log("Profile Detail - Filtered Profiles Count:", filteredProfiles.length);
  console.log("Profile Detail - Current Profile Index:", currentProfileIndex);
  
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"shortlist" | "reject" | null>(null);

  const profile = location.state?.profile || 
    filteredProfiles[currentProfileIndex] || 
    null;
    
  console.log("Profile Detail - Current Profile:", profile ? `${profile.name} (${profile.email})` : "No profile found");
  if (profile) {
    console.log("Profile Detail - PDF URL:", profile.pdfUrl);
  }

  useEffect(() => {
    console.log("Profile Detail - Checking JobID:", jobId);
    if (!jobId) {
      console.log("No JobID found, redirecting to home");
      navigate("/");
      return;
    }

    if (!profile) {
      console.log("No profile found, redirecting to profiles list");
      navigate(`/profiles/${activeCategory}`);
    }
  }, [jobId, profile, navigate, activeCategory]);

  const handleAction = async (action: "shortlist" | "reject") => {
    console.log(`Profile Detail - Handling ${action} action`);
    if (!profile || !profile.email) {
      console.log("No profile or email found, cannot perform action");
      return;
    }
    
    setConfirmAction(action);
  };

  const downloadResume = () => {
    console.log("Downloading resume");
    if (!profile?.pdfUrl) {
      console.log("No PDF URL found");
      toast({
        title: "Error",
        description: "No resume URL available for download.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Calling downloadResumeFile with URL:", profile.pdfUrl);
    downloadResumeFile(profile);
    
    toast({
      title: "Download started",
      description: `${profile.name}'s resume is being downloaded.`,
    });
  };

  const handleConfirmAction = async () => {
    console.log(`Profile Detail - Confirming ${confirmAction} action`);
    if (!profile || !profile.id || !confirmAction) {
      console.log("Missing profile, ID, or action, cannot confirm");
      return;
    }
    
    setLoading(true);
    try {
      const status = confirmAction === "shortlist" ? "Shortlisted" : "Rejected";
      console.log(`Updating profile ${profile.id} status to ${status}`);
      const success = await updateProfileStatus(profile.id, status);
      
      if (success) {
        console.log("Status update successful, updating locally");
        updateProfileStatusLocally(profile.id, status);
        toast({
          title: "Success",
          description: `Resume ${status.toLowerCase()} successfully.`,
        });
        
        if (confirmAction === "shortlist") {
          console.log("Shortlisted, downloading resume");
          downloadResume();
        }
        
        const newProfiles = filteredProfiles.filter(p => p.status === "New");
        const currentNewIndex = profile ? newProfiles.findIndex(p => p.id === profile.id) : -1;
        const hasMoreNewProfiles = currentNewIndex < newProfiles.length - 1;
        const hasPreviousNewProfiles = currentNewIndex > 0;
        
        console.log("New profiles remaining:", newProfiles.length);
        console.log("Current index in new profiles:", currentNewIndex);
        console.log("Has more new profiles:", hasMoreNewProfiles);
        
        if (currentNewIndex < newProfiles.length - 1) {
          const nextNewProfile = newProfiles[currentNewIndex + 1];
          const nextIndexInFiltered = filteredProfiles.findIndex(p => p.id === nextNewProfile.id);
          
          console.log("Navigating to next new profile:", nextNewProfile.id);
          setCurrentProfileIndex(nextIndexInFiltered);
          navigate(`/profile/${nextNewProfile.id}`, { state: { profile: nextNewProfile } });
        } else {
          console.log("No more new profiles, navigating to profiles list");
          toast({
            description: "No more new resumes available.",
          });
          navigate(`/profiles/new`);
        }
      } else {
        console.log("Status update failed");
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
    const newProfiles = filteredProfiles.filter(p => p.status === "New");
    const currentNewIndex = newProfiles.findIndex(p => p.id === profile.id);
    
    if (currentNewIndex > 0) {
      const prevNewProfile = newProfiles[currentNewIndex - 1];
      const prevIndexInFiltered = filteredProfiles.findIndex(p => p.id === prevNewProfile.id);
      
      setCurrentProfileIndex(prevIndexInFiltered);
      navigate(`/profile/${prevNewProfile.id}`, { state: { profile: prevNewProfile } });
    }
  };

  const isShortlisted = profile?.status === "Shortlisted";
  const isRejected = profile?.status === "Rejected";
  
  const newProfiles = filteredProfiles.filter(p => p.status === "New");
  const currentNewIndex = profile ? newProfiles.findIndex(p => p.id === profile.id) : -1;
  const hasMoreNewProfiles = currentNewIndex < newProfiles.length - 1;
  const hasPreviousNewProfiles = currentNewIndex > 0;

  if (!profile) {
    console.log("Rendering loading state - no profile found");
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Resume" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  console.log("Rendering profile detail view for:", profile.name);
  
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
                disabled={loading || profile.status === "Rejected"}
                className="w-[48%]"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleAction("shortlist")}
                variant="default"
                disabled={loading || profile.status === "Shortlisted"}
                className="w-[48%]"
              >
                Shortlist
              </Button>
            </div>
            
            <div className="flex flex-col">
              <div className="flex justify-between">
                <Button
                  onClick={() => {
                    console.log("Navigating to previous profile");
                    const newProfiles = filteredProfiles.filter(p => p.status === "New");
                    const currentNewIndex = profile ? newProfiles.findIndex(p => p.id === profile.id) : -1;
                    
                    if (currentNewIndex > 0) {
                      const prevNewProfile = newProfiles[currentNewIndex - 1];
                      const prevIndexInFiltered = filteredProfiles.findIndex(p => p.id === prevNewProfile.id);
                      
                      setCurrentProfileIndex(prevIndexInFiltered);
                      navigate(`/profile/${prevNewProfile.id}`, { state: { profile: prevNewProfile } });
                    }
                  }}
                  variant="outline"
                  disabled={!hasPreviousProfiles || loading}
                  className="w-[48%]"
                >
                  <ChevronLeft className="mr-1" /> Previous
                </Button>
                <Button
                  onClick={() => {
                    console.log("Navigating to next profile");
                    const newProfiles = filteredProfiles.filter(p => p.status === "New");
                    const currentNewIndex = newProfiles.findIndex(p => p.id === profile.id);
                    
                    if (currentNewIndex < newProfiles.length - 1) {
                      const nextNewProfile = newProfiles[currentNewIndex + 1];
                      const nextIndexInFiltered = filteredProfiles.findIndex(p => p.id === nextNewProfile.id);
                      
                      setCurrentProfileIndex(nextIndexInFiltered);
                      navigate(`/profile/${nextNewProfile.id}`, { state: { profile: nextNewProfile } });
                    }
                  }}
                  variant="outline"
                  disabled={!hasMoreProfiles || loading}
                  className="w-[48%]"
                >
                  Next <ChevronRight className="ml-1" />
                </Button>
              </div>
              
              {!hasMoreProfiles && (
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
