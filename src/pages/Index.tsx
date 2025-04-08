
import { useState, useEffect, useRef } from "react";
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
  const [processingJobId, setProcessingJobId] = useState(false);
  const fetchingRef = useRef(false);
  
  // Get context functions safely
  const { 
    setJobId, 
    fetchProfiles, 
    setActiveCategory, 
    profiles,
    profilesCache,
    clearProfiles,
    jobId: contextJobId
  } = useProfiles();

  // Process job ID from URL on component mount
  useEffect(() => {
    const processUrlJobId = async () => {
      if (jobIdFromUrl && !processingJobId && !fetchingRef.current) {
        console.log("Processing jobId from URL:", jobIdFromUrl);
        setProcessingJobId(true);
        fetchingRef.current = true;
        try {
          await processJobId(jobIdFromUrl);
        } catch (error) {
          console.error("Error processing URL jobId:", error);
        } finally {
          setProcessingJobId(false);
          fetchingRef.current = false;
        }
      }
    };
    
    processUrlJobId();
  }, [jobIdFromUrl]); 

  const processJobId = async (id: string) => {
    if (!id.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Job ID",
        variant: "destructive",
      });
      return;
    }
    
    // Check if already processing to prevent duplicate calls
    if (fetchingRef.current) {
      console.log("Already processing a job ID, skipping:", id);
      return;
    }
    
    setLoading(true);
    fetchingRef.current = true;
    console.log("Processing Job ID:", id);
    
    try {
      // First clear any existing profiles to prevent flash of old data
      clearProfiles();
      
      // Set the job ID in context
      console.log("Setting job ID in context:", id.trim());
      setJobId(id.trim());
      
      // Allow time for the state to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Then fetch profiles for this job ID - using await to ensure we get the results
      console.log("Starting profile fetch for:", id.trim());
      const result = await fetchProfiles();
      console.log("Profiles fetch completed, got:", result?.length || 0, "profiles");
      
      if (!result || result.length === 0) {
        console.log("No profiles found for Job ID:", id.trim());
        toast({
          title: "No profiles found",
          description: `No profiles were found for Job ID: ${id}. Please check the ID and try again.`,
          variant: "destructive",
        });
        fetchingRef.current = false;
        setLoading(false);
        return;
      }
      
      // Only proceed with navigation if we have profiles
      if (result.length > 0) {
        console.log("Found", result.length, "profiles, proceeding with navigation");
        // Set the active category to "pending" by default (renamed from "new")
        setActiveCategory("pending");
        
        // Get profiles and find the first one with "New" status
        const firstNewProfile = result.find(profile => profile.status === "New");
        
        if (firstNewProfile) {
          console.log("Navigating to first new profile:", firstNewProfile.id);
          // Navigate directly to the profile view page if we have a "New" status profile
          navigate(`/profile/${firstNewProfile.id}`);
        } else if (result.length > 0) {
          console.log("No new profiles found, navigating to first profile:", result[0].id);
          // Navigate to the first profile if no new profiles found
          navigate(`/profile/${result[0].id}`);
        }
      }
    } catch (error) {
      console.error("Error during profile processing:", error);
      toast({
        title: "Error",
        description: "Failed to fetch profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
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
                disabled={loading || processingJobId}
              >
                {loading || processingJobId ? "Loading..." : "Continue"}
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
