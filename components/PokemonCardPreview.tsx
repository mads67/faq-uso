"use client";

import { type PokemonData } from "@/lib/pokemonCard";
import { typeColor, TYPE_LABEL_ES } from "@/lib/pokemonTypes";
import TypeIcon from "@/components/TypeIcon";

function rarityInfo(total: number) {
  if (total >= 200) return { label: "Rara", symbol: "star", holo: true };
  if (total >= 140) return { label: "Poco común", symbol: "diamond", holo: false };
  if (total >= 90) return { label: "Poco común", symbol: "diamond", holo: false };
  return { label: "Común", symbol: "circle", holo: false };
}

// El "stage tag" real (BASIC / STAGE 1 / STAGE 2) se deriva de la altura:
// una heurística simple para dar variedad sin inventar datos de evolución.
function stageInfo(heightDm: number) {
  if (heightDm >= 15) return "STAGE 2";
  if (heightDm >= 8) return "STAGE 1";
  return "BASIC";
}

function RaritySymbol({ symbol }: { symbol: string }) {
  if (symbol === "star") return <span className="text-[11px] leading-none">&#9733;</span>;
  if (symbol === "diamond") return <span className="text-[11px] leading-none">&#9670;</span>;
  return <span className="text-[9px] leading-none">&#9679;</span>;
}

// decímetros -> pies/pulgadas, hectogramos -> libras (formato "5'7", 200 lbs" real de las cartas)
function formatHeightFeet(decimetres: number) {
  const totalInches = Math.round((decimetres / 10) * 3.28084 * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${String(inches).padStart(2, "0")}"`;
}
function formatWeightLbs(hectograms: number) {
  return `${Math.round((hectograms / 10) * 2.20462)} lbs.`;
}

// Energía "incolora" (Colorless): esfera plateada lisa con relieve metálico,
// igual que el símbolo real de las cartas TCG (un círculo gris liso, sin
// ningún glifo dentro: la versión anterior con un "+" se leía como un botón
// de interfaz, no como energía Pokémon).
function ColorlessOrb({ size = 18 }: { size?: number }) {
  return (
    <span
      className="rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 34% 30%, #ffffff 0%, #e4e6e9 45%, #c2c6cc 75%, #9fa4ab 100%)",
        boxShadow: "inset 0 -1.5px 2.5px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.95), 0 1px 1.5px rgba(0,0,0,0.35)",
        border: "0.5px solid rgba(0,0,0,0.2)",
      }}
    />
  );
}

// Icono de tipo oficial (ya trae su propio fondo de color cuadrado):
// se muestra directamente, sin envolverlo en otro círculo de color.
function TypeOrb({ type, size = 18 }: { type: string; size?: number }) {
  return (
    <span
      className="rounded-[5px] overflow-hidden shrink-0 shadow-sm"
      style={{ width: size, height: size }}
    >
      <TypeIcon type={type} size={size} />
    </span>
  );
}

