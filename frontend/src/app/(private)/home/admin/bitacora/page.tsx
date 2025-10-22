"use client";
import axios from "axios"; 

import Link from "next/link";
import React, { useState, useEffect } from "react";
import api from "@/app/services/api"; // ✅ usa tu instancia configurada
import {
  Pencil,
  Trash2,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  BookMarked,
  X,
  ChevronDown,
  Loader2,
  GanttChartSquare,
  Zap,
  Leaf,
  Settings,
  AlertCircle,
  HardHat,
  BellRing,
} from "lucide-react";

// --- Interfaces ---
interface Autor {
  id_persona: number;
  nombre_usuario: string;
  estado: string;
  rol: string;
}

interface Invernadero {
  id_invernadero: number;
  nombre: string;
}

interface Zona {
  id_zona: number;
  nombre: string;
}

interface Publicacion {
  id_publicacion: number | null;
  titulo: string;
  contenido: string;
  tipo_evento: string;
  importancia: "alta" | "media" | "baja";
  id_invernadero: number | string;
  id_zona: number | string;
  autor_id: number | string;
  timestamp_publicacion?: string;
  autor?: Autor;
  invernadero?: Invernadero;
  zona?: Zona;
}

// --- Componentes de Modales ---

// COMPONENTE: ConfirmModal (Sin Cambios)
const ConfirmModal = ({
  mensaje,
  onConfirmar,
  onCancelar,
}: {
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
      <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
      <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmación Requerida</h3>
      <p className="text-slate-500 mb-8">{mensaje}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancelar}
          className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
);

// COMPONENTE: MessageModal (Sin Cambios)
const MessageModal = ({ mensaje, onCerrar }: { mensaje: string; onCerrar: () => void }) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
      {mensaje.includes("90 minutos") ? (
        <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
      ) : (
        <CheckCircle2 className="w-16 h-16 mx-auto text-teal-500 mb-4" />
      )}
      <h3 className="text-xl font-bold text-slate-800 mb-4">
        {mensaje.includes("90 minutos") ? "Aviso" : "Operación Exitosa"}
      </h3>
      <p className="text-slate-500 mb-8">{mensaje}</p>
      <button
        onClick={onCerrar}
        className="w-full px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
      >
        Entendido
      </button>
    </div>
  </div>
);

