
import { useEffect, useState } from "react";
import { ResumeProfile } from "@/types";
import { fetchProfilesFromGoogleSheets } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download } from "lucide-react";

interface SampleResumesProps {
  onImportComplete: () => void;
}

const SampleResumes = ({ onImportComplete }: SampleResumesProps) => {
  const [sampleProfiles, setSampleProfiles] = useState<ResumeProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  
  useEffect(() => {
    fetchSampleProfiles();
  }, []);

  const fetchSampleProfiles = async () => {
    setLoading(true);
    try {
      // Fetch from Google Sheets with job ID "1" which has our sample data
      const profiles = await fetchProfilesFromGoogleSheets("1");
      setSampleProfiles(profiles);
    } catch (error) {
      console.error("Error fetching sample profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load sample resumes from Google Sheets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const importSampleProfiles = async () => {
    setImporting(true);
    try {
      // In a real application, this would save the profiles to your database
      // For now, we're just adding a delay to simulate the import process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: `${sampleProfiles.length} sample resumes imported successfully.`,
      });
      
      // Notify parent component that import is complete
      onImportComplete();
    } catch (error) {
      console.error("Error importing sample profiles:", error);
      toast({
        title: "Error",
        description: "Failed to import sample resumes.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

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
        <CardTitle>Sample Resumes</CardTitle>
        <CardDescription>These sample resumes are fetched from the connected Google Sheet</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading sample resumes...</span>
          </div>
        ) : sampleProfiles.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No sample resumes found in the Google Sheet.</p>
            <Button 
              variant="outline" 
              onClick={fetchSampleProfiles} 
              className="mt-4"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{getStatusBadge(profile.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={fetchSampleProfiles} 
          disabled={loading || importing}
        >
          Refresh
        </Button>
        <Button 
          onClick={importSampleProfiles} 
          disabled={loading || importing || sampleProfiles.length === 0}
        >
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Import Sample Resumes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SampleResumes;
