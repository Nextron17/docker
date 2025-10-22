'use client';

import React, { useEffect, useState } from "react";
import { Bell, Check, AlertTriangle, XCircle, Wrench } from "lucide-react";
import { io, Socket } from "socket.io-client";

// ⭐ DEFINICIÓN DE URL CORREGIDA ⭐
// Usamos la URL desplegada para garantizar la conexión.
const BACKEND_URL = 'https://backendhortitech.com';

// --- Interfaces ---
interface NotificacionBase {
  id: number | string;
  tipo: "visita" | "alerta_hardware";
  titulo: string; 
  mensaje: string; 
  leida: boolean;
  createdAt: string;
  // Campos de Visita
  nombre_visitante: string;
  motivo: string;
  ciudad: string;
  fecha_visita: string;
  correo: string;
  identificacion: string;
  telefono: string;
}

interface NotificacionSocket {
  id?: number | string; // Para alerta_hardware
  id_visita?: number | string; // Para visita
  tipo: "visita" | "alerta_hardware";
  leida?: boolean;
  createdAt?: string;
  titulo?: string;
  mensaje?: string;
  nombre_visitante?: string;
  motivo?: string;
  ciudad?: string;
  fecha_visita?: string;
  correo?: string;
  identificacion?: string;
  telefono?: string;
}

// --- Helpers ---
const formatTiempoRelativo = (timestamp: string) => {
  const ahora = new Date();
  const fechaNotificacion = new Date(timestamp);
  const diferenciaSegundos = Math.floor(
    (ahora.getTime() - fechaNotificacion.getTime()) / 1000
  );

  const minutos = Math.floor(diferenciaSegundos / 60);
  if (minutos < 1) return "hace un momento";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  return `hace ${dias} día(s)`;
};

const ordenarNotificaciones = (arr: NotificacionBase[]) =>
  [...arr].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

