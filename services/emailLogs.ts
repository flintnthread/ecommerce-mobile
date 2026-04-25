import api from "./api";

export const EMAIL_LOGS_ENDPOINT = "/api/email-logs";

export type EmailLogStatus = "pending" | "sent" | "failed";

export interface EmailLogRow {
  id: number;
  userId?: number | null;
  emailType: string;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
}

export interface EmailLogsResponse {
  success?: boolean;
  message?: string;
  data?: EmailLogRow[];
}

export interface FetchEmailLogsParams {
  userId?: number;
  emailType?: string;
  recipient?: string;
  status?: EmailLogStatus;
}

export async function fetchEmailLogs(
  params: FetchEmailLogsParams = {}
): Promise<EmailLogRow[]> {
  const cleaned: Record<string, string | number> = {};

  if (typeof params.userId === "number" && Number.isFinite(params.userId)) {
    cleaned.userId = Math.floor(params.userId);
  }
  if (params.emailType?.trim()) {
    cleaned.emailType = params.emailType.trim();
  }
  if (params.recipient?.trim()) {
    cleaned.recipient = params.recipient.trim();
  }
  if (params.status?.trim()) {
    cleaned.status = params.status.trim().toLowerCase();
  }

  const { data } = await api.get<EmailLogsResponse>(EMAIL_LOGS_ENDPOINT, {
    params: cleaned,
  });
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  return [];
}
