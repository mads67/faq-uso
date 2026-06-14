import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateToken } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  return NextResponse.json({ token: generateToken() });
}
