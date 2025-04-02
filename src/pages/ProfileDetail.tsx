
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import { updateProfileStatus } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ConfirmDialog from "@/components/ConfirmDialog";
import { PDFObject } from "@/components/PDFObject";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ProfileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
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
    
    // Convert Google Doc URL to PDF export URL if needed
    let downloadUrl = profile.pdfUrl;
    if (downloadUrl.includes('docs.google.com/document')) {
      downloadUrl = downloadUrl.replace('/edit?usp=sharing', '/export?format=pdf');
    }
    
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${profile.name}_resume.pdf`;
    link.target = "_blank"; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmAction = async () => {
    if (!profile || !profile.email || !confirmAction) return;
    
    setLoading(true);
    try {
      const status = confirmAction === "shortlist" ? "Shortlisted" : "Rejected";
      // Change from using profile.id to profile.email for Google Sheets
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
        
        if (hasMoreProfiles) {
          goToNextProfile();
        } else {
          toast({
            description: "No more resumes in this category.",
          });
          navigate(`/profiles/${activeCategory}`);
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
      <Header title="Resume Viewer" showBackButton backTo="/dashboard" />
      
      <div className="container mx-auto p-4 flex-1 flex flex-col">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-1">
          <div className="h-[calc(100vh-220px)] border border-gray-200 rounded-md overflow-hidden">
            <PDFObject url={profile.pdfUrl} />
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4">
        <div className="container mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between">
              <Button
                onClick={() => handleAction("reject")}
                variant="destructive"
                disabled={loading}
                className="w-[48%]"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleAction("shortlist")}
                variant="default"
                disabled={loading}
                className="w-[48%]"
              >
                Shortlist
              </Button>
            </div>
            
            <div className="flex justify-between">
              <Button
                onClick={goToPreviousProfile}
                variant="outline"
                disabled={!hasPreviousProfiles || loading}
                className="w-[48%]"
              >
                <ChevronLeft className="mr-1" /> Previous
              </Button>
              <Button
                onClick={goToNextProfile}
                variant="outline"
                disabled={!hasMoreProfiles || loading}
                className="w-[48%]"
              >
                Next <ChevronRight className="ml-1" />
              </Button>
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
