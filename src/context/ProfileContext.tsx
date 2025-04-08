
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { ResumeProfile, JobStats } from "@/types";
import { fetchProfilesFromGoogleSheets } from "@/services/api";
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
  // Get auth context to detect logout
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

  // Set jobId both in state and ref to avoid race conditions
  const setJobId = useCallback((id: string) => {
    console.log("Setting jobId:", id);
    jobIdRef.current = id;
    setJobIdState(id);
  }, []);

  // Initialize jobId from localStorage only once on mount
  useEffect(() => {
    const savedJobId = localStorage.getItem("jobId");
    console.log("Initial jobId from localStorage:", savedJobId);
    
    if (savedJobId) {
      setJobId(savedJobId);
    }
    
    setInitialLoadDone(true);
  }, [setJobId]);

  // Calculate stats from profiles
  const stats: JobStats = {
    all: profiles.length,
    new: profiles.filter(p => p.status === "New").length,
    shortlisted: profiles.filter(p => p.status === "Shortlisted").length,
    rejected: profiles.filter(p => p.status === "Rejected").length
  };

  // Filter profiles based on activeCategory
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
    
    // Also update cache
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
    // Use the ref to avoid race conditions
    const currentJobId = jobIdRef.current;
    
    console.log("fetchProfiles called with jobIdRef:", currentJobId);
    
    if (!currentJobId) {
      console.log("No jobId provided to fetchProfiles");
      return [];
    }
    
    // If fetch is already in progress for this jobId, return the cached profiles or empty array
    if (fetchInProgress[currentJobId]) {
      console.log("Fetch already in progress for jobId:", currentJobId);
      return profilesCache[currentJobId] || [];
    }
    
    setLoading(true);
    setFetchInProgress(prev => ({ ...prev, [currentJobId]: true }));
    
    try {
      console.log("Fetching profiles for jobId:", currentJobId);
      
      // Check cache first
      if (profilesCache[currentJobId] && profilesCache[currentJobId].length > 0) {
        console.log("Using cached profiles for jobId:", currentJobId, "count:", profilesCache[currentJobId].length);
        setProfiles(profilesCache[currentJobId]);
        setLoading(false);
        setFetchInProgress(prev => ({ ...prev, [currentJobId]: false }));
        return profilesCache[currentJobId];
      } else {
        console.log("No cached profiles found for jobId:", currentJobId, "- fetching fresh");
      }
      
      const data = await fetchProfilesFromGoogleSheets(currentJobId);
      console.log("Fetched profiles:", data);
      
      if (data && data.length > 0) {
        // Update cache with the fetched profiles
        setProfilesCache(prev => ({
          ...prev,
          [currentJobId]: data
        }));
        
        // Update current profiles in state
        setProfiles(data);
        
        // Save jobId to localStorage only if profiles were found
        localStorage.setItem("jobId", currentJobId);
        
        return data;
      } else {
        console.log("No profiles found for jobId:", currentJobId);
        return [];
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch profiles. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
      setFetchInProgress(prev => ({ ...prev, [currentJobId]: false }));
    }
  }, [fetchInProgress, profilesCache]);

  // Only load profiles from cache when jobId changes AND initialLoadDone is true
  useEffect(() => {
    // Skip the initial load when the component first mounts
    if (!initialLoadDone) return;
    
    const loadProfilesFromCache = async () => {
      if (jobId && profilesCache[jobId] && profilesCache[jobId].length > 0) {
        console.log("Loading profiles from cache for jobId:", jobId);
        setProfiles(profilesCache[jobId]);
      }
    };
    
    if (jobId) {
      loadProfilesFromCache();
    }
  }, [jobId, initialLoadDone, profilesCache]);

  // Clear everything when user logs out
  useEffect(() => {
    if (!user) {
      // User logged out, clear state
      console.log("User logged out, clearing all profile state");
      setJobId("");
      setProfiles([]);
      setProfilesCache({});
      localStorage.removeItem("jobId");
    }
  }, [user, setJobId]);
  
  // Reset profile index when active category changes
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
    clearProfiles
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
