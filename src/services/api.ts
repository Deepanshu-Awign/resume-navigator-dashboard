import { createClient } from "@supabase/supabase-js";
import { GoogleSheetData, ResumeProfile } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Constants - keeping the Google Sheet ID for backward compatibility if needed
const SHEET_ID = "1ERZMPrh3siXBYUYPgu62Z3ULpjqlTdDrD4P1xWzVMRk";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

// Mock user for testing purposes
const MOCK_ADMIN_USER = {
  id: '123',
  email: 'admin@example.com',
  role: 'admin',
  user_metadata: {
    name: 'Admin User'
  }
};

// Mock storage for resumes (since we don't have a real database)
let mockResumeStorage: ResumeProfile[] = [];

// Function to fetch profiles from Supabase
export const fetchProfilesFromSupabase = async (jobId: string): Promise<ResumeProfile[]> => {
  try {
    console.log("Fetching profiles from Supabase for jobId:", jobId);
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('job_id', jobId);
    
    if (error) {
      console.error("Error fetching from Supabase:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No profiles found in Supabase for jobId:", jobId);
      return [];
    }
    
    // Map the Supabase data structure to our ResumeProfile interface
    const profiles: ResumeProfile[] = data.map(item => ({
      id: item.id,
      jobId: item.job_id,
      name: item.name,
      email: item.email,
      status: item.status as "New" | "Shortlisted" | "Rejected",
      pdfUrl: item.pdf_url || ""
    }));
    
    console.log(`Found ${profiles.length} profiles in Supabase for jobId:`, jobId);
    return profiles;
  } catch (error) {
    console.error("Error fetching profiles from Supabase:", error);
    return [];
  }
};

// Original Google Sheets function (renamed)
export const fetchProfilesFromGoogleSheetsOriginal = async (jobId: string): Promise<ResumeProfile[]> => {
  try {
    console.log("Fetching profiles from Google Sheets for jobId:", jobId);
    const response = await fetch(SHEET_URL);
    
    if (!response.ok) {
      console.error("Error fetching Google Sheet:", response.status, response.statusText);
      return [];
    }
    
    const csvData = await response.text();
    
    // Parse CSV manually
    const rows = csvData.split('\n');
    // Skip header row
    const dataRows = rows.slice(1);
    
    const profiles: ResumeProfile[] = dataRows.map(row => {
      // Handle quotes in CSV
      const cleanRow = row.replace(/"([^"]*)"/g, (match, content) => {
        // Replace commas inside quotes with a temporary placeholder
        return content.replace(/,/g, '###COMMA###');
      });
      
      const columns = cleanRow.split(',');
      // Restore any commas that were inside quotes
      const processedColumns = columns.map(col => col.replace(/###COMMA###/g, ','));
      
      return {
        id: crypto.randomUUID(), // Generate a unique ID for each profile
        jobId: processedColumns[0]?.trim() || "",
        name: processedColumns[1]?.trim() || "",
        email: processedColumns[2]?.trim() || "",
        status: (processedColumns[3]?.trim() as "New" | "Shortlisted" | "Rejected") || "New",
        pdfUrl: processedColumns[4]?.trim() || ""
      };
    }).filter(profile => profile.jobId === jobId);

    console.log("Filtered profiles from Google Sheets:", profiles.length);
    return profiles;
  } catch (error) {
    console.error("Error fetching profiles from Google Sheets:", error);
    return [];
  }
};

// Main function to fetch profiles - tries Supabase first, then falls back to Google Sheets
export const fetchProfilesFromGoogleSheets = async (jobId: string): Promise<ResumeProfile[]> => {
  try {
    // First try to get data from Supabase
    const supabaseProfiles = await fetchProfilesFromSupabase(jobId);
    
    // If we got profiles from Supabase, return them
    if (supabaseProfiles.length > 0) {
      console.log(`Using ${supabaseProfiles.length} profiles from Supabase for jobId:`, jobId);
      return supabaseProfiles;
    }
    
    // If no profiles found in Supabase, try Google Sheets as fallback
    console.log("No profiles found in Supabase, trying Google Sheets as fallback");
    const googleSheetProfiles = await fetchProfilesFromGoogleSheetsOriginal(jobId);
    
    // If we found profiles in Google Sheets, save them to Supabase for future use
    if (googleSheetProfiles.length > 0) {
      console.log(`Importing ${googleSheetProfiles.length} profiles from Google Sheets to Supabase`);
      
      // Import each profile to Supabase
      for (const profile of googleSheetProfiles) {
        await uploadResume({
          jobId: profile.jobId,
          name: profile.name,
          email: profile.email,
          status: profile.status,
          pdfUrl: profile.pdfUrl
        });
      }
    }
    
    return googleSheetProfiles;
  } catch (error) {
    console.error("Error in fetchProfilesFromGoogleSheets:", error);
    return [];
  }
};

