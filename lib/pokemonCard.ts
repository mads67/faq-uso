import QRCode from "qrcode";
import { typeColor, TYPE_LABEL_ES } from "./pokemonTypes";

export type PokemonData = {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  height: number;
  weight: number;
  hp: number;
  attack: number;
  defense: number;
  speciesFlavor?: string;
  // Debilidades/resistencias REALES (multiplicador neto de daño combinando
  // ambos tipos, calculado a partir de damage_relations de PokeAPI en
  // /api/pokemon/preview), no inventadas como antes.
  weaknesses?: string[];
  resistances?: string[];
};

let fontsReady: Promise<{ display: string; body: string }> | null = null;

// next/font/google (ver app/layout.tsx) NO registra las fuentes bajo su
// nombre genérico de Google Fonts: genera un @font-face con un nombre interno
// (hasheado) y lo expone solo vía las variables CSS --font-barlow-condensed /
// --font-cabin en <html>. Pedirle a document.fonts.load() el nombre genérico
// "Barlow Condensed" nunca encuentra esa fuente (falla en silencio por el
// .catch de abajo) y el canvas cae al fallback del stack, que no es condensado
// — por eso el "STAGE 2"/nombre se veían más anchos que en la vista previa.
// La solución es leer el nombre real ya resuelto desde esas variables CSS.
function resolveFontFamily(cssVar: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || fallback;
}

function ensureFontsLoaded(): Promise<{ display: string; body: string }> {
  if (!fontsReady) {
    const display = resolveFontFamily("--font-barlow-condensed", "'Barlow Condensed'");
    const body = resolveFontFamily("--font-cabin", "Cabin");
    fontsReady = Promise.all([
      document.fonts.load(`600 16px ${display}`),
      document.fonts.load(`700 16px ${display}`),
      document.fonts.load(`800 16px ${display}`),
      document.fonts.load(`500 16px ${body}`),
      document.fonts.load(`600 16px ${body}`),
      document.fonts.load(`italic 600 16px ${body}`),
    ]).then(() => ({ display, body })).catch(() => ({ display, body }));
  }
  return fontsReady;
}

