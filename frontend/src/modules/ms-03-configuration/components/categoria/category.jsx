import React, { useEffect, useState } from "react";
import {
    getAllActiveCategories,
    getAllInactiveCategories,
    restoreCategory,
    deleteCategory,
} from "../../services/apiCategory";
import {
    FaUndo,
    FaSearch,
    FaEye,
    FaTrash,
    FaEdit,
    FaInfoCircle,
    FaCheckCircle,
    FaBan,
    FaLayerGroup,
} from "react-icons/fa";
import Swal from "sweetalert2";
import EditarCategoria from "./editcategory";
import CrearCategoria from "./createCategory";

const CategoriaList = () => {
    const [categorias, setCategorias] = useState([]);
    const [filter, setFilter] = useState("activos");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);


    const fetchCategorias = async () => {
        try {
            setLoading(true);
            const [active, inactive] = await Promise.all([
                getAllActiveCategories(),
                getAllInactiveCategories(),
            ]);
            setCategorias([...active, ...inactive]);
        } catch (error) {
            console.error("Error al obtener categorías:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategorias();
    }, []);

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


    const handleRestore = async (id) => {
        const confirm = await Swal.fire({
            title: "¿Restaurar categoría?",
            text: "Esta categoría volverá a estar activa.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, restaurar",
            cancelButtonText: "Cancelar",
        });

        if (confirm.isConfirmed) {
            try {
                await restoreCategory(id);
                await fetchCategorias();
                Swal.fire("Restaurada", "La categoría ha sido restaurada.", "success");
            } catch {
                Swal.fire("Error", "No se pudo restaurar la categoría.", "error");
            }
        }
    };


    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "¿Inactivar categoría?",
            text: "La categoría pasará a estado inactivo.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, inactivar",
            cancelButtonText: "Cancelar",
        });

        if (confirm.isConfirmed) {
            try {
                await deleteCategory(id);
                await fetchCategorias();
                Swal.fire("Inactivada", "La categoría ha sido inactivada.", "success");
            } catch {
                Swal.fire("Error", "No se pudo inactivar la categoría.", "error");
            }
        }
    };


    const filtered = categorias
    .sort((a, b) => {
        const numA = parseInt(a.categoryCode?.split("-")[1], 10) || 0;
        const numB = parseInt(b.categoryCode?.split("-")[1], 10) || 0;
        return numA - numB;
    })
    .filter((cat) => {
        const byState =
            filter === "activos"
                ? cat.active
                : filter === "inactivos"
                    ? !cat.active
                    : true;
        const search = searchTerm.toLowerCase();
        const parentName = categorias.find(c => c.id === cat.parentCategoryId)?.name || "";
        const bySearch =
            cat.name?.toLowerCase().includes(search) ||
            cat.categoryCode?.toLowerCase().includes(search) ||
            cat.accountingAccount?.toLowerCase().includes(search) ||
            cat.description?.toLowerCase().includes(search) ||
            parentName.toLowerCase().includes(search) ||
            String(cat.annualDepreciation || "").includes(search) ||
            String(cat.usefulLifeYears || "").includes(search);

        return byState && bySearch;
    });

    const totalCategorias = categorias.length;
    const totalActivas = categorias.filter((c) => c.active).length;
    const totalInactivas = categorias.filter((c) => !c.active).length;

    return (
        <div className="p-8 bg-gray-50 rounded-2xl shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Gestión de Categorías de Bienes
            </h1>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center justify-between bg-blue-100 border-l-4 border-blue-600 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                    <div>
                        <h2 className="text-sm text-blue-600 font-semibold uppercase">Total</h2>
                        <p className="text-3xl font-bold text-blue-800 mt-1">{totalCategorias}</p>
                    </div>
                    <div className="text-blue-600 text-4xl"><FaLayerGroup /></div>
                </div>

                <div className="flex items-center justify-between bg-green-100 border-l-4 border-green-600 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                    <div>
                        <h2 className="text-sm text-green-600 font-semibold uppercase">Activas</h2>
                        <p className="text-3xl font-bold text-green-800 mt-1">{totalActivas}</p>
                    </div>
                    <div className="text-green-600 text-4xl"><FaCheckCircle /></div>
                </div>

                <div className="flex items-center justify-between bg-amber-100 border-l-4 border-amber-600 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                    <div>
                        <h2 className="text-sm text-amber-600 font-semibold uppercase">Inactivas</h2>
                        <p className="text-3xl font-bold text-amber-800 mt-1">{totalInactivas}</p>
                    </div>
                    <div className="text-amber-600 text-4xl"><FaBan /></div>
                </div>
            </div>

            {/* Filtros y botón Crear */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 items-center">
                <div className="flex flex-1 gap-4">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por código, nombre o cuenta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />
                    </div>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full sm:w-56 border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="activos">Activas</option>
                        <option value="inactivos">Inactivas</option>
                    </select>
                </div>

                <button
                    onClick={() => setCreating(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    Crear Categoría
                </button>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-gray-700">
                    <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                        <tr>
                            <th className="px-5 py-3 text-left">Código</th>
                            <th className="px-5 py-3 text-left">Nombre</th>
                            <th className="px-5 py-3 text-left">Cuenta</th>
                            <th className="px-5 py-3 text-left">Depreciación</th>
                            <th className="px-5 py-3 text-left">Vida útil</th>
                            <th className="px-5 py-3 text-left">Categoría Padre</th>
                            <th className="px-5 py-3 text-left">Estado</th>
                            <th className="px-5 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="text-center py-6 text-gray-500 italic">
                                    Cargando categorías...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-6 text-gray-500 italic">
                                    No se encontraron resultados.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((cat) => (
                                <tr key={cat.id} className="hover:bg-blue-50 transition border-b last:border-none">
                                    <td className="px-5 py-3">{cat.categoryCode}</td>
                                    <td className="px-5 py-3 font-medium">{cat.name}</td>
                                    <td className="px-5 py-3">{cat.accountingAccount}</td>
                                    <td className="px-5 py-3">{cat.annualDepreciation}%</td>
                                    <td className="px-5 py-3">{cat.usefulLifeYears} años</td>
                                    <td className="px-5 py-3">
                                        {cat.parentCategoryId
                                            ? categorias.find(c => c.id === cat.parentCategoryId)?.name || "—"
                                            : "Ninguno"}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${cat.active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                                        >
                                            {cat.active ? "Activa" : "Inactiva"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center space-x-3">
                                        {cat.active && (
                                            <button
                                                className="text-blue-600 hover:text-blue-800"
                                                onClick={() => setEditing(cat)}
                                                title="Editar"
                                            >
                                                <FaEdit />
                                            </button>
                                        )}

                                        <button
                                            className="text-gray-500 hover:text-blue-600"
                                            onClick={() => setSelected(cat)}
                                            title="Ver detalles"
                                        >
                                            <FaEye />
                                        </button>
                                        {cat.active ? (
                                            <button
                                                className="text-red-600 hover:text-red-800"
                                                onClick={() => handleDelete(cat.id)}
                                                title="Inactivar"
                                            >
                                                <FaTrash />
                                            </button>
                                        ) : (
                                            <button
                                                className="text-amber-600 hover:text-amber-800"
                                                onClick={() => handleRestore(cat.id)}
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

            {/* Modal Crear */}
            {creating && (
                <CrearCategoria
                    onClose={() => setCreating(false)}
                    onCreated={fetchCategorias}
                />
            )}

            {/* Modal Detalles */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
                        {/* Encabezado */}
                        <div className="bg-blue-600 text-white p-5 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <FaInfoCircle className="text-2xl" />
                                <h2 className="text-xl font-semibold">Detalles de Categoría</h2>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-white text-2xl hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-700">
                            {/* Información General */}
                            <div>
                                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                                    Información General
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <p><strong>Código:</strong> {selected.categoryCode}</p>
                                    <p><strong>Nombre:</strong> {selected.name}</p>
                                    <p><strong>Descripción:</strong> {selected.description || "—"}</p>
                                    <p><strong>Nivel:</strong> {selected.level || "—"}</p>
                                    <p>
                                        <strong>Categoría Padre:</strong>{" "}
                                        {selected.parentCategoryId
                                            ? categorias.find(c => c.id === selected.parentCategoryId)?.name || "—"
                                            : "Ninguno"}
                                    </p>
                                    <p>
                                        <strong>Estado:</strong>{" "}
                                        <span
                                            className={`font-semibold ${selected.active ? "text-green-600" : "text-amber-600"}`}
                                        >
                                            {selected.active ? "Activa" : "Inactiva"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Configuración Contable */}
                            <div>
                                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                                    Configuración Contable
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <p><strong>Cuenta Contable:</strong> {selected.accountingAccount || "—"}</p>
                                    <p><strong>Depreciación Anual:</strong> {selected.annualDepreciation || 0}%</p>
                                    <p><strong>Valor Residual:</strong> {selected.residualValuePct || 0}%</p>
                                    <p><strong>Vida Útil:</strong> {selected.usefulLifeYears || 0} años</p>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Configuración de Control */}
                            <div>
                                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                                    Configuración de Control
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <p><strong>Inventariable:</strong> {selected.isInventoriable ? "Sí" : "No"}</p>
                                    <p><strong>Requiere Serie:</strong> {selected.requiresSerial ? "Sí" : "No"}</p>
                                    <p><strong>Requiere Placa:</strong> {selected.requiresPlate ? "Sí" : "No"}</p>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Información de Auditoría */}
                            <div>
                                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                                    Información de Auditoría
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <p>
                                        <strong>Fecha de creación:</strong>{" "}
                                        {selected.createdAt ? formatDate(selected.createdAt) : "—"}
                                    </p>
                                    <p>
                                        <strong>Última actualización:</strong>{" "}
                                        {selected.updatedAt ? formatDate(selected.updatedAt) : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 text-right px-6 py-4 flex-shrink-0">
                            <button
                                onClick={() => setSelected(null)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar */}
            {editing && (
                <EditarCategoria
                    categoria={editing}
                    onClose={() => setEditing(null)}
                    onUpdated={fetchCategorias}
                />
            )}
        </div>
    );
};

export default CategoriaList;