// Function to update profile status
export const updateProfileStatus = async (id: string, status: "Shortlisted" | "Rejected"): Promise<boolean> => {
  try {
    console.log(`Updating profile status for ${id} to ${status}`);
    
    // Update in Supabase
    const { error } = await supabase
      .from('resumes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error("Error updating profile in Supabase:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating profile status:", error);
    return false;
  }
};

// Function to upload a new resume
export const uploadResume = async (profile: Omit<ResumeProfile, 'id'>): Promise<boolean> => {
  try {
    console.log("Uploading resume to Supabase:", profile);
    
    const { error } = await supabase
      .from('resumes')
      .insert([
        {
          job_id: profile.jobId,
          name: profile.name,
          email: profile.email,
          status: profile.status,
          pdf_url: profile.pdfUrl || ''
        }
      ]);
    
    if (error) {
      console.error("Error uploading resume to Supabase:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error uploading resume:", error);
    return false;
  }
};

// Function to upload PDF file to Supabase storage
export const uploadPdfFile = async (file: File, jobId: string): Promise<string | null> => {
  try {
    // Create a storage bucket if it doesn't exist
    const fileExt = file.name.split('.').pop();
    const fileName = `${jobId}_${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('resume-pdfs')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading PDF to storage:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('resume-pdfs')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading PDF file:", error);
    return null;
  }
};

// Bulk upload resumes from CSV data
export const bulkUploadResumes = async (
  csvData: string, 
  jobId: string
): Promise<{ success: number; failed: number }> => {
  try {
    // Parse CSV data
    const rows = csvData.split('\n');
    // Assume the first row is a header
    const headers = rows[0].split(',');
    
    // Get column indices
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
    const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
    const pdfUrlIndex = headers.findIndex(h => 
      h.toLowerCase().includes('pdf') || 
      h.toLowerCase().includes('url') || 
      h.toLowerCase().includes('resume')
    );
    
    if (nameIndex === -1 || emailIndex === -1) {
      throw new Error("CSV must contain 'name' and 'email' columns");
    }
    
    // Process each row (skip header)
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue; // Skip empty rows
      
      // Handle quoted values in CSV
      const cleanRow = rows[i].replace(/"([^"]*)"/g, (match, content) => {
        return content.replace(/,/g, '###COMMA###');
      });
      
      const columns = cleanRow.split(',');
      const processedColumns = columns.map(col => col.replace(/###COMMA###/g, ',').trim());
      
      // Create profile object
      const profile: Omit<ResumeProfile, 'id'> = {
        jobId,
        name: processedColumns[nameIndex] || "",
        email: processedColumns[emailIndex] || "",
        status: "New",
        pdfUrl: processedColumns[pdfUrlIndex] || ""
      };
      
      // Skip if name or email is missing
      if (!profile.name || !profile.email) {
        failedCount++;
        continue;
      }
      
      // Use a placeholder URL if none provided
      if (!profile.pdfUrl) {
        profile.pdfUrl = "https://docs.google.com/document/d/placeholder/edit?usp=sharing";
      }
      
      const success = await uploadResume(profile);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
    }
    
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error("Error bulk uploading resumes:", error);
    return { success: 0, failed: 0 };
  }
};

// Get all resumes across all jobs
export const getAllResumes = async (): Promise<ResumeProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*');
    
    if (error) {
      console.error("Error fetching all resumes from Supabase:", error);
      return [];
    }
    
    // Map the data to our ResumeProfile interface
    const profiles: ResumeProfile[] = data.map(item => ({
      id: item.id,
      jobId: item.job_id,
      name: item.name,
      email: item.email,
      status: item.status as "New" | "Shortlisted" | "Rejected",
      pdfUrl: item.pdf_url || ""
    }));
    
    return profiles;
  } catch (error) {
    console.error("Error fetching all resumes:", error);
    return [];
  }
};

// Helper function to convert resume profiles to CSV
export const convertResumesToCsv = (resumes: ResumeProfile[]): string => {
  // Create CSV header
  const headers = ["Job ID", "Name", "Email", "Status", "Resume URL"];
  const csvRows = [headers.join(',')];
  
  // Add each resume as a row
  resumes.forEach(resume => {
    const values = [
      resume.jobId,
      `"${resume.name}"`, // Quote names in case they contain commas
      resume.email,
      resume.status,
      `"${resume.pdfUrl}"` // Quote URLs in case they contain commas
    ];
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

// Fix the resume PDF download issue
export const downloadResume = (profile: ResumeProfile): void => {
  if (!profile?.pdfUrl) return;
  
  let downloadUrl = profile.pdfUrl;
  
  // If it's a Google Docs URL, make it download directly
  if (downloadUrl.includes('docs.google.com/document')) {
    // Replace /edit or /preview with /export?format=pdf
    downloadUrl = downloadUrl.replace(/\/(edit|preview).*$/, '/export?format=pdf');
    
    // Add direct download parameter to bypass Google account selection
    downloadUrl += '&autodownload=1';
  }
  else if (downloadUrl.includes('drive.google.com/file/d/')) {
    // Extract file ID from Google Drive URL
    const fileIdMatch = downloadUrl.match(/\/d\/([^\/]+)\//);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // Format for direct download without Google account selection
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
    }
  }
  
  // Create an invisible iframe to handle the download without opening a new tab
  const downloadFrame = document.createElement('iframe');
  downloadFrame.style.display = 'none';
  document.body.appendChild(downloadFrame);
  
  // Set the source to the download URL
  downloadFrame.src = downloadUrl;
  
  // Remove the frame after a delay
  setTimeout(() => {
    document.body.removeChild(downloadFrame);
  }, 2000);
};

// Authentication functions with Supabase
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      // Fallback for development/testing
      if (email === 'admin@example.com' && password === 'password') {
        console.log('Mock sign in successful');
        return {
          user: MOCK_ADMIN_USER,
          session: { token: 'mock-token' }
        };
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      return user;
    }
    
    // For development/testing, check if we have a stored user in sessionStorage
    const storedUser = sessionStorage.getItem('mockUser');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};
