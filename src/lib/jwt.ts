// ============================================================
// JWT & Provider Profile Utilities
// ============================================================

/** ฟิลด์ชื่อผู้ใช้ใน JWT payload ที่ Backend รองรับในการดึงไปบันทึก firststaff */
export const BACKEND_JWT_NAME_FIELDS = [
  "name",
  "name_th",
  "fullname",
  "username",
] as const;

export type BackendJwtNameField = (typeof BACKEND_JWT_NAME_FIELDS)[number];

export interface JwtUserNameCheckResult {
  isJwt: boolean;
  hasUserName: boolean;
  matchedField: BackendJwtNameField | null;
  userName: string;
  payload: Record<string, unknown> | null;
}

const warnedTokens = new Set<string>();

/** เข้ารหัสข้อความ UTF-8 (รองรับภาษาไทย) เป็น Base64URL */
export function encodeBase64UrlUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** ถอดรหัส Base64 / Base64URL เป็นข้อความ UTF-8 (รองรับภาษาไทย) */
export function decodeBase64UrlUtf8(base64Url: string): string {
  const normalized = base64Url.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/** ถอดรหัส JWT payload (ส่วนกลางของ header.payload.signature) */
export function decodeJwtPayload(
  token: string | null | undefined,
): Record<string, unknown> | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const json = decodeBase64UrlUtf8(parts[1]);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** แปลง raw profile จาก query/hash (รองรับ JSON, URI-encoded JSON และ Base64/Base64URL UTF-8) */
export function parseProviderProfile(
  rawProfile: string | null | undefined,
): Record<string, unknown> | null {
  if (!rawProfile || typeof rawProfile !== "string") return null;
  try {
    const unescaped = decodeURIComponent(rawProfile);
    if (unescaped.startsWith("{") || unescaped.startsWith("[")) {
      return JSON.parse(unescaped);
    }
    if (rawProfile.startsWith("{") || rawProfile.startsWith("[")) {
      return JSON.parse(rawProfile);
    }
    const decodedStr = decodeBase64UrlUtf8(rawProfile);
    return JSON.parse(decodedStr);
  } catch (e) {
    console.error("Error parsing provider profile:", e);
    return null;
  }
}

function getNonEmptyString(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === "object" && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : null;
}

function getFirstOrganization(
  profile: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!profile) return null;
  const orgList = Array.isArray(profile.organization)
    ? profile.organization
    : Array.isArray(asRecord(profile.data)?.organization)
      ? (asRecord(profile.data)?.organization as unknown[])
      : null;
  return orgList && orgList.length > 0 ? asRecord(orgList[0]) : null;
}

export interface ResolvedCallbackAuth {
  token: string;
  providerProfile: Record<string, unknown> | null;
  jwtPayload: Record<string, unknown> | null;
  name: string;
  username: string;
  cid: string;
  role: string;
  hospcode: string;
  providerId: string;
}

/** ดึงข้อมูลผู้ใช้และ token จาก callback (URL params, Provider Profile และ JWT Payload) */
export function resolveCallbackAuth(
  initialToken: string,
  rawProfile: string | null | undefined,
  getParam: (key: string) => string | null,
): ResolvedCallbackAuth {
  const providerProfile = parseProviderProfile(rawProfile);
  const profileData = asRecord(providerProfile?.data) || providerProfile;
  const org0 = getFirstOrganization(providerProfile);

  let token = initialToken;
  if (!token) {
    const idpToken = getNonEmptyString(org0?.moph_access_token_idp);
    if (idpToken) token = idpToken;
  }

  const jwtPayload = decodeJwtPayload(token);

  const name =
    extractNameFromProfile(providerProfile) ||
    extractNameFromJwtPayload(jwtPayload) ||
    getNonEmptyString(getParam("name")) ||
    getNonEmptyString(getParam("name_th")) ||
    getNonEmptyString(getParam("fullname")) ||
    getNonEmptyString(getParam("username")) ||
    "";

  const username =
    getNonEmptyString(profileData?.username) ||
    getNonEmptyString(jwtPayload?.username) ||
    getNonEmptyString(getParam("username")) ||
    "";

  const cid =
    getNonEmptyString(profileData?.cid) ||
    getNonEmptyString(profileData?.provider_id) ||
    getNonEmptyString(jwtPayload?.cid) ||
    getNonEmptyString(jwtPayload?.pid) ||
    getNonEmptyString(jwtPayload?.sub) ||
    getNonEmptyString(getParam("cid")) ||
    "";

  const role =
    getNonEmptyString(org0?.position_type) ||
    getNonEmptyString(profileData?.profession_name_th) ||
    getNonEmptyString(profileData?.profession_name) ||
    getNonEmptyString(jwtPayload?.role) ||
    getNonEmptyString(jwtPayload?.position) ||
    getNonEmptyString(getParam("role")) ||
    "พยาบาลประสานงาน";

  const hospcode =
    getNonEmptyString(org0?.hcode) ||
    getNonEmptyString(org0?.hospcode) ||
    getNonEmptyString(profileData?.hospcode) ||
    getNonEmptyString(jwtPayload?.hospcode) ||
    getNonEmptyString(getParam("hospcode")) ||
    "10664";

  const providerId =
    getNonEmptyString(profileData?.provider_id) ||
    getNonEmptyString(jwtPayload?.provider_id) ||
    "";

  return {
    token,
    providerProfile,
    jwtPayload,
    name,
    username,
    cid,
    role,
    hospcode,
    providerId,
  };
}

