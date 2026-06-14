const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function generateToken(): string {
  const ts = Date.now().toString(36);
  const raw = `${ts}:${ADMIN_PASSWORD}`;
  return Buffer.from(raw).toString("base64");
}

export function validateToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [, pwd] = decoded.split(":");
    return pwd === ADMIN_PASSWORD;
  } catch {
    return false;
  }
}
