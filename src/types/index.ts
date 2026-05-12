export type UserRole = "applicant" | "hrd";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
