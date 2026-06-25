"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

type Documento = {
  nombre_archivo: string;
  storage_path: string;
  indicaciones: string | null;
  created_at: string;
};

type Submission = {
  id: number;
  nombre: string;
  correo: string;
  unidad: string;
  cargo: string;
  cargo_otro: string | null;
  sugerencias: string | null;
  created_at: string;
  preguntas: { numero: number; pregunta: string; respuesta: string; categoria: string | null }[];
  documentos: Documento[];
};

type Cuestionario = {
  id: number;
  condicion: string;
  medios: string[];
  tramites: string[];
  created_at: string;
  comentarios: { numero: number; comentario: string }[];
};

type Metrics = {
  totalSubmissions: number;
  totalPreguntas: number;
  totalDocs: number;
  totalCuestionarios: number;
  totalComentarios: number;
};

type Tab = "personal" | "estudiantes";
type ExportFormat = "csv" | "xlsx";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse ${className ?? ""}`} />;
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportCsvLoading, setExportCsvLoading] = useState(false);
  const [exportXlsxLoading, setExportXlsxLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>("personal");
  const [modalPersonal, setModalPersonal] = useState<Submission | null>(null);
  const [modalCuest, setModalCuest] = useState<Cuestionario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nombre: string } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = sessionStorage.getItem("faq_admin_token");
    if (!t) { router.push("/admin"); return; }
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
      setCuestionarios(data.cuestionarios);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset search/page on tab change
  useEffect(() => { setSearch(""); setPage(1); }, [tab]);

  const filteredPersonal = useMemo(() =>
    submissions.filter((s) =>
      !debouncedSearch ||
      s.nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (s.correo || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.unidad.toLowerCase().includes(debouncedSearch.toLowerCase())
    ), [submissions, debouncedSearch]);

  const filteredCuest = useMemo(() =>
    cuestionarios.filter((c) =>
      !debouncedSearch ||
      c.condicion.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.condicion.toLowerCase().includes(debouncedSearch.toLowerCase())
    ), [cuestionarios, debouncedSearch]);

  const pageSize = 10;
  const activeFiltered = tab === "personal" ? filteredPersonal : filteredCuest;
  const totalPages = Math.max(1, Math.ceil(activeFiltered.length / pageSize));
  const paginated = activeFiltered.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = async (format: ExportFormat) => {
    if (!token) return;
    const setFn = format === "csv" ? setExportCsvLoading : setExportXlsxLoading;
    setFn(true);
    try {
      const res = await fetch(`/api/admin/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chatbot-export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error al exportar los datos");
    } finally {
      setFn(false);
    }
  };

  const handleDownload = async (doc: Documento) => {
    if (!token || downloading) return;
    setDownloading(doc.storage_path);
    try {
      const res = await fetch(
        `/api/admin/download?path=${encodeURIComponent(doc.storage_path)}&name=${encodeURIComponent(doc.nombre_archivo)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeleting(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      const deleted = submissions.find((s) => s.id === id);
      if (deleted) {
        setMetrics((prev) => prev && ({
          ...prev,
          totalSubmissions: prev.totalSubmissions - 1,
          totalPreguntas: prev.totalPreguntas - deleted.preguntas.length,
          totalDocs: prev.totalDocs - deleted.documentos.length,
        }));
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (modalPersonal?.id === id) setModalPersonal(null);
    } catch {
      setError("Error al eliminar el envio");
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("faq_admin_token");
    router.push("/admin");
  };

  // ── Datos para gráficos: formulario personal ──
  const chartCargos = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of submissions) {
      const k = s.cargo_otro || s.cargo;
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [submissions]);

  const chartUnidades = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of submissions) {
      map[s.unidad] = (map[s.unidad] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [submissions]);

  const chartCategorias = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of submissions) {
      for (const p of s.preguntas) {
        const k = p.categoria || "Sin categoría";
        map[k] = (map[k] || 0) + 1;
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [submissions]);

  // ── Datos para gráficos: cuestionario estudiantes ──
  const chartCondicion = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of cuestionarios) {
      const k = c.condicion === "activo" ? "Activo" : "Egresado";
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [cuestionarios]);


  const chartMedios = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of cuestionarios) {
      for (const m of c.medios) {
        const k = m.startsWith("Otro:") ? "Otro" : m;
        map[k] = (map[k] || 0) + 1;
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [cuestionarios]);

  const chartTramites = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of cuestionarios) {
      for (const t of c.tramites) {
        const k = t.startsWith("Otro:") ? "Otro" : t;
        map[k] = (map[k] || 0) + 1;
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [cuestionarios]);

  // Paleta matte para formulario personal (azules/verdes/violetas apagados)
  const COLORS_PERSONAL = ["#5B7FA6", "#6A9E7A", "#9B7BAF", "#C4935A", "#6AAFAF", "#AF7070", "#7A8FA6", "#8FAF6A"];
  // Paleta matte para cuestionario estudiantes (verdes/naranjas/rosados apagados)
  const COLORS_EST = ["#6A9E7A", "#C4935A", "#AF7070", "#6AAFAF", "#9B7BAF", "#5B7FA6", "#8FAF6A", "#AF9B6A"];
  // Pie condicion: activo=azul slate, egresado=verde sage
  const COLORS_PIE = ["#5B7FA6", "#6A9E7A"];

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4">{title}</p>
      {children}
    </div>
  );

  const EmptyChart = () => (
    <div className="h-40 flex items-center justify-center text-xs text-gray-300">Sin datos suficientes</div>
  );

  if (!token) return null;

  // ── Modal detalle personal ──
  const ModalPersonal = () => {
    if (!modalPersonal) return null;
    const s = modalPersonal;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 cursor-pointer" onClick={() => setModalPersonal(null)}>
        <div className="bg-white border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Detalle del envio</h3>
              {s.preguntas.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {s.preguntas.length}
                </span>
              )}
              {s.documentos.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {s.documentos.length}
                </span>
              )}
            </div>
            <button onClick={() => setModalPersonal(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"><IconClose /></button>
          </div>

          <div className="bg-gray-50 p-3 space-y-1.5 mb-4 text-sm">
            {[
              { label: "Nombre", value: s.nombre },
              ...(s.correo ? [{ label: "Correo", value: s.correo }] : []),
              { label: "Unidad", value: s.unidad },
              { label: "Cargo", value: s.cargo_otro || s.cargo },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-gray-400 w-20 shrink-0 text-[11px] font-semibold uppercase">{label}</span>
                <span className="text-gray-700">{value}</span>
              </div>
            ))}
          </div>

          {s.sugerencias && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Sugerencias</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3">{s.sugerencias}</p>
            </div>
          )}

          {s.preguntas.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Preguntas ({s.preguntas.length})</p>
              <div className="space-y-2">
                {s.preguntas.map((p, i) => (
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

          {s.documentos.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Documentos ({s.documentos.length})</p>
              <div className="space-y-1.5">
                {s.documentos.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 border border-gray-200 px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="flex-1 text-sm text-gray-700 truncate">{d.nombre_archivo}</span>
                    {d.indicaciones && <span className="text-xs text-gray-400 hidden sm:inline truncate max-w-30">{d.indicaciones}</span>}
                    <button
                      onClick={() => handleDownload(d)}
                      disabled={downloading === d.storage_path}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      {downloading === d.storage_path ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      )}
                      {downloading === d.storage_path ? "Descargando..." : "Descargar"}
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

  // ── Modal detalle cuestionario ──
  const ModalCuestionario = () => {
    if (!modalCuest) return null;
    const c = modalCuest;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 cursor-pointer" onClick={() => setModalCuest(null)}>
        <div className="bg-white border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Detalle del cuestionario</h3>
            <button onClick={() => setModalCuest(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"><IconClose /></button>
          </div>

          <div className="bg-gray-50 p-3 space-y-1.5 mb-4 text-sm">
            {[
              { label: "Condicion", value: c.condicion },
              { label: "Fecha", value: new Date(c.created_at).toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <span className="text-gray-400 w-20 shrink-0 text-[11px] font-semibold uppercase">{label}</span>
                <span className="text-gray-700">{value}</span>
              </div>
            ))}
          </div>

          {c.medios.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Medios de consulta</p>
              <div className="flex flex-wrap gap-1.5">
                {c.medios.map((m, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs">{m}</span>
                ))}
              </div>
            </div>
          )}

          {c.tramites.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Tramites consultados</p>
              <div className="flex flex-wrap gap-1.5">
                {c.tramites.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}

          {c.comentarios.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Consultas frecuentes</p>
              <div className="space-y-2">
                {c.comentarios.map((com, i) => (
                  <div key={i} className="border border-gray-200 p-3">
                    <span className="text-[11px] font-bold text-gray-500 mr-2">#{com.numero}</span>
                    <span className="text-sm text-gray-700">{com.comentario}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Modal confirmacion eliminacion ──
  const DeleteConfirmModal = () => {
    if (!deleteTarget) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 cursor-pointer" onClick={() => !deleting && setDeleteTarget(null)}>
        <div className="bg-white border border-gray-200 w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Eliminar envio</h3>
              <p className="text-xs text-gray-500 mt-0.5">Se eliminara el envio de <strong>{deleteTarget.nombre}</strong>. Esta accion no se puede deshacer.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} disabled={!!deleting} className="px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer">
              Cancelar
            </button>
            <button onClick={() => handleDelete(deleteTarget.id)} disabled={!!deleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {deleting ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> : null}
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SkeletonMetrics = () => (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-gray-100 p-4 border-l-2 border-gray-200">
          <Skeleton className="h-7 w-12 mb-2" /><Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );

  const SkeletonTable = () => (
    <div className="border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex gap-6">
        {[16, 28, 32, 24, 16, 16].map((w, i) => <Skeleton key={i} className={`h-3 w-${w}`} />)}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex gap-6 px-4 py-3 border-b border-gray-200 ${i % 2 === 0 ? "bg-gray-100/40" : ""}`}>
          {[16, 28, 32, 24, 16, 16].map((w, j) => <Skeleton key={j} className={`h-3.5 w-${w}`} />)}
        </div>
      ))}
    </div>
  );

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="min-h-screen bg-gray-100">
      <DeleteConfirmModal />
      <ModalPersonal />
      <ModalCuestionario />

      {/* Header */}
      <header className="bg-gray-900 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Admin Chatbot USO
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }}
              disabled={refreshing}
              title="Refrescar"
              className="p-2 border border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? "animate-spin" : ""}>
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={exportCsvLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-600 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {exportCsvLoading
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              }
              {exportCsvLoading ? "Generando..." : "CSV"}
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              disabled={exportXlsxLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-100 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
            >
              {exportXlsxLoading
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              }
              {exportXlsxLoading ? "Generando..." : "Excel"}
            </button>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-600 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white hover:border-gray-400 transition cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
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
              { label: "Envios personal", value: metrics.totalSubmissions, accent: "border-l-gray-900" },
              { label: "Preguntas", value: metrics.totalPreguntas, accent: "border-l-gray-400" },
              { label: "Documentos", value: metrics.totalDocs, accent: "border-l-gray-400" },
              { label: "Cuestionarios", value: metrics.totalCuestionarios, accent: "border-l-gray-900" },
              { label: "Comentarios", value: metrics.totalComentarios, accent: "border-l-gray-400" },
            ].map((m) => (
              <div key={m.label} className={`bg-white border border-gray-200 border-l-2 ${m.accent} p-4`}>
                <p className="text-2xl font-bold text-gray-900 tabular-nums mb-1">{m.value}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold leading-tight">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Gráficos ── */}
        {!loading && !error && (
          <div className="space-y-4">

            {/* Formulario personal */}
            {submissions.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Análisis — Formulario personal</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                  <ChartCard title="Envíos por unidad">
                    {chartUnidades.length === 0 ? <EmptyChart /> : (
                      <ResponsiveContainer width="100%" height={Math.max(120, chartUnidades.length * 36)}>
                        <BarChart data={chartUnidades} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [v, "Envíos"]} contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                            {chartUnidades.map((_, i) => <Cell key={i} fill={COLORS_PERSONAL[i % COLORS_PERSONAL.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Envíos por cargo">
                    {chartCargos.length === 0 ? <EmptyChart /> : (
                      <ResponsiveContainer width="100%" height={Math.max(120, chartCargos.length * 36)}>
                        <BarChart data={chartCargos} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [v, "Envíos"]} contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                            {chartCargos.map((_, i) => <Cell key={i} fill={COLORS_PERSONAL[(i + 2) % COLORS_PERSONAL.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Preguntas por categoría">
                    {chartCategorias.length === 0 ? <EmptyChart /> : (
                      <ResponsiveContainer width="100%" height={Math.max(120, chartCategorias.length * 36)}>
                        <BarChart data={chartCategorias} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [v, "Preguntas"]} contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                            {chartCategorias.map((_, i) => <Cell key={i} fill={COLORS_PERSONAL[(i + 4) % COLORS_PERSONAL.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                </div>
              </div>
            )}

            {/* Cuestionario estudiantes */}
            {cuestionarios.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Análisis — Cuestionario estudiantes</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                  <ChartCard title="Condición académica">
                    {chartCondicion.length === 0 ? <EmptyChart /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={chartCondicion}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
                            outerRadius={78}
                            innerRadius={36}
                            paddingAngle={3}
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {chartCondicion.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => [v, "Estudiantes"]} contentStyle={{ fontSize: 11 }} />
                          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Medios de consulta más usados">
                    {chartMedios.length === 0 ? <EmptyChart /> : (
                      <ResponsiveContainer width="100%" height={Math.max(120, chartMedios.length * 36)}>
                        <BarChart data={chartMedios} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [v, "Estudiantes"]} contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                            {chartMedios.map((_, i) => <Cell key={i} fill={COLORS_EST[i % COLORS_EST.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  <ChartCard title="Trámites más consultados">
                    {chartTramites.length === 0 ? <EmptyChart /> : (
                      <ResponsiveContainer width="100%" height={Math.max(120, chartTramites.length * 36)}>
                        <BarChart data={chartTramites} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [v, "Estudiantes"]} contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                            {chartTramites.map((_, i) => <Cell key={i} fill={COLORS_EST[(i + 3) % COLORS_EST.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                </div>
              </div>
            )}

          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex border-b border-gray-200 w-full">
            {([
              { id: "personal" as Tab, label: "Formulario personal", count: submissions.length },
              { id: "estudiantes" as Tab, label: "Cuestionario estudiantes", count: cuestionarios.length },
            ] as const).map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  tab === id
                    ? "text-gray-900 border-b-2 border-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
                <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold ${tab === id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={tab === "personal" ? "Buscar por nombre, correo o unidad..." : "Buscar por condicion..."}
            className="w-56 sm:w-72 px-3 py-1.5 border border-gray-300 text-xs bg-white focus:outline-none focus:border-gray-900 focus:ring-[1.5px] focus:ring-gray-900/10 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-xs text-gray-400">{activeFiltered.length} resultado{activeFiltered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Table */}
        {loading ? <SkeletonTable /> : !error && (
          <div className="bg-white border border-gray-200">
            <div className="overflow-x-auto">
              {tab === "personal" ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["ID", "Nombre", "Correo", "Unidad", "Fecha", "Acciones"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${i === 5 ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(paginated as Submission[]).length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No hay resultados</td></tr>
                    ) : (paginated as Submission[]).map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition even:bg-gray-50/60 border-l-2 border-l-transparent hover:border-l-gray-900">
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-20" title={String(s.id)}>#{String(s.id).substring(0, 8)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.nombre}</td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-48">{s.correo || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.unidad}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(s.created_at)}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => setModalPersonal(s)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer" title="Ver detalle">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button onClick={() => setDeleteTarget({ id: s.id, nombre: s.nombre })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer" title="Eliminar">
                              {deleting === s.id
                                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["ID", "Condicion", "Medios", "Tramites", "Fecha", ""].map((h, i) => (
                        <th key={i} className={`px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${i === 5 ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(paginated as Cuestionario[]).length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No hay resultados</td></tr>
                    ) : (paginated as Cuestionario[]).map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition even:bg-gray-50/60 border-l-2 border-l-transparent hover:border-l-gray-900">
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[5rem]" title={String(c.id)}>#{String(c.id).substring(0, 8)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap capitalize">{c.condicion}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 font-semibold">{c.medios.length}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 font-semibold">{c.tramites.length}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(c.created_at)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setModalCuest(c)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer" title="Ver detalle">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-xs text-gray-500">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, activeFiltered.length)} de {activeFiltered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-2 py-1 text-xs border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`px-2 py-1 text-xs border ${page === i + 1 ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600 hover:bg-gray-100"} cursor-pointer`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-2 py-1 text-xs border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
