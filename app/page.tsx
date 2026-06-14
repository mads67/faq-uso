import FormFAQ from "@/components/FormFAQ";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight">
            Recolección de preguntas frecuentes
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Universidad de Sonsonate · Sistema de FAQ institucional
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <FormFAQ />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Universidad de Sonsonate
        </p>
      </div>
    </main>
  );
}
