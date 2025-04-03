
import { useState } from "react";
import { bulkUploadResumes } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BulkUploadFormProps {
  onUploadComplete: () => void;
}

const BulkUploadForm = ({ onUploadComplete }: BulkUploadFormProps) => {
  const [jobId, setJobId] = useState("");
  const [csvData, setCsvData] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      
      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCsvData(event.target.result as string);
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvData(e.target.value);
    setCsvFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobId) {
      toast({
        title: "Error",
        description: "Please enter a Job ID",
        variant: "destructive",
      });
      return;
    }
    
    if (!csvData) {
      toast({
        title: "Error",
        description: "Please provide CSV data either by file upload or manual input",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await bulkUploadResumes(csvData, jobId);
      
      if (result.success > 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${result.success} resumes${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
        
        // Reset form
        setJobId("");
        setCsvData("");
        setCsvFile(null);
        
        // Reset file input
        const fileInput = document.getElementById("csv-file") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        
        // Notify parent component
        onUploadComplete();
      } else {
        toast({
          title: "Error",
          description: `Failed to upload resumes. Please check the CSV format.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload resumes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Upload Resumes</CardTitle>
        <CardDescription>Upload multiple resumes at once using a CSV file</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobId">Job ID</Label>
            <Input
              id="jobId"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Enter job ID"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-1">
              CSV should include columns for name, email, and resume URL
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="csv-manual">Or paste CSV content here</Label>
            <Textarea
              id="csv-manual"
              value={csvData}
              onChange={handleManualInput}
              placeholder="name,email,pdf_url"
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4 animate-pulse" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Upload Resumes
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BulkUploadForm;
