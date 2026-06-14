"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Documento = {
  nombre_archivo: string;
  storage_path: string;
  indicaciones: string | null;
  created_at: string;
};

type Submission = {
  id: string;
  nombre: string;
  correo: string;
  unidad: string;
  cargo: string;
  cargo_otro: string | null;
  modo: "manual" | "doc";
  sugerencias: string | null;
  created_at: string;
  preguntas: { numero: number; pregunta: string; respuesta: string; categoria: string | null }[];
  documentos: Documento[];
};

type Metrics = {
  totalSubmissions: number;
  totalPreguntas: number;
  totalDocs: number;
  manualCount: number;
  docCount: number;
};

type ExportFormat = "csv" | "xlsx";
type FilterModo = "all" | "manual" | "doc";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse ${className ?? ""}`} />;
}

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporCsvLoading, setExportCsvLoading] = useState(false);
  const [exportXlsxLoading, setExportXlsxLoading] = useState(false);
  const [filter, setFilter] = useState<FilterModo>("all");
  const [search, setSearch] = useState("");
  const [modalData, setModalData] = useState<Submission | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = sessionStorage.getItem("faq_admin_token");
    if (!t) {
      router.push("/admin");
      return;
    }
    setToken(t);
  }, [router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("faq_admin_token");
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar datos");
      setMetrics(data.metrics);
      setSubmissions(data.submissions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (format: ExportFormat) => {
    if (!token) return;
    const setLoadingFn = format === "csv" ? setExportCsvLoading : setExportXlsxLoading;
    setLoadingFn(true);
    try {
      const res = await fetch(`/api/admin/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faq-export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error al exportar los datos");
    } finally {
      setLoadingFn(false);
    }
  };

  const handleDownload = async (doc: Documento) => {
    if (!token || downloading) return;
    setDownloading(doc.storage_path);
    try {
      const res = await fetch(`/api/admin/download?path=${encodeURIComponent(doc.storage_path)}&name=${encodeURIComponent(doc.nombre_archivo)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nombre_archivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error al descargar el archivo");
    } finally {
      setDownloading(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("faq_admin_token");
    router.push("/admin");
  };

  const filtered = submissions
    .filter((s) => filter === "all" || s.modo === filter)
    .filter(
      (s) =>
        !search ||
        s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.correo.toLowerCase().includes(search.toLowerCase()) ||
        s.unidad.toLowerCase().includes(search.toLowerCase())
    );

  if (!token) return null;

  // ── Modal de detalle ──
  const DetailModal = () => {
    if (!modalData) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
        onClick={() => setModalData(null)}
      >
        <div
          className="bg-white border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Detalle del envio</h3>
            <button
              onClick={() => setModalData(null)}
              className="p-1 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Info del respondente */}
          <div className="bg-gray-50 p-3 space-y-1.5 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20 shrink-0 text-[11px] font-semibold uppercase">Nombre</span>
              <span className="text-gray-900 font-medium">{modalData.nombre}</span>
            </div>
            {modalData.correo && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-20 shrink-0 text-[11px] font-semibold uppercase">Correo</span>
                <span className="text-gray-700">{modalData.correo}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20 shrink-0 text-[11px] font-semibold uppercase">Unidad</span>
              <span className="text-gray-700">{modalData.unidad}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20 shrink-0 text-[11px] font-semibold uppercase">Cargo</span>
              <span className="text-gray-700">{modalData.cargo_otro || modalData.cargo}</span>
            </div>
          </div>

          {modalData.sugerencias && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Sugerencias</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3">{modalData.sugerencias}</p>
            </div>
          )}

          {/* Preguntas */}
          {modalData.preguntas.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Preguntas ({modalData.preguntas.length})
              </p>
              <div className="space-y-2">
                {modalData.preguntas.map((p, i) => (
                  <div key={i} className="border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5">#{p.numero}</span>
                      {p.categoria && <span className="text-xs text-gray-400">{p.categoria}</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-0.5">{p.pregunta}</p>
                    <p className="text-sm text-gray-600">{p.respuesta}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentos */}
          {modalData.documentos.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Documentos ({modalData.documentos.length})
              </p>
              <div className="space-y-1.5">
                {modalData.documentos.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 border border-gray-200 px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="flex-1 text-sm text-gray-700 truncate">{d.nombre_archivo}</span>
                    {d.indicaciones && <span className="text-xs text-gray-400 hidden sm:inline truncate max-w-[120px]">{d.indicaciones}</span>}
                    <button
                      onClick={() => handleDownload(d)}
                      disabled={downloading === d.storage_path}
                      className="p-1 text-gray-900 hover:bg-gray-100 transition active:scale-90 disabled:opacity-50 cursor-pointer"
                      title="Descargar"
                    >
                      {downloading === d.storage_path ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Skeleton metrics ──
  const SkeletonMetrics = () => (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-gray-100 p-4 border-l-2 border-gray-200">
          <Skeleton className="h-7 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );

  // ── Skeleton table ──
  const SkeletonTable = () => (
    <div className="border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex gap-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex gap-6 px-4 py-3 border-b border-gray-200 ${i % 2 === 0 ? "bg-gray-100/40" : ""}`}>
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  );

  // ── Metric icon mapping ──
  const metricIcon = (key: string) => {
    switch (key) {
      case "total": return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      );
      case "preguntas": return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      );
      case "docs": return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      );
      case "manual": return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      );
      case "doc": return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <DetailModal />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Admin FAQ USO
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition active:scale-[.98] cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Metrics */}
        {loading ? <SkeletonMetrics /> : metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: "total", label: "Total envios", value: metrics.totalSubmissions, accent: "border-l-gray-900" },
              { key: "preguntas", label: "Preguntas", value: metrics.totalPreguntas, accent: "border-l-gray-500" },
              { key: "docs", label: "Documentos", value: metrics.totalDocs, accent: "border-l-gray-500" },
              { key: "manual", label: "Modo manual", value: metrics.manualCount, accent: "border-l-gray-500" },
              { key: "doc", label: "Modo doc", value: metrics.docCount, accent: "border-l-gray-500" },
            ].map((m) => (
              <div key={m.key} className={`bg-white border border-gray-200 border-l-2 ${m.accent} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">{metricIcon(m.key)}</span>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">{m.value}</span>
                </div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(["all", "manual", "doc"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition cursor-pointer active:scale-[.98] ${
                  filter === f
                    ? "bg-gray-900 text-white"
                    : "border border-gray-300 text-gray-500 hover:border-gray-900"
                }`}
              >
                {f === "all" ? "Todos" : f === "manual" ? "Manual" : "Documentos"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre, correo o unidad..."
              className="w-48 sm:w-64 px-3 py-1.5 border border-gray-300 text-xs bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => handleExport("csv")}
              disabled={exporCsvLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporCsvLoading ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              {exporCsvLoading ? "Generando..." : "CSV"}
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              disabled={exportXlsxLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition active:scale-[.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {exportXlsxLoading ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              {exportXlsxLoading ? "Generando..." : "Excel"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Submissions Table */}
        {loading ? <SkeletonTable /> : !error && (
          <div className="bg-white border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Unidad</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1">
                        Modo
                        {filter !== "all" && (
                          <span className="inline-block w-1.5 h-1.5 bg-gray-900" />
                        )}
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                        No hay resultados
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50 transition cursor-pointer active:bg-gray-100 even:bg-gray-50/60 border-l-2 border-l-transparent hover:border-l-gray-900"
                        onClick={() => setModalData(s)}
                      >
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[5rem]" title={s.id}>#{typeof s.id === "string" ? s.id.substring(0, 8) : s.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.nombre}</td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[12rem]" title={s.correo || ""}>{s.correo || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.unidad}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700">
                            {s.modo === "manual" ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                            ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /></svg>
                            )}
                            {s.modo === "manual" ? "Manual" : "Doc"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString("es-SV", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