/** ดึงชื่อผู้ใช้จาก object ทั่วไป (Provider Profile หรือ JWT Payload) */
export function extractNameFromObject(
  obj: Record<string, unknown> | null | undefined,
): string {
  if (!obj) return "";

  const firstName =
    getNonEmptyString(obj.firstname_th) ||
    getNonEmptyString(obj.first_name_th) ||
    getNonEmptyString(obj.first_name) ||
    getNonEmptyString(obj.firstname);
  const lastName =
    getNonEmptyString(obj.lastname_th) ||
    getNonEmptyString(obj.last_name_th) ||
    getNonEmptyString(obj.last_name) ||
    getNonEmptyString(obj.lastname);
  const title =
    getNonEmptyString(obj.title_th) ||
    getNonEmptyString(obj.pre_name_th) ||
    getNonEmptyString(obj.prename) ||
    getNonEmptyString(obj.title);

  const composed = [title, firstName, lastName].filter(Boolean).join(" ").trim();
  if (composed) return composed;

  return (
    getNonEmptyString(obj.name_th) ||
    getNonEmptyString(obj.name) ||
    getNonEmptyString(obj.fullname) ||
    getNonEmptyString(obj.fullname_th) ||
    getNonEmptyString(obj.full_name) ||
    getNonEmptyString(obj.display_name) ||
    getNonEmptyString(obj.thai_name) ||
    getNonEmptyString(obj.username) ||
    ""
  );
}

/** ดึงชื่อผู้ใช้จาก Provider Profile (รองรับทั้งโครงสร้างแบนและที่ห่อใน data) */
export function extractNameFromProfile(
  profile: Record<string, unknown> | null | undefined,
): string {
  if (!profile) return "";
  const direct = extractNameFromObject(profile);
  if (direct) return direct;
  if (profile.data && typeof profile.data === "object" && !Array.isArray(profile.data)) {
    return extractNameFromObject(profile.data as Record<string, unknown>);
  }
  return "";
}

/**
 * ตรวจสอบว่า JWT payload มีฟิลด์ชื่อผู้ใช้ที่ Backend ใช้ดึงไปใส่ firststaff หรือไม่
 * (name, name_th, fullname, username)
 */
export function inspectJwtUserName(
  token: string | null | undefined,
): JwtUserNameCheckResult {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return {
      isJwt: false,
      hasUserName: false,
      matchedField: null,
      userName: "",
      payload: null,
    };
  }

  for (const field of BACKEND_JWT_NAME_FIELDS) {
    const val = getNonEmptyString(payload[field]);
    if (val && val !== "-") {
      return {
        isJwt: true,
        hasUserName: true,
        matchedField: field,
        userName: val,
        payload,
      };
    }
  }

  return {
    isJwt: true,
    hasUserName: false,
    matchedField: null,
    userName: "",
    payload,
  };
}

/** ดึงชื่อผู้ใช้จาก JWT payload โดยยึดลำดับฟิลด์ที่ Backend ใช้ก่อน แล้วจึง fallback ฟิลด์อื่น */
export function extractNameFromJwtPayload(
  payload: Record<string, unknown> | null | undefined,
): string {
  if (!payload) return "";
  for (const field of BACKEND_JWT_NAME_FIELDS) {
    const val = getNonEmptyString(payload[field]);
    if (val && val !== "-") return val;
  }
  return extractNameFromObject(payload);
}

/** แจ้งเตือนใน Console (ครั้งเดียวต่อ token) หาก JWT ไม่มีฟิลด์ชื่อผู้ใช้ที่ Backend รองรับ */
export function warnIfJwtMissingUserName(
  token: string | null | undefined,
  context = "Auth",
): JwtUserNameCheckResult {
  const result = inspectJwtUserName(token);
  if (!token || result.hasUserName || warnedTokens.has(token)) {
    return result;
  }

  warnedTokens.add(token);
  if (!result.isJwt) {
    console.warn(
      `[${context}] Token ที่ส่งไป API ไม่ใช่รูปแบบ JWT — Backend จะไม่สามารถอ่านชื่อผู้ใช้ได้และอาจบันทึก firststaff เป็น "-"`,
    );
  } else {
    console.warn(
      `[${context}] JWT payload ไม่มีฟิลด์ชื่อผู้ใช้ (${BACKEND_JWT_NAME_FIELDS.join(", ")}) — Backend จะบันทึก firststaff เป็น "-"`,
      { payloadKeys: result.payload ? Object.keys(result.payload) : [] },
    );
  }
  return result;
}

/** สร้าง Session JWT Token (กรณี Login Provider ไม่ได้แนบ token มา) พร้อมฟิลด์ชื่อผู้ใช้ครบถ้วน */
export function createSessionJwt(params: {
  cid?: string;
  name?: string;
  username?: string;
  role?: string;
  hospcode?: string;
  expSeconds?: number;
}): string {
  const header = encodeBase64UrlUtf8(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const resolvedName =
    getNonEmptyString(params.name) ||
    getNonEmptyString(params.username) ||
    "เจ้าหน้าที่";

  const payloadObj: Record<string, unknown> = {
    cid: params.cid || "unknown",
    name: resolvedName,
    name_th: resolvedName,
    fullname: resolvedName,
    role: params.role || "staff",
    hospcode: params.hospcode || "10664",
    exp: Math.floor(Date.now() / 1000) + (params.expSeconds ?? 86400 * 7),
  };

  if (getNonEmptyString(params.username)) {
    payloadObj.username = getNonEmptyString(params.username);
  }

  const payload = encodeBase64UrlUtf8(JSON.stringify(payloadObj));
  return `${header}.${payload}.moph_session_sig`;
}
