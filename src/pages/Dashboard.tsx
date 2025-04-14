
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

  const handleCardClick = (category: "pending" | "shortlisted" | "rejected") => {
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

  // If no profiles at all, show a comprehensive message
  if (stats.all === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title={`Job ID: ${jobId}`} />
        <div className="container mx-auto p-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">No Profiles Found</h2>
            <p className="text-lg text-gray-500 mb-6">
              There are currently no profiles for this Job ID. 
              Try uploading resumes or verifying the Job ID.
            </p>
            <button 
              onClick={() => navigate("/")} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={`Job ID: ${jobId}`} />
      
      <div className="container mx-auto p-4 flex-1">
        <h2 className="text-xl font-semibold mb-4">Resume Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Pending"
            count={stats.new} 
            color="bg-blue-50 border-blue-200"
            onClick={() => handleCardClick("pending")} 
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
      </div>
    </div>
  );
};

export default Dashboard;

