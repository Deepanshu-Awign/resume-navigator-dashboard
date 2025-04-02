
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "@/context/ProfileContext";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";

const Dashboard = () => {
  const { jobId, stats, setActiveCategory, loading } = useProfiles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!jobId) {
      navigate("/");
    }
  }, [jobId, navigate]);

  const handleCardClick = (category: "all" | "new" | "shortlisted" | "rejected") => {
    setActiveCategory(category);
    navigate(`/profiles/${category}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title={`Job ID: ${jobId}`} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={`Job ID: ${jobId}`} />
      
      <div className="container mx-auto p-4 flex-1">
        <h2 className="text-xl font-semibold mb-4">Resume Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="All Resumes" 
            count={stats.all} 
            color=""
            onClick={() => handleCardClick("all")} 
          />
          <StatCard 
            title="New" 
            count={stats.new} 
            color="bg-blue-50 border-blue-200"
            onClick={() => handleCardClick("new")} 
          />
          <StatCard 
            title="Shortlisted" 
            count={stats.shortlisted} 
            color="bg-green-50 border-green-200"
            onClick={() => handleCardClick("shortlisted")} 
          />
          <StatCard 
            title="Rejected" 
            count={stats.rejected} 
            color="bg-red-50 border-red-200"
            onClick={() => handleCardClick("rejected")} 
          />
        </div>

        {stats.all === 0 && (
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-500">No resumes found for this Job ID.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
