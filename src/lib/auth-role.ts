export const SESSION_COOKIE = "notebook_session";

export type UserRole = "admin" | "viewer";

export function isUserRole(value: string | undefined): value is UserRole {
  return value === "admin" || value === "viewer";
}

export function getRolePassword(role: UserRole): string | undefined {
  if (role === "admin") return process.env.APP_ADMIN_PASSWORD;
  return process.env.APP_VIEWER_PASSWORD;
}
