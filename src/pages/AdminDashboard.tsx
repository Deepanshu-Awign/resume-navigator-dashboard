import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import BulkUploadForm from "@/components/BulkUploadForm";
import ResumeManagementTable from "@/components/ResumeManagementTable";
import SampleResumes from "@/components/SampleResumes";
import { FileText, Upload, ListFilter, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadResume, uploadPdfFile } from "@/services/api";
import { ResumeProfile } from "@/types";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState({
    jobId: "",
    name: "",
    email: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleUploadComplete = () => {
    // Trigger a refresh of the resume table
    setRefreshTrigger(prev => prev + 1);
  };

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Resume Management System</h2>
        </div>
        
        <Tabs defaultValue="upload-single" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="upload-single" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Single Upload</span>
            </TabsTrigger>
            <TabsTrigger value="upload-bulk" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Bulk Upload</span>
            </TabsTrigger>
            <TabsTrigger value="sample-resumes" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Sample Resumes</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              <span>Manage Resumes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload-single" className="mt-0">
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
          </TabsContent>
          
          <TabsContent value="upload-bulk" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              <BulkUploadForm onUploadComplete={handleUploadComplete} />
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CSV Format Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-4">
                    <p>Your CSV file should contain the following columns:</p>
                    <div className="font-mono bg-gray-100 p-2 rounded-md text-xs overflow-x-auto">
                      name,email,pdf_url
                    </div>
                    <p>Example data:</p>
                    <div className="font-mono bg-gray-100 p-2 rounded-md text-xs overflow-x-auto">
                      John Doe,john@example.com,https://example.com/resume.pdf<br/>
                      Jane Smith,jane@example.com,https://example.com/jane-resume.pdf
                    </div>
                    <p className="font-medium">Notes:</p>
                    <ul className="list-disc list-inside">
                      <li>All resumes will be assigned to the Job ID you specify</li>
                      <li>All resumes will start with "New" status</li>
                      <li>PDF URLs should be directly accessible</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sample-resumes" className="mt-0">
            <SampleResumes onImportComplete={handleUploadComplete} />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-0">
            <ResumeManagementTable refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
