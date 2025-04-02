
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { uploadResume, uploadPdfFile } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { ResumeProfile } from "@/types";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    jobId: "",
    name: "",
    email: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pdfFile) {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Upload PDF file to storage
      const pdfUrl = await uploadPdfFile(pdfFile, formData.jobId);
      
      if (!pdfUrl) {
        throw new Error("Failed to upload PDF file");
      }
      
      // 2. Create resume profile
      const profile: Omit<ResumeProfile, 'id'> = {
        jobId: formData.jobId,
        name: formData.name,
        email: formData.email,
        status: "New",
        pdfUrl,
      };
      
      const success = await uploadResume(profile);
      
      if (success) {
        toast({
          title: "Success",
          description: "Resume uploaded successfully",
        });
        
        // Reset form
        setFormData({
          jobId: "",
          name: "",
          email: "",
        });
        setPdfFile(null);
        
        // Reset file input
        const fileInput = document.getElementById("pdf-file") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        throw new Error("Failed to upload resume");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Admin Dashboard" />
      
      <div className="container mx-auto p-4 flex-1">
        <h2 className="text-2xl font-semibold mb-6">Upload New Resume</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>Add a new candidate resume to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobId">Job ID</Label>
                  <Input
                    id="jobId"
                    name="jobId"
                    value={formData.jobId}
                    onChange={handleChange}
                    placeholder="Enter job ID"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Candidate Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter candidate name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Candidate Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter candidate email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pdf-file">Upload PDF Resume</Label>
                  <Input
                    id="pdf-file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Only PDF files are accepted
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Uploading..." : "Upload Resume"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground">{user?.id || "Unknown"}</p>
                </div>
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "Unknown"}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>1. Enter the Job ID for the position</p>
                <p>2. Enter the candidate's name and email</p>
                <p>3. Upload their resume in PDF format</p>
                <p>4. Click "Upload Resume" to add to the database</p>
                <p>5. The resume will be available for review under the specified Job ID</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
