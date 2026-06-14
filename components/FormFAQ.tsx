"use client";

import { useState, useRef, useCallback } from "react";

const CATS = [
  "Matrícula / Inscripción",
  "Pagos y aranceles",
  "Trámites académicos",
  "Becas y apoyo estudiantil",
  "Horarios y calendarios",
  "Información general",
  "Otra",
];

type Pregunta = { id: number; pregunta: string; respuesta: string; categoria: string };
type FileItem = { id: string; file: File; progress: number; status: "pending" | "uploading" | "done" | "error" };

export default function FormFAQ() {
  const [modo, setModo] = useState<"manual" | "doc">("manual");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [unidad, setUnidad] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargoOtro, setCargoOtro] = useState("");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([{ id: 1, pregunta: "", respuesta: "", categoria: "" }]);
  const [nextId, setNextId] = useState(2);
  const [archivos, setArchivos] = useState<FileItem[]>([]);
  const [indicaciones, setIndicaciones] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [progLabel, setProgLabel] = useState("");
  const [progPct, setProgPct] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Preguntas ──
  const addPregunta = () => {
    setPreguntas(p => [...p, { id: nextId, pregunta: "", respuesta: "", categoria: "" }]);
    setNextId(n => n + 1);
  };
  const delPregunta = (id: number) => setPreguntas(p => p.filter(q => q.id !== id));
  const updatePregunta = (id: number, field: keyof Pregunta, val: string) =>
    setPreguntas(p => p.map(q => q.id === id ? { ...q, [field]: val } : q));

  // ── Archivos ──
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const items: FileItem[] = arr
      .filter(f => {
        if (f.size > 10 * 1024 * 1024) { setError(`"${f.name}" supera 10 MB.`); return false; }
        return true;
      })
      .map(f => ({ id: crypto.randomUUID(), file: f, progress: 0, status: "pending" as const }));
    setArchivos(a => [...a, ...items]);
  }, []);

  const removeFile = (id: string) => setArchivos(a => a.filter(f => f.id !== id));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Validación ──
  const validate = () => {
    if (!nombre.trim()) { setError("Ingresa tu nombre completo."); return false; }
    if (!correo.trim() || !correo.includes("@")) { setError("Ingresa un correo válido."); return false; }
    if (!unidad.trim()) { setError("Ingresa el nombre de tu unidad."); return false; }
    if (!cargo) { setError("Selecciona tu cargo."); return false; }
    if (cargo === "Otro" && !cargoOtro.trim()) { setError("Especifica tu cargo."); return false; }
    if (modo === "manual") {
      if (!preguntas.length) { setError("Agrega al menos una pregunta."); return false; }
      for (let i = 0; i < preguntas.length; i++) {
        if (!preguntas[i].pregunta.trim()) { setError(`La pregunta ${i + 1} está vacía.`); return false; }
        if (!preguntas[i].respuesta.trim()) { setError(`La respuesta ${i + 1} está vacía.`); return false; }
      }
    }
    if (modo === "doc" && !archivos.length) { setError("Adjunta al menos un documento."); return false; }
    return true;
  };

  // ── Envío ──
  const enviar = async () => {
    setError("");
    if (!validate()) return;
    setSending(true);

    try {
      // 1. Submit respondente + preguntas
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, correo, unidad, cargo,
          cargo_otro: cargo === "Otro" ? cargoOtro : undefined,
          modo,
          preguntas: modo === "manual" ? preguntas : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      // 2. Upload files if doc mode
      if (modo === "doc") {
        const total = archivos.length;
        let done = 0;
        for (const item of archivos) {
          setProgLabel(`Subiendo ${done + 1} de ${total}: ${item.file.name}`);
          setArchivos(a => a.map(f => f.id === item.id ? { ...f, status: "uploading" } : f));
          const fd = new FormData();
          fd.append("file", item.file);
          fd.append("respuesta_id", data.id);
          fd.append("indicaciones", indicaciones);
          const r = await fetch("/api/upload", { method: "POST", body: fd });
          const d = await r.json();
          setArchivos(a => a.map(f => f.id === item.id
            ? { ...f, status: r.ok ? "done" : "error", progress: 100 }
            : f));
          done++;
          setProgPct(Math.round(done / total * 100));
          if (!r.ok) console.error("Upload error:", d.error);
        }
        const ok = archivos.filter((_, i) => i < done).length;
        setSuccess(`Se subieron ${done} de ${total} archivo(s). ¡Gracias por tu aporte!`);
      } else {
        setSuccess(`Se registraron ${preguntas.length} pregunta(s). ¡Gracias por tu aporte!`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setNombre(""); setCorreo(""); setUnidad(""); setCargo(""); setCargoOtro("");
    setPreguntas([{ id: 1, pregunta: "", respuesta: "", categoria: "" }]);
    setNextId(2); setArchivos([]); setIndicaciones("");
    setError(""); setProgLabel(""); setProgPct(0); setSuccess(null);
    setModo("manual");
  };

  // ── UI helpers ──
  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  if (success) return (
    <div className="text-center py-16 px-8">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-semibold text-green-700 mb-2">¡Respuesta enviada!</h2>
      <p className="text-gray-500 text-sm leading-relaxed">{success}</p>
      <button onClick={resetForm}
        className="mt-6 px-6 py-2.5 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition">
        Enviar otra respuesta
      </button>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* DATOS GENERALES */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b-2 border-blue-100 pb-1.5 mb-5">
          Datos generales
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre completo <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="Ej. María López"
              value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Correo electrónico <span className="text-red-500">*</span></label>
            <input type="email" className={inputCls} placeholder="nombre@uso.edu.sv"
              value={correo} onChange={e => setCorreo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Unidad o área <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="Ej. Registro Académico"
              value={unidad} onChange={e => setUnidad(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Cargo <span className="text-red-500">*</span></label>
            <select className={inputCls} value={cargo} onChange={e => { setCargo(e.target.value); setCargoOtro(""); }}>
              <option value="">— Selecciona —</option>
              {["Jefe de unidad / Director","Personal administrativo","Docente","Asistente / Auxiliar","Otro"]
                .map(o => <option key={o}>{o}</option>)}
            </select>
            {cargo === "Otro" && (
              <input className={`${inputCls} mt-2`} placeholder="Especifica tu cargo…"
                value={cargoOtro} onChange={e => setCargoOtro(e.target.value)} />
            )}
          </div>
        </div>
      </section>

      {/* MODO */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b-2 border-blue-100 pb-1.5 mb-5">
          ¿Cómo deseas registrar las preguntas?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {([["manual","✏️","Agregar preguntas\nuna a una"],["doc","📄","Cargar\ndocumentos"]] as const).map(([m,ic,lbl]) => (
            <button key={m} type="button" onClick={() => setModo(m)}
              className={`border-2 rounded-xl p-4 text-center text-sm font-medium transition cursor-pointer
                ${modo === m ? "border-blue-700 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-700"}`}>
              <span className="text-2xl block mb-1.5">{ic}</span>
              {lbl.split("\n").map((l,i) => <span key={i} className="block">{l}</span>)}
            </button>
          ))}
        </div>
      </section>

      {/* PANEL MANUAL */}
      {modo === "manual" && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b-2 border-blue-100 pb-1.5 mb-5">
            Preguntas y respuestas
          </h2>
          <div className="space-y-3">
            {preguntas.map((q, i) => (
              <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
                  Pregunta {i + 1}
                </div>
                {preguntas.length > 1 && (
                  <button type="button" onClick={() => delPregunta(q.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded px-1.5 py-0.5 text-sm transition">
                    ✕
                  </button>
                )}
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Pregunta <span className="text-red-500">*</span></label>
                    <textarea rows={2} className={inputCls} placeholder="Escribe la pregunta frecuente que recibe tu área…"
                      value={q.pregunta} onChange={e => updatePregunta(q.id, "pregunta", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Respuesta sugerida <span className="text-red-500">*</span></label>
                    <textarea rows={3} className={inputCls} placeholder="Escribe la respuesta que normalmente das…"
                      value={q.respuesta} onChange={e => updatePregunta(q.id, "respuesta", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Categoría</label>
                    <select className={inputCls} value={q.categoria} onChange={e => updatePregunta(q.id, "categoria", e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addPregunta}
            className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-blue-700 text-sm font-semibold hover:border-blue-400 hover:bg-blue-50 transition">
            + Agregar pregunta
          </button>
        </section>
      )}

      {/* PANEL DOCUMENTO */}
      {modo === "doc" && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-800 border-b-2 border-blue-100 pb-1.5 mb-5">
            Documentos
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Sube uno o varios archivos (Word, PDF o Excel). Máx. 10 MB por archivo.
          </p>
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition relative
              ${dragging ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" multiple className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={e => e.target.files && addFiles(e.target.files)} />
            <span className="text-3xl block mb-2">📂</span>
            <p className="text-sm text-gray-500">
              <strong className="text-blue-700">Haz clic o arrastra archivos aquí</strong>
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, Word o Excel · hasta 10 MB por archivo</p>
          </div>

          {/* File list */}
          {archivos.length > 0 && (
            <div className="mt-3 space-y-2">
              {archivos.map(f => (
                <div key={f.id} className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm
                  ${f.status === "error" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                  <span className="flex-1 truncate text-gray-700" title={f.file.name}>{f.file.name}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {(f.file.size / 1024).toFixed(0)} KB
                  </span>
                  {f.status === "done" && <span className="text-green-600 text-xs">✓</span>}
                  {f.status === "error" && <span className="text-red-600 text-xs">✗</span>}
                  {f.status === "pending" && (
                    <button type="button" onClick={() => removeFile(f.id)}
                      className="text-gray-400 hover:text-red-500 transition text-xs px-1">✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <label className={labelCls}>Indicaciones adicionales</label>
            <textarea rows={2} className={inputCls}
              placeholder="Ej. El primer archivo contiene las preguntas de matrícula…"
              value={indicaciones} onChange={e => setIndicaciones(e.target.value)} />
          </div>

          {/* Upload progress */}
          {progLabel && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">{progLabel}</p>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-700 rounded-full transition-all duration-300"
                  style={{ width: `${progPct}%` }} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* SUBMIT */}
      <button type="button" onClick={enviar} disabled={sending}
        className="w-full py-3.5 bg-blue-800 text-white rounded-xl font-semibold text-base
          hover:bg-blue-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition">
        {sending ? "Enviando…" : "Enviar respuesta"}
      </button>
    </div>
  );
}
