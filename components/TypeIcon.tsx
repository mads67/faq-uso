// Iconos de tipo 100% oficiales: los símbolos reales usados en el juego más
// reciente (Scarlet/Violet), servidos por la propia PokéAPI en su endpoint
// /type/{id} (campo sprites["generation-ix"]["scarlet-violet"].symbol_icon) y
// empaquetados localmente en /public/type-icons/<tipo>.png para no depender
// de una carga de red externa en cada render de la tarjeta.
export default function TypeIcon({ type, size = 14, className = "" }: { type: string; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/type-icons/${type}.png`}
      alt={type}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
