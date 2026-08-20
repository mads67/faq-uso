export const TYPE_COLORS: Record<string, { bg: string; grad: string; text: string }> = {
  normal:   { bg: "#A8A77A", grad: "linear-gradient(135deg,#C6C6A7,#A8A77A)", text: "#6D6D4E" },
  fire:     { bg: "#EE8130", grad: "linear-gradient(135deg,#F5AC78,#EE8130)", text: "#9C531F" },
  water:    { bg: "#6390F0", grad: "linear-gradient(135deg,#9DB7F5,#6390F0)", text: "#445E9C" },
  electric: { bg: "#F7D02C", grad: "linear-gradient(135deg,#FAE078,#F7D02C)", text: "#A1871F" },
  grass:    { bg: "#7AC74C", grad: "linear-gradient(135deg,#A7DB8D,#7AC74C)", text: "#4E8234" },
  ice:      { bg: "#96D9D6", grad: "linear-gradient(135deg,#BCE6E6,#96D9D6)", text: "#638D8D" },
  fighting: { bg: "#C22E28", grad: "linear-gradient(135deg,#D67873,#C22E28)", text: "#7D1F1A" },
  poison:   { bg: "#A33EA1", grad: "linear-gradient(135deg,#C183C1,#A33EA1)", text: "#682A68" },
  ground:   { bg: "#E2BF65", grad: "linear-gradient(135deg,#EBD69D,#E2BF65)", text: "#997B41" },
  flying:   { bg: "#A98FF3", grad: "linear-gradient(135deg,#C6B7F5,#A98FF3)", text: "#6D5E9C" },
  psychic:  { bg: "#F95587", grad: "linear-gradient(135deg,#FA92B2,#F95587)", text: "#A13959" },
  bug:      { bg: "#A6B91A", grad: "linear-gradient(135deg,#C6D16E,#A6B91A)", text: "#6D7815" },
  rock:     { bg: "#B6A136", grad: "linear-gradient(135deg,#D1C17D,#B6A136)", text: "#786824" },
  ghost:    { bg: "#735797", grad: "linear-gradient(135deg,#A292BC,#735797)", text: "#493963" },
  dragon:   { bg: "#6F35FC", grad: "linear-gradient(135deg,#A27DFA,#6F35FC)", text: "#4924A1" },
  dark:     { bg: "#705746", grad: "linear-gradient(135deg,#A29288,#705746)", text: "#49392F" },
  steel:    { bg: "#B7B7CE", grad: "linear-gradient(135deg,#D1D1E0,#B7B7CE)", text: "#787887" },
  fairy:    { bg: "#D685AD", grad: "linear-gradient(135deg,#F4BDCB,#D685AD)", text: "#9B6470" },
};

export const TYPE_LABEL_ES: Record<string, string> = {
  normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico",
  grass: "Planta", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
  ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
  rock: "Roca", ghost: "Fantasma", dragon: "Dragón", dark: "Siniestro",
  steel: "Acero", fairy: "Hada",
};

export function typeColor(type: string) {
  return TYPE_COLORS[type] || TYPE_COLORS.normal;
}
