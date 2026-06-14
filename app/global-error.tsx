"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Error inesperado</h2>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition"
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
