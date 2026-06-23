import FormCuestionario from "@/components/FormCuestionario";

export default async function EstudiantesPage(props: { searchParams?: Promise<{ s?: string }> }) {
  const params = await props.searchParams;
  const session = params?.s || null;
  return (
    <main className="min-h-screen bg-gray-100 py-8 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header + intro — solo mobile/tablet */}
        <div className="mb-6 lg:hidden">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight text-center">
            Consultas sobre trámites y servicios académicos
          </h1>
          <p className="mt-1 text-xs text-gray-400 text-center">Dirigido a estudiantes de la Universidad de Sonsonate</p>
          <div className="mt-4 border-l-4 border-gray-900 pl-4 py-0.5">
            <p className="text-sm text-gray-600 leading-relaxed">
              Este cuestionario busca identificar las consultas más frecuentes que realizan los
              estudiantes sobre trámites y servicios académicos. La información recopilada
              orientará el diseño de la base de conocimientos del chatbot de atención estudiantil.
            </p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] lg:gap-10 lg:items-start">

          {/* Panel izquierdo — solo desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  Consultas sobre trámites y servicios académicos
                </h1>
                <p className="mt-1.5 text-xs text-gray-400">Dirigido a estudiantes de la Universidad de Sonsonate</p>
              </div>

              <div className="border-l-4 border-gray-900 pl-4 py-0.5">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Este cuestionario busca identificar las consultas más frecuentes que realizan los
                  estudiantes sobre trámites y servicios académicos. La información recopilada
                  orientará el diseño de la base de conocimientos del chatbot de atención estudiantil.
                </p>
              </div>

            </div>
          </aside>

          {/* Formulario */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6 md:p-8 rounded">
            <FormCuestionario initialSession={session} />
          </div>

        </div>

        <p className="mt-6 text-center text-[10px] sm:text-xs text-gray-300">
          &copy; {new Date().getFullYear()} Universidad de Sonsonate
        </p>
      </div>
    </main>
  );
}