// NUEVO COMPONENTE: PublicacionFormModal
const PublicacionFormModal = ({
  modalOpen,
  setModalOpen,
  form,
  setForm,
  guardarPublicacion,
  editando,
  isSaving,
  invernaderos,
  zonasDisponibles,
  autoresFiltrados,
  tipoEventos,
}: {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  form: Publicacion;
  setForm: (form: Publicacion) => void;
  guardarPublicacion: () => Promise<void>;
  editando: boolean;
  isSaving: boolean;
  invernaderos: Invernadero[];
  zonasDisponibles: Zona[];
  autoresFiltrados: Autor[];
  tipoEventos: string[];
}) => {
  if (!modalOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-3xl my-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-2xl font-bold text-slate-800">
            {editando ? "Editar Publicación" : "Nueva Publicación"}
          </h3>
          <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); guardarPublicacion(); }}>
          
          {/* Secciones del Formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Título y Contenido */}
            <div className="md:col-span-2">
              <label htmlFor="titulo" className="block text-sm font-medium text-slate-700 mb-1">Título (*)</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                maxLength={100}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="contenido" className="block text-sm font-medium text-slate-700 mb-1">Contenido (*)</label>
              <textarea
                id="contenido"
                name="contenido"
                value={form.contenido}
                onChange={handleChange}
                rows={4}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              />
            </div>

            {/* Selects de Ubicación y Evento */}
            <div>
              <label htmlFor="id_invernadero" className="block text-sm font-medium text-slate-700 mb-1">Invernadero (*)</label>
              <select
                id="id_invernadero"
                name="id_invernadero"
                value={form.id_invernadero}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white appearance-none focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              >
                <option value="" disabled>Selecciona un invernadero</option>
                {invernaderos.map((i) => (
                  <option key={i.id_invernadero} value={i.id_invernadero}>
                    {i.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="id_zona" className="block text-sm font-medium text-slate-700 mb-1">Zona (*)</label>
              <select
                id="id_zona"
                name="id_zona"
                value={form.id_zona}
                onChange={handleChange}
                required
                disabled={!form.id_invernadero || zonasDisponibles.length === 0}
                className={`w-full px-4 py-2 border border-slate-300 rounded-lg bg-white appearance-none focus:ring-teal-500 focus:border-teal-500 transition-shadow ${!form.id_invernadero || zonasDisponibles.length === 0 ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              >
                <option value="" disabled>Selecciona una zona</option>
                {zonasDisponibles.map((z) => (
                  <option key={z.id_zona} value={z.id_zona}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Evento e Importancia */}
            <div>
              <label htmlFor="tipo_evento" className="block text-sm font-medium text-slate-700 mb-1">Tipo de Evento (*)</label>
              <select
                id="tipo_evento"
                name="tipo_evento"
                value={form.tipo_evento}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white appearance-none focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              >
                <option value="" disabled>Selecciona un tipo</option>
                {tipoEventos.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="importancia" className="block text-sm font-medium text-slate-700 mb-1">Importancia (*)</label>
              <select
                id="importancia"
                name="importancia"
                value={form.importancia}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white appearance-none focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              >
                <option value="baja" className="text-green-600">Baja</option>
                <option value="media" className="text-amber-600">Media</option>
                <option value="alta" className="text-red-600">Alta</option>
              </select>
            </div>

            {/* Autor */}
            <div className="md:col-span-2">
              <label htmlFor="autor_id" className="block text-sm font-medium text-slate-700 mb-1">Autor (*)</label>
              <select
                id="autor_id"
                name="autor_id"
                value={form.autor_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white appearance-none focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              >
                <option value="" disabled>Selecciona un autor</option>
                {autoresFiltrados.map((a) => (
                  <option key={a.id_persona} value={a.id_persona}>
                    {a.nombre_usuario} ({a.rol.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            
          </div>
          
          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2 rounded-lg text-white font-semibold transition-colors flex items-center justify-center ${
                isSaving ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : editando ? (
                "Actualizar Publicación"
              ) : (
                "Crear Publicación"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// NUEVA FUNCIÓN: Obtener Icono para Tipo de Evento
const getTipoEventoIcon = (tipo: string) => {
    switch (tipo) {
        case "riego": return <GanttChartSquare className="w-4 h-4 text-blue-500" />;
        case "iluminacion": return <Zap className="w-4 h-4 text-yellow-500" />;
        case "cultivo": return <Leaf className="w-4 h-4 text-green-600" />;
        case "alerta": return <BellRing className="w-4 h-4 text-red-500" />;
        case "mantenimiento": return <Settings className="w-4 h-4 text-amber-600" />;
        case "hardware": return <HardHat className="w-4 h-4 text-gray-500" />;
        default: return <BookMarked className="w-4 h-4 text-slate-500" />;
    }
}

// NUEVA FUNCIÓN: Obtener Estilos para Importancia
const getImportanciaStyles = (importancia: "alta" | "media" | "baja") => {
    switch (importancia) {
        case "alta": return "bg-red-100 text-red-700 border-red-300";
        case "media": return "bg-amber-100 text-amber-700 border-amber-300";
        case "baja": return "bg-green-100 text-green-700 border-green-300";
        default: return "bg-slate-100 text-slate-700 border-slate-300";
    }
}


// --- Componente Principal ---
export default function BitacoraPage() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [form, setForm] = useState<Publicacion>({
    id_publicacion: null,
    titulo: "",
    contenido: "",
    tipo_evento: "",
    importancia: "media",
    id_invernadero: "",
    id_zona: "",
    autor_id: "",
  });
  const [autores, setAutores] = useState<Autor[]>([]);
  const [invernaderos, setInvernaderos] = useState<Invernadero[]>([]);
  const [zonasDisponibles, setZonasDisponibles] = useState<Zona[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [autoresFiltrados, setAutoresFiltrados] = useState<Autor[]>([]);
  const [modalMensaje, setModalMensaje] = useState("");
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [accionConfirmar, setAccionConfirmar] = useState<() => void>(() => {});
  const tipoEventos = ["riego", "iluminacion", "cultivo", "alerta", "mantenimiento", "hardware", "general"];
  const [filtroActivo, setFiltroActivo] = useState("invernadero");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      try {
        const [bitacoraRes, personaRes, invernaderoRes] = await Promise.all([
          api.get("/bitacora?archivadas=false"),
          api.get("/persona"),
          api.get("/invernadero"),
        ]);
        setPublicaciones(bitacoraRes.data);
        setAutores(personaRes.data);
        setInvernaderos(invernaderoRes.data);
      } catch (error) {
        console.error("Error al cargar los datos iniciales:", error);
        setModalMensaje("No se pudieron cargar los datos. Revisa la conexión con el servidor.");
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (form.id_invernadero) {
      api
        .get(`/zona/invernadero/${form.id_invernadero}`)
        .then((res) => setZonasDisponibles(res.data))
        .catch((error) => {
          console.error("Error al cargar las zonas:", error);
          setZonasDisponibles([]);
        });
    } else {
      setZonasDisponibles([]);
    }
  }, [form.id_invernadero]);

  useEffect(() => {
    const filtrados = autores.filter((a) => a.estado === "activo" && ["admin", "operario"].includes(a.rol));
    setAutoresFiltrados(filtrados);
  }, [autores]);

  const abrirModal = (pub: Publicacion | null = null) => {
    if (pub) {
      const tiempoCreacion = new Date(pub.timestamp_publicacion || "");
      const ahora = new Date();
      const minutosPasados = (ahora.getTime() - tiempoCreacion.getTime()) / 1000 / 60;
      if (minutosPasados > 90) {
        setModalMensaje("No puedes editar publicaciones con más de 90 minutos de antigüedad.");
        return;
      }
      setForm(pub);
      setEditando(true);
    } else {
      setForm({
        id_publicacion: null,
        titulo: "",
        contenido: "",
        tipo_evento: "",
        importancia: "media",
        // Intentar preseleccionar el primer invernadero y autor si existen
        id_invernadero: invernaderos.length > 0 ? invernaderos[0].id_invernadero.toString() : "",
        id_zona: "",
        autor_id: autoresFiltrados.length > 0 ? autoresFiltrados[0].id_persona.toString() : "",
      });
      setEditando(false);
    }
    setModalOpen(true);
  };

  const guardarPublicacion = async () => {
    setIsSaving(true);
    try {
      const url = `/bitacora${editando ? `/${form.id_publicacion}` : ""}`;
      const method = editando ? api.put : api.post;

      if (!form.titulo || !form.contenido || !form.tipo_evento || !form.id_invernadero || !form.id_zona || !form.autor_id) {
        setModalMensaje("Por favor completa todos los campos obligatorios.");
        setIsSaving(false);
        return;
      }

      await method(url, {
        ...form,
        id_invernadero: Number(form.id_invernadero),
        id_zona: Number(form.id_zona),
        autor_id: Number(form.autor_id),
      });

      const res = await api.get("/bitacora?archivadas=false");
      setPublicaciones(res.data);
      setModalOpen(false);
      setEditando(false);
      setModalMensaje("¡Publicación guardada con éxito!");
    } catch (err) {
      console.error("Error al guardar", err);
      setModalMensaje("Error al guardar la publicación.");
    } finally {
      setIsSaving(false);
    }
  };

  const iniciarEliminacion = (pub: Publicacion) => {
    // Restricción: No se puede eliminar una publicación 'alta'
    if (pub.importancia === 'alta') {
      setModalMensaje("No se pueden eliminar publicaciones con importancia ALTA directamente.");
      return;
    }
    
    setAccionConfirmar(() => async () => {
      try {
        if (!pub.id_publicacion) {
           setModalMensaje("ID no válido para eliminar.");
           return;
        }
        await api.delete(`/bitacora/${pub.id_publicacion}`);
        const res = await api.get("/bitacora?archivadas=false");
        setPublicaciones(res.data);
        setModalMensaje("Publicación eliminada correctamente.");
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          setModalMensaje("No puedes eliminar publicaciones de importancia ALTA."); // Redundante, pero por si acaso.
        } else {
          setModalMensaje("Error al eliminar la publicación.");
        }
      } finally {
        setModalConfirmar(false);
      }
    });
    setModalConfirmar(true);
  };


  const archivarPublicacion = async (id: number | null) => {
    if (!id) return;
    try {
      await api.patch(`/bitacora/${id}/archivar`);
      setPublicaciones((prev) => prev.filter((p) => p.id_publicacion !== id));
      setModalMensaje("Publicación archivada.");
    } catch (err) {
      console.error("Error al archivar", err);
      setModalMensaje("No se pudo archivar la publicación.");
    }
  };

  const filteredPublicaciones = publicaciones.filter((pub) => {
    const valor = busqueda.toLowerCase();
    if (!valor) return true;
    
    // Función de ayuda para la búsqueda
    const includesSearch = (text: string | number | undefined | null) => 
        text ? String(text).toLowerCase().includes(valor) : false;

    // Buscar en título y contenido siempre
    if (includesSearch(pub.titulo) || includesSearch(pub.contenido)) return true;

    // Búsqueda por el filtro activo
    if (filtroActivo === "invernadero")
      return includesSearch(pub.invernadero?.nombre) || includesSearch(pub.id_invernadero);
      
    if (filtroActivo === "zona")
      return includesSearch(pub.zona?.nombre) || includesSearch(pub.id_zona);

    if (filtroActivo === "autor")
      return includesSearch(pub.autor?.nombre_usuario) || includesSearch(pub.autor_id);

    if (filtroActivo === "importancia") return includesSearch(pub.importancia);
    
    if (filtroActivo === "etiqueta") return includesSearch(pub.tipo_evento);
    
    return false;
  });
  
  // --- Render ---
  return (
    <main className="w-full bg-slate-50 min-h-screen p-6 sm:p-8">
      
      {/* Encabezado y Botón de Acción */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center mb-4 sm:mb-0">
          <BookMarked className="w-8 h-8 text-teal-600 mr-3" />
          Bitácora de Eventos
        </h1>
        <button
          onClick={() => abrirModal()}
          className="flex items-center px-6 py-2 bg-teal-600 text-white font-semibold rounded-xl shadow-lg hover:bg-teal-700 transition-all transform hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Publicación
        </button>
      </header>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-4 items-center">
        
        {/* Búsqueda */}
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={`Buscar por ${filtroActivo}...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-shadow"
          />
        </div>

        {/* Filtro Activo Selector */}
        <div className="relative flex-shrink-0 w-full md:w-auto">
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <select
            value={filtroActivo}
            onChange={(e) => { setFiltroActivo(e.target.value); setBusqueda(""); }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white appearance-none text-slate-700 font-medium"
          >
            <option value="invernadero">Invernadero</option>
            <option value="zona">Zona</option>
            <option value="autor">Autor</option>
            <option value="importancia">Importancia</option>
            <option value="etiqueta">Etiqueta</option>
          </select>
        </div>
        
        {/* Enlace al Archivo */}
        <Link 
          href="/bitacora/archivadas" 
          className="flex items-center px-4 py-2 text-sm text-teal-600 border border-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors w-full md:w-auto justify-center"
        >
          <Archive className="w-4 h-4 mr-2" />
          Ver Archivo
        </Link>
      </div>

      {/* Contenido Principal: Tabla de Publicaciones */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {cargando ? (
          <div className="p-10 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-500" />
            Cargando publicaciones...
          </div>
        ) : filteredPublicaciones.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
            {busqueda ? `No se encontraron publicaciones que coincidan con "${busqueda}" en el filtro de ${filtroActivo}.` : "No hay publicaciones activas en la bitácora."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Título y Contenido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detalles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Autor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPublicaciones.map((pub) => (
                  <tr key={pub.id_publicacion} className="hover:bg-teal-50/50 transition-colors">
                    {/* Columna de Título y Contenido */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-800 truncate max-w-xs">{pub.titulo}</div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-xs">{pub.contenido}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 mt-2 text-xs font-medium rounded-full border ${getImportanciaStyles(pub.importancia)}`}>
                          {pub.importancia.toUpperCase()}
                      </span>
                    </td>
                    
                    {/* Columna de Detalles */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-700">
                        {getTipoEventoIcon(pub.tipo_evento)}
                        <span className="ml-2 font-medium">{pub.tipo_evento.toUpperCase()}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Invernadero: <span className="font-medium text-slate-800">{pub.invernadero?.nombre || `ID: ${pub.id_invernadero}`}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Zona: <span className="font-medium text-slate-800">{pub.zona?.nombre || `ID: ${pub.id_zona}`}</span>
                      </div>
                    </td>
                    
                    {/* Columna de Autor */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{pub.autor?.nombre_usuario || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{pub.autor?.rol || 'Desconocido'}</div>
                    </td>
                    
                    {/* Columna de Fecha */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {pub.timestamp_publicacion ? new Date(pub.timestamp_publicacion).toLocaleString() : 'N/A'}
                    </td>
                    
                    {/* Columna de Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => archivarPublicacion(pub.id_publicacion)}
                          title="Archivar"
                          className="text-amber-500 hover:text-amber-700 p-2 rounded-full hover:bg-amber-50 transition-colors"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => abrirModal(pub)}
                          title="Editar"
                          className="text-teal-600 hover:text-teal-800 p-2 rounded-full hover:bg-teal-50 transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => iniciarEliminacion(pub)}
                          title="Eliminar"
                          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      <PublicacionFormModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        form={form}
        setForm={setForm}
        guardarPublicacion={guardarPublicacion}
        editando={editando}
        isSaving={isSaving}
        invernaderos={invernaderos}
        zonasDisponibles={zonasDisponibles}
        autoresFiltrados={autoresFiltrados}
        tipoEventos={tipoEventos}
      />

      {modalConfirmar && (
        <ConfirmModal
          mensaje="¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer."
          onConfirmar={() => {
            accionConfirmar();
            setModalConfirmar(false); // Se cierra al ejecutar, pero la acciónConfirmar también puede cerrarlo
          }} 
          onCancelar={() => setModalConfirmar(false)}
        />
      )}
      {modalMensaje && <MessageModal mensaje={modalMensaje} onCerrar={() => setModalMensaje("")} />}
    </main>
  );
}