"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PokemonCardPreview from "@/components/PokemonCardPreview";
import { renderPokemonCard, type PokemonData } from "@/lib/pokemonCard";

const IconSpinner = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IconDownload = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconShuffle = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);
const IconAlertCircle = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function PokemonPreviewPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("id") || searchParams.get("name") || "");
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardUrl, setCardUrl] = useState("");
  const [buildingCard, setBuildingCard] = useState(false);

  const load = useCallback(async (identifier?: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (identifier) {
        if (/^\d+$/.test(identifier.trim())) params.set("id", identifier.trim());
        else params.set("name", identifier.trim());
      }
      const res = await fetch(`/api/pokemon/preview?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el Pokémon");
      setPokemon(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
      setPokemon(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga el Pokémon indicado en ?id= o ?name=, o uno aleatorio si no hay ninguno
  useEffect(() => {
    const initial = searchParams.get("id") || searchParams.get("name") || undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- arranca la carga inicial al montar, no un ciclo de sincronización
    load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pokemon) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- arranca el render async del canvas al cambiar de Pokémon
    setBuildingCard(true);
    const formUrl = `${window.location.origin}/pokemon`;
    renderPokemonCard(pokemon, "Entrenador Anónimo", formUrl)
      .then((url) => { if (!cancelled) setCardUrl(url); })
      .catch(() => { if (!cancelled) setCardUrl(""); })
      .finally(() => { if (!cancelled) setBuildingCard(false); });
    return () => { cancelled = true; };
  }, [pokemon]);

  const downloadCard = () => {
    if (!cardUrl || !pokemon) return;
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = `preview-${pokemon.name}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Vista previa de tarjetas Pokémon</h1>
          <p className="mt-1 text-xs text-gray-400">
            Consulta el diseño de cualquier Pokémon sin enviar el cuestionario. Solo para revisión interna.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition rounded"
              placeholder="Nombre o número (ej. pikachu, 25)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load(query)}
            />
            <button
              type="button"
              onClick={() => load(query)}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 disabled:bg-gray-300 transition cursor-pointer shrink-0"
            >
              Buscar
            </button>
          </div>

          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="w-full mb-5 inline-flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-gray-900 hover:text-gray-700 transition cursor-pointer active:scale-[.98] rounded"
          >
            {loading ? <><IconSpinner size={14} /> Buscando...</> : <><IconShuffle size={14} /> Pokémon aleatorio</>}
          </button>

          {error && (
            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
              <span className="mt-0.5 shrink-0"><IconAlertCircle size={16} /></span>
              <span>{error}</span>
            </div>
          )}

          {loading && !pokemon && (
            <div className="py-16 flex justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
            </div>
          )}

          {pokemon && (
            <>
              <PokemonCardPreview pokemon={pokemon} />
              <button
                type="button"
                onClick={downloadCard}
                disabled={buildingCard || !cardUrl}
                className="w-full mt-5 inline-flex items-center justify-center gap-2 py-3 bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 active:scale-[.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition cursor-pointer rounded"
              >
                {buildingCard ? <><IconSpinner size={14} /> Generando imagen...</> : <><IconDownload size={15} /> Descargar esta vista previa</>}
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[10px] text-gray-400 leading-relaxed">
          Esta página solo consulta la PokéAPI pública y no guarda nada en la base de datos.
          El formulario real está en <a href="/pokemon" className="underline hover:text-gray-600">/pokemon</a>.
        </p>
      </div>
    </main>
  );
}
