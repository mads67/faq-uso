import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateToken } from "@/lib/admin-auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !validateToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") || "csv";

  // Fetch all data
  const { data: respuestas, error: rErr } = await supabaseAdmin
    .from("faq_respuestas")
    .select("id, nombre, correo, unidad, cargo, cargo_otro, modo, sugerencias, created_at")
    .order("created_at", { ascending: false });

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const ids = respuestas.map((r: { id: number }) => r.id);

  const { data: preguntas } = await supabaseAdmin
    .from("faq_preguntas")
    .select("respuesta_id, numero, pregunta, respuesta, categoria")
    .in("respuesta_id", ids);

  const { data: documentos } = await supabaseAdmin
    .from("faq_documentos")
    .select("respuesta_id, nombre_archivo, indicaciones, created_at")
    .in("respuesta_id", ids);

  // Build rows
  const rows: Record<string, string | number | null>[] = [];

  for (const r of respuestas) {
    const relatedPreguntas = (preguntas || []).filter(
      (p: { respuesta_id: number }) => p.respuesta_id === r.id
    );
    const relatedDocs = (documentos || []).filter(
      (d: { respuesta_id: number }) => d.respuesta_id === r.id
    );

    if (relatedPreguntas.length > 0) {
      for (const p of relatedPreguntas) {
        rows.push({
          ID: r.id,
          Nombre: r.nombre,
          Correo: r.correo,
          Unidad: r.unidad,
          Cargo: r.cargo_otro || r.cargo,
          Modo: r.modo,
          Sugerencias: r.sugerencias || "",
          "Fecha envio": r.created_at,
          "Num. pregunta": p.numero,
          Pregunta: p.pregunta,
          Respuesta: p.respuesta,
          Categoria: p.categoria || "",
          Documento: "",
          Indicaciones: "",
        });
      }
    } else if (relatedDocs.length > 0) {
      for (const d of relatedDocs) {
        rows.push({
          ID: r.id,
          Nombre: r.nombre,
          Correo: r.correo,
          Unidad: r.unidad,
          Cargo: r.cargo_otro || r.cargo,
          Modo: r.modo,
          Sugerencias: r.sugerencias || "",
          "Fecha envio": r.created_at,
          "Num. pregunta": "",
          Pregunta: "",
          Respuesta: "",
          Categoria: "",
          Documento: d.nombre_archivo,
          Indicaciones: d.indicaciones || "",
        });
      }
    } else {
      rows.push({
        ID: r.id,
        Nombre: r.nombre,
        Correo: r.correo,
        Unidad: r.unidad,
        Cargo: r.cargo_otro || r.cargo,
        Modo: r.modo,
        Sugerencias: r.sugerencias || "",
        "Fecha envio": r.created_at,
        "Num. pregunta": "",
        Pregunta: "",
        Respuesta: "",
        Categoria: "",
        Documento: "",
        Indicaciones: "",
      });
    }
  }

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Respuestas");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="faq-export-${Date.now()}.xlsx"`,
      },
    });
  }

  // CSV fallback
  const headers = [
    "ID", "Nombre", "Correo", "Unidad", "Cargo", "Modo", "Sugerencias",
    "Fecha envio", "Num. pregunta", "Pregunta", "Respuesta", "Categoria",
    "Documento", "Indicaciones",
  ];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="faq-export-${Date.now()}.csv"`,
    },
  });
}
