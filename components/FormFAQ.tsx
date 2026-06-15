"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IconCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconCheckCircle = ({ size = 52 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconPen = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);
const IconFileText = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);
const IconUpload = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IconX = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconPlus = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconTrash = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconAlertCircle = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconAlertTriangle = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconSend = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconRefresh = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v6h6" />
    <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
  </svg>
);
const IconMessage = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconSpinner = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IconUser = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconFile = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────

const CATS = [
  "Matrícula / Inscripción",
  "Pagos y aranceles",
  "Trámites académicos",
  "Becas y apoyo estudiantil",
  "Horarios y calendarios",
  "Información general",
  "Otra",
];

const CARGOS = [
  "Jefe de unidad / Director",
  "Personal administrativo",
  "Docente",
  "Asistente / Auxiliar",
  "Otro",
];

type Pregunta = { id: number; pregunta: string; respuesta: string; categoria: string; categoriaOtro: string };
type FileItem = { id: string; file: File; progress: number; status: "pending" | "uploading" | "done" | "error" };

export default function FormFAQ({ initialSession }: { initialSession?: string | null }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [unidad, setUnidad] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargoOtro, setCargoOtro] = useState("");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([{ id: 1, pregunta: "", respuesta: "", categoria: "", categoriaOtro: "" }]);
  const [nextId, setNextId] = useState(2);
  const [archivos, setArchivos] = useState<FileItem[]>([]);
  const [indicaciones, setIndicaciones] = useState("");
  const [sugerencias, setSugerencias] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [progLabel, setProgLabel] = useState("");
  const [progPct, setProgPct] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const correoRef = useRef<HTMLInputElement>(null);
  const unidadRef = useRef<HTMLInputElement>(null);
  const cargoRef = useRef<HTMLSelectElement>(null);
  const cargoOtroRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // ── Session: URL param + localStorage auto-save ──
  const STORAGE_KEY = sessionId ? `faq_draft_${sessionId}` : "";

  useEffect(() => {
    const s = initialSession || crypto.randomUUID();
    setSessionId(s);
    const url = new URL(window.location.href);
    if (!url.searchParams.has("s")) {
      url.searchParams.set("s", s);
      window.history.replaceState({}, "", url.toString());
    }
  }, [initialSession]);

  // Restore draft on mount
  useEffect(() => {
    if (!sessionId) return;
    const saved = localStorage.getItem(`faq_draft_${sessionId}`);
    if (!saved) return;
    try {
      const st = JSON.parse(saved);
      if (st.nombre !== undefined) setNombre(st.nombre);
      if (st.correo !== undefined) setCorreo(st.correo);
      if (st.unidad !== undefined) setUnidad(st.unidad);
      if (st.cargo !== undefined) setCargo(st.cargo);
      if (st.cargoOtro !== undefined) setCargoOtro(st.cargoOtro);
      if (st.preguntas !== undefined) setPreguntas(st.preguntas);
      if (st.nextId !== undefined) setNextId(st.nextId);
      if (st.sugerencias !== undefined) setSugerencias(st.sugerencias);
      if (st.indicaciones !== undefined) setIndicaciones(st.indicaciones);
    } catch { /* ignore corrupt draft */ }
  }, [sessionId]);

  // Auto-save draft (debounced 1.5s)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!sessionId) return;
    const draft = {
      nombre, correo, unidad, cargo, cargoOtro,
      preguntas, nextId, sugerencias, indicaciones,
    };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(`faq_draft_${sessionId}`, JSON.stringify(draft));
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [
    sessionId, nombre, correo, unidad, cargo, cargoOtro,
    preguntas, nextId, sugerencias, indicaciones,
  ]);

  // ── Preguntas ──
  const addPregunta = () => {
    setPreguntas(p => [...p, { id: nextId, pregunta: "", respuesta: "", categoria: "", categoriaOtro: "" }]);
    setNextId(n => n + 1);
    setTimeout(() => {
      const cards = document.querySelectorAll("[data-qs-card]");
      const last = cards[cards.length - 1] as HTMLElement | undefined;
      last?.querySelector("textarea")?.focus();
      last?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };
  const delPregunta = (id: number) => setPreguntas(p => p.filter(q => q.id !== id));
  const updatePregunta = (id: number, field: keyof Pregunta, val: string) =>
    setPreguntas(p => p.map(q => q.id === id ? { ...q, [field]: val } : q));

  // ── Archivos ──
  const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

  const addFiles = useCallback((files: FileList | File[]) => {
    setError("");
    const items: FileItem[] = Array.from(files)
      .filter(f => {
        const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "");
        if (!allowedExtensions.includes(ext)) {
          setError(`"${f.name}" no es un tipo permitido (PDF, Word o Excel).`);
          return false;
        }
        if (f.size > 50 * 1024 * 1024) { setError(`"${f.name}" supera 50 MB.`); return false; }
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

  // ── Focus first error ──
  useEffect(() => {
    if (!error) return;
    const sel = "[data-field]:invalid, [data-field][aria-invalid=true]";
    const el = document.querySelector<HTMLElement>(sel)
      || document.querySelector<HTMLElement>("[data-field]");
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  // ── Validación ──
  const validate = () => {
    if (!nombre.trim()) return setError("Ingresa tu nombre completo."), false;
    if (!unidad.trim()) return setError("Ingresa el nombre de tu unidad."), false;
    if (!cargo) return setError("Selecciona tu cargo."), false;
    if (cargo === "Otro" && !cargoOtro.trim()) return setError("Especifica tu cargo."), false;
    if (!preguntas.length && !archivos.length) return setError("Agrega al menos una pregunta o adjunta un documento."), false;
    if (!archivos.length) {
      for (let i = 0; i < preguntas.length; i++) {
        if (!preguntas[i].pregunta.trim()) return setError(`La pregunta ${i + 1} está vacía.`), false;
        if (!preguntas[i].respuesta.trim()) return setError(`La respuesta ${i + 1} está vacía.`), false;
      }
    }
    return true;
  };

  const handleSubmitClick = () => {
    setError("");
    if (validate()) setShowConfirm(true);
  };

  // ── Construir resumen para el modal ──
  const resumenItems = () => {
    const items: { label: string; value: string }[] = [];
    items.push({ label: "Nombre", value: nombre });
    if (correo) items.push({ label: "Correo", value: correo });
    items.push({ label: "Unidad", value: unidad });
    items.push({ label: "Cargo", value: cargo === "Otro" ? cargoOtro : cargo });
    if (preguntas.length > 0) items.push({ label: "Preguntas", value: `${preguntas.length} pregunta(s)` });
    if (archivos.length > 0) items.push({ label: "Documentos", value: `${archivos.length} archivo(s)` });
    return items;
  };

  // ── Envio ──
  const enviar = async () => {
    setSending(true);
    try {
      const todasSugerencias = sugerencias.trim() || undefined;

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId || undefined,
          nombre, correo, unidad, cargo,
          cargo_otro: cargo === "Otro" ? cargoOtro : undefined,
          sugerencias: todasSugerencias,
          preguntas: preguntas
            .filter(p => p.pregunta.trim())
            .map(p => ({
              ...p,
              categoria: p.categoria === "Otra" && p.categoriaOtro.trim()
                ? p.categoriaOtro.trim() : (p.categoria || null),
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      const totalArchivos = archivos.length;
      let done = 0;

      if (totalArchivos > 0) {
        for (const item of archivos) {
          setProgLabel(`Subiendo ${done + 1} de ${totalArchivos}: ${item.file.name}`);
          setArchivos(a => a.map(f => f.id === item.id ? { ...f, status: "uploading" } : f));

          let uploadOk = false;
          try {
            // Paso 1: pide la signed URL al servidor (solo metadatos, sin el archivo)
            const r = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: item.file.name,
                fileType: item.file.type,
                fileSize: item.file.size,
                respuestaId: data.id,
              }),
            });
            if (!r.ok) throw new Error((await r.json()).error ?? "Error al obtener URL");
            const { signedUrl, path } = await r.json();

            // Paso 2: sube el archivo directo a Supabase desde el browser (sin pasar por Vercel)
            const putRes = await fetch(signedUrl, {
              method: "PUT",
              headers: { "Content-Type": item.file.type },
              body: item.file,
            });
            if (!putRes.ok) throw new Error("Fallo al subir el archivo a storage");

            // Paso 3: confirma el registro en BD solo si el upload fue exitoso
            const confirmRes = await fetch("/api/upload/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                respuestaId: data.id,
                fileName: item.file.name,
                storagePath: path,
                indicaciones,
              }),
            });
            if (!confirmRes.ok) throw new Error((await confirmRes.json()).error ?? "Error al confirmar");

            uploadOk = true;
          } catch (e) {
            console.error("Upload error:", e);
          }

          setArchivos(a => a.map(f => f.id === item.id
            ? { ...f, status: uploadOk ? "done" : "error", progress: 100 } : f));
          done++;
          setProgPct(Math.round(done / totalArchivos * 100));
        }
      }

      const partes: string[] = [];
      if (preguntas.length > 0) partes.push(`${preguntas.length} pregunta(s)`);
      if (done > 0) partes.push(`${done} archivo(s)`);
      setSuccess(`Se registraron ${partes.join(" y ")}. Gracias por tu aporte.`);

      if (sessionId) {
        localStorage.removeItem(`faq_draft_${sessionId}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSending(false);
    }
  };

  const confirmarEnvio = async () => {
    setShowConfirm(false);
    await enviar();
  };

  const resetForm = () => {
    setNombre(""); setCorreo(""); setUnidad(""); setCargo(""); setCargoOtro("");
    setPreguntas([{ id: 1, pregunta: "", respuesta: "", categoria: "", categoriaOtro: "" }]);
    setNextId(2); setArchivos([]); setIndicaciones("");
    setSugerencias("");
    setError(""); setProgLabel(""); setProgPct(0); setSuccess(null);
    if (sessionId) {
      localStorage.removeItem(`faq_draft_${sessionId}`);
    }
  };

  // ── Estilos ──
  const inputCls = "w-full px-3 sm:px-3.5 py-2 sm:py-2.5 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition";
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1";
  const sectionTitle = "flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-2 mb-5";

  // ── Success ──
  if (success) return (
    <div className="text-center py-16 px-8">
      <div className="flex justify-center mb-4 text-green-600">
        <IconCheckCircle size={56} />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Respuesta enviada</h2>
      <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{success}</p>
      <button onClick={resetForm}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition active:scale-[.97] cursor-pointer">
        <IconRefresh size={14} />
        Enviar otra respuesta
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modal de confirmación ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white p-5 w-full max-w-sm">
            <div className="flex items-start gap-3 mb-4">
              <span className="mt-0.5 text-amber-500 shrink-0">
                <IconAlertTriangle size={20} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Confirmar envio</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Revisa la informacion antes de continuar. Una vez enviada no podras modificarla.
                </p>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 p-3 space-y-1.5 mb-4">
              {resumenItems().map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 w-20 shrink-0 text-[11px] font-medium uppercase tracking-wide">{item.label}</span>
                  <span className="text-gray-800 font-medium truncate">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer active:scale-[.97]">
                Cancelar
              </button>
              <button
                onClick={confirmarEnvio}
                disabled={sending}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition active:scale-[.97] cursor-pointer">
                {sending ? <><IconSpinner size={13} /> Enviando...</> : <><IconSend size={13} /> Si, enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 sm:space-y-8">

        {/* ── DATOS GENERALES ── */}
        <section>
          <h2 className={sectionTitle}>
            <IconUser size={18} />
            Datos generales
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="grid gap-x-4 lg:grid-cols-2">
              <div>
                <label className={labelCls}>Nombre completo <span className="text-red-400">*</span></label>
                <input ref={nombreRef} data-field="nombre" className={inputCls} placeholder="Ej. Maria Lopez"
                  value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
              <div className="mt-3 sm:mt-0">
                <label className={labelCls}>
                  Correo electronico{" "}
                  <span className="text-gray-400 font-normal normal-case tracking-normal">(opcional)</span>
                </label>
                <input ref={correoRef} data-field="correo" type="email" className={inputCls} placeholder="nombre@uso.edu.sv"
                  value={correo} onChange={e => setCorreo(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-x-4 lg:grid-cols-2">
              <div>
                <label className={labelCls}>Unidad o area <span className="text-red-400">*</span></label>
                <input ref={unidadRef} data-field="unidad" className={inputCls} placeholder="Ej. Registro Academico"
                  value={unidad} onChange={e => setUnidad(e.target.value)} />
              </div>
              <div className="mt-3 sm:mt-0">
                <label className={labelCls}>Cargo <span className="text-red-400">*</span></label>
                <select ref={cargoRef} data-field="cargo" className={`${inputCls} cursor-pointer`} value={cargo} onChange={e => { setCargo(e.target.value); setCargoOtro(""); }}>
                  <option value="">— Selecciona —</option>
                  {CARGOS.map(o => <option key={o}>{o}</option>)}
                </select>
                {cargo === "Otro" && (
                  <input ref={cargoOtroRef} data-field="cargoOtro" className={`${inputCls} mt-2`} placeholder="Especifica tu cargo..."
                    value={cargoOtro} onChange={e => setCargoOtro(e.target.value)} />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── PREGUNTAS Y RESPUESTAS ── */}
        <section>
            <h2 className={sectionTitle}>
              <IconPen size={18} />
              Preguntas y respuestas
            </h2>
            <div className="space-y-3">
              {preguntas.map((q, i) => (
                <div key={q.id} data-qs-card className="bg-gray-100 border border-gray-300 p-3 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Pregunta {i + 1}
                    </span>
                    {preguntas.length > 1 && (
                      <button type="button" onClick={() => delPregunta(q.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition cursor-pointer">
                        <IconTrash size={12} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className={labelCls}>Pregunta <span className="text-red-400">*</span></label>
                      <textarea data-field={`pq-${q.id}`} rows={3}
                        className="w-full px-3 py-1.5 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition resize-y overflow-hidden"
                        value={q.pregunta}
                        onChange={e => updatePregunta(q.id, "pregunta", e.target.value)}
                        onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }} />
                    </div>
                    <div>
                      <label className={labelCls}>Respuesta sugerida <span className="text-red-400">*</span></label>
                      <textarea data-field={`pr-${q.id}`} rows={4}
                        className="w-full px-3 py-1.5 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition resize-y overflow-hidden"
                        value={q.respuesta}
                        onChange={e => updatePregunta(q.id, "respuesta", e.target.value)}
                        onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className={labelCls}>Categoria</label>
                    <select className="w-full px-3 py-1.5 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition cursor-pointer text-gray-500"
                      value={q.categoria} onChange={e => updatePregunta(q.id, "categoria", e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {q.categoria === "Otra" && (
                      <input className="w-full px-3 py-1.5 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition mt-1.5"
                        placeholder="Especifica la categoria..."
                        value={q.categoriaOtro}
                        onChange={e => updatePregunta(q.id, "categoriaOtro", e.target.value)} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPregunta}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-gray-900 hover:text-gray-700 transition cursor-pointer active:scale-[.98]">
              <IconPlus size={14} />
              Agregar pregunta
            </button>
            {/* Floating add button */}
            {preguntas.length >= 3 && (
              <button
                type="button"
                onClick={addPregunta}
                title="Agregar pregunta"
                className="fixed bottom-6 right-6 z-40 w-12 h-12 flex items-center justify-center bg-gray-900 text-white shadow-md hover:bg-gray-800 active:scale-90 transition-all cursor-pointer rounded"
              >
                <IconPlus size={22} />
              </button>
            )}
          </section>

        {/* ── DOCUMENTOS ── */}
        <section>
          <h2 className={sectionTitle}>
              <IconFileText size={18} />
              Documentos
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Sube uno o varios archivos (Word, PDF o Excel). Max. 50 MB por archivo.
            </p>

            {/* Drop zone */}
            <div data-field="archivos"
              className={`border border-dashed p-8 text-center cursor-pointer transition rounded
                ${dragging ? "border-gray-900 bg-gray-100" : "border-gray-400 hover:border-gray-900"}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={e => e.target.files && addFiles(e.target.files)} />
              <div className={`flex justify-center mb-3 ${dragging ? "text-gray-900" : "text-gray-400"}`}>
                <IconUpload size={28} />
              </div>
              <p className="text-sm text-gray-900 font-medium">
                Haz clic o arrastra archivos aqui
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, Word o Excel · hasta 50 MB por archivo</p>
            </div>

            {/* File list */}
            {archivos.length > 0 && (
              <div className="mt-3 space-y-2">
                {archivos.map(f => (
                  <div key={f.id} className={`flex items-center gap-2 border px-3 py-2 text-sm rounded
                    ${f.status === "error" ? "border-red-200 bg-red-50" : "border-gray-300"}`}>
                    <span className="shrink-0 text-gray-400"><IconFile size={14} /></span>
                    <span className="flex-1 truncate text-gray-700" title={f.file.name}>{f.file.name}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {(f.file.size / 1024).toFixed(0)} KB
                    </span>
                    {f.status === "done" && <span className="text-green-500 shrink-0"><IconCheck size={14} /></span>}
                    {f.status === "error" && <span className="text-red-500 shrink-0"><IconX size={14} /></span>}
                    {f.status === "pending" && (
                      <button type="button" onClick={() => removeFile(f.id)}
                        className="text-gray-400 hover:text-red-500 transition shrink-0 cursor-pointer">
                        <IconX size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <label className={labelCls}>Indicaciones adicionales</label>
              <textarea rows={2} className={inputCls}
                placeholder="Ej. El primer archivo contiene las preguntas de matricula..."
                value={indicaciones} onChange={e => setIndicaciones(e.target.value)} />
            </div>

            {/* Upload progress */}
            {progLabel && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">{progLabel}</p>
                <div className="h-1 bg-gray-100">
                  <div className="h-full bg-gray-900 transition-all duration-300"
                    style={{ width: `${progPct}%` }} />
                </div>
              </div>
            )}

          </section>

        {/* ── SUGERENCIAS ── */}
        <section>
          <h2 className={sectionTitle}>
            <IconMessage size={13} />
            Sugerencias o comentarios
          </h2>
          <div>
            <label className={labelCls}>
              Tienes alguna sugerencia o comentario adicional?{" "}
              <span className="text-gray-400 font-normal normal-case tracking-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Cualquier comentario, contexto extra o sugerencia que consideres util..."
              value={sugerencias}
              onChange={e => setSugerencias(e.target.value)}
            />
          </div>
        </section>

        {/* ── ERROR ── */}
        {error && (
          <div ref={errorRef} className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            <span className="mt-0.5 shrink-0"><IconAlertCircle size={16} /></span>
            <span>{error}</span>
          </div>
        )}

        {/* ── SUBMIT ── */}
        <button type="button" onClick={handleSubmitClick} disabled={sending}
          className="w-full inline-flex items-center justify-center gap-2 py-3 sm:py-3 bg-gray-900 text-white font-medium text-sm
            hover:bg-gray-800 active:scale-[.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition cursor-pointer">
          {sending ? <><IconSpinner size={16} /> Enviando...</> : <><IconSend size={15} /> Enviar respuesta</>}
        </button>

      </div>
    </>
  );
}
