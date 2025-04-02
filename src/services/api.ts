
import { createClient } from "@supabase/supabase-js";
import { GoogleSheetData, ResumeProfile } from "@/types";

// Constants
const SHEET_ID = "1ERZMPrh3siXBYUYPgu62Z3ULpjqlTdDrD4P1xWzVMRk";
const SHEET_RANGE = "Sheet1!A2:E";
const SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}?key=AIzaSyBmNVkCGVw-baSV9lJnY64QPbNQ6sCnZxE`; // Public read-only key

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

// Function to fetch data from Google Sheets
export const fetchProfilesFromGoogleSheets = async (jobId: string): Promise<ResumeProfile[]> => {
  try {
    const response = await fetch(SHEETS_API_URL);
    const data: GoogleSheetData = await response.json();
    
    if (!data.values) {
      console.error("No data returned from Google Sheets");
      return [];
    }

    const profiles: ResumeProfile[] = data.values.map(row => ({
      jobId: row[0] || "",
      name: row[1] || "",
      email: row[2] || "",
      status: (row[3] as "New" | "Shortlisted" | "Rejected") || "New",
      pdfUrl: row[4] || ""
    })).filter(profile => profile.jobId === jobId);

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

// Function to update profile status in Supabase
export const updateProfileStatus = async (id: string, status: "Shortlisted" | "Rejected"): Promise<boolean> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Cannot update profile status.");
      return false;
    }
    
    const { error } = await supabase
      .from('resumes')
      .update({ status })
      .eq('id', id);
    
    if (error) {
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

// Authentication functions
export const signIn = async (email: string, password: string) => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Cannot sign in.");
      throw new Error("Supabase is not configured. Please set up your environment variables.");
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Cannot sign out.");
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase not configured. Cannot get current user.");
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};