// `crossOrigin` solo se marca para recursos de OTRO origen (el sprite del
// Pokémon, servido desde raw.githubusercontent.com) — es lo que le pide al
// navegador un pase CORS y evita que el canvas quede "tainted". Ponerlo en un
// recurso del MISMO origen (los iconos de tipo, servidos por este mismo sitio
// desde /public) tiene el efecto contrario: Next.js no manda cabecera
// Access-Control-Allow-Origin para archivos estáticos, así que el navegador
// trata la imagen como sin permiso CORS y el canvas se contamina igual —
// canvas.toDataURL() falla en silencio y la tarjeta descargada sale corrupta
// aunque la vista previa (un <img> normal, sin canvas) se vea perfecta.
function loadImage(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Iconos de tipo 100% oficiales (símbolos reales del juego, ver components/TypeIcon.tsx
// para la fuente exacta), empaquetados en /public/type-icons/. Caché en memoria para no
// recargar la misma imagen dos veces al dibujar varias tarjetas en la misma sesión.
const typeIconCache = new Map<string, Promise<HTMLImageElement>>();
function loadTypeIcon(type: string): Promise<HTMLImageElement> {
  let p = typeIconCache.get(type);
  if (!p) {
    p = loadImage(`/type-icons/${type}.png`, false);
    typeIconCache.set(type, p);
  }
  return p;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Deterministic pseudo-random "moves" derived from the pokémon's own stats,
// so the same pokémon always gets the same two attacks.
function buildMoves(pokemon: PokemonData) {
  const typeLabel = TYPE_LABEL_ES[pokemon.types[0]] || "Normal";
  const move1 = {
    name: `Impacto ${typeLabel}`,
    cost: Math.max(1, Math.round(pokemon.attack / 40)),
    damage: Math.max(10, Math.round(pokemon.attack * 1.1)),
  };
  const move2 = {
    name: `Golpe ${pokemon.types[1] ? TYPE_LABEL_ES[pokemon.types[1]] : "Definitivo"}`,
    cost: Math.max(2, Math.round((pokemon.attack + pokemon.defense) / 55)),
    damage: Math.max(20, Math.round((pokemon.attack + pokemon.defense) * 0.9)),
  };
  return [move1, move2];
}

function rarityInfo(total: number): { label: string; symbol: string; holo: boolean } {
  if (total >= 200) return { label: "RARA", symbol: "★", holo: true };
  if (total >= 140) return { label: "POCO COMÚN", symbol: "◆", holo: false };
  if (total >= 90) return { label: "POCO COMÚN", symbol: "◆", holo: false };
  return { label: "COMÚN", symbol: "●", holo: false };
}

// El "stage tag" real (BASIC / STAGE 1 / STAGE 2) se deriva de la altura:
// una heurística simple para dar variedad sin inventar datos de evolución.
function stageInfo(heightDm: number) {
  if (heightDm >= 15) return "STAGE 2";
  if (heightDm >= 8) return "STAGE 1";
  return "BASIC";
}

// decímetros -> pies/pulgadas, hectogramos -> libras (formato real de las cartas: 5'07", 200 lbs.)
function formatHeightFeet(decimetres: number) {
  const totalInches = Math.round((decimetres / 10) * 3.28084 * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${String(inches).padStart(2, "0")}"`;
}
function formatWeightLbs(hectograms: number) {
  return `${Math.round((hectograms / 10) * 2.20462)} lbs.`;
}

export async function renderPokemonCard(
  pokemon: PokemonData,
  trainerName: string,
  formUrl: string
): Promise<string> {
  const { display: displayFamily, body: bodyFamily } = await ensureFontsLoaded();
  const FONT = `${bodyFamily}, 'Segoe UI', Arial, sans-serif`;
  const FONT_DISPLAY = `${displayFamily}, 'Segoe UI', Arial, sans-serif`;
  const W = 620;
  const primaryType = pokemon.types[0] || "normal";
  const secondaryType = pokemon.types[1];
  const colors = typeColor(primaryType);
  const total = pokemon.hp + pokemon.attack + pokemon.defense;
  const rarity = rarityInfo(total);
  const stage = stageInfo(pokemon.height);
  const moves = buildMoves(pokemon);

  // Precarga los iconos de tipo que la carta va a necesitar (oficial, no dibujado a mano):
  // los del propio Pokémon Y los de su debilidad/resistencia real (si no se precargan
  // estos últimos, drawTypeOrb no encuentra la imagen y cae al círculo de color plano).
  const neededTypes = Array.from(new Set([
    primaryType,
    ...(secondaryType ? [secondaryType] : []),
    ...(pokemon.weaknesses?.[0] ? [pokemon.weaknesses[0]] : []),
    ...(pokemon.resistances?.[0] ? [pokemon.resistances[0]] : []),
  ]));
  const typeIcons = new Map<string, HTMLImageElement>();
  await Promise.all(neededTypes.map(async t => {
    try {
      typeIcons.set(t, await loadTypeIcon(t));
    } catch {
      // icon failed to load — orb will just show its color, no glyph
    }
  }));

  // ── Alturas calculadas para que todo quede exactamente ajustado ──
  // Estos valores se derivaron midiendo con getBoundingClientRect() las
  // secciones REALES de components/PokemonCardPreview.tsx (max-w-xs = 320px)
  // y escalándolas por 620/320 = 1.9375 (proporción del ancho de este canvas
  // frente al ancho real de la vista previa). Antes solo artH se había vuelto
  // a calcular tras los cambios de diseño (fuente, texturas, fila de
  // debilidad/resistencia); el resto de secciones se quedó muy por debajo de
  // su tamaño real, por lo que el panel de arte se veía desproporcionadamente
  // grande frente al resto de la carta descargada.
  const cardX = 14, cardY = 14, cardW = W - 28;
  const nameStripH = secondaryType ? 92 : 66; // namestrip(30)+secondline(17.5) o pb-1(4), × 1.9375
  const artH = 310; // proporción ancho/alto igual a la del panel de arte en PokemonCardPreview.tsx (h-40 sobre ~288px de ancho)
  const pokedexPillH = 27; // (24.75 medido - 11 de -mt-[11px]) × 1.9375
  const movesPadY = 27; // aumentado desde 16: con pipSize=33 (bolas de energía más grandes tras
  // subir el tamaño de letra), 16px de margen dejaba la primera fila de ataques tocando el borde
  // inferior de la pastilla Pokédex — se necesita medio pipSize + margen real para no solaparse.
  const movesRowH = 64; // (movespanel 83 - pad 16 - gap 10) / 2 × 1.9375
  const movesBlockH = movesPadY * 2 + moves.length * movesRowH;
  const weaknessRowH = 96; // 49.5 medido × 1.9375
  const bottomStripH = 46; // 24 medido × 1.9375
  const trainerBlockH = 148; // entrenador + QR (nuestro añadido, no está en cartas reales)
  const cardBodyH = nameStripH + artH + pokedexPillH + movesBlockH + weaknessRowH + bottomStripH;
  const H = cardY * 2 + cardBodyH + trainerBlockH;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fondo general de la imagen (detrás de la carta)
  ctx.fillStyle = "#eceff1";
  ctx.fillRect(0, 0, W, H);

  // ── Marco plateado metálico PLANO (dorado si la rareza es holo, como una carta real) ──
  const frameGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardBodyH);
  if (rarity.holo) {
    frameGrad.addColorStop(0, "#f7e9c8");
    frameGrad.addColorStop(0.3, "#d9c48f");
    frameGrad.addColorStop(0.5, "#b8974f");
    frameGrad.addColorStop(0.7, "#d9c48f");
    frameGrad.addColorStop(1, "#f7e9c8");
  } else {
    frameGrad.addColorStop(0, "#f4f5f6");
    frameGrad.addColorStop(0.3, "#cfd3d8");
    frameGrad.addColorStop(0.5, "#9aa0aa");
    frameGrad.addColorStop(0.7, "#cfd3d8");
    frameGrad.addColorStop(1, "#f4f5f6");
  }
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = frameGrad;
  roundRect(ctx, cardX, cardY, cardW, cardBodyH, 12);
  ctx.fill();
  ctx.restore();

  const frameBorder = 6;
  const bodyX = cardX + frameBorder, bodyY = cardY + frameBorder, bodyW = cardW - frameBorder * 2, bodyH = cardBodyH - frameBorder * 2;

  // ── Cuerpo de la carta: blanco con tinte suave del tipo (no saturado) ──
  ctx.save();
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 8);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
  const tintGrad = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
  tintGrad.addColorStop(0, `${colors.bg}30`);
  tintGrad.addColorStop(0.35, "#ffffff00");
  tintGrad.addColorStop(0.8, "#ffffff00");
  tintGrad.addColorStop(1, `${colors.bg}22`);
  ctx.fillStyle = tintGrad;
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  // Grano fino de papel sobre el cuerpo de la carta, igual que
  // components/PokemonCardPreview.tsx (que usa un filtro SVG feTurbulence: un
  // ruido continuo y suave). El primer intento aquí colocaba puntos sueltos de
  // 1x1 al azar, con muy poca densidad — se veía como motas dispersas, no como
  // grano de papel. En su lugar se genera ruido por píxel con ImageData: cada
  // píxel recibe una variación de luminosidad aleatoria pero acotada, dando un
  // grano continuo y fino equivalente al de la vista previa en vivo.
  ctx.save();
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 8);
  ctx.clip();
  const grainX = Math.floor(bodyX), grainY = Math.floor(bodyY);
  const grainW = Math.ceil(bodyW), grainH = Math.ceil(bodyH);
  const grainImg = ctx.createImageData(grainW, grainH);
  let grainSeed = 90125;
  const grainRnd = () => {
    grainSeed = (grainSeed * 1103515245 + 12345) & 0x7fffffff;
    return (grainSeed % 10000) / 10000;
  };
  // El SVG feColorMatrix de React pinta un color gris-calido SOLIDO (0.55,
  // 0.52, 0.48 -> rgb(140,133,122)) cuya ALPHA varia con el ruido de
  // feTurbulence (matriz de alpha: "0 0 0 0.55 0"), combinado con
  // "multiply". Un "overlay" de blanco/negro con alpha bajo (como se hacia
  // antes) es casi invisible sobre fondo casi blanco; "multiply" con este
  // gris calido SI oscurece visiblemente los pixeles, igual que en React.
  for (let p = 0; p < grainImg.data.length; p += 4) {
    const n = grainRnd();
    grainImg.data[p] = 140;
    grainImg.data[p + 1] = 133;
    grainImg.data[p + 2] = 122;
    grainImg.data[p + 3] = Math.round(n * 140); // alpha variable: da el patron de grano
  }
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = grainW;
  grainCanvas.height = grainH;
  grainCanvas.getContext("2d")!.putImageData(grainImg, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(grainCanvas, grainX, grainY);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "#b8bcc2";
  ctx.lineWidth = 1;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 8);
  ctx.stroke();
  ctx.restore();

  const displayName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  const pad = bodyX + 14;

  // Medidas que la capa de brillo/tornasol necesita para recortar las zonas
  // que NUNCA debe teñir (panel de arte y tag de etapa), calculadas aquí para
  // poder dibujar esa capa ANTES que el texto y los iconos (igual que en
  // components/PokemonCardPreview.tsx, donde el destello va en un z-index por
  // debajo de todo el contenido): así el texto oscuro nunca queda tapado ni
  // recoloreado por "color-dodge".
  const artOuterX = bodyX + 10, artOuterY = bodyY + nameStripH, artOuterW = bodyW - 20;
  const stageTagH = 33; // px-2.5 py-[3px] con fuente 10px, escalado × 1.9375
  ctx.font = `800 19px ${FONT_DISPLAY}`;
  // El letter-spacing (aplicado más abajo al dibujar el tag) no lo tiene en cuenta
  // ctx.measureText(): sin sumarlo aquí, el texto real (con espaciado entre letras)
  // queda más ancho que el contenedor calculado y se sale del recorte diagonal.
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1px";
  const stageTextWidthWithSpacing = ctx.measureText(stage).width;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  const stageTagW = stageTextWidthWithSpacing + 30;

  // ── Capa de brillo/tornasol, ANTES de dibujar cualquier texto o icono
  // (como el laminado satinado de una carta TCG real), recortada a su forma
  // redondeada y EXCLUYENDO el panel de arte y el tag de etapa. ──
  ctx.save();
  const sheenClip = new Path2D();
  sheenClip.roundRect(bodyX, bodyY, bodyW, bodyH, 8);
  sheenClip.roundRect(artOuterX, artOuterY, artOuterW, artH, 4);
  sheenClip.rect(bodyX, bodyY, stageTagW + 4, stageTagH + 4);
  ctx.clip(sheenClip, "evenodd");
  ctx.save();
  // "overlay" con blanco puro sobre un fondo ya casi blanco da un resultado
  // casi invisible (la matemática de overlay converge al valor de la capa
  // superior cuando el fondo es blanco). Se usa una franja gris clara con
  // composición normal en su lugar: así el destello SE VE sobre el papel,
  // igual que el reflejo de luz en el laminado brillante de una carta real.
  //
  // Igual que el "linear-gradient(115deg, ...)" de CSS en
  // components/PokemonCardPreview.tsx: un ángulo real, no un punto final
  // arbitrario proporcional al ancho/alto (eso último solo funciona en cajas
  // cuadradas — en una carta alta y angosta, el ángulo real resultante era muy
  // distinto del de React, y la franja de brillo terminaba fuera de la zona
  // visible o en un lugar diferente al de la vista previa).
  const sheenAngleRad = ((115 - 90) * Math.PI) / 180; // CSS mide desde arriba (0deg = ↑), canvas desde la derecha (0rad = →)
  const sheenDirX = Math.cos(sheenAngleRad), sheenDirY = Math.sin(sheenAngleRad);
  const sheenHalfDiag = (Math.abs(bodyW * sheenDirX) + Math.abs(bodyH * sheenDirY)) / 2;
  const sheenCx = bodyX + bodyW / 2, sheenCy = bodyY + bodyH / 2;
  const sheenGrad = ctx.createLinearGradient(
    sheenCx - sheenDirX * sheenHalfDiag, sheenCy - sheenDirY * sheenHalfDiag,
    sheenCx + sheenDirX * sheenHalfDiag, sheenCy + sheenDirY * sheenHalfDiag
  );
  if (rarity.holo) {
    sheenGrad.addColorStop(0.15, "rgba(255,255,255,0)");
    sheenGrad.addColorStop(0.38, "rgba(120,130,145,0.14)");
    sheenGrad.addColorStop(0.48, "rgba(255,255,255,0.45)");
    sheenGrad.addColorStop(0.58, "rgba(120,130,145,0.14)");
    sheenGrad.addColorStop(0.8, "rgba(255,255,255,0)");
  } else {
    sheenGrad.addColorStop(0.3, "rgba(255,255,255,0)");
    sheenGrad.addColorStop(0.45, "rgba(140,148,160,0.12)");
    sheenGrad.addColorStop(0.5, "rgba(255,255,255,0.45)");
    sheenGrad.addColorStop(0.55, "rgba(140,148,160,0.12)");
    sheenGrad.addColorStop(0.68, "rgba(255,255,255,0)");
  }
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
  ctx.restore();

  if (rarity.holo) {
    // Efecto tornasol arcoíris (cosmos holo), igual que una carta rara real
    ctx.save();
    ctx.globalCompositeOperation = "color-dodge";
    ctx.globalAlpha = 0.16;
    const stripe = ["#ff6bb0", "#ffb37b", "#fff27b", "#7bffb0", "#7bd4ff", "#b17bff"];
    const diag = Math.max(bodyW, bodyH) * 1.6;
    ctx.translate(bodyX + bodyW / 2, bodyY + bodyH / 2);
    ctx.rotate((-115 * Math.PI) / 180);
    const bandCount = stripe.length * 3;
    const bandW = diag / bandCount;
    for (let i = 0; i < bandCount; i++) {
      const c0 = stripe[i % stripe.length];
      const c1 = stripe[(i + 1) % stripe.length];
      const bandGrad = ctx.createLinearGradient(-diag / 2 + i * bandW, 0, -diag / 2 + (i + 1) * bandW, 0);
      bandGrad.addColorStop(0, c0);
      bandGrad.addColorStop(1, c1);
      ctx.fillStyle = bandGrad;
      ctx.fillRect(-diag / 2 + i * bandW, -diag / 2, bandW, diag);
    }
    ctx.restore();

    // Puntitos de brillo (glitter) sobre el tornasol
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#ffffff";
    let holoSeed = pokemon.id * 7919;
    const holoRnd = () => {
      holoSeed = (holoSeed * 1103515245 + 12345) & 0x7fffffff;
      return (holoSeed % 1000) / 1000;
    };
    for (let i = 0; i < 90; i++) {
      const gx = bodyX + holoRnd() * bodyW;
      const gy = bodyY + holoRnd() * bodyH;
      ctx.beginPath();
      ctx.arc(gx, gy, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  // ── Tag de etapa (esquina superior izquierda, recorte diagonal como en cartas reales) ──
  // font-extrabold (800) + letter-spacing, igual que "tracking-wide font-extrabold"
  // en components/PokemonCardPreview.tsx (antes usaba 700 sin letter-spacing).
  ctx.save();
  ctx.font = `800 19px ${FONT_DISPLAY}`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1px";
  ctx.beginPath();
  ctx.moveTo(bodyX, bodyY);
  ctx.lineTo(bodyX + stageTagW, bodyY);
  ctx.lineTo(bodyX + stageTagW - stageTagW * 0.14, bodyY + stageTagH);
  ctx.lineTo(bodyX, bodyY + stageTagH);
  ctx.closePath();
  const stageGrad = ctx.createLinearGradient(bodyX, bodyY, bodyX + stageTagW, bodyY + stageTagH);
  stageGrad.addColorStop(0, "#4a4a4a");
  stageGrad.addColorStop(1, "#1c1917");
  ctx.fillStyle = stageGrad;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(stage, bodyX + 16, bodyY + stageTagH / 2 + 1);
  ctx.restore();
  const nameLeftX = bodyX + stageTagW + 18;

  // Dibuja el icono de tipo oficial (imagen precargada) dentro de un cuadrado
  // redondeado de tamaño `size`, centrado en (cx, cy). Sin círculo de color
  // duplicado detrás: el PNG ya trae su propio fondo de color.
  function drawTypeOrb(cx: number, cy: number, size: number, type: string) {
    const icon = typeIcons.get(type);
    const r = size * 0.22;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 2;
    if (icon) {
      roundRect(ctx, cx - size / 2, cy - size / 2, size, size, r);
      ctx.clip();
      ctx.drawImage(icon, cx - size / 2, cy - size / 2, size, size);
    } else {
      roundRect(ctx, cx - size / 2, cy - size / 2, size, size, r);
      ctx.fillStyle = typeColor(type).bg;
      ctx.fill();
    }
    ctx.restore();
  }
  // Energía incolora: esfera plateada lisa con relieve metálico (gradiente
  // radial + sombra interior), igual que el símbolo real de las cartas TCG
  // (un círculo gris liso, sin ningún glifo dentro: la estrella anterior se
  // leía como un botón de interfaz, no como energía Pokémon).
  function drawColorlessOrb(cx: number, cy: number, r: number) {
    ctx.save();
    const metalGrad = ctx.createRadialGradient(cx - r * 0.34, cy - r * 0.3, r * 0.1, cx, cy, r);
    metalGrad.addColorStop(0, "#ffffff");
    metalGrad.addColorStop(0.45, "#e4e6e9");
    metalGrad.addColorStop(0.75, "#c2c6cc");
    metalGrad.addColorStop(1, "#9fa4ab");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = metalGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 0.75;
    ctx.stroke();
    // brillo superior (resalta el relieve)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.35, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fill();
    ctx.restore();
    // sombra interior inferior
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy + r * 0.4, r * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // ── Franja de nombre + HP + tipo ──
  // Posiciones y tamaños de fuente recalculados con getBoundingClientRect()
  // sobre la vista previa real (ver notas de nameStripH más arriba): antes
  // este bloque quedaba pegado arriba, dejando un hueco vacío hasta el panel
  // de arte porque nameStripH creció pero el contenido no se movió con él.
  const headerBaselineY = bodyY + 44;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1c1917";
  ctx.font = `700 37px ${FONT_DISPLAY}`;
  ctx.textAlign = "left";
  ctx.fillText(displayName, nameLeftX, headerBaselineY);

  // Icono de tipo primario: se posiciona primero, pegado al borde derecho,
  // y el HP/"HP" se miden y colocan a su izquierda — así nunca se solapan
  // sin importar cuántos dígitos tenga el HP o qué tan ancho sea el nombre.
  const headerOrbSize = 39;
  const headerOrbCx = bodyX + bodyW - 20 - headerOrbSize / 2;
  drawTypeOrb(headerOrbCx, headerBaselineY - 11, headerOrbSize, primaryType);
  const headerOrbLeftEdge = headerOrbCx - headerOrbSize / 2;

  ctx.font = `700 20px ${FONT_DISPLAY}`;
  ctx.fillStyle = "#57534e";
  ctx.textAlign = "right";
  const hpLabelX = headerOrbLeftEdge - 10;
  ctx.fillText("HP", hpLabelX, headerBaselineY);
  const hpLabelWidth = ctx.measureText("HP").width;

  ctx.font = `700 33px ${FONT_DISPLAY}`;
  ctx.fillStyle = "#1c1917";
  const hpText = String(pokemon.hp);
  ctx.fillText(hpText, hpLabelX - hpLabelWidth - 6, headerBaselineY);
  ctx.textAlign = "left";

  if (secondaryType) {
    const secondLineY = bodyY + 80;
    ctx.font = `italic 500 19px ${FONT}`;
    ctx.fillStyle = "#57534e";
    ctx.textAlign = "left";
    ctx.fillText(`También tipo ${TYPE_LABEL_ES[secondaryType]}`, pad, secondLineY);
    const secondaryLabelW = ctx.measureText(`También tipo ${TYPE_LABEL_ES[secondaryType]}`).width;
    drawTypeOrb(pad + secondaryLabelW + 18, secondLineY - 6, 25, secondaryType);
  }

  // ── Panel de arte enmarcado (borde blanco grueso + línea gris) ──
  // (artOuterX/Y/W ya se calcularon más arriba, antes de la capa de brillo)
  const artBorder = 4;
  const artX = artOuterX + artBorder, artY = artOuterY + artBorder, artW = artOuterW - artBorder * 2, artHInner = artH - artBorder * 2;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, artOuterX, artOuterY, artOuterW, artH, 4);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, artX, artY, artW, artHInner, 2);
  ctx.clip();
  ctx.fillStyle = colors.bg;
  ctx.fillRect(artX, artY, artW, artHInner);

  // Viñeta radial suave detrás del sprite, como el fondo de una carta real
  // (se dibuja ANTES del sprite, así que nunca lo tiñe). Se quitó el grano
  // que había aquí: a esta resolución se veía como ruido y degradaba la
  // nitidez del sprite dibujado encima.
  ctx.save();
  const vignette = ctx.createRadialGradient(
    artX + artW / 2, artY + artHInner * 0.45, artHInner * 0.25,
    artX + artW / 2, artY + artHInner * 0.45, artHInner * 0.75
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = vignette;
  ctx.fillRect(artX, artY, artW, artHInner);
  ctx.restore();

  try {
    const sprite = await loadImage(pokemon.sprite);
    const spad = 10;
    const maxW = artW - spad * 2, maxH = artHInner - spad * 2;
    const scale = Math.min(maxW / sprite.width, maxH / sprite.height);
    const dw = sprite.width * scale, dh = sprite.height * scale;
    const dx = artX + (artW - dw) / 2, dy = artY + (artHInner - dh) / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(sprite, dx, dy, dw, dh);
    ctx.restore();
  } catch {
    // sprite failed to load — leave art panel empty
  }
  ctx.restore();
  ctx.strokeStyle = "#b8bcc2";
  ctx.lineWidth = 1;
  roundRect(ctx, artOuterX, artOuterY, artOuterW, artH, 4);
  ctx.stroke();

  // ── Franja Pokédex tipo "pastilla" ──
  const pillY = artOuterY + artH - pokedexPillH / 2;
  const pillX = bodyX + 20, pillW = bodyW - 40;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 4;
  const pillGrad = ctx.createLinearGradient(0, pillY, 0, pillY + pokedexPillH);
  pillGrad.addColorStop(0, "#ffffff");
  pillGrad.addColorStop(1, "#e9eaec");
  ctx.fillStyle = pillGrad;
  roundRect(ctx, pillX, pillY, pillW, pokedexPillH, pokedexPillH / 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#c7cad0";
  ctx.lineWidth = 1;
  roundRect(ctx, pillX, pillY, pillW, pokedexPillH, pokedexPillH / 2);
  ctx.stroke();

  ctx.font = `italic 500 19px ${FONT}`;
  ctx.fillStyle = "#57534e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `N.º ${String(pokemon.id).padStart(4, "0")}   ALT ${formatHeightFeet(pokemon.height)}   PESO ${formatWeightLbs(pokemon.weight)}`,
    bodyX + bodyW / 2,
    pillY + pokedexPillH / 2 + 1
  );
  ctx.textAlign = "left";

  // ── Panel de ataques ──
  const movesY0 = artOuterY + artH + pokedexPillH / 2 + movesPadY;
  const pipSize = 33; // mismo tamaño visual para el icono de tipo y las bolas incoloras (17px React × 1.9375)
  const pipStep = pipSize + 8;
  let moveY = movesY0;
  for (const move of moves) {
    let pipX = pad + pipSize / 2;
    for (let i = 0; i < move.cost; i++) {
      if (i === 0) {
        drawTypeOrb(pipX, moveY, pipSize, primaryType);
      } else {
        drawColorlessOrb(pipX, moveY, pipSize / 2);
      }
      pipX += pipStep;
    }
    ctx.font = `600 29px ${FONT}`;
    ctx.fillStyle = "#1c1917";
    ctx.textBaseline = "middle";
    ctx.fillText(move.name, pipX + 10, moveY);

    ctx.textAlign = "right";
    ctx.font = `700 37px ${FONT_DISPLAY}`;
    ctx.fillText(String(move.damage), bodyX + bodyW - 16, moveY);
    ctx.textAlign = "left";

    moveY += movesRowH;
  }

  // ── Fila de 3 columnas iguales: debilidad | resistencia | retirada ──
  // (grid fijo, igual que components/PokemonCardPreview.tsx, para que nada se salga del ancho de la carta)
  const wRowTop = movesY0 + movesBlockH - movesPadY;
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bodyX + 14, wRowTop);
  ctx.lineTo(bodyX + bodyW - 14, wRowTop);
  ctx.stroke();
  ctx.restore();

  const wColW = (bodyW - 28) / 3;
  const wLabelY = wRowTop + 27;
  const wValueY = wRowTop + 54;
  const retreatCost = Math.max(1, Math.min(4, Math.round(pokemon.weight / 300)));
  const weaknessType = pokemon.weaknesses?.[0];
  const resistanceType = pokemon.resistances?.[0];

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Columna 1: debilidad (tipo real según damage_relations de PokeAPI, no el propio tipo del Pokémon)
  const col1X = pad;
  const debilidadOrbSize = 27;
  ctx.font = `700 19px ${FONT_DISPLAY}`;
  ctx.fillStyle = "#57534e";
  ctx.fillText("DEBILIDAD", col1X, wLabelY);
  if (weaknessType) {
    drawTypeOrb(col1X + debilidadOrbSize / 2, wValueY, debilidadOrbSize, weaknessType);
    ctx.font = `700 21px ${FONT_DISPLAY}`;
    ctx.fillStyle = "#c0392b";
    ctx.fillText("×2", col1X + debilidadOrbSize + 10, wValueY);
  } else {
    ctx.font = `600 21px ${FONT}`;
    ctx.fillStyle = "#57534e";
    ctx.fillText("Ninguna", col1X, wValueY);
  }

  // Columna 2: resistencia (tipo real; solo se muestra si existe alguna)
  const col2X = pad + wColW;
  ctx.font = `700 19px ${FONT_DISPLAY}`;
  ctx.fillStyle = "#57534e";
  ctx.fillText("RESISTENCIA", col2X, wLabelY);
  if (resistanceType) {
    const resistOrbSize = 27;
    drawTypeOrb(col2X + resistOrbSize / 2, wValueY, resistOrbSize, resistanceType);
    ctx.font = `700 21px ${FONT_DISPLAY}`;
    ctx.fillStyle = "#2f7d4f";
    ctx.fillText("-20", col2X + resistOrbSize + 10, wValueY);
  } else {
    ctx.font = `600 21px ${FONT}`;
    ctx.fillStyle = "#57534e";
    ctx.fillText("Ninguna", col2X, wValueY);
  }

  // Columna 3: retirada
  const col3X = pad + wColW * 2;
  ctx.font = `700 19px ${FONT_DISPLAY}`;
  ctx.fillStyle = "#57534e";
  ctx.fillText("RETIRADA", col3X, wLabelY);
  let retreatX = col3X + 12;
  const retreatMaxX = bodyX + bodyW - 16;
  for (let p = 0; p < retreatCost; p++) {
    if (retreatX + 12 > retreatMaxX) break; // nunca dibujar fuera del ancho de la carta
    drawColorlessOrb(retreatX, wValueY, 11.5);
    retreatX += 27;
  }

  // ── Footer: rareza + numeración (como una carta real) ──
  const stripY = wRowTop + weaknessRowH;
  ctx.font = `500 18px ${FONT}`;
  ctx.fillStyle = "#57534e";
  ctx.textAlign = "left";
  ctx.fillText(`MEG ${String(pokemon.id).padStart(3, "0")}`, pad, stripY + bottomStripH / 2);
  ctx.textAlign = "right";
  ctx.font = `bold 23px ${FONT}`;
  ctx.fillStyle = "#57534e";
  ctx.fillText(rarity.symbol, bodyX + bodyW - 14, stripY + bottomStripH / 2);
  ctx.textAlign = "left";

  // ── Bloque final (fuera de la réplica de carta): entrenador + QR, centrado
  // verticalmente en el bloque ya que no hay más texto debajo ──
  const qrSize = 100;
  const qrBoxPad = 8; // grosor del marco blanco alrededor del QR
  const sideMargin = 6; // mismo margen que "ENTRENADOR/A" respecto al borde izquierdo
  const trainerBlockY0 = cardY + cardBodyH;
  const qrY = trainerBlockY0 + (trainerBlockH - (qrSize + qrBoxPad * 2)) / 2 + qrBoxPad;
  const qrX = cardX + cardW - qrSize - qrBoxPad - sideMargin;
  const trainerY = qrY + qrSize / 2 - 14;

  ctx.font = `600 23px ${FONT}`;
  ctx.fillStyle = "#57534e";
  ctx.fillText("ENTRENADOR/A", cardX + 6, trainerY);

  // El nombre del entrenador lo escribe la persona (hasta 40 caracteres, ver
  // maxLength en components/FormPokemon.tsx) y antes se dibujaba a tamaño fijo
  // sin límite de ancho: un nombre largo terminaba metido debajo del QR. Aquí
  // se reduce el tamaño de fuente hasta que quepa en el espacio disponible
  // (entre el borde izquierdo y el QR) y, si aun así no cabe, se trunca con
  // puntos suspensivos — igual que un "text-overflow: ellipsis" real.
  const trainerLabel = trainerName || "Entrenador Anónimo";
  // -12 de margen de seguridad para que el texto nunca quede pegado al marco del QR
  const trainerMaxW = qrX - qrBoxPad - sideMargin - (cardX + 6) - 12;
  let trainerFontSize = 34;
  ctx.fillStyle = "#292524";
  while (trainerFontSize > 13) {
    ctx.font = `700 ${trainerFontSize}px ${FONT_DISPLAY}`;
    if (ctx.measureText(trainerLabel).width <= trainerMaxW) break;
    trainerFontSize -= 2;
  }
  ctx.font = `700 ${trainerFontSize}px ${FONT_DISPLAY}`;
  let trainerText = trainerLabel;
  if (ctx.measureText(trainerText).width > trainerMaxW) {
    while (trainerText.length > 1 && ctx.measureText(trainerText + "…").width > trainerMaxW) {
      trainerText = trainerText.slice(0, -1);
    }
    trainerText += "…";
  }
  ctx.fillText(trainerText, cardX + 6, trainerY + trainerFontSize);

  try {
    const qrDataUrl = await QRCode.toDataURL(formUrl, { margin: 1, width: 200, color: { dark: "#292524ff", light: "#ffffffff" } });
    const qrImg = await loadImage(qrDataUrl);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, qrX - qrBoxPad, qrY - qrBoxPad, qrSize + qrBoxPad * 2, qrSize + qrBoxPad * 2, 10);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch {
    // QR failed — card still usable without it
  }

  return canvas.toDataURL("image/png");
}
