
import { useEffect, useState } from "react";
import { getAllResumes, fetchProfilesFromGoogleSheets, convertResumesToCsv } from "@/services/api";
import { ResumeProfile } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, RefreshCw, Search, MoreHorizontal, Eye, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ResumeManagementTableProps {
  refreshTrigger?: number;
}

const ResumeManagementTable = ({ refreshTrigger = 0 }: ResumeManagementTableProps) => {
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, [refreshTrigger]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      // First try to get resumes from Google Sheets (sample data)
      const googleSheetData = await fetchProfilesFromGoogleSheets("1");
      
      // Then try to get resumes from storage/database
      const dbResumes = await getAllResumes();
      
      // Combine both sets of resumes
      const combinedResumes = [...googleSheetData, ...dbResumes];
      
      // Remove duplicates (based on email)
      const uniqueResumes = combinedResumes.filter((resume, index, self) => 
        index === self.findIndex(r => r.email === resume.email)
      );
      
      setResumes(uniqueResumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      toast({
        title: "Error",
        description: "Failed to load resumes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    try {
      const csvContent = convertResumesToCsv(resumes);
      
      // Create a Blob containing the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create a link element and trigger a download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `resume-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Resume report downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const viewResume = (profile: ResumeProfile) => {
    // Open PDF in new tab
    window.open(profile.pdfUrl, '_blank', 'noopener,noreferrer');
  };

  // Filter resumes based on search query
  const filteredResumes = resumes.filter(resume => {
    const searchLower = searchQuery.toLowerCase();
    return (
      resume.name.toLowerCase().includes(searchLower) ||
      resume.email.toLowerCase().includes(searchLower) ||
      resume.jobId.toLowerCase().includes(searchLower) ||
      resume.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: "New" | "Shortlisted" | "Rejected") => {
    switch (status) {
      case "New":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">New</Badge>;
      case "Shortlisted":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Shortlisted</Badge>;
      case "Rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>All Resumes</CardTitle>
            <CardDescription>Manage and track all uploaded resumes</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchResumes} size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button onClick={handleDownloadCSV} size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resumes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="ml-4 text-sm text-muted-foreground">
            {filteredResumes.length} results
          </div>
        </div>
        
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin">
              <RefreshCw className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Loading resumes...</p>
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <p className="mt-2 text-muted-foreground">No resumes found</p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Try adjusting your search query
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">S.No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-center">Resume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResumes.map((resume, index) => (
                  <TableRow key={resume.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{resume.name}</TableCell>
                    <TableCell>{resume.email}</TableCell>
                    <TableCell>{getStatusBadge(resume.status)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => viewResume(resume)}
                        className="flex items-center mx-auto"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeManagementTable;
