"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { renderPokemonCard, downloadDataUrlImage, type PokemonData } from "@/lib/pokemonCard";
import PokemonCardPreview from "@/components/PokemonCardPreview";

// ── Icons ─────────────────────────────────────────────────────────────────────
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
const IconDownload = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconSparkles = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

// Pokéball icon used decoratively + as the checkbox/radio glyph. Cuando
// "checked" es true, el botón central muestra un check en vez de quedar
// vacío: refuerza que está seleccionada sin depender solo del cambio de
// fondo/escala del contenedor, que es sutil y fácil de pasar por alto.
const PokeballIcon = ({ size = 18, className = "", checked = false }: { size?: number; className?: string; checked?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
    <circle cx="16" cy="16" r="14.5" fill="#fff" stroke={checked ? "#16a34a" : "#1f2937"} strokeWidth={checked ? 2.5 : 1.5} />
    <path d="M1.5 16a14.5 14.5 0 0 1 29 0Z" fill="#ee1515" stroke="#1f2937" strokeWidth="1.5" />
    <rect x="1.5" y="15.1" width="29" height="1.8" fill="#1f2937" />
    <circle cx="16" cy="16" r="7.4" fill={checked ? "#16a34a" : "#fff"} stroke="#1f2937" strokeWidth="1.5" />
    {checked ? (
      <path d="M11.8 16.3l2.7 2.7l5.7-6.2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <circle cx="16" cy="16" r="2.2" fill="#fff" stroke="#1f2937" strokeWidth="1.2" />
    )}
  </svg>
);
// Tira decorativa de Pokémon animados: imágenes fijas, livianas y "lazy",
// solo decoran el encabezado del formulario (no afectan la lógica ni recargan).
function DecorativeSpriteStrip() {
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5 mb-4 select-none" aria-hidden="true">
      {DECORATIVE_SPRITES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          width={36}
          height={36}
          className="w-8 h-8 sm:w-9 sm:h-9 opacity-90 drop-shadow"
          style={{
            imageRendering: "pixelated",
            animation: `pkFloat 2.6s ease-in-out ${i * 0.25}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes pkFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

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

// Sprites animados decorativos (gen-V, muy livianos ~5-15KB c/u).
// Lista fija: no se recalcula ni se vuelve a pedir en cada render.
const DECORATIVE_SPRITES = [25, 1, 7, 133, 52, 143]
  .map(id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`);

type Comentario = { id: number; texto: string };

// ── Checkbox row (Pokéball glyph) ────────────────────────────────────────────
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`flex items-start gap-3 py-2.5 px-2.5 -mx-2.5 rounded-lg cursor-pointer group select-none transition-colors border
        ${checked ? "bg-green-50 border-green-300" : "border-transparent hover:bg-gray-50"}`}
    >
      <span className={`mt-0.5 shrink-0 transition-transform duration-200 ${checked ? "scale-100" : "scale-90 opacity-50 group-hover:opacity-80"}`}>
        <PokeballIcon size={24} checked={checked} />
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span className={`text-sm leading-snug transition ${checked ? "text-gray-900 font-semibold" : "text-gray-600"}`}>{label}</span>
    </label>
  );
}

// ── Radio row (Pokéball glyph) ───────────────────────────────────────────────
function RadioRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`flex items-center gap-3 py-2.5 px-2.5 -mx-2.5 rounded-lg cursor-pointer group select-none transition-colors border
        ${checked ? "bg-green-50 border-green-300" : "border-transparent hover:bg-gray-50"}`}
    >
      <span className={`shrink-0 transition-transform duration-200 ${checked ? "scale-100" : "scale-90 opacity-50 group-hover:opacity-80"}`}>
        <PokeballIcon size={24} checked={checked} />
      </span>
      <input type="radio" className="sr-only" checked={checked} onChange={onChange} />
      <span className={`text-sm transition ${checked ? "text-gray-900 font-semibold" : "text-gray-600"}`}>{label}</span>
    </label>
  );
}