// --- Card para visitas (Interactivo: activa modal y marca como leída) ---
const NotificacionCard: React.FC<{
  visita: NotificacionBase;
  onMarcarComoLeida: (id: number | string) => void;
  onSeleccionar: (visita: NotificacionBase) => void;
}> = ({ visita, onMarcarComoLeida, onSeleccionar }) => {
  const style = {
    bg: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-600",
  };

  const handleClick = () => {
    onSeleccionar(visita);
    if (!visita.leida) onMarcarComoLeida(visita.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 flex items-start gap-4 rounded-lg border-l-4 cursor-pointer transition-colors shadow-sm ${style.border} ${
        visita.leida ? "opacity-70 bg-slate-50" : `${style.bg} hover:bg-opacity-80`
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.bg} ${style.text}`}
      >
        <Wrench className="w-5 h-5" />
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-slate-800">
          Nueva solicitud de Visita: {visita.nombre_visitante || "Sin nombre"}
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Motivo: {visita.motivo || "No especificado"}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          {formatTiempoRelativo(visita.createdAt)}
        </p>
      </div>
      {!visita.leida && (
        <div
          className="w-2.5 h-2.5 bg-red-500 rounded-full self-center flex-shrink-0"
          title="No leída"
        />
      )}
    </div>
  );
};

// --- Card para alertas (Solo informativo, asume marcado masivo) ---
const AlertaCard: React.FC<{ notificacion: NotificacionBase }> = ({ notificacion }) => {
  return (
    <div
      className={`p-4 flex items-start gap-4 rounded-lg border-l-4 transition-colors shadow-sm border-red-500 ${
        notificacion.leida ? "opacity-70 bg-slate-50" : "bg-red-50"
      }`}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-50 text-red-600">
        <AlertTriangle className="w-5 h-5" />
          </div>
      <div className="flex-grow">
        <h3 className="font-bold text-slate-800">ALERTA HARDWARE: {notificacion.titulo}</h3>
        <p className="text-sm text-slate-600 mt-1">{notificacion.mensaje}</p>
        <p className="text-xs text-slate-400 mt-2">
          {formatTiempoRelativo(notificacion.createdAt)}
        </p>
      </div>
    </div>
  );
};

// --- Detalle de visita ---
const VisitaDetalles: React.FC<{ visita: NotificacionBase; onClose: () => void }> = ({
  visita,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">
          Detalles de la Solicitud de Visita
        </h2>
        <div className="space-y-3 pt-2 text-sm">
          <p>
            <span className="font-semibold text-slate-700">Nombre Completo:</span>{" "}
            {visita.nombre_visitante || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Identificación:</span>{" "}
            {visita.identificacion || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Motivo de Contacto:</span>{" "}
            {visita.motivo || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Fecha Tentativa:</span>{" "}
            {visita.fecha_visita
              ? new Date(visita.fecha_visita).toLocaleDateString()
              : "N/A"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Correo Electrónico:</span>{" "}
            {visita.correo || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Teléfono:</span>{" "}
            {visita.telefono || "N/A"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Ciudad:</span>{" "}
            {visita.ciudad || "N/A"}
          </p>
          <p className="text-xs text-slate-400 border-t pt-2 mt-4">
            <span className="font-medium">Recibido:</span>{" "}
            {new Date(visita.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal ---
export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<NotificacionBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitaSeleccionada, setVisitaSeleccionada] = useState<NotificacionBase | null>(null);

  // --- Fetch inicial ---
  const fetchNotificaciones = async () => {
    try {
      // Usa la URL base y agrega el endpoint de la API
      const res = await fetch(`${BACKEND_URL}/api/notificaciones/admin`);
      if (!res.ok) throw new Error("Error cargando notificaciones del servidor.");
      const data: NotificacionBase[] = await res.json();
      setNotificaciones(ordenarNotificaciones(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de conexión al backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();

    // Conexión Socket.IO
    const socket: Socket = io(BACKEND_URL);

    socket.on("nuevaNotificacion", (payload: NotificacionSocket) => {
      console.log("Nueva notificación recibida por Socket:", payload);
      if (payload.tipo !== "visita" && payload.tipo !== "alerta_hardware") return;

      // Determinar el ID único
      const id = payload.tipo === "visita" ? payload.id_visita : payload.id;
      if (!id) return;

      // Mapear el payload del socket a la interfaz NotificacionBase
      const notificacion: NotificacionBase = {
        id: id!,
        tipo: payload.tipo,
        leida: payload.leida ?? false,
        createdAt: payload.createdAt ?? new Date().toISOString(),
        titulo: payload.titulo ?? (payload.tipo === 'visita' ? 'Nueva Solicitud' : 'Alerta Desconocida'),
        mensaje: payload.mensaje ?? (payload.tipo === 'visita' ? `Visita de ${payload.nombre_visitante}` : 'Revisar estado del hardware.'),
        nombre_visitante: payload.nombre_visitante ?? "",
        motivo: payload.motivo ?? "",
        ciudad: payload.ciudad ?? "",
        fecha_visita: payload.fecha_visita ?? "",
        correo: payload.correo ?? "",
        identificacion: payload.identificacion ?? "",
        telefono: payload.telefono ?? "",
      };

      setNotificaciones((prev) => {
        const existe = prev.some((n) => n.id === notificacion.id);
        // Si ya existe (por si el backend reenvía un evento), lo ignoramos.
        if (existe) return prev;
        return ordenarNotificaciones([notificacion, ...prev]);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const marcarComoLeida = async (id: number | string) => {
    try {
      // PATCH para marcar individualmente
      const res = await fetch(`${BACKEND_URL}/api/notificaciones/${id}/leida`, { 
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leida: true }) // Payload de ejemplo
      });

      if (!res.ok) throw new Error("Fallo al actualizar estado en el servidor.");

      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    } catch (err) {
      console.error("Error al marcar como leída:", err);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      // PUT para marcar todas
      const res = await fetch(`${BACKEND_URL}/api/notificaciones/marcar-todas-leidas`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Fallo al actualizar estado en el servidor.");

      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida);

  return (
    <main className="w-full bg-slate-50 min-h-screen p-6 sm:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="relative">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Bell className="w-10 h-10 text-slate-500" />
            <span>Notificaciones</span>
            {noLeidas.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                {noLeidas.length > 9 ? "+9" : noLeidas.length}
              </span>
            )}
          </h1>
          <p className="text-lg text-slate-500 mt-1">
            Aquí encontrarás las alertas y solicitudes del sistema.
          </p>
        </div>

        {noLeidas.length > 0 && (
          <button
            onClick={marcarTodasComoLeidas}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Marcar todas como leídas ({noLeidas.length})</span>
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-slate-200">
          {loading ? (
            <p className="text-center text-slate-500 py-10">Cargando notificaciones...</p>
          ) : error ? (
            <p className="text-center text-red-600 font-medium bg-red-50 p-4 rounded-lg flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5"/> Error de Conexión: {error}
            </p>
          ) : notificaciones.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No hay notificaciones para mostrar.</p>
          ) : (
            <div className="space-y-4">
              {notificaciones.map((n) =>
                n.tipo === "visita" ? (
                  <NotificacionCard
                    key={`visita-${n.id}`}
                    visita={n}
                    onMarcarComoLeida={marcarComoLeida}
                    onSeleccionar={setVisitaSeleccionada}
                  />
                ) : (
                  <AlertaCard key={`alerta-${n.id}`} notificacion={n} />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {visitaSeleccionada && (
        <VisitaDetalles
          visita={visitaSeleccionada}
          onClose={() => setVisitaSeleccionada(null)}
        />
      )}
    </main>
  );
}