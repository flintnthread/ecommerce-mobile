import api from "./api";

export const COOKIES_POLICY_ENDPOINT = "/api/cookies-policy";

export interface CookiesPolicyData {
  id?: number;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CookiesPolicyResponse {
  success?: boolean;
  message?: string;
  data?: CookiesPolicyData;
}

export async function fetchCookiesPolicy(): Promise<CookiesPolicyData> {
  const { data } = await api.get<CookiesPolicyResponse>(COOKIES_POLICY_ENDPOINT);
  return {
    id: data?.data?.id,
    content: typeof data?.data?.content === "string" ? data.data.content : "",
    createdAt: data?.data?.createdAt,
    updatedAt: data?.data?.updatedAt,
  };
}
