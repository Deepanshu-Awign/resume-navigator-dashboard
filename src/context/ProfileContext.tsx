
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ResumeProfile, JobStats } from "@/types";
import { fetchProfilesFromGoogleSheets } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

interface ProfileContextType {
  jobId: string;
  setJobId: (id: string) => void;
  profiles: ResumeProfile[];
  fetchProfiles: () => Promise<void>;
  loading: boolean;
  stats: JobStats;
  activeCategory: "all" | "new" | "shortlisted" | "rejected";
  setActiveCategory: (category: "all" | "new" | "shortlisted" | "rejected") => void;
  filteredProfiles: ResumeProfile[];
  currentProfileIndex: number;
  setCurrentProfileIndex: (index: number) => void;
  goToNextProfile: () => void;
  goToPreviousProfile: () => void;
  hasMoreProfiles: boolean;
  hasPreviousProfiles: boolean;
  resetProfileIndex: () => void;
  updateProfileStatusLocally: (id: string, status: "Shortlisted" | "Rejected") => void;
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
  const [jobId, setJobId] = useState<string>(() => {
    return localStorage.getItem("jobId") || "";
  });
  const [profiles, setProfiles] = useState<ResumeProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "new" | "shortlisted" | "rejected">("all");
  const [currentProfileIndex, setCurrentProfileIndex] = useState<number>(0);

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
    if (activeCategory === "new") return profile.status === "New";
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
  };

  const fetchProfiles = async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      console.log("Fetching profiles for jobId:", jobId);
      const data = await fetchProfilesFromGoogleSheets(jobId);
      console.log("Fetched profiles:", data);
      setProfiles(data);
      // Save jobId to localStorage
      localStorage.setItem("jobId", jobId);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchProfiles();
    }
  }, [jobId]);

  // Reset profile index when category changes
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
    updateProfileStatusLocally
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
