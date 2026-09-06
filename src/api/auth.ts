import { apiFetch, type LoginRequest, type TokenResponse } from "./client";

export function login(credentials: LoginRequest): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/v1/admin/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function refresh(): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/v1/admin/auth/refresh", {
    method: "POST",
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/v1/admin/auth/logout", {
    method: "POST",
  });
}

export function getAdminSurface(accessToken: string): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>("/api/v1/admin/", {
    accessToken,
  });
}
