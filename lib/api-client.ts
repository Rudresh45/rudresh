import { API_CONFIG } from "./api-config";

export class ApiError extends Error {
  status: number;
  data: any;
  validationErrors?: Record<string, string[]>;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;

    if (data && typeof data === "object") {
      this.validationErrors = data;
    }
  }
}

function cleanErrorMessage(raw: string, status: number): string {
  if (raw.includes("<html") || raw.includes("<!DOCTYPE") || raw.includes("</")) {
    const reasonMatch = raw.match(/Reason given for failure:<\/p>\s*<pre>([^<]+)<\/pre>/i);
    if (reasonMatch && reasonMatch[1]) {
      return `Backend Error: ${reasonMatch[1].trim()}`;
    }
    const titleMatch = raw.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return `Backend Error (${status}): ${titleMatch[1].trim()}`;
    }
    return `Server returned error (${status}). Please check backend status.`;
  }
  return raw;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  timeoutMs?: number;
  baseUrl?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    params,
    timeoutMs = API_CONFIG.timeoutMs,
    baseUrl = API_CONFIG.defaultBaseUrl,
    headers = {},
    ...customConfig
  } = options;

  // Clean trailing and leading slashes
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let url = `${cleanBase}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (customConfig.body && !(customConfig.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 204) {
      return {} as T;
    }

    let responseData: any = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      const text = await response.text();
      responseData = text ? { detail: cleanErrorMessage(text, response.status) } : null;
    }

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = cleanErrorMessage(responseData, response.status);
        } else if (responseData.detail) {
          errorMessage = cleanErrorMessage(responseData.detail, response.status);
        } else if (responseData.message) {
          errorMessage = cleanErrorMessage(responseData.message, response.status);
        } else if (typeof responseData === "object") {
          const firstKey = Object.keys(responseData)[0];
          if (firstKey && Array.isArray(responseData[firstKey])) {
            errorMessage = `${firstKey}: ${responseData[firstKey].join(", ")}`;
          }
        }
      }
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new ApiError("Request timed out. Please check backend connection.", 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    // Network failure (server down, CORS, etc.)
    throw new ApiError(
      error.message || "Failed to connect to backend server. Make sure it is running on http://127.0.0.1:8000.",
      0
    );
  }
}
