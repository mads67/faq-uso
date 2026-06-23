"use client";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* Número grande */}
        <div className="mb-6 select-none">
          <span className="block text-[120px] sm:text-[160px] font-black leading-none text-gray-200 tracking-tighter">
            404
          </span>
        </div>

        {/* Mensaje */}
        <h1 className="text-lg font-bold text-gray-900 mb-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          La dirección que ingresaste no existe o no está disponible.
          Verifica el enlace que recibiste.
        </p>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition active:scale-[.97] cursor-pointer mb-8"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </button>

        {/* Separador decorativo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-300">
            Universidad de Sonsonate
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-[11px] text-gray-300">
          &copy; {new Date().getFullYear()} Universidad de Sonsonate
        </p>
      </div>
    </main>
  );
}
