let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    // Make a GET request to public endpoint to get the CSRF token from response header
    const res = await fetch("/api/csrf-token", { credentials: "include" });
    const token = res.headers.get("X-CSRF-Token");
    if (token) {
      csrfToken = token;
      return token;
    }
  } catch (err) {
    console.error("Failed to fetch CSRF token:", err);
  }

  return "";
}

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export function clearCsrfToken() {
  csrfToken = null;
}

