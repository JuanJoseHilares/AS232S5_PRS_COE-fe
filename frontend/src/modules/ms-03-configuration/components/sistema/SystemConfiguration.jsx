import React, { useEffect, useState } from "react";
import SystemConfigurationEditModal from "./EditSystemConfiguration";
import CreateSystemConfiguration from "./createSystemConfiguration";
import {
    getAllSystemConfigurations,
    softDeleteSystemConfiguration,
    restoreSystemConfiguration,
} from "../../services/apisystemconfigurations";
import { FaEdit, FaSearch, FaEye, FaTrash, FaUndo, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";

const SystemConfigurationList = () => {
    const [configs, setConfigs] = useState([]);
    const [filteredConfigs, setFilteredConfigs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchConfigurations = async () => {
        try {
            setLoading(true);
            const data = await getAllSystemConfigurations();
            setConfigs(data);
            setFilteredConfigs(data);
        } catch (err) {
            console.error("Error al obtener configuraciones del sistema:", err);
            Swal.fire("Error", "No se pudieron cargar las configuraciones.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigurations();
    }, []);

    useEffect(() => {
        const filtered = configs.filter(
            (c) =>
                c.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredConfigs(filtered);
    }, [searchTerm, configs]);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString + "Z");
        return date.toLocaleString("es-PE", {
            timeZone: "America/Lima",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatBoolean = (value) => {
        if (value === true) return "Sí";
        if (value === false) return "No";
        return "—";
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Desactivar configuración?",
            text: "Esta acción marcará la configuración como no editable.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, desactivar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });

        if (result.isConfirmed) {
            try {
                await softDeleteSystemConfiguration(id);
                Swal.fire("Desactivada", "La configuración fue marcada como no editable.", "success");
                fetchConfigurations();
            } catch (error) {
                Swal.fire("Error", "No se pudo desactivar la configuración.", "error");
            }
        }
    };

    const handleRestore = async (id) => {
        const result = await Swal.fire({
            title: "¿Restaurar configuración?",
            text: "La configuración volverá a estar editable.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, restaurar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#6c757d",
        });

        if (result.isConfirmed) {
            try {
                await restoreSystemConfiguration(id);
                Swal.fire("Restaurada", "La configuración fue restaurada exitosamente.", "success");
                fetchConfigurations();
            } catch (error) {
                Swal.fire("Error", "No se pudo restaurar la configuración.", "error");
            }
        }
    };

    const excludedFields = ["id", "createdBy", "updatedBy","municipalityId"];

    const detailOrder = [
        "municipalityId",
        "category",
        "key",
        "value",
        "dataType",
        "description",
        "isEditable",
        "requiresRestart",
        "isSensitive",
        "minimumValue",
        "maximumValue",
        "allowedValues",
        "validationPattern",
        "createdAt",
        "updatedAt",
    ];

    const fieldLabels = {
        municipalityId: "Municipalidad ID",
        category: "Categoría",
        key: "Clave",
        value: "Valor",
        dataType: "Tipo de dato",
        description: "Descripción",
        isEditable: "¿Es editable?",
        requiresRestart: "¿Requiere reinicio?",
        isSensitive: "¿Es sensible?",
        minimumValue: "Valor mínimo",
        maximumValue: "Valor máximo",
        allowedValues: "Valores permitidos",
        validationPattern: "Patrón de validación",
        createdAt: "Fecha de creación",
        updatedAt: "Última actualización",
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 rounded-2xl shadow-md border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                    Configuraciones del Sistema
                </h2>

                <div className="flex flex-col items-end gap-4 w-full sm:w-auto">

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 w-full sm:w-80">
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                            Buscar por categoría o clave
                        </label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Ej: seguridad, login..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-80"
                    >
                        <FaPlus /> Nueva Configuración
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-500 italic py-6">Cargando configuraciones...</p>
            ) : filteredConfigs.length === 0 ? (
                <p className="text-center text-gray-500 italic py-6">
                    No hay configuraciones que coincidan.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredConfigs.map((config) => (
                        <div
                            key={config.id}
                            className="bg-white p-5 rounded-2xl shadow hover:shadow-lg border border-gray-200 transition-all duration-200 relative"
                        >
                            <h3 className="text-lg font-bold text-gray-800 mb-2 capitalize">
                                {config.category}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-semibold text-gray-700">Clave:</span>{" "}
                                {config.key}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-semibold text-gray-700">Valor:</span>{" "}
                                {config.value}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-semibold text-gray-700">Tipo:</span>{" "}
                                {config.dataType}
                            </p>
                            <div className="flex justify-between items-center mt-3 text-sm">
                                <span
                                    className={`font-semibold ${config.isEditable
                                        ? "text-green-600"
                                        : "text-gray-500"
                                        }`}
                                >
                                    {config.isEditable ? "Editable" : "No editable"}
                                </span>
                                <span
                                    className={`font-semibold ${config.requiresRestart
                                        ? "text-amber-600"
                                        : "text-gray-500"
                                        }`}
                                >
                                    {config.requiresRestart ? "Requiere reinicio" : "Normal"}
                                </span>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex justify-end items-center gap-3 mt-4">
                                <button
                                    className="text-gray-600 hover:text-blue-600 transition"
                                    title="Ver detalles"
                                    onClick={() => {
                                        setSelectedConfig(config);
                                        setShowDetails(true);
                                    }}
                                >
                                    <FaEye />
                                </button>

                                {config.isEditable && (
                                    <button
                                        className="text-blue-600 hover:text-blue-800 transition"
                                        title="Editar configuración"
                                        onClick={() => {
                                            setSelectedConfig(config);
                                            setShowEditModal(true);
                                        }}
                                    >
                                        <FaEdit />
                                    </button>
                                )}

                                {config.isEditable ? (
                                    <button
                                        className="text-red-600 hover:text-red-800 transition"
                                        title="Desactivar configuración"
                                        onClick={() => handleDelete(config.id)}
                                    >
                                        <FaTrash />
                                    </button>
                                ) : (
                                    <button
                                        className="text-green-600 hover:text-green-800 transition"
                                        title="Restaurar configuración"
                                        onClick={() => handleRestore(config.id)}
                                    >
                                        <FaUndo />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showDetails && selectedConfig && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] p-6 border border-gray-200 relative">
                        <button
                            onClick={() => setShowDetails(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
                        >
                            ✕
                        </button>

                        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                            Detalles de Configuración
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                            {detailOrder
                                .filter((key) => !excludedFields.includes(key))
                                .map((key) => {
                                    const value = selectedConfig[key];
                                    if (value === undefined) return null;

                                    let displayValue = value;
                                    if (key === "createdAt" || key === "updatedAt") {
                                        displayValue = formatDate(value);
                                    } else if (
                                        key === "isEditable" ||
                                        key === "requiresRestart" ||
                                        key === "isSensitive"
                                    ) {
                                        displayValue = formatBoolean(value);
                                    } else if (Array.isArray(value)) {
                                        displayValue = value.join(", ");
                                    } else if (typeof value === "object" && value !== null) {
                                        displayValue = JSON.stringify(value);
                                    } else if (value === null || value === "") {
                                        displayValue = "—";
                                    }

                                    return (
                                        <div
                                            key={key}
                                            className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                                        >
                                            <span className="block font-semibold capitalize text-gray-800 mb-1">
                                                {fieldLabels[key] || key.replace(/([A-Z])/g, " $1")}
                                            </span>
                                            <span className="block text-gray-600 break-words">
                                                {displayValue}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className="mt-6 text-right">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición */}
            {showEditModal && selectedConfig && (
                <SystemConfigurationEditModal
                    config={selectedConfig}
                    onClose={() => setShowEditModal(false)}
                    onUpdated={fetchConfigurations}
                />
            )}

            {/* Modal de creación */}
            {showCreateModal && (
                <CreateSystemConfiguration
                    onClose={() => setShowCreateModal(false)}
                    onCreated={fetchConfigurations}
                />
            )}
        </div>
    );
};

export default SystemConfigurationList;