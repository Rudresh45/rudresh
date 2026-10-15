import { NextRequest, NextResponse } from "next/server";

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

let cachedCsrfToken: string | null = null;
let cachedCsrfCookie: string | null = null;

async function getCsrfToken(): Promise<{ token: string; cookie: string } | null> {
  if (cachedCsrfToken && cachedCsrfCookie) {
    return { token: cachedCsrfToken, cookie: cachedCsrfCookie };
  }
  try {
    const res = await fetch(`${BACKEND_INTERNAL_URL}/admin/login/`, {
      method: "GET",
      cache: "no-store",
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/csrftoken=([^;]+)/);
      if (match && match[1]) {
        cachedCsrfToken = match[1];
        cachedCsrfCookie = `csrftoken=${match[1]}`;
        return { token: cachedCsrfToken, cookie: cachedCsrfCookie };
      }
    }
  } catch (err) {
    console.error("Failed to fetch CSRF token from Django backend:", err);
  }
  return null;
}

async function proxyRequest(request: NextRequest, params: { path?: string[] }) {
  const pathSegments = params.path ? params.path.join("/") : "";
  // Ensure trailing slash for Django REST framework URL conventions
  const trailingSlash = pathSegments.endsWith("/") ? "" : "/";
  const searchParams = request.nextUrl.search;
  const targetUrl = `${BACKEND_INTERNAL_URL}/api/v1/${pathSegments}${trailingSlash}${searchParams}`;

  const method = request.method;
  const headers = new Headers();
  request.headers.forEach((val, key) => {
    const lower = key.toLowerCase();
    if (
      lower !== "host" &&
      lower !== "content-length" &&
      lower !== "connection" &&
      lower !== "expect" &&
      lower !== "origin" &&
      lower !== "referer"
    ) {
      headers.set(key, val);
    }
  });

  // Attach CSRF credentials and internal origin for state-changing methods to satisfy Django's CsrfViewMiddleware
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase())) {
    const csrf = await getCsrfToken();
    if (csrf) {
      headers.set("X-CSRFToken", csrf.token);
      headers.set("Cookie", csrf.cookie);
    }
    // Set internal origin and referer to match Django's ALLOWED_HOSTS
    headers.set("Origin", BACKEND_INTERNAL_URL);
    headers.set("Referer", `${BACKEND_INTERNAL_URL}/`);
  }

  let body: any = undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      const rawText = await request.text();
      if (rawText && rawText.trim().length > 0) {
        body = rawText;
      }
    } catch {
      body = undefined;
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: "no-store",
    };
    if (body !== undefined) {
      fetchOptions.body = body;
    }

    const res = await fetch(targetUrl, fetchOptions);

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const responseBody = await res.text();
    const responseHeaders = new Headers();
    res.headers.forEach((val, key) => {
      responseHeaders.set(key, val);
    });

    return new NextResponse(responseBody, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Proxy fetch error:", error);
    return NextResponse.json(
      {
        detail:
          "Unable to connect to Django backend on http://127.0.0.1:8000. Start backend using `backend\\.venv\\Scripts\\python.exe backend\\manage.py runserver`",
        error: error.message,
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxyRequest(request, params);
}

export async function POST(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxyRequest(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxyRequest(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxyRequest(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxyRequest(request, params);
}

export async function OPTIONS(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxyRequest(request, params);
}
