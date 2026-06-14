import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateToken } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !validateToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  const name = req.nextUrl.searchParams.get("name") || "documento";

  if (!path) {
    return NextResponse.json({ error: "Falta el parámetro path" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from("faq-documentos")
    .download(path);

  if (error || !data) {
    return NextResponse.json({ error: "Error al descargar el archivo" }, { status: 500 });
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
