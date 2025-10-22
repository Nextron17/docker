"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Sun, Droplets, Leaf, AlertCircle, Thermometer } from "lucide-react";
import { io } from "socket.io-client";

// --- Configuración de URLs ---
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '') || 'http://localhost:4000';

// 🔹 Tipo de dato recibido por socket
interface LecturaDHT11 {
  tipo: string;
  temperatura: number | null;
  humedad: number | null;
  unidadTemp: string;
  unidadHum: string;
  timestamp: string;
}

// Datos resumen
const resumen = {
  invernaderosActivos: 3,
  totalInvernaderos: 5,
  zonasActivas: 10,
  totalZonas: 15,
  iluminacionesHoy: 4,
  iluminacionActiva: 2,
};

// Datos de iluminación
const datosIluminacion = {
  Dia: [
    { dia: "Lun", iluminacion: 3 },
    { dia: "Mar", iluminacion: 5 },
    { dia: "Mié", iluminacion: 4 },
    { dia: "Jue", iluminacion: 6 },
    { dia: "Vie", iluminacion: 3 },
    { dia: "Sáb", iluminacion: 2 },
    { dia: "Dom", iluminacion: 5 },
  ],
  Semana: [
    { dia: "Semana 1", iluminacion: 26 },
    { dia: "Semana 2", iluminacion: 31 },
  ],
  Mes: [
    { dia: "Jul", iluminacion: 108 },
    { dia: "Jun", iluminacion: 95 },
  ],
};

// Estado de zonas
const zonasEstado = [
  { nombre: "Activas", valor: 10 },
  { nombre: "Inactivas", valor: 3 },
  { nombre: "Mantenimiento", valor: 2 },
];

// Colores para pie chart en tonos de amarillo y naranja suave
const coloresPie = ["#fd8b08ff", "#f0fc4dff", "#fbbf24"];

// Historial de iluminación
const historial = [
  { fecha: "20/07", invernadero: "Inv-1", zona: "Zona 1", tipo: "Iluminación", accion: "Encendido", estado: "Completado" },
  { fecha: "20/07", invernadero: "Inv-2", zona: "Zona 2", tipo: "Iluminación", accion: "Apagado", estado: "Pendiente" },
  { fecha: "19/07", invernadero: "Inv-3", zona: "Zona 3", tipo: "Iluminación", accion: "Encendido", estado: "OK" },
];

export default function EstadisticasIluminacion() {
  const [filtro, setFiltro] = useState<"Dia" | "Semana" | "Mes">("Dia");
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 🔹 Estados de temperatura y humedad en tiempo real
  const [temperatura, setTemperatura] = useState<string>("-- °C");
  const [humedad, setHumedad] = useState<string>("-- %");

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Conectado al servidor de sockets");
    });

    socket.on("nuevaLecturaDHT11", (data: LecturaDHT11) => {
      console.log("📡 Evento nuevaLecturaDHT11 recibido:", data);

      if (data.tipo === "dht11") {
        if (typeof data.temperatura === "number") {
          setTemperatura(`${data.temperatura.toFixed(1)} ${data.unidadTemp}`);
        }
        if (typeof data.humedad === "number") {
          setHumedad(`${data.humedad.toFixed(1)} ${data.unidadHum}`);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Desconectado del servidor de sockets");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };

  const datosFiltrados = datosIluminacion[filtro];

  return (
    <div className="pl-20 pr-6 py-6 bg-gray-50 min-h-screen space-y-8 transition-all duration-300">
      <h1 className="text-3xl font-bold mb-4">Estadísticas de Iluminación</h1>

      {/* Cards resumen + nuevas cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        <Card
          icon={<Leaf size={20} />}
          title="Invernaderos Activos"
          value={`${resumen.invernaderosActivos} / ${resumen.totalInvernaderos}`}
          onClick={() => openModal(<ModalContent title="Invernaderos Activos" items={["Inv-1", "Inv-2", "Inv-3"]} />)}
        />
        <Card
          icon={<Droplets size={20} />}
          title="Zonas Activas"
          value={`${resumen.zonasActivas} / ${resumen.totalZonas}`}
          onClick={() =>
            openModal(
              <ModalContent
                title="Zonas Activas"
                items={[
                  "Zona 1", "Zona 3", "Zona 4", "Zona 5", "Zona 6",
                  "Zona 7", "Zona 8", "Zona 9", "Zona 10", "Zona 11",
                ]}
              />
            )
          }
        />
        <Card
          icon={<Sun size={20} />}
          title="Iluminaciones Hoy"
          value={resumen.iluminacionesHoy}
          onClick={() =>
            openModal(
              <ModalContent
                title="Iluminaciones de Hoy"
                items={["Inv-1 / Zona 1", "Inv-2 / Zona 2", "Inv-3 / Zona 3", "Inv-1 / Zona 4"]}
              />
            )
          }
        />
        <Card icon={<AlertCircle size={20} />} title="Alertas Activas" value="0" />

        {/* card Temperatura */}
        <Card icon={<Thermometer size={20} />} title="Temperatura" value={temperatura} />

        {/*  card Humedad */}
        <Card icon={<Droplets size={20} />} title="Humedad" value={humedad} />
      </div>

      {/* Línea de historial */}
      <div className="bg-white shadow rounded-xl p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-xl ">Historial de Iluminación</h2>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as "Dia" | "Semana" | "Mes")}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="Dia">Por día</option>
            <option value="Semana">Por semana</option>
            <option value="Mes">Por mes</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={270}>
          <LineChart data={datosFiltrados}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="iluminacion"
              stroke="#facc15e1"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart y tabla */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="font-semibold text-xl mb-4 ">Estado de Zonas</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={zonasEstado} dataKey="valor" nameKey="nombre" outerRadius={80} label>
                {zonasEstado.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={coloresPie[index % coloresPie.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded-xl p-6 overflow-auto">
          <h2 className="font-semibold text-xl mb-4">Historial de Eventos</h2>
          <table className="w-full text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="py-2">Fecha</th>
                <th>Invernadero</th>
                <th>Zona</th>
                <th>Tipo</th>
                <th>Acción</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{item.fecha}</td>
                  <td>{item.invernadero}</td>
                  <td>{item.zona}</td>
                  <td>{item.tipo}</td>
                  <td>{item.accion}</td>
                  <td>{item.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-500 text-xl"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            {modalContent}
          </div>
        </div>
      )}
    </div>
  );
}

// Card component
function Card({
  title,
  value,
  icon,
  onClick,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white shadow rounded-xl p-4 flex flex-col items-center text-center hover:ring-2 hover:ring-yellow-300 transition"
    >
      <div className="text-yellow-500 mb-1">{icon}</div>
      <h3 className="text-xs text-gray-500">{title}</h3>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

// ModalContent
function ModalContent({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}