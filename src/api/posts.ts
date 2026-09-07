import { apiFetch, type components } from "./client";

export type PostResponse = components["schemas"]["PostResponse"];
export type UpsertPostRequest = components["schemas"]["UpsertPostRequest"];
export type PostListResponse = components["schemas"]["PostListResponse"];

export function listPosts(accessToken: string, status?: string): Promise<PostListResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<PostListResponse>(`/api/v1/admin/posts${query}`, { accessToken });
}

export function getPost(accessToken: string, id: string): Promise<PostResponse> {
  return apiFetch<PostResponse>(`/api/v1/admin/posts/${id}`, { accessToken });
}

export function createPost(accessToken: string, body: UpsertPostRequest): Promise<PostResponse> {
  return apiFetch<PostResponse>("/api/v1/admin/posts", {
    method: "POST",
    accessToken,
    body,
  });
}

export function updatePost(
  accessToken: string,
  id: string,
  body: UpsertPostRequest,
): Promise<PostResponse> {
  return apiFetch<PostResponse>(`/api/v1/admin/posts/${id}`, {
    method: "PUT",
    accessToken,
    body,
  });
}

export function deletePost(accessToken: string, id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/posts/${id}`, {
    method: "DELETE",
    accessToken,
  });
}
