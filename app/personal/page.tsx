import FormFAQ from "@/components/FormFAQ";

const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default async function PersonalPage(props: { searchParams?: Promise<{ s?: string }> }) {
  const params = await props.searchParams;
  const session = params?.s || null;

  return (
    <main className="min-h-screen bg-gray-100 py-8 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header + intro — solo mobile/tablet */}
        <div className="mb-6 lg:hidden">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight text-center">
            Recolección de preguntas frecuentes
          </h1>
          <p className="mt-1 text-xs text-gray-400 text-center">Dirigido a personal universitario</p>
          <div className="mt-4 border-l-4 border-gray-900 pl-4 py-0.5">
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="font-semibold text-gray-900">¿Para qué sirve este formulario?</strong>{" "}
              Se está desarrollando un{" "}
              <strong className="font-semibold text-gray-900">chatbot de atención estudiantil</strong>{" "}
              para la Universidad de Sonsonate que orientará a los estudiantes sobre trámites
              y servicios académicos de forma automática. Para que el chatbot responda con precisión
              necesita aprender de la experiencia real de cada unidad. Su aporte consiste en registrar
              las preguntas que recibe con frecuencia junto con sus respuestas, ya sea escribiéndolas
              directamente en el formulario o adjuntando un documento que contenga la lista de
              preguntas y respuestas.
            </p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] lg:gap-10 lg:items-start">

          {/* Panel izquierdo — solo desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  Recolección de preguntas frecuentes
                </h1>
                <p className="mt-1.5 text-xs text-gray-400">Dirigido a personal universitario</p>
              </div>

              <div className="border-l-4 border-gray-900 pl-4 py-0.5">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Se está desarrollando un{" "}
                  <strong className="font-semibold text-gray-900">chatbot de atención estudiantil</strong>{" "}
                  para la Universidad de Sonsonate que orientará a los estudiantes sobre trámites
                  y servicios académicos de forma automática. Tu aporte consiste en registrar las
                  preguntas que recibes con frecuencia junto con sus respuestas, ya sea escribiéndolas
                  directamente o adjuntando un documento que contenga ese listado.
                </p>
              </div>

              <div className="border border-gray-200 rounded p-4 bg-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  ¿Qué puedes registrar?
                </p>
                <div className="space-y-2">
                  {["Preguntas y documentos", "Solo preguntas", "Solo documentos"].map(label => (
                    <div key={label} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 shrink-0">
                        <IconCheck />
                      </span>
                      {label}
                    </div>
                  ))}
                  <div className="flex items-center gap-2.5 text-sm text-red-500 pt-2 mt-1 border-t border-gray-200">
                    <span className="w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <IconX />
                    </span>
                    Sin contenido no es posible enviar
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Formulario */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6 md:p-8 rounded">
            <FormFAQ initialSession={session} />
          </div>

        </div>

        <p className="mt-6 text-center text-[10px] sm:text-xs text-gray-300">
          &copy; {new Date().getFullYear()} Universidad de Sonsonate
        </p>
      </div>
    </main>
  );
}
