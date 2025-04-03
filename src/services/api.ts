import { createClient } from "@supabase/supabase-js";
import { GoogleSheetData, ResumeProfile } from "@/types";

// Constants
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

// Supabase setup
// Check if Supabase environment variables are set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a fallback client if environment variables are not set
const createFallbackClient = () => {
  console.warn(
    "Supabase URL or anonymous key not found. Using fallback client. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file for production use."
  );
  
  // Return a mock client with similar structure but no actual Supabase functionality
  return {
    auth: {
      signInWithPassword: async () => ({ data: null, error: new Error("Supabase not configured") }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: new Error("Supabase not configured") }),
      }),
      update: () => ({
        eq: async () => ({ error: new Error("Supabase not configured") }),
      }),
      insert: async () => ({ error: new Error("Supabase not configured") }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: new Error("Supabase not configured") }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  };
};

// Create Supabase client only if both URL and anonymous key are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createFallbackClient();

// Function to fetch data directly from Google Sheets as CSV
export const fetchProfilesFromGoogleSheets = async (jobId: string): Promise<ResumeProfile[]> => {
  try {
    console.log("Fetching profiles from Google Sheets for jobId:", jobId);
    const response = await fetch(SHEET_URL);
    
    if (!response.ok) {
      console.error("Error fetching Google Sheet:", response.status, response.statusText);
      return [];
    }
    
    const csvData = await response.text();
    console.log("CSV data received:", csvData.substring(0, 100) + "..."); // Log first 100 chars for debugging
    
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

    console.log("Filtered profiles:", profiles.length);
    return profiles;
  } catch (error) {
    console.error("Error fetching profiles from Google Sheets:", error);
    return [];
  }
};

// Function to fetch profiles from Supabase
export const fetchProfilesFromSupabase = async (jobId: string): Promise<ResumeProfile[]> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Returning empty profiles array.");
      return [];
    }
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('jobId', jobId);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching profiles from Supabase:", error);
    return [];
  }
};

// Function to update profile status in Google Sheets
export const updateProfileStatus = async (email: string, status: "Shortlisted" | "Rejected"): Promise<boolean> => {
  // This is a mock implementation since we can't directly update Google Sheets without authentication
  // In a real implementation, you would need to use the Google Sheets API with proper authentication
  console.log(`Updating profile status for ${email} to ${status}`);
  
  // For the exercise, log success but don't actually update the sheet
  return true;
};

// Function to upload a new resume
export const uploadResume = async (profile: Omit<ResumeProfile, 'id'>): Promise<boolean> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Cannot upload resume.");
      return false;
    }
    
    const { error } = await supabase
      .from('resumes')
      .insert([profile]);
    
    if (error) {
      throw error;
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
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Cannot upload PDF file.");
      return null;
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${jobId}_${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resume-pdfs')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('resume-pdfs')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading PDF file:", error);
    return null;
  }
};

// Authentication functions with mock implementation
export const signIn = async (email: string, password: string) => {
  try {
    // If Supabase is configured, use it
    if (supabaseUrl && supabaseAnonKey) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    }
    
    // Mock authentication for development/testing
    if (email === 'admin@example.com' && password === 'password') {
      console.log('Mock sign in successful');
      return {
        user: MOCK_ADMIN_USER,
        session: { token: 'mock-token' }
      };
    }
    
    throw new Error('Invalid email or password');
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    // If Supabase is configured, use it
    if (supabaseUrl && supabaseAnonKey) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return;
    }
    
    // Mock sign out for development/testing
    console.log('Mock sign out successful');
    return;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    // If Supabase is configured, use it
    if (supabaseUrl && supabaseAnonKey) {
      const { data: { user } } = await supabase.auth.getUser();
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
