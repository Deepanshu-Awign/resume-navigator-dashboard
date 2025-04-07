
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get("jobId");
  
  const [jobIdInput, setJobIdInput] = useState(jobIdFromUrl || "");
  const [loading, setLoading] = useState(false);
  
  // Get context functions safely
  const profileContext = useProfiles();
  const { setJobId, fetchProfiles, setActiveCategory } = profileContext;

  // Process job ID from URL on component mount
  useEffect(() => {
    if (jobIdFromUrl) {
      console.log("Found jobId in URL:", jobIdFromUrl);
      processJobId(jobIdFromUrl);
    }
  }, [jobIdFromUrl]);  // Added jobIdFromUrl as a dependency

  const processJobId = async (id: string) => {
    if (!id.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Job ID",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setJobId(id.trim());
    
    try {
      const result = await fetchProfiles();
      console.log("Profiles fetched:", result);
      
      // Set the active category to "new" by default
      setActiveCategory("new");
      
      // Get profiles and find the first one with "New" status
      const firstNewProfile = profileContext.profiles.find(profile => profile.status === "New");
      
      if (firstNewProfile) {
        // Navigate directly to the profile view page if we have a "New" status profile
        navigate(`/profile/${firstNewProfile.id}`);
      } else if (profileContext.profiles.length > 0) {
        // Navigate to the first profile if no new profiles found
        navigate(`/profile/${profileContext.profiles[0].id}`);
      } else {
        // No profiles found, show error toast
        toast({
          title: "No profiles found",
          description: "No profiles were found for this Job ID.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processJobId(jobIdInput);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Resume Navigator</CardTitle>
            <CardDescription className="text-center">
              Enter a Job ID to view and manage candidate profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter Job ID"
                  value={jobIdInput}
                  onChange={(e) => setJobIdInput(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Loading..." : "Continue"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>Or <a href="/admin" className="text-blue-600 hover:underline">login as admin</a></p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
