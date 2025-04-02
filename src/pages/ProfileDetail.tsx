
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import { updateProfileStatus } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ConfirmDialog from "@/components/ConfirmDialog";
import { PDFObject } from "@/components/PDFObject";

const ProfileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    jobId, 
    filteredProfiles, 
    currentProfileIndex, 
    activeCategory,
    goToNextProfile,
    hasMoreProfiles,
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
          const link = document.createElement('a');
          link.href = profile.pdfUrl;
          link.download = `${profile.name}_resume.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
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
      <Header title={profile.name} showBackButton backTo="/dashboard" />
      
      <div className="container mx-auto p-4 flex-1 flex flex-col">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-xl font-semibold mb-1">{profile.name}</h2>
          <p className="text-gray-600 mb-1">{profile.email}</p>
          <p className="text-sm text-gray-500">Job ID: {profile.jobId}</p>
          <div className="mt-2">
            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
              profile.status === "New" ? "bg-blue-100 text-blue-800" :
              profile.status === "Shortlisted" ? "bg-green-100 text-green-800" :
              "bg-red-100 text-red-800"
            }`}>
              {profile.status}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-1">
          <h3 className="text-lg font-medium mb-4">Resume Preview</h3>
          <div className="h-[60vh] border border-gray-200 rounded-md overflow-hidden">
            <PDFObject url={profile.pdfUrl} />
          </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between">
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
