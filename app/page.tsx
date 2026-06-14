import FormFAQ from "@/components/FormFAQ";

export default async function Home(props: { searchParams?: Promise<{ s?: string }> }) {
  const params = await props.searchParams;
  const session = params?.s || null;

  return (
    <main className="min-h-screen bg-gray-100 py-8 sm:py-12 px-3 sm:px-4">
      <div className="max-w-3xl lg:max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            Recolección de preguntas frecuentes
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400">
            Universidad de Sonsonate
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-400 p-4 sm:p-6 md:p-8 rounded">
          <FormFAQ initialSession={session} />
        </div>

        <p className="mt-6 text-center text-[10px] sm:text-xs text-gray-300">
          &copy; {new Date().getFullYear()} Universidad de Sonsonate
        </p>
      </div>
    </main>
  );
}