// Vista previa "en vivo" de la tarjeta Pokémon, replicando la estructura real
// de una carta moderna del TCG (fondo blanco con tinte suave del tipo, marco
// metálico plano, tag de etapa, panel de arte enmarcado, franja Pokédex curva,
// ataques con energías simples). Es el mismo bloque visual que se muestra al
// finalizar el cuestionario en FormPokemon.tsx, reutilizado en /pokemon/preview.
export default function PokemonCardPreview({ pokemon }: { pokemon: PokemonData }) {
  const colors = typeColor(pokemon.types[0]);
  const displayName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  const total = pokemon.hp + pokemon.attack + pokemon.defense;
  const rarity = rarityInfo(total);
  const stage = stageInfo(pokemon.height);
  const primaryType = pokemon.types[0] || "normal";
  const secondaryType = pokemon.types[1];
  const retreatCost = Math.max(1, Math.min(4, Math.round(pokemon.weight / 300)));
  const weaknessType = pokemon.weaknesses?.[0];
  const resistanceType = pokemon.resistances?.[0];

  const move1 = {
    name: `Impacto ${TYPE_LABEL_ES[primaryType] || "Normal"}`,
    cost: Math.max(1, Math.round(pokemon.attack / 40)),
    damage: Math.max(10, Math.round(pokemon.attack * 1.1)),
  };
  const move2 = {
    name: `Golpe ${secondaryType ? TYPE_LABEL_ES[secondaryType] : "Definitivo"}`,
    cost: Math.max(2, Math.round((pokemon.attack + pokemon.defense) / 55)),
    damage: Math.max(20, Math.round((pokemon.attack + pokemon.defense) * 0.9)),
  };

  return (
    <div className="max-w-xs mx-auto font-[family-name:var(--font-cabin)]">
      <style>{`
        @keyframes cardPop { 0% { transform: scale(0.9) rotate(-1.5deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
      `}</style>

      {/* Marco plateado metálico, delgado y recto como el borde real de una carta TCG */}
      <div
        className="rounded-[10px] p-[5px]"
        style={{
          background: rarity.holo
            ? "linear-gradient(155deg, #f7e9c8 0%, #d9c48f 28%, #b8974f 50%, #d9c48f 72%, #f7e9c8 100%)"
            : "linear-gradient(155deg, #eef0f2 0%, #c4c9d0 28%, #8d94a0 50%, #c4c9d0 72%, #eef0f2 100%)",
          animation: "cardPop 0.4s cubic-bezier(.2,1.2,.4,1)",
          boxShadow: "0 10px 24px -8px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)",
                  }}
      >
        {/* Cuerpo de la carta: blanco, con tinte suave del tipo + grano fino de
            papel visible (a diferencia del primer intento, este SOLO se pinta en
            este fondo del papel, nunca dentro del panel de arte: el panel de arte
            pinta su propio fondo opaco encima, así que el sprite queda intacto). */}
        <div
          className="relative rounded-[6px] overflow-hidden bg-white"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='paperGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch' result='t'/%3E%3CfeColorMatrix in='t' type='matrix' values='0 0 0 0 0.55  0 0 0 0 0.52  0 0 0 0 0.48  0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperGrain)'/%3E%3C/svg%3E"), linear-gradient(180deg, ${colors.bg}38 0%, #ffffff 40%, #ffffff 76%, ${colors.bg}26 100%)`,
            backgroundBlendMode: "multiply, normal",
            border: "1px solid #b0b4bb",
          }}
        >
          {/* Brillo holográfico satinado: una franja diagonal gris clara (visible sobre
              blanco, a diferencia de un blanco-sobre-blanco con blend "overlay" que no se
              nota) que simula el reflejo de luz del laminado brillante de una carta TCG real.
              Sutil en cartas normales, más ancha y marcada en las raras. */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: rarity.holo
                ? "linear-gradient(115deg, transparent 15%, rgba(120,130,145,0.14) 38%, rgba(255,255,255,0.45) 48%, rgba(120,130,145,0.14) 58%, transparent 80%)"
                : "linear-gradient(115deg, transparent 30%, rgba(140,148,160,0.12) 45%, rgba(255,255,255,0.45) 50%, rgba(140,148,160,0.12) 55%, transparent 68%)",
            }}
          />
          {rarity.holo && (
            <>
              {/* Efecto tornasol arcoíris (cosmos holo) para cartas raras, solo sobre el papel */}
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  background: "repeating-linear-gradient(115deg, #ff6bb0 0%, #ffb37b 8%, #fff27b 16%, #7bffb0 24%, #7bd4ff 32%, #b17bff 40%, #ff6bb0 48%)",
                  opacity: 0.16,
                  mixBlendMode: "color-dodge",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.95) 0.7px, transparent 1.1px)",
                  backgroundSize: "6px 6px",
                  opacity: 0.4,
                  mixBlendMode: "overlay",
                }}
              />
            </>
          )}

          {/* ── Tag de etapa (esquina superior izquierda, recorte diagonal) ── */}
          <div className="absolute top-0 left-0 z-20">
            <div
              className="text-white text-[10px] font-extrabold tracking-wide px-2.5 py-[3px] font-[family-name:var(--font-barlow-condensed)]"
              style={{
                background: "linear-gradient(135deg,#4a4a4a,#1c1917)",
                clipPath: "polygon(0 0, 100% 0, 86% 100%, 0% 100%)",
              }}
            >
              {stage}
            </div>
          </div>

          {/* ── Franja de nombre + HP + tipo ── */}
          <div className="relative z-20 flex items-start justify-between pl-[74px] pr-2.5 pt-2 pb-0.5">
            <span className="font-bold text-gray-900 text-[19px] leading-none tracking-tight truncate pr-2 font-[family-name:var(--font-barlow-condensed)]">
              {displayName}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-bold text-gray-900 text-[17px] leading-none font-[family-name:var(--font-barlow-condensed)]">{pokemon.hp}</span>
              <span className="font-bold text-gray-700 text-[9px] leading-none mr-0.5 font-[family-name:var(--font-barlow-condensed)]">HP</span>
              <TypeOrb type={primaryType} size={20} />
            </div>
          </div>
          {secondaryType && (
            <div className="relative z-20 pl-[74px] pr-2.5 pb-1 flex items-center gap-1">
              <span className="text-[9px] italic text-gray-600">También tipo {TYPE_LABEL_ES[secondaryType]}</span>
              <TypeOrb type={secondaryType} size={13} />
            </div>
          )}
          {!secondaryType && <div className="pb-1" />}

          {/* ── Panel de arte enmarcado (borde blanco grueso + línea gris), por encima del destello para que nunca lo tiña ── */}
          <div className="relative z-20 px-2.5">
            <div
              className="relative h-40 overflow-hidden rounded-[3px]"
              style={{ border: "3px solid #ffffff", boxShadow: "0 0 0 1px #b0b4bb" }}
            >
              <div className="absolute inset-0" style={{ background: colors.grad }} />
              {/* Viñeta radial suave detrás del sprite, como el fondo de una carta real (sin textura de grano: degradaba la nitidez del sprite) */}
              <div
                className="absolute inset-0"
                style={{ background: "radial-gradient(circle at 50% 45%, transparent 45%, rgba(0,0,0,0.18) 100%)" }}
              />
              {pokemon.sprite ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pokemon.sprite}
                  alt={pokemon.name}
                  className="relative h-full w-full object-contain p-2"
                  style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.35))" }}
                />
              ) : (
                <span className="relative text-white/70 text-xs">Sin imagen</span>
              )}
            </div>
          </div>

          {/* ── Franja Pokédex curva (estilo "tab" real, integrada al marco del arte) ── */}
          <div className="px-4 -mt-[11px] relative z-20">
            <div
              className="text-center text-[8.5px] italic font-medium text-gray-600 py-[5px]"
              style={{
                background: "linear-gradient(180deg,#fff,#e7e9eb)",
                border: "1px solid #c2c5cb",
                borderRadius: "3px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              }}
            >
              N.º {String(pokemon.id).padStart(4, "0")} &nbsp;·&nbsp; ALT {formatHeightFeet(pokemon.height)} &nbsp;·&nbsp; PESO {formatWeightLbs(pokemon.weight)}
            </div>
          </div>

          {/* ── Panel de ataques ── */}
          <div className="relative z-20 px-3 pt-2.5 pb-1.5 space-y-2.5">
            {[move1, move2].map(move => (
              <div key={move.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="flex gap-0.5 shrink-0">
                    {Array.from({ length: move.cost }).map((_, i) => (
                      i === 0
                        ? <TypeOrb key={i} type={primaryType} size={17} />
                        : <ColorlessOrb key={i} size={17} />
                    ))}
                  </span>
                  <span className="text-[14px] font-semibold text-gray-900 truncate">{move.name}</span>
                </div>
                <span className="text-[19px] font-bold text-gray-900 shrink-0 font-[family-name:var(--font-barlow-condensed)]">{move.damage}</span>
              </div>
            ))}
          </div>

          {/* ── Fila de 3 columnas iguales: debilidad | resistencia | retirada (tipos REALES de damage_relations de PokeAPI, no inventados) ── */}
          <div className="relative z-20 px-3 py-2 grid grid-cols-3 gap-1.5 text-[8.5px] border-t border-gray-200 font-[family-name:var(--font-barlow-condensed)]">
            <div className="min-w-0">
              <div className="uppercase tracking-wide text-gray-600 text-[8px] font-bold mb-1">Debilidad</div>
              {weaknessType ? (
                <div className="flex items-center gap-1">
                  <TypeOrb type={weaknessType} size={14} />
                  <span className="font-bold text-[11px]" style={{ color: "#c0392b" }}>×2</span>
                </div>
              ) : (
                <span className="text-gray-600 font-semibold text-[10px] font-[family-name:var(--font-cabin)]">Ninguna</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="uppercase tracking-wide text-gray-600 text-[8px] font-bold mb-1">Resistencia</div>
              {resistanceType ? (
                <div className="flex items-center gap-1">
                  <TypeOrb type={resistanceType} size={14} />
                  <span className="font-bold text-[11px]" style={{ color: "#2f7d4f" }}>-20</span>
                </div>
              ) : (
                <span className="text-gray-600 font-semibold text-[10px] font-[family-name:var(--font-cabin)]">Ninguna</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="uppercase tracking-wide text-gray-600 text-[8px] font-bold mb-1">Retirada</div>
              <div className="flex flex-wrap gap-0.5">
                {Array.from({ length: retreatCost }).map((_, i) => (
                  <ColorlessOrb key={i} size={12} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer: rareza + numeración (como una carta real) ── */}
          <div className="relative z-20 px-3 pb-2 pt-1 flex items-center justify-between">
            <span className="text-[8px] text-gray-600 font-medium">MEG {String(pokemon.id).padStart(3, "0")}</span>
            <span className="flex items-center gap-1 text-gray-600">
              <RaritySymbol symbol={rarity.symbol} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
