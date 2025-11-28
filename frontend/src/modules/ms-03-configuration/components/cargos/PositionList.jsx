import React, { useEffect, useState } from "react";
import {
  getAllActivePositions,
  getAllInactivePositions,
  deletePosition,
  restorePosition,
} from "../../services/positionApi";
import PositionForm from "./PositionForm";
import PositionWidget from "./PositionWidget";
import { FaEdit, FaUndo, FaPlus, FaSearch, FaEye } from "react-icons/fa";
import Swal from "sweetalert2";


const PositionList = () => {
  const [positions, setPositions] = useState([]);
  const [editingPosition, setEditingPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filterActive, setFilterActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");


  // 🔹 Obtener todos los cargos
  const fetchPositions = async () => {
    try {
      setLoading(true);
      const [active, inactive] = await Promise.all([
        getAllActivePositions(),
        getAllInactivePositions(),
      ]);
      setPositions([...active, ...inactive]);
      setStats({
        active: active.length,
        inactive: inactive.length,
        total: active.length + inactive.length,
      });
    } catch (err) {
      console.error("Error fetching positions:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchPositions();
  }, []);


  // 🔹 Eliminar (desactivar) un cargo
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "El cargo se marcará como inactivo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
    });


    if (result.isConfirmed) {
      try {
        await deletePosition(id);
        await fetchPositions();
        Swal.fire("Desactivado", "El cargo se desactivó correctamente.", "success");
      } catch {
        Swal.fire("Error", "No se pudo desactivar el cargo.", "error");
      }
    }
  };


  // 🔹 Restaurar un cargo inactivo
  const handleRestore = async (id) => {
    const result = await Swal.fire({
      title: "¿Restaurar cargo?",
      text: "El cargo estará activo nuevamente.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });


    if (result.isConfirmed) {
      try {
        await restorePosition(id);
        await fetchPositions();
        Swal.fire("Restaurado", "El cargo se restauró correctamente.", "success");
      } catch {
        Swal.fire("Error", "No se pudo restaurar el cargo.", "error");
      }
    }
  };


  // 🔹 Modal de agregar
  const openAddModal = () => {
    setEditingPosition(null);
    setShowModal(true);
  };


  // 🔹 Modal de editar
  const openEditModal = (position) => {
    setEditingPosition(position);
    setShowModal(true);
  };


  // 🔹 Actualizar después de guardar
  const handleFormSuccess = () => {
    fetchPositions();
    setEditingPosition(null);
    setShowModal(false);
    Swal.fire("Guardado", "El cargo se guardó correctamente.", "success");
  };


  // 🔹 Modal de detalles
  const openDetailsModal = (position) => {
    setSelectedPosition(position);
    setShowDetails(true);
  };


  // 🔹 Filtrar y buscar
  const filteredPositions = positions.filter((position) => {
    const matchesFilter = filterActive ? position.active : !position.active;
    const matchesSearch =
      position.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.positionCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.municipalityId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });


  // 🔹 Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };


  return (
    <div className="p-8 space-y-8 bg-gray-50 rounded-2xl shadow-md border border-gray-200">
      {/* Título y botón */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Gestión de Cargos
        </h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
        >
          <FaPlus className="text-sm" /> Agregar Cargo
        </button>
      </div>


      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <PositionWidget title="Cargos Activos" value={stats.active} />
        <PositionWidget title="Cargos Inactivos" value={stats.inactive} />
        <PositionWidget title="Total Cargos" value={stats.total} />
      </div>


      {/* Buscador */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <div className="flex-1 flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <FaSearch className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 py-2 px-3 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={filterActive}
              onChange={() => setFilterActive(!filterActive)}
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
          </label>
          <span className="ml-2 text-sm font-medium text-gray-600">
            {filterActive ? "Activos" : "Inactivos"}
          </span>
        </div>
      </div>


      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-3 font-semibold">Código</th>
              <th className="px-5 py-3 font-semibold">Municipio</th>
              <th className="px-5 py-3 font-semibold">Nombre</th>
              <th className="px-5 py-3 font-semibold">Descripción</th>
              <th className="px-5 py-3 font-semibold">Nivel</th>
              <th className="px-5 py-3 font-semibold">Salario Base</th>
              <th className="px-5 py-3 font-semibold">Creación</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center text-gray-500 py-6 italic">
                  ⏳ Cargando cargos...
                </td>
              </tr>
            ) : filteredPositions.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-gray-500 py-6 italic">
                  No se encontraron resultados.
                </td>
              </tr>
            ) : (
              filteredPositions.map((position) => (
                <tr key={position.id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-5 py-3">{position.positionCode}</td>
                  <td className="px-5 py-3">{position.municipalityId}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{position.name}</td>
                  <td className="px-5 py-3 text-gray-600">{position.description}</td>
                  <td className="px-5 py-3">{position.hierarchicalLevel ?? "—"}</td>
                  <td className="px-5 py-3">S/. {position.baseSalary?.toFixed(2)}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(position.createdAt)}</td>
                  <td className="px-5 py-3">
                    {position.active ? (
                      <span className="text-green-600 font-semibold">Activo</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Inactivo</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center space-x-3">
                    <button
                      className="text-gray-600 hover:text-gray-900 transition"
                      onClick={() => openDetailsModal(position)}
                      title="Ver detalles"
                    >
                      <FaEye />
                    </button>


                    {position.active ? (
                      <>
                        <button
                          className="text-blue-600 hover:text-blue-800 transition"
                          onClick={() => openEditModal(position)}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 transition"
                          onClick={() => handleDelete(position.id)}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-amber-600 hover:text-amber-800 transition"
                        onClick={() => handleRestore(position.id)}
                        title="Restaurar"
                      >
                        <FaUndo />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


      {/* Modal de formulario */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-lg font-bold"
            >
              ✕
            </button>
            <PositionForm
              position={editingPosition}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}


      {/* ✅ Modal de detalles con botón a la derecha */}
      {showDetails && selectedPosition && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative animate-fadeIn border border-gray-200">
            {/* Botón de cierre (X) */}
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-5 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold transition"
            >
              ✕
            </button>


            {/* Título */}
            <h3 className="text-3xl font-extrabold text-gray-800 mb-6 border-b border-gray-200 pb-3 flex items-center gap-2">
              <FaEye className="text-blue-600" /> Detalles del Cargo
            </h3>


            {/* Datos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
              {[
                { label: "Código", value: selectedPosition.positionCode },
                { label: "Municipio", value: selectedPosition.municipalityId },
                { label: "Nombre", value: selectedPosition.name },
                { label: "Descripción", value: selectedPosition.description },
                {
                  label: "Nivel Jerárquico",
                  value: selectedPosition.hierarchicalLevel ?? "—",
                },
                {
                  label: "Salario Base",
                  value: `S/. ${selectedPosition.baseSalary?.toFixed(2)}`,
                },
                {
                  label: "Fecha de Creación",
                  value: new Date(selectedPosition.createdAt).toLocaleDateString(
                    "es-PE",
                    { year: "numeric", month: "long", day: "numeric" }
                  ),
                },
                {
                  label: "Estado",
                  value: selectedPosition.active ? (
                    <span className="text-green-600 font-semibold">Activo</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Inactivo</span>
                  ),
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                    {item.label}
                  </span>
                  <span className="mt-1 text-base font-medium text-gray-800 break-words">
                    {item.value || "—"}
                  </span>
                </div>
              ))}
            </div>


            {/* Botón cerrar alineado a la derecha */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default PositionList;


