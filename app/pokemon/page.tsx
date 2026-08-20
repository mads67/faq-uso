import FormPokemon from "@/components/FormPokemon";

const POKEBALL_PATTERN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='16' fill='none' stroke='%23ffffff' stroke-opacity='0.5' stroke-width='2'/%3E%3Cpath d='M14 30a16 16 0 0 1 32 0Z' fill='%23ffffff' fill-opacity='0.12'/%3E%3Cline x1='14' y1='30' x2='46' y2='30' stroke='%23ffffff' stroke-opacity='0.5' stroke-width='2'/%3E%3Ccircle cx='30' cy='30' r='4' fill='none' stroke='%23ffffff' stroke-opacity='0.5' stroke-width='2'/%3E%3C/svg%3E";

export default async function PokemonPage(props: { searchParams?: Promise<{ s?: string }> }) {
  const params = await props.searchParams;
  const session = params?.s || null;
  return (
    <main
      className="min-h-screen py-8 sm:py-10 px-3 sm:px-6 lg:px-8"
      style={{
        backgroundColor: "#dc2626",
        backgroundImage: `linear-gradient(160deg, #dc2626 0%, #ef4444 35%, #f97316 100%), url("${POKEBALL_PATTERN}")`,
        backgroundBlendMode: "normal, overlay",
        backgroundSize: "auto, 60px 60px",
      }}
    >
      <style>{`
        @keyframes introPop {
          0% { opacity: 0; transform: translateY(14px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes introShine {
          0%, 100% { background-position: -200% 0; }
          50% { background-position: 200% 0; }
        }
        @keyframes introGlow {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(251,191,36,0.0), 0 8px 24px -8px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 22px 3px rgba(251,191,36,0.55), 0 8px 24px -8px rgba(0,0,0,0.4); }
        }
        @keyframes introBallSpin {
          0%, 100% { transform: rotate(-8deg) translateY(0); }
          50% { transform: rotate(8deg) translateY(-4px); }
        }
        .intro-card {
          animation: introPop 0.55s cubic-bezier(.2,1.2,.4,1) both, introGlow 2.8s ease-in-out 0.6s infinite;
        }
        .intro-text {
          background: linear-gradient(90deg, #fff 40%, #fde68a 50%, #fff 60%);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: introShine 4s ease-in-out 0.6s infinite;
        }
        .intro-ball {
          animation: introBallSpin 2.2s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">

        {/* Header + intro — solo mobile/tablet */}
        <div className="mb-6 lg:hidden">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight text-center drop-shadow-sm">
            Consultas académicas: ¿qué Pokémon te tocará?
          </h1>
          <p className="mt-1 text-xs text-white/80 text-center">Dirigido a estudiantes de la Universidad de Sonsonate</p>
          <div
            className="intro-card mt-4 rounded-2xl px-4 py-4 flex items-start gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
              border: "1.5px solid rgba(251,191,36,0.6)",
            }}
          >
            <span className="intro-ball text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">⚡</span>
            <p className="font-[family-name:var(--font-barlow-condensed)] text-white text-lg leading-snug tracking-wide">
              Responde este breve cuestionario sobre trámites y servicios académicos y, al finalizar,{" "}
              <span className="intro-text font-extrabold">¡descubre qué Pokémon te tocó!</span>{" "}
              Podrás descargar tu propia tarjeta estilo Pokémon con tu nombre.
            </p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] lg:gap-10 lg:items-start">

          {/* Panel izquierdo — solo desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight drop-shadow-sm">
                  Consultas académicas: ¿qué Pokémon te tocará?
                </h1>
                <p className="mt-1.5 text-xs text-white/80">Dirigido a estudiantes de la Universidad de Sonsonate</p>
              </div>

              <div
                className="intro-card rounded-2xl px-4 py-4 flex items-start gap-3"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
                  border: "1.5px solid rgba(251,191,36,0.6)",
                }}
              >
                <span className="intro-ball text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">⚡</span>
                <p className="font-[family-name:var(--font-barlow-condensed)] text-white text-base leading-snug tracking-wide">
                  Responde este breve cuestionario sobre trámites y servicios académicos y, al finalizar,{" "}
                  <span className="intro-text font-extrabold">¡descubre qué Pokémon te tocó!</span>{" "}
                  Podrás descargar tu propia tarjeta estilo Pokémon con tu nombre.
                </p>
              </div>
            </div>
          </aside>

          {/* Formulario */}
          <div className="bg-white border border-white/40 p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl">
            <FormPokemon initialSession={session} />
          </div>

        </div>

        <p className="mt-6 text-center text-[10px] sm:text-xs text-white/70">
          &copy; {new Date().getFullYear()} Universidad de Sonsonate. Pokémon y sus nombres son marca de Nintendo/Game Freak, usados aquí solo con fines ilustrativos.
        </p>
      </div>
    </main>
  );
}
