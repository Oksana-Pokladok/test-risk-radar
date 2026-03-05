export type Role = "admin" | "editor" | "viewer";

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"],
};

export function can(role: Role, action: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}
