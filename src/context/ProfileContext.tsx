import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { ResumeProfile, JobStats } from "@/types";
import { fetchProfilesFromGoogleSheets, fetchProfilesFromSupabase } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface ProfileContextType {
  jobId: string;
  setJobId: (id: string) => void;
  profiles: ResumeProfile[];
  fetchProfiles: () => Promise<ResumeProfile[]>;
  loading: boolean;
  stats: JobStats;
  activeCategory: "all" | "pending" | "shortlisted" | "rejected";
  setActiveCategory: (category: "all" | "pending" | "shortlisted" | "rejected") => void;
  filteredProfiles: ResumeProfile[];
  currentProfileIndex: number;
  setCurrentProfileIndex: (index: number) => void;
  goToNextProfile: () => void;
  goToPreviousProfile: () => void;
  hasMoreProfiles: boolean;
  hasPreviousProfiles: boolean;
  resetProfileIndex: () => void;
  updateProfileStatusLocally: (id: string, status: "Shortlisted" | "Rejected") => void;
  profilesCache: Record<string, ResumeProfile[]>;
  clearProfiles: () => void;
  fetchInProgress: Record<string, boolean>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfiles must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  console.log("=== PROFILE PROVIDER INITIALIZATION ===");
  const { user } = useAuth();
  
  const [jobId, setJobIdState] = useState<string>("");
  const jobIdRef = useRef<string>("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  const [profiles, setProfiles] = useState<ResumeProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "pending" | "shortlisted" | "rejected">("pending");
  const [currentProfileIndex, setCurrentProfileIndex] = useState<number>(0);
  const [profilesCache, setProfilesCache] = useState<Record<string, ResumeProfile[]>>({});
  const [fetchInProgress, setFetchInProgress] = useState<Record<string, boolean>>({});

  const setJobId = useCallback((id: string) => {
    console.log("Setting jobId:", id);
    jobIdRef.current = id;
    setJobIdState(id);
    
    if (id) {
      console.log("Storing jobId in localStorage:", id);
      localStorage.setItem("jobId", id);
    }
  }, []);

  useEffect(() => {
    console.log("ProfileProvider mounted, checking for saved jobId");
    const savedJobId = localStorage.getItem("jobId");
    console.log("Initial jobId from localStorage:", savedJobId);
    
    if (savedJobId) {
      console.log("Using saved jobId from localStorage:", savedJobId);
      setJobId(savedJobId);
    }
    
    console.log("Initial load complete");
    setInitialLoadDone(true);
  }, [setJobId]);

  const stats: JobStats = {
    all: profiles.length,
    new: profiles.filter(p => p.status === "New").length,
    shortlisted: profiles.filter(p => p.status === "Shortlisted").length,
    rejected: profiles.filter(p => p.status === "Rejected").length
  };

  const filteredProfiles = profiles.filter(profile => {
    if (activeCategory === "all") return true;
    if (activeCategory === "pending") return profile.status === "New";
    if (activeCategory === "shortlisted") return profile.status === "Shortlisted";
    if (activeCategory === "rejected") return profile.status === "Rejected";
    return false;
  });

  const hasMoreProfiles = currentProfileIndex < filteredProfiles.length - 1;
  const hasPreviousProfiles = currentProfileIndex > 0;

  const goToNextProfile = () => {
    if (hasMoreProfiles) {
      setCurrentProfileIndex(prevIndex => prevIndex + 1);
    } else {
      toast({
        title: "No more resumes",
        description: "You've reached the end of the resumes in this category.",
        variant: "default",
      });
    }
  };

  const goToPreviousProfile = () => {
    if (hasPreviousProfiles) {
      setCurrentProfileIndex(prevIndex => prevIndex - 1);
    } else {
      toast({
        title: "First resume",
        description: "You're already at the first resume in this category.",
        variant: "default",
      });
    }
  };

  const resetProfileIndex = () => {
    setCurrentProfileIndex(0);
  };

  const updateProfileStatusLocally = (id: string, status: "Shortlisted" | "Rejected") => {
    setProfiles(prevProfiles => 
      prevProfiles.map(profile => 
        profile.id === id ? { ...profile, status } : profile
      )
    );
    
    if (jobIdRef.current && profilesCache[jobIdRef.current]) {
      setProfilesCache(prevCache => ({
        ...prevCache,
        [jobIdRef.current]: prevCache[jobIdRef.current].map(profile => 
          profile.id === id ? { ...profile, status } : profile
        )
      }));
    }
  };

  const clearProfiles = () => {
    console.log("Clearing profiles");
    setProfiles([]);
    setCurrentProfileIndex(0);
  };

  const fetchProfiles = useCallback(async (): Promise<ResumeProfile[]> => {
    console.log("fetchProfiles called with jobId:", jobIdRef.current);
    const currentJobId = jobIdRef.current;
    
    if (!currentJobId) {
      console.log("No jobId provided");
      return [];
    }
    
    if (fetchInProgress[currentJobId]) {
      console.log("Fetch already in progress");
      return profilesCache[currentJobId] || [];
    }
    
    setLoading(true);
    setFetchInProgress(prev => ({ ...prev, [currentJobId]: true }));
    
    try {
      if (profilesCache[currentJobId] && profilesCache[currentJobId].length > 0) {
        console.log("Using cached profiles");
        setProfiles(profilesCache[currentJobId]);
        return profilesCache[currentJobId];
      }
      
      console.log("Fetching from Supabase");
      const supabaseProfiles = await fetchProfilesFromSupabase(currentJobId);
      
      if (supabaseProfiles && supabaseProfiles.length > 0) {
        console.log(`Found ${supabaseProfiles.length} profiles in Supabase`);
        
        setProfilesCache(prev => ({
          ...prev,
          [currentJobId]: supabaseProfiles
        }));
        
        setProfiles(supabaseProfiles);
        localStorage.setItem("jobId", currentJobId);
        
        return supabaseProfiles;
      }
      
      console.log("No profiles found in Supabase, trying combined fetch");
      const profiles = await fetchProfilesFromGoogleSheets(currentJobId);
      
      if (profiles && profiles.length > 0) {
        console.log(`Found ${profiles.length} profiles from combined sources`);
        
        setProfilesCache(prev => ({
          ...prev,
          [currentJobId]: profiles
        }));
        
        setProfiles(profiles);
        localStorage.setItem("jobId", currentJobId);
        
        return profiles;
      }
      
      console.log("No profiles found from any source");
      return [];
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return [];
    } finally {
      setLoading(false);
      setFetchInProgress(prev => ({ ...prev, [currentJobId]: false }));
    }
  }, [fetchInProgress, profilesCache]);

  useEffect(() => {
    console.log("useEffect for loading profiles - initialLoadDone:", initialLoadDone, "jobId:", jobId);
    if (initialLoadDone && jobId) {
      console.log("Loading profiles for jobId:", jobId);
      
      const loadProfiles = async () => {
        if (profilesCache[jobId] && profilesCache[jobId].length > 0) {
          console.log("Setting profiles from cache for jobId:", jobId);
          setProfiles(profilesCache[jobId]);
        } else {
          console.log("Fetching profiles for jobId:", jobId);
          await fetchProfiles();
        }
      };
      
      loadProfiles();
    }
  }, [jobId, initialLoadDone, fetchProfiles, profilesCache]);

  useEffect(() => {
    console.log("useEffect for user:", user?.email || "no user");
    if (!user) {
      console.log("User logged out, clearing all profile state");
      // setJobId("");
      // setProfiles([]);
      // setProfilesCache({});
      // localStorage.removeItem("jobId");
    }
  }, [user, setJobId]);
  
  useEffect(() => {
    resetProfileIndex();
  }, [activeCategory]);

  const value = {
    jobId,
    setJobId,
    profiles,
    fetchProfiles,
    loading,
    stats,
    activeCategory,
    setActiveCategory,
    filteredProfiles,
    currentProfileIndex,
    setCurrentProfileIndex,
    goToNextProfile,
    goToPreviousProfile,
    hasMoreProfiles,
    hasPreviousProfiles,
    resetProfileIndex,
    updateProfileStatusLocally,
    profilesCache,
    clearProfiles,
    fetchInProgress
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
