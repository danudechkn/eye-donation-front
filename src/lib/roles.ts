import type { AppRole, AuthUser } from "@/types";

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  eye: "บริจาคดวงตา",
  organ: "บริจาคอวัยวะ",
  both: "บริจาคดวงตา + อวัยวะ",
  admin: "ผู้ดูแลระบบ (ทั้งหมด)",
};

export const APP_ROLE_BADGE_STYLES: Record<
  AppRole,
  {
    pill: string;
    chevron: string;
    dots: string[];
  }
> = {
  eye: {
    pill: "bg-sky-50/90 hover:bg-sky-100/80 border-sky-200 text-sky-700",
    chevron: "text-sky-500",
    dots: ["bg-sky-500"],
  },
  organ: {
    pill: "bg-rose-50/90 hover:bg-rose-100/80 border-rose-200 text-rose-700",
    chevron: "text-rose-500",
    dots: ["bg-rose-500"],
  },
  both: {
    pill: "bg-violet-50/90 hover:bg-violet-100/80 border-violet-200 text-violet-700",
    chevron: "text-violet-500",
    dots: ["bg-sky-500", "bg-rose-500"],
  },
  admin: {
    pill: "bg-emerald-50/90 hover:bg-emerald-100/80 border-emerald-200 text-emerald-700",
    chevron: "text-emerald-500",
    dots: ["bg-emerald-500"],
  },
};

export const APP_ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "eye", label: "บริจาคดวงตา (Eye)" },
  { value: "organ", label: "บริจาคอวัยวะ (Organ)" },
  { value: "both", label: "บริจาคดวงตา + อวัยวะ" },
  { value: "admin", label: "ผู้ดูแลระบบ (เห็นทั้งหมด)" },
];

export function isValidAppRole(value: unknown): value is AppRole {
  return value === "eye" || value === "organ" || value === "both" || value === "admin";
}

export function getEffectiveAppRole(user: AuthUser | null | undefined): AppRole {
  if (user && isValidAppRole(user.appRole)) {
    return user.appRole;
  }
  return "eye";
}

export function canAccessEye(role: AppRole): boolean {
  return role === "eye" || role === "both" || role === "admin";
}

export function canAccessOrgan(role: AppRole): boolean {
  return role === "organ" || role === "both" || role === "admin";
}

export function canAccessAdmin(role: AppRole): boolean {
  return role === "admin";
}

export function getDefaultHomeRoute(role: AppRole): string {
  return role === "organ" ? "/organs/dashboard" : "/dashboard";
}

/** ตรวจสอบว่าสิทธิ์ appRole ปัจจุบันสามารถเข้าถึง URL pathname นี้ได้หรือไม่ */
export function canAccessPathname(pathname: string, role: AppRole): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return canAccessAdmin(role);
  }
  if (pathname === "/organs" || pathname.startsWith("/organs/")) {
    return canAccessOrgan(role);
  }
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/cases" ||
    pathname.startsWith("/cases/")
  ) {
    return canAccessEye(role);
  }
  return true;
}
