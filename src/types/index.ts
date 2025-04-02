
export interface ResumeProfile {
  jobId: string;
  name: string;
  email: string;
  status: "New" | "Shortlisted" | "Rejected";
  pdfUrl: string;
  id?: string; // For Supabase records
}

export interface GoogleSheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

export interface JobStats {
  all: number;
  new: number;
  shortlisted: number;
  rejected: number;
}

export interface AdminUser {
  email: string;
  id: string;
}
