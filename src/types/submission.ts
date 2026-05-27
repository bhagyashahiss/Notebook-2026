export type SubmissionStatus = "pending" | "token_sent" | "completed";

export type SubmissionRecord = {
  id: string;
  responseKey: string;
  name: string;
  phone: string;
  isJain: boolean;
  dozens: number;
  amount: number;
  tokenNumber: string | null;
  status: SubmissionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
