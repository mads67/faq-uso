"use client";

import { useState, useRef, useEffect } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconCheckCircle = ({ size = 52 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconAlertTriangle = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconSend = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconSpinner = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IconAlertCircle = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconPlus = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconTrash = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconCheck = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconUser = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconClipboard = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const IconMessageSquarePlus = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="12" y1="8" x2="12" y2="14" /><line x1="9" y1="11" x2="15" y2="11" />
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────

const AÑOS = [
  "Primer año",
  "Segundo año",
  "Tercer año",
  "Cuarto año",
  "Quinto año",
  "Egresado",
];

const MEDIOS = [
  "Ventanilla de atención presencial",
  "Llamadas telefónicas a la universidad",
  "Correo electrónico institucional",
  "Redes sociales oficiales (Facebook, etc.)",
  "Página web institucional (usonsonate.edu.sv)",
  "Grupos informales de estudiantes en redes sociales",
];

const TRAMITES = [
  "Inscripción de materias",
  "Horas sociales",
  "Pagos, aranceles o colecturía",
  "Constancias, equivalencias o certificaciones",
  "Becas o apoyos estudiantiles",
  "Servicios de biblioteca",
  "Proceso de graduación",
];

type Comentario = { id: number; texto: string };

// ── Checkbox row ──────────────────────────────────────────────────────────────
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-start gap-3 py-1.5 cursor-pointer group select-none">
      <span
        className={`mt-0.5 w-4 h-4 border rounded-sm shrink-0 flex items-center justify-center transition
          ${checked ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300 bg-white group-hover:border-gray-500"}`}
        onClick={onChange}
      >
        {checked && <IconCheck size={10} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span className="text-sm text-gray-700 leading-snug">{label}</span>
    </label>
  );
}

// ── Radio row ─────────────────────────────────────────────────────────────────
function RadioRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-3 py-1.5 cursor-pointer group select-none">
      <span
        className={`w-4 h-4 border rounded-full shrink-0 flex items-center justify-center transition
          ${checked ? "border-gray-900" : "border-gray-300 bg-white group-hover:border-gray-500"}`}
        onClick={onChange}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-gray-900 block" />}
      </span>
      <input type="radio" className="sr-only" checked={checked} onChange={onChange} />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FormCuestionario({ initialSession }: { initialSession?: string | null }) {
  // Sección 1
  const [condicion, setCondicion] = useState<"activo" | "egresado" | "">("");
  const [año, setAño] = useState("");

  // Sección 2 — medios
  const [medios, setMedios] = useState<string[]>([]);
  const [medioOtro, setMedioOtro] = useState("");

  // Sección 2 — trámites
  const [tramites, setTramites] = useState<string[]>([]);
  const [tramiteOtro, setTramiteOtro] = useState("");

  // Sección 2 — comentarios adicionales
  const [comentarios, setComentarios] = useState<Comentario[]>([{ id: 1, texto: "" }]);
  const [nextId, setNextId] = useState(2);

  // UI
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);

  // ── Session: URL param + localStorage auto-save ──
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
    const saved = localStorage.getItem(`cuest_draft_${sessionId}`);
    if (!saved) return;
    try {
      const st = JSON.parse(saved);
      if (st.condicion !== undefined) setCondicion(st.condicion);
      if (st.año !== undefined) setAño(st.año);
      if (st.medios !== undefined) setMedios(st.medios);
      if (st.medioOtro !== undefined) setMedioOtro(st.medioOtro);
      if (st.tramites !== undefined) setTramites(st.tramites);
      if (st.tramiteOtro !== undefined) setTramiteOtro(st.tramiteOtro);
      if (st.comentarios !== undefined) setComentarios(st.comentarios);
      if (st.nextId !== undefined) setNextId(st.nextId);
    } catch { /* ignore corrupt draft */ }
  }, [sessionId]);

  // Auto-save draft (debounced 1.5s)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!sessionId) return;
    const draft = { condicion, año, medios, medioOtro, tramites, tramiteOtro, comentarios, nextId };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(`cuest_draft_${sessionId}`, JSON.stringify(draft));
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [sessionId, condicion, año, medios, medioOtro, tramites, tramiteOtro, comentarios, nextId]);

  // ── Helpers ──
  const toggleMedio = (m: string) =>
    setMedios(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);

  const toggleTramite = (t: string) =>
    setTramites(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const addComentario = () => {
    setComentarios(c => [...c, { id: nextId, texto: "" }]);
    setNextId(n => n + 1);
    setTimeout(() => {
      const cards = document.querySelectorAll("[data-comentario]");
      (cards[cards.length - 1] as HTMLElement)?.querySelector("textarea")?.focus();
    }, 50);
  };

  const removeComentario = (id: number) => setComentarios(c => c.filter(x => x.id !== id));
  const updateComentario = (id: number, texto: string) =>
    setComentarios(c => c.map(x => x.id === id ? { ...x, texto } : x));

  // ── Validación ──
  const validate = () => {
    if (!condicion) return setError("Selecciona tu condición académica actual."), false;
    if (!año) return setError("Selecciona el año académico."), false;
    if (medios.length === 0 && !medioOtro.trim()) return setError("Selecciona al menos un medio de consulta."), false;
    if (tramites.length === 0 && !tramiteOtro.trim()) return setError("Selecciona al menos un trámite o servicio."), false;
    return true;
  };

  const handleSubmit = () => {
    setError("");
    if (validate()) setShowConfirm(true);
  };

  // ── Envío ──
  const enviar = async () => {
    setSending(true);
    try {
      const mediosFinales = medioOtro.trim()
        ? [...medios, `Otro: ${medioOtro.trim()}`]
        : medios;
      const tramitesFinales = tramiteOtro.trim()
        ? [...tramites, `Otro: ${tramiteOtro.trim()}`]
        : tramites;
      const comentariosFinales = comentarios
        .filter(c => c.texto.trim())
        .map((c, i) => ({ numero: i + 1, comentario: c.texto.trim() }));

      const res = await fetch("/api/cuestionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condicion,
          año_academico: año,
          medios: mediosFinales,
          tramites: tramitesFinales,
          comentarios: comentariosFinales,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      if (sessionId) localStorage.removeItem(`cuest_draft_${sessionId}`);
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message :
        typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : "Error inesperado";
      setError(msg);
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } finally {
      setSending(false);
    }
  };

  const confirmar = async () => { setShowConfirm(false); await enviar(); };


  // ── Estilos ──
  const inputCls = "w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition";
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1";
  const sectionTitle = "flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-2 mb-4";

  // ── Success ──
  if (success) return (
    <div className="text-center py-16 px-8">
      <div className="flex justify-center mb-4 text-green-600">
        <IconCheckCircle size={56} />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Cuestionario enviado</h2>
      <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
        Tu respuesta fue registrada correctamente.
      </p>
    </div>
  );

  return (
    <>
      {/* ── Modal de confirmación ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white p-5 w-full max-w-sm rounded">
            <div className="flex items-start gap-3 mb-4">
              <span className="mt-0.5 text-amber-500 shrink-0"><IconAlertTriangle size={20} /></span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Confirmar envío</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Una vez enviado no podrás modificar el cuestionario. ¿Deseas continuar?
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer active:scale-[.97] rounded">
                Cancelar
              </button>
              <button onClick={confirmar} disabled={sending}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition cursor-pointer active:scale-[.97] rounded">
                {sending ? <><IconSpinner size={13} /> Enviando...</> : <><IconSend size={13} /> Sí, enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">

        {/* ── SECCIÓN 1: DATOS GENERALES ── */}
        <section>
          <h2 className={sectionTitle}>
            <IconUser size={16} />
            Sección 1 — Datos generales
          </h2>

          {/* Condición académica */}
          <div className="mb-5">
            <p className={labelCls}>Condición académica actual <span className="text-red-400">*</span></p>
            <div className="mt-1 space-y-0.5">
              <RadioRow
                label="Estudiante activo (ciclo en curso)"
                checked={condicion === "activo"}
                onChange={() => { setCondicion("activo"); setAño(""); }}
              />
              <RadioRow
                label="Egresado en proceso de graduación"
                checked={condicion === "egresado"}
                onChange={() => { setCondicion("egresado"); setAño(""); }}
              />
            </div>
          </div>

          {/* Año académico */}
          <div>
            <label className={labelCls}>Año académico que cursa <span className="text-red-400">*</span></label>
            <select
              className={`${inputCls} cursor-pointer`}
              value={año}
              onChange={e => setAño(e.target.value)}
            >
              <option value="">— Selecciona —</option>
              {AÑOS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </section>

        {/* ── SECCIÓN 2: CONSULTAS ── */}
        <section>
          <h2 className={sectionTitle}>
            <IconClipboard size={16} />
            Sección 2 — Consultas sobre trámites y servicios
          </h2>

          {/* Medios de consulta */}
          <div className="mb-6">
            <p className={labelCls}>
              ¿A través de qué medios consulta habitualmente información sobre trámites académicos
              (inscripciones, horas sociales, graduación, etc.)? <span className="text-red-400">*</span>
            </p>
            <p className="text-xs text-gray-400 mb-2">Seleccione todos los que apliquen</p>
            <div className="space-y-0.5">
              {MEDIOS.map(m => (
                <CheckRow key={m} label={m} checked={medios.includes(m)} onChange={() => toggleMedio(m)} />
              ))}
              {/* Otro */}
              <div className="flex items-start gap-3 py-1.5">
                <span
                  className={`mt-0.5 w-4 h-4 border rounded-sm shrink-0 flex items-center justify-center transition cursor-pointer
                    ${medioOtro.trim() || medios.includes("__otro_medio__")
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "border-gray-300 bg-white hover:border-gray-500"}`}
                >
                  {(medioOtro.trim()) && <IconCheck size={10} />}
                </span>
                <input
                  className="flex-1 px-2 py-1 border-b border-gray-300 text-sm bg-transparent focus:outline-none focus:border-gray-900 transition"
                  placeholder="Otro: especifica..."
                  value={medioOtro}
                  onChange={e => setMedioOtro(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Trámites */}
          <div className="mb-6">
            <p className={labelCls}>
              ¿Sobre qué trámites o servicios académicos ha necesitado consultar información? <span className="text-red-400">*</span>
            </p>
            <p className="text-xs text-gray-400 mb-2">Seleccione todos los que apliquen</p>
            <div className="space-y-0.5">
              {TRAMITES.map(t => (
                <CheckRow key={t} label={t} checked={tramites.includes(t)} onChange={() => toggleTramite(t)} />
              ))}
              {/* Otro */}
              <div className="flex items-start gap-3 py-1.5">
                <span
                  className={`mt-0.5 w-4 h-4 border rounded-sm shrink-0 flex items-center justify-center transition cursor-pointer
                    ${tramiteOtro.trim()
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "border-gray-300 bg-white hover:border-gray-500"}`}
                >
                  {tramiteOtro.trim() && <IconCheck size={10} />}
                </span>
                <input
                  className="flex-1 px-2 py-1 border-b border-gray-300 text-sm bg-transparent focus:outline-none focus:border-gray-900 transition"
                  placeholder="Otro: especifica..."
                  value={tramiteOtro}
                  onChange={e => setTramiteOtro(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Consultas frecuentes */}
          <div>
            <p className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <IconMessageSquarePlus size={13} />
                Consultas frecuentes
              </span>
              {" "}
              <span className="text-gray-400 font-normal normal-case tracking-normal">(opcional)</span>
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Escribe las preguntas frecuentes que realizas o has realizado sobre trámites y servicios académicos.
            </p>

            <div className="space-y-2">
              {comentarios.map((c, i) => (
                <div key={c.id} data-comentario className="flex items-start gap-2">
                  <span className="mt-2 text-[11px] font-bold text-gray-400 w-5 shrink-0 text-right">{i + 1}.</span>
                  <textarea
                    rows={2}
                    className="flex-1 px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition resize-none"
                    placeholder="Ej. ¿Cómo solicito una constancia de notas?"
                    value={c.texto}
                    onChange={e => updateComentario(c.id, e.target.value)}
                    onInput={e => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = "auto";
                      t.style.height = t.scrollHeight + "px";
                    }}
                  />
                  {comentarios.length > 1 && (
                    <button type="button" onClick={() => removeComentario(c.id)}
                      className="mt-2 p-1.5 text-gray-300 hover:text-red-500 transition cursor-pointer shrink-0">
                      <IconTrash size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={addComentario}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-gray-900 hover:text-gray-700 transition cursor-pointer active:scale-[.98]">
              <IconPlus size={13} />
              Agregar consulta
            </button>
          </div>
        </section>

        {/* ── ERROR ── */}
        {error && (
          <div ref={errorRef} className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
            <span className="mt-0.5 shrink-0"><IconAlertCircle size={16} /></span>
            <span>{error}</span>
          </div>
        )}

        {/* ── SUBMIT ── */}
        <button type="button" onClick={handleSubmit} disabled={sending}
          className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 active:scale-[.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition cursor-pointer rounded">
          {sending
            ? <><IconSpinner size={14} /> Enviando...</>
            : <><IconSend size={14} /> Enviar cuestionario</>}
        </button>

      </div>
    </>
  );
}
