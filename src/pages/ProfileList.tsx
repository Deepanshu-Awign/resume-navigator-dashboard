
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import Header from "@/components/Header";
import ProfileCard from "@/components/ProfileCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfileList = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { 
    jobId, 
    filteredProfiles, 
    setActiveCategory,
    loading,
    stats
  } = useProfiles();

  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

    if (category) {
      setActiveCategory(category as any);
    }
  }, [category, jobId, navigate, setActiveCategory]);

  const getCategoryTitle = () => {
    switch (category) {
      case "pending": return "Pending Resumes";
      case "shortlisted": return "Shortlisted Resumes";
      case "rejected": return "Rejected Resumes";
      default: return "Resumes";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title={getCategoryTitle()} showBackButton backTo="/dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={getCategoryTitle()} showBackButton backTo="/dashboard" />
      
      <div className="sticky top-16 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto">
          <Tabs value={category} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto p-0">
              <TabsTrigger 
                value="pending" 
                onClick={() => navigate("/profiles/pending")}
                className="flex-1"
              >
                Pending ({stats.new})
              </TabsTrigger>
              <TabsTrigger 
                value="shortlisted" 
                onClick={() => navigate("/profiles/shortlisted")}
                className="flex-1"
              >
                Shortlisted ({stats.shortlisted})
              </TabsTrigger>
              <TabsTrigger 
                value="rejected" 
                onClick={() => navigate("/profiles/rejected")}
                className="flex-1"
              >
                Rejected ({stats.rejected})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="container mx-auto p-4 flex-1">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {getCategoryTitle()}
          </h2>
        </div>
        
        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile, index) => (
              <ProfileCard key={profile.id} profile={profile} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-500">No resumes found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileList;
