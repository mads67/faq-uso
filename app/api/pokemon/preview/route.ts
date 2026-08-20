import { NextRequest, NextResponse } from "next/server";

const POKEMON_MAX_ID = 1010;

type DamageRelations = {
  double_damage_from: { name: string }[];
  half_damage_from: { name: string }[];
  no_damage_from: { name: string }[];
};

const typeRelationsCache = new Map<string, Promise<DamageRelations>>();
function fetchTypeRelations(type: string): Promise<DamageRelations> {
  let p = typeRelationsCache.get(type);
  if (!p) {
    p = fetch(`https://pokeapi.co/api/v2/type/${type}`)
      .then(r => r.json())
      .then(d => d.damage_relations as DamageRelations);
    typeRelationsCache.set(type, p);
  }
  return p;
}

// Combina el multiplicador de daño de AMBOS tipos del Pokémon (como en el
// juego real: un tipo doble puede anular la debilidad de su otro tipo, por
// ejemplo Volador cancela la debilidad a Tierra). Devuelve solo los tipos
// atacantes cuyo multiplicador neto es >1 (debilidad real) o <1 (resistencia
// real), en vez de inventar los datos como se hacía antes.
async function typeEffectiveness(types: string[]): Promise<{ weaknesses: string[]; resistances: string[] }> {
  const relations = await Promise.all(types.map(fetchTypeRelations));
  const multiplier: Record<string, number> = {};
  const ALL_TYPES = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
  ];
  for (const attackType of ALL_TYPES) {
    let m = 1;
    for (const rel of relations) {
      if (rel.no_damage_from.some(t => t.name === attackType)) m *= 0;
      else if (rel.double_damage_from.some(t => t.name === attackType)) m *= 2;
      else if (rel.half_damage_from.some(t => t.name === attackType)) m *= 0.5;
    }
    multiplier[attackType] = m;
  }
  const weaknesses = ALL_TYPES.filter(t => multiplier[t] > 1);
  const resistances = ALL_TYPES.filter(t => multiplier[t] < 1 && multiplier[t] > 0);
  return { weaknesses, resistances };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const nameParam = searchParams.get("name");

    const identifier =
      nameParam?.trim().toLowerCase() ||
      idParam?.trim() ||
      String(Math.floor(Math.random() * POKEMON_MAX_ID) + 1);

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: `No se encontró un Pokémon para "${identifier}"` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }
    const data = await res.json();

    const statValue = (name: string) =>
      data.stats.find((s: { stat: { name: string } }) => s.stat.name === name)?.base_stat ?? 0;

    const types: string[] = data.types.map((t: { type: { name: string } }) => t.type.name);
    const { weaknesses, resistances } = await typeEffectiveness(types);

    return NextResponse.json({
      id: data.id,
      name: data.name,
      types,
      sprite:
        data.sprites?.other?.["official-artwork"]?.front_default ||
        data.sprites?.front_default ||
        "",
      spriteAnimated: data.sprites?.versions?.["generation-v"]?.["black-white"]?.animated?.front_default || null,
      height: data.height,
      weight: data.weight,
      hp: statValue("hp"),
      attack: statValue("attack"),
      defense: statValue("defense"),
      weaknesses,
      resistances,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    console.error("[pokemon/preview]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
