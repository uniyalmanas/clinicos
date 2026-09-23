import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET_KEY ||
  "clinicos-super-secret-production-jwt-key-change-in-prod-2026";

export interface TokenPayload {
  sub: string;
  role: string;
  clinic_id?: string | null;
  phone?: string;
  full_name?: string;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

export function signAccessToken(payload: {
  sub: string;
  role: string;
  clinic_id?: string | null;
  phone?: string;
  full_name?: string;
}): string {
  return jwt.sign(
    {
      sub: payload.sub,
      role: payload.role,
      clinic_id: payload.clinic_id || null,
      phone: payload.phone,
      full_name: payload.full_name,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256",
    }
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}
