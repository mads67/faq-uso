import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateToken } from "@/lib/admin-auth";
import ExcelJS from "exceljs";

const BUCKET = "faq-documentos";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !validateToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") || "csv";

  // ── Formulario personal ──
  const { data: respuestas, error: rErr } = await supabaseAdmin
    .from("faq_respuestas")
    .select("id, nombre, correo, unidad, cargo, cargo_otro, sugerencias, created_at")
    .order("created_at", { ascending: false });

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const ids = (respuestas || []).map((r: { id: string }) => r.id);

  const { data: preguntas } = await supabaseAdmin
    .from("faq_preguntas")
    .select("respuesta_id, numero, pregunta, respuesta, categoria")
    .in("respuesta_id", ids.length ? ids : ["__none__"]);

  const { data: documentos } = await supabaseAdmin
    .from("faq_documentos")
    .select("respuesta_id, nombre_archivo, storage_path, indicaciones, created_at")
    .in("respuesta_id", ids.length ? ids : ["__none__"]);

  // ── Cuestionario estudiantes ──
  const { data: cuestionarios, error: cErr } = await supabaseAdmin
    .from("cuestionario_respuestas")
    .select("id, condicion, año_academico, medios, tramites, created_at")
    .order("created_at", { ascending: false });

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  type CuestionarioRow = {
    id: string; condicion: string; año_academico: string | null;
    medios: string[]; tramites: string[]; created_at: string;
  };
  const cuestionariosTyped = (cuestionarios ?? []) as unknown as CuestionarioRow[];

  const cuestionarioIds = cuestionariosTyped.map((c) => c.id);

  const { data: comentarios } = await supabaseAdmin
    .from("cuestionario_comentarios")
    .select("respuesta_id, numero, comentario")
    .in("respuesta_id", cuestionarioIds.length ? cuestionarioIds : ["__none__"])
    .order("numero", { ascending: true });

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("es-SV", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();

    const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF111827" } };
    const headerAlign = { horizontal: "center" as const, vertical: "middle" as const };
    const evenFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF3F4F6" } };

    const applyHeaderStyle = (row: ExcelJS.Row) => {
      row.font = headerFont;
      row.fill = headerFill;
      row.alignment = headerAlign;
      row.height = 20;
    };

    const applyStripes = (ws: ExcelJS.Worksheet, endRow: number) => {
      for (let r = 2; r <= endRow; r++) {
        if (r % 2 === 0) {
          ws.getRow(r).eachCell((cell) => { cell.fill = evenFill; });
        }
      }
    };

    // ── Sheet 1: Respondentes (personal) ──
    const wsResp = wb.addWorksheet("Personal — Respondentes");
    wsResp.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Nombre", key: "nombre", width: 26 },
      { header: "Correo", key: "correo", width: 30 },
      { header: "Unidad", key: "unidad", width: 26 },
      { header: "Cargo", key: "cargo", width: 22 },
      { header: "Sugerencias", key: "sugerencias", width: 36 },
      { header: "Fecha envio", key: "fecha", width: 20 },
    ];
    for (const r of respuestas || []) {
      wsResp.addRow({
        id: r.id,
        nombre: r.nombre,
        correo: r.correo || "",
        unidad: r.unidad,
        cargo: (r as any).cargo_otro || r.cargo,
        sugerencias: r.sugerencias || "",
        fecha: fmtDate(r.created_at),
      });
    }
    applyHeaderStyle(wsResp.getRow(1));
    applyStripes(wsResp, wsResp.rowCount);

    // ── Sheet 2: Preguntas ──
    if (preguntas && preguntas.length > 0) {
      const wsPreg = wb.addWorksheet("Personal — Preguntas");
      wsPreg.columns = [
        { header: "ID respuesta", key: "idRespuesta", width: 14 },
        { header: "#", key: "numero", width: 6 },
        { header: "Pregunta", key: "pregunta", width: 52 },
        { header: "Respuesta", key: "respuesta", width: 52 },
        { header: "Categoria", key: "categoria", width: 22 },
      ];
      for (const p of preguntas) {
        wsPreg.addRow({
          idRespuesta: p.respuesta_id,
          numero: p.numero,
          pregunta: p.pregunta,
          respuesta: p.respuesta,
          categoria: p.categoria || "",
        });
      }
      applyHeaderStyle(wsPreg.getRow(1));
      applyStripes(wsPreg, wsPreg.rowCount);
    }

    // ── Sheet 3: Documentos ──
    if (documentos && documentos.length > 0) {
      const wsDoc = wb.addWorksheet("Personal — Documentos");
      wsDoc.columns = [
        { header: "ID respuesta", key: "idRespuesta", width: 14 },
        { header: "Archivo", key: "archivo", width: 40 },
        { header: "Link descarga", key: "link", width: 18 },
        { header: "Indicaciones", key: "indicaciones", width: 30 },
        { header: "Fecha subida", key: "fecha", width: 20 },
      ];

      for (const d of documentos) {
        let link = "";
        try {
          const { data } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(d.storage_path, 60 * 60 * 24 * 7);
          link = data?.signedUrl || "";
        } catch { /* fallback */ }

        wsDoc.addRow({
          idRespuesta: d.respuesta_id,
          archivo: d.nombre_archivo,
          link,
          indicaciones: d.indicaciones || "",
          fecha: fmtDate(d.created_at),
        });
      }
      applyHeaderStyle(wsDoc.getRow(1));
      applyStripes(wsDoc, wsDoc.rowCount);

      for (let r = 2; r <= wsDoc.rowCount; r++) {
        const linkCell = wsDoc.getCell(r, 3);
        if (linkCell.value) {
          linkCell.value = { text: "Descargar", hyperlink: linkCell.value as string };
          linkCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
          linkCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } };
          linkCell.alignment = { horizontal: "center", vertical: "middle" };
          linkCell.border = {
            top: { style: "thin", color: { argb: "FF374151" } },
            left: { style: "thin", color: { argb: "FF374151" } },
            bottom: { style: "thin", color: { argb: "FF374151" } },
            right: { style: "thin", color: { argb: "FF374151" } },
          };
        }
      }
    }

    // ── Sheet 4: Cuestionario estudiantes ──
    if (cuestionariosTyped.length > 0) {
      const wsCuest = wb.addWorksheet("Estudiantes — Cuestionario");
      wsCuest.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Condicion", key: "condicion", width: 14 },
        { header: "Año academico", key: "año", width: 18 },
        { header: "Medios de consulta", key: "medios", width: 44 },
        { header: "Tramites consultados", key: "tramites", width: 44 },
        { header: "Fecha envio", key: "fecha", width: 20 },
      ];
      for (const c of cuestionariosTyped) {
        wsCuest.addRow({
          id: c.id,
          condicion: c.condicion,
          año: c.año_academico || "",
          medios: Array.isArray(c.medios) ? c.medios.join(" | ") : c.medios,
          tramites: Array.isArray(c.tramites) ? c.tramites.join(" | ") : c.tramites,
          fecha: fmtDate(c.created_at),
        });
      }
      applyHeaderStyle(wsCuest.getRow(1));
      applyStripes(wsCuest, wsCuest.rowCount);
    }

    // ── Sheet 5: Comentarios estudiantes ──
    if (comentarios && comentarios.length > 0) {
      const wsCom = wb.addWorksheet("Estudiantes — Comentarios");
      wsCom.columns = [
        { header: "ID cuestionario", key: "idCuest", width: 14 },
        { header: "#", key: "numero", width: 6 },
        { header: "Comentario", key: "comentario", width: 70 },
      ];
      for (const c of comentarios) {
        wsCom.addRow({
          idCuest: c.respuesta_id,
          numero: c.numero,
          comentario: c.comentario,
        });
      }
      applyHeaderStyle(wsCom.getRow(1));
      applyStripes(wsCom, wsCom.rowCount);
    }

    // ── Sheet 6: Resumen ──
    const wsSum = wb.addWorksheet("Resumen");
    wsSum.columns = [
      { header: "Metrica", key: "metrica", width: 36 },
      { header: "Valor", key: "valor", width: 12 },
    ];
    wsSum.addRow({ metrica: "Formulario personal — envios", valor: (respuestas || []).length });
    wsSum.addRow({ metrica: "Formulario personal — preguntas", valor: (preguntas || []).length });
    wsSum.addRow({ metrica: "Formulario personal — documentos", valor: (documentos || []).length });
    wsSum.addRow({});
    wsSum.addRow({ metrica: "Cuestionario estudiantes — envios", valor: cuestionariosTyped.length });
    wsSum.addRow({ metrica: "Cuestionario estudiantes — comentarios", valor: (comentarios || []).length });
    wsSum.addRow({});
    wsSum.addRow({ metrica: "Exportado el", valor: new Date().toLocaleString("es-SV") });
    applyHeaderStyle(wsSum.getRow(1));
    for (let r = 2; r <= wsSum.rowCount; r++) {
      const cell = wsSum.getCell(r, 1);
      cell.font = { bold: true, size: 11 };
    }

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="chatbot-export-${Date.now()}.xlsx"`,
      },
    });
  }

  // ── CSV fallback (solo personal) ──
  const csvHeaders = ["ID", "Nombre", "Correo", "Unidad", "Cargo", "Sugerencias", "Fecha envio"];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const respRows = (respuestas || []).map((r: Record<string, unknown>) => ({
    ID: r.id,
    Nombre: r.nombre as string,
    Correo: (r.correo as string) || "",
    Unidad: r.unidad as string,
    Cargo: ((r as { cargo_otro?: string | null; cargo?: string }).cargo_otro || r.cargo) as string,
    Sugerencias: (r.sugerencias as string) || "",
    "Fecha envio": fmtDate(r.created_at as string),
  }));
  const csv = [
    csvHeaders.join(","),
    ...respRows.map((r: Record<string, unknown>) => csvHeaders.map((h) => esc(r[h])).join(",")),
  ].join("\n");

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chatbot-export-${Date.now()}.csv"`,
    },
  });
}
