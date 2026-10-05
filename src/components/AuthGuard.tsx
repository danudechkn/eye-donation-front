"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCookie, setCookie } from "@/hooks/useApi";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. ตรวจสอบว่ามี Token หรือ Profile จาก MOPH Gateway (10.10.200.103:3577) ส่งมาทาง hash หรือ query หรือไม่
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashString = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashString);

      const checkParams = (params: URLSearchParams) => {
        return !!(
          params.get("token") ||
          params.get("moph_token") ||
          params.get("access_token") ||
          params.get("id_token") ||
          params.get("profile") ||
          params.get("provider_profile") ||
          params.get("data") ||
          params.get("user")
        );
      };

      const hasAuthParams = checkParams(hashParams) || checkParams(searchParams);

      if (hasAuthParams) {
        const getParam = (key: string) => searchParams.get(key) || hashParams.get(key);
        let token =
          getParam("token") ||
          getParam("moph_token") ||
          getParam("access_token") ||
          getParam("id_token") ||
          "";

        const rawProfile =
          getParam("profile") ||
          getParam("provider_profile") ||
          getParam("data") ||
          getParam("user");

        let providerProfile: any = null;
        if (rawProfile) {
          try {
            const unescaped = decodeURIComponent(rawProfile);
            if (unescaped.startsWith("{") || unescaped.startsWith("[")) {
              providerProfile = JSON.parse(unescaped);
            } else if (rawProfile.startsWith("{") || rawProfile.startsWith("[")) {
              providerProfile = JSON.parse(rawProfile);
            } else {
              providerProfile = JSON.parse(atob(rawProfile));
            }
          } catch (e) {
            console.error("Error parsing provider profile in AuthGuard:", e);
          }
        }

        if (!token && providerProfile?.organization?.[0]?.moph_access_token_idp) {
          token = providerProfile.organization[0].moph_access_token_idp;
        }

        const firstName =
          providerProfile?.firstname_th ||
          providerProfile?.first_name_th ||
          providerProfile?.first_name ||
          "";
        const lastName =
          providerProfile?.lastname_th ||
          providerProfile?.last_name_th ||
          providerProfile?.last_name ||
          "";
        const title =
          providerProfile?.title_th ||
          providerProfile?.pre_name_th ||
          "";
        const providerFullName = [title, firstName, lastName].filter(Boolean).join(" ").trim();

        const name =
          providerFullName ||
          providerProfile?.name ||
          providerProfile?.fullname ||
          providerProfile?.display_name ||
          getParam("name") ||
          "";

        const cid =
          providerProfile?.cid ||
          providerProfile?.provider_id ||
          getParam("cid") ||
          "";

        const role =
          providerProfile?.organization?.[0]?.position_type ||
          providerProfile?.profession_name_th ||
          providerProfile?.profession_name ||
          getParam("role") ||
          "พยาบาลประสานงาน";

        const hospcode =
          providerProfile?.organization?.[0]?.hcode ||
          providerProfile?.organization?.[0]?.hospcode ||
          providerProfile?.hospcode ||
          getParam("hospcode") ||
          "10664";

        // ถ้าไม่มี Token แต่ล็อกอินผ่าน Health ID สำเร็จ ให้สร้าง JWT Session Token
        if (!token && (cid || name || providerProfile)) {
          const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
          const payload = btoa(
            unescape(
              encodeURIComponent(
                JSON.stringify({
                  cid: cid || "unknown",
                  name: name || "เจ้าหน้าที่",
                  role: role || "staff",
                  hospcode: hospcode || "10664",
                  exp: Math.floor(Date.now() / 1000) + 86400 * 7,
                })
              )
            )
          )
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
          token = `${header}.${payload}.moph_session_sig`;
        }

        if (token) {
          setCookie("moph_token", token);
          sessionStorage.removeItem("moph_token");
          localStorage.removeItem("moph_token");
        }

        if (providerProfile) {
          sessionStorage.setItem("provider_profile", JSON.stringify(providerProfile));
          localStorage.removeItem("provider_profile");
        }

        if (token || cid || name) {
          const userObj = {
            cid,
            name: name || "เจ้าหน้าที่",
            role,
            hospcode,
            providerId: providerProfile?.provider_id || "",
            loginAt: new Date().toISOString(),
          };
          setCookie("eye_donation_user", JSON.stringify(userObj));
          sessionStorage.setItem("eye_donation_user", JSON.stringify(userObj));
          localStorage.removeItem("eye_donation_user");
          window.dispatchEvent(new Event("storage"));
        }

        // ล้าง URL hash/query ไม่ให้มีข้อมูลผู้ใช้ค้างอยู่บนแถบ URL
        window.history.replaceState({}, document.title, window.location.pathname);

        setAuthorized(true);
        return;
      }

      // 2. ตรวจสอบว่ามี Token อยู่ใน Cookie หรือไม่
      const token =
        getCookie("moph_token") ||
        getCookie("token");

      if (token) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.replace("/login");
      }
    }
  }, [pathname, router]);

  // หากไม่มีสิทธิ์และกำลังส่งกลับไปหน้า /login
  if (authorized === false) {
    return null;
  }

  // กำลังตรวจสิทธิ์
  if (authorized === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
      </div>
    );
  }

  return <>{children}</>;
}