// ── Pide un Pokémon aleatorio a nuestro propio endpoint /api/pokemon/preview,
// que ya calcula debilidad/resistencia REALES a partir de PokeAPI (en vez de
// llamar a PokeAPI directamente desde el cliente y duplicar esa lógica) ──────
async function fetchRandomPokemon(): Promise<PokemonData> {
  const res = await fetch("/api/pokemon/preview");
  if (!res.ok) throw new Error("No se pudo contactar a la PokéAPI");
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FormPokemon({ initialSession }: { initialSession?: string | null }) {
  // Sección 1
  const [condicion, setCondicion] = useState<"activo" | "egresado" | "">("");

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

  // Pokémon reveal
  const [revealing, setRevealing] = useState(false);
  const [revealStage, setRevealStage] = useState<"throw" | "shake" | "open">("throw");
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [pokemonError, setPokemonError] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [cardUrl, setCardUrl] = useState("");
  const [buildingCard, setBuildingCard] = useState(false);

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
    const saved = localStorage.getItem(`pokemon_draft_${sessionId}`);
    if (!saved) return;
    try {
      const st = JSON.parse(saved);
      if (st.condicion !== undefined) setCondicion(st.condicion);
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
    const draft = { condicion, medios, medioOtro, tramites, tramiteOtro, comentarios, nextId };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(`pokemon_draft_${sessionId}`, JSON.stringify(draft));
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [sessionId, condicion, medios, medioOtro, tramites, tramiteOtro, comentarios, nextId]);

  // ── Progreso (para la barra tipo "experiencia") ──
  const progress = useMemo(() => {
    let steps = 0;
    const total = 3;
    if (condicion) steps++;
    if (medios.length > 0 || medioOtro.trim()) steps++;
    if (tramites.length > 0 || tramiteOtro.trim()) steps++;
    return Math.round((steps / total) * 100);
  }, [condicion, medios, medioOtro, tramites, tramiteOtro]);

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
    if (medios.length === 0 && !medioOtro.trim()) return setError("Selecciona al menos un medio de consulta."), false;
    if (tramites.length === 0 && !tramiteOtro.trim()) return setError("Selecciona al menos un trámite o servicio."), false;
    return true;
  };

  const handleSubmit = () => {
    setError("");
    if (validate()) setShowConfirm(true);
  };

  // ── Envío ──
  const enviar = async (mon: PokemonData) => {
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

      const res = await fetch("/api/pokemon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condicion,
          medios: mediosFinales,
          tramites: tramitesFinales,
          comentarios: comentariosFinales,
          pokemonId: mon.id,
          pokemonName: mon.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      if (sessionId) localStorage.removeItem(`pokemon_draft_${sessionId}`);
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

  // ── Confirmar: guarda respuesta + revela Pokémon aleatorio con animación de Pokébola ──
  const confirmar = async () => {
    setShowConfirm(false);
    setRevealing(true);
    setRevealStage("throw");
    setPokemonError("");
    try {
      const [mon] = await Promise.all([
        fetchRandomPokemon(),
        new Promise(r => setTimeout(r, 900)), // deja ver la animación de lanzamiento
      ]);
      setRevealStage("shake");
      await new Promise(r => setTimeout(r, 1100)); // 3 sacudidas
      setRevealStage("open");
      await Promise.all([enviar(mon), new Promise(r => setTimeout(r, 550))]);
      setPokemon(mon);
    } catch {
      setPokemonError("No se pudo conectar con la PokéAPI. Intenta de nuevo.");
    } finally {
      setRevealing(false);
    }
  };

  // ── Generar tarjeta descargable (canvas + QR) cuando cambia el nombre ──
  const buildCard = useCallback(async () => {
    if (!pokemon) return;
    setBuildingCard(true);
    try {
      const formUrl = `${window.location.origin}/pokemon`;
      const url = await renderPokemonCard(pokemon, trainerName.trim(), formUrl);
      setCardUrl(url);
    } catch {
      // canvas render failed silently — download button just won't work
    } finally {
      setBuildingCard(false);
    }
  }, [pokemon, trainerName]);

  useEffect(() => {
    if (success && pokemon) buildCard();
  }, [success, pokemon, buildCard]);

  const downloadCard = () => {
    downloadDataUrlImage(cardUrl, `tarjeta-${pokemon?.name || "pokemon"}.png`).catch(() => {});
  };

  // ── Estilos ──
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
  const questionCls = "block text-sm font-semibold text-gray-800 leading-snug mb-1.5";
  const sectionTitle = "flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-gray-900 border-b-2 border-gray-900/10 pb-2.5 mb-4";

  // ── Revealing screen: Pokéball capture animation ──
  if (revealing) {
    return (
      <div className="text-center py-16 px-8 min-h-[420px] flex flex-col items-center justify-center">
        <style>{`
          @keyframes pkThrow { 0% { transform: translateY(-40px) scale(0.6); opacity: 0; } 60% { transform: translateY(0) scale(1.05); opacity: 1; } 100% { transform: translateY(0) scale(1); } }
          @keyframes pkShake { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(-18deg); } 40% { transform: rotate(16deg); } 60% { transform: rotate(-12deg); } 80% { transform: rotate(8deg); } }
          @keyframes pkFlashRing { 0% { transform: scale(0.4); opacity: 0.9; } 100% { transform: scale(2.6); opacity: 0; } }
          @keyframes pkPop { 0% { transform: scale(0.3); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        `}</style>
        <div className="relative w-24 h-24 flex items-center justify-center">
          {revealStage === "open" && (
            <span
              className="absolute inset-0 rounded-full border-4 border-amber-300"
              style={{ animation: "pkFlashRing 0.6s ease-out forwards" }}
            />
          )}
          <div
            className="drop-shadow-xl"
            style={{
              animation:
                revealStage === "throw" ? "pkThrow 0.9s ease-out"
                : revealStage === "shake" ? "pkShake 0.35s ease-in-out 3"
                : "pkPop 0.5s ease-out",
            }}
          >
            <PokeballIcon size={88} />
          </div>
        </div>
        <h2 className="mt-6 text-lg font-extrabold text-gray-900 mb-1">
          {revealStage === "open" ? "¡Lo atrapaste!" : "Un Pokémon salvaje apareció..."}
        </h2>
        <p className="text-gray-400 text-sm">
          {revealStage === "throw" && "Lanzando Pokébola..."}
          {revealStage === "shake" && "La Pokébola se sacude..."}
          {revealStage === "open" && "Registrando tu respuesta..."}
        </p>
        {pokemonError && (
          <div className="mt-6 max-w-xs mx-auto flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded text-left">
            <span className="mt-0.5 shrink-0"><IconAlertCircle size={16} /></span>
            <span>{pokemonError}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Success + Pokémon card (holo TCG-style live preview) ──
  if (success && pokemon) {
    return (
      <div className="py-6 px-2 sm:px-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 text-amber-500 mb-2">
            <IconSparkles size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">¡Un Pokémon salvaje apareció!</span>
            <IconSparkles size={18} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Gracias por responder el cuestionario</h2>
          <p className="text-gray-500 text-sm mt-1">Tu respuesta fue registrada. Esta es tu carta:</p>
        </div>

        <PokemonCardPreview pokemon={pokemon} />

        {/* Nombre opcional + descarga */}
        <div className="max-w-xs mx-auto mt-6 space-y-3">
          <div>
            <label className={labelCls}>Tu nombre (opcional)</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition rounded"
              placeholder="Ej. Ash Ketchum"
              maxLength={40}
              value={trainerName}
              onChange={e => setTrainerName(e.target.value)}
            />
            <p className="text-[11px] text-gray-400 mt-1">Aparecerá en tu tarjeta descargable como entrenador/a.</p>
          </div>

          <button
            type="button"
            onClick={downloadCard}
            disabled={buildingCard || !cardUrl}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 active:scale-[.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition cursor-pointer rounded"
          >
            {buildingCard ? <><IconSpinner size={14} /> Preparando tarjeta...</> : <><IconDownload size={15} /> Descargar tarjeta Pokémon</>}
          </button>
        </div>
      </div>
    );
  }

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
                  Una vez enviado no podrás modificar el cuestionario, pero descubrirás qué Pokémon te tocó. ¿Deseas continuar?
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
                {sending ? <><IconSpinner size={13} /> Enviando respuesta...</> : <><IconSend size={13} /> Confirmar y enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tira decorativa de Pokémon animados ── */}
      <DecorativeSpriteStrip />

      {/* ── Barra de progreso tipo "experiencia" ── */}
      <div className="mb-6 -mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progreso del cuestionario</span>
          <span className="text-[10px] font-bold text-gray-500">{progress}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">

        {/* ── SECCIÓN 1: DATOS GENERALES ── */}
        <section>
          <h2 className={sectionTitle}>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-extrabold shrink-0">1</span>
            <IconUser size={16} />
            Datos generales
          </h2>

          {/* Condición académica */}
          <div>
            <p className={questionCls}>Condición académica actual <span className="text-red-400">*</span></p>
            <div className="mt-1 space-y-0.5">
              <RadioRow
                label="Estudiante activo (ciclo en curso)"
                checked={condicion === "activo"}
                onChange={() => setCondicion("activo")}
              />
              <RadioRow
                label="Egresado en proceso de graduación"
                checked={condicion === "egresado"}
                onChange={() => setCondicion("egresado")}
              />
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 2: CONSULTAS ── */}
        <section>
          <h2 className={sectionTitle}>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-extrabold shrink-0">2</span>
            <IconClipboard size={16} />
            Consultas sobre trámites y servicios
          </h2>

          {/* Medios de consulta */}
          <div className="mb-6">
            <p className={questionCls}>
              ¿A través de qué medios consulta habitualmente información sobre trámites académicos
              (inscripciones, horas sociales, graduación, etc.)? <span className="text-red-400">*</span>
            </p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Selecciona todas las que apliquen</p>
              {medios.length > 0 && (
                <span className="text-[11px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full">
                  {medios.length} {medios.length === 1 ? "seleccionada" : "seleccionadas"}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {MEDIOS.map(m => (
                <CheckRow key={m} label={m} checked={medios.includes(m)} onChange={() => toggleMedio(m)} />
              ))}
              {/* Otro */}
              <div className="flex items-center gap-3 pt-2">
                <span className={`shrink-0 transition-transform ${medioOtro.trim() ? "scale-100" : "scale-90 opacity-50"}`}>
                  <PokeballIcon size={20} />
                </span>
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition"
                  placeholder="Otro: especifica..."
                  value={medioOtro}
                  onChange={e => setMedioOtro(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Trámites */}
          <div className="mb-6">
            <p className={questionCls}>
              ¿Sobre qué trámites o servicios académicos ha necesitado consultar información? <span className="text-red-400">*</span>
            </p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Selecciona todos los que apliquen</p>
              {tramites.length > 0 && (
                <span className="text-[11px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full">
                  {tramites.length} {tramites.length === 1 ? "seleccionado" : "seleccionados"}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {TRAMITES.map(t => (
                <CheckRow key={t} label={t} checked={tramites.includes(t)} onChange={() => toggleTramite(t)} />
              ))}
              {/* Otro */}
              <div className="flex items-center gap-3 pt-2">
                <span className={`shrink-0 transition-transform ${tramiteOtro.trim() ? "scale-100" : "scale-90 opacity-50"}`}>
                  <PokeballIcon size={20} />
                </span>
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition"
                  placeholder="Otro: especifica..."
                  value={tramiteOtro}
                  onChange={e => setTramiteOtro(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Consultas frecuentes */}
          <div>
            <p className={questionCls}>
              <span className="inline-flex items-center gap-1.5">
                <IconMessageSquarePlus size={13} />
                Consultas frecuentes
              </span>
              {" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
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
              Agregar otra pregunta
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
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm hover:from-red-600 hover:to-rose-700 active:scale-[.98] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition cursor-pointer rounded-full shadow-lg shadow-rose-500/20">
          {sending
            ? <><IconSpinner size={14} /> Enviando...</>
            : <><PokeballIcon size={16} /> Enviar y descubrir mi Pokémon</>}
        </button>

      </div>
    </>
  );
}
