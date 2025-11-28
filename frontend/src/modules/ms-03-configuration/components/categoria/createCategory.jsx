import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaPlusCircle } from "react-icons/fa";
import { createCategory, getAllActiveCategories } from "../../services/apiCategory";

const CrearCategoria = ({ onClose, onCreated }) => {
    const [categoriasPadre, setCategoriasPadre] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [categoria, setCategoria] = useState({
        categoryCode: "",
        name: "",
        description: "",
        accountingAccount: "",
        annualDepreciation: "",
        usefulLifeYears: "",
        parentCategoryId: null,
        isInventoriable: false,
        requiresSerial: false,
        requiresPlate: false,
        level: 1,
        residualValuePct: "",
        municipalityId: "24ad12a5-d9e5-4cdd-91f1-8fd0355c9473",
    });

    const generarCodigoCategoria = (categorias) => {
        if (!categorias || categorias.length === 0) return "CAT-001";
        const numeros = categorias
            .map((c) => {
                const match = c.categoryCode?.match(/CAT-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter((n) => !isNaN(n));
        const maxNum = numeros.length > 0 ? Math.max(...numeros) : 0;
        return `CAT-${(maxNum + 1).toString().padStart(3, "0")}`;
    };

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const actives = await getAllActiveCategories();
                setCategoriasPadre(actives);
                setAllCategories(actives);
                const nuevoCodigo = generarCodigoCategoria(actives);
                setCategoria((prev) => ({ ...prev, categoryCode: nuevoCodigo }));
            } catch (error) {
                console.error("Error cargando categorías activas:", error);
            }
        };
        fetchCategorias();
    }, []);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCategoria((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value === "" ? null : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const regexLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.,-]+$/;

        if (!categoria.name?.trim() || !categoria.description?.trim()) {
            Swal.fire("Campos vacíos", "El nombre y la descripción son obligatorios.", "warning");
            return;
        }

        if (!regexLetras.test(categoria.name)) {
            Swal.fire("Error", "El nombre solo puede contener letras, espacios y algunos signos (.,-).", "error");
            return;
        }

        if (!regexLetras.test(categoria.description)) {
            Swal.fire("Error", "La descripción solo puede contener letras, espacios y algunos signos (.,-).", "error");
            return;
        }

        if (categoria.name.length < 3 || categoria.name.length > 50) {
            Swal.fire("Error", "El nombre debe tener entre 3 y 50 caracteres.", "error");
            return;
        }

        if (categoria.description.length < 5 || categoria.description.length > 200) {
            Swal.fire("Error", "La descripción debe tener entre 5 y 200 caracteres.", "error");
            return;
        }

        const nombreDuplicado = allCategories.some(
            (c) => c.name.toLowerCase().trim() === categoria.name.toLowerCase().trim()
        );
        if (nombreDuplicado) {
            Swal.fire("Duplicado", "Ya existe una categoría con ese nombre.", "warning");
            return;
        }

        const camposNumericos = [
            { campo: "accountingAccount", nombre: "Cuenta Contable", min: 0, max: null, regex: /^[0-9]{2,4}$/ },
            { campo: "annualDepreciation", nombre: "Depreciación Anual (%)", min: 0, max: 100 },
            { campo: "usefulLifeYears", nombre: "Vida Útil (Años)", min: 1, max: 50 },
            { campo: "residualValuePct", nombre: "Valor Residual (%)", min: 0, max: 100 },
            { campo: "level", nombre: "Nivel", min: 1, max: 5 },
        ];

        for (const { campo, nombre, min, max, regex } of camposNumericos) {
            const valor = categoria[campo];
            if (valor === "" || valor === null || valor === undefined) {
                Swal.fire("Campo vacío", `${nombre} es obligatorio.`, "warning");
                return;
            }

            const numero = Number(valor);
            if (isNaN(numero)) {
                Swal.fire("Valor inválido", `${nombre} debe ser un número.`, "error");
                return;
            }

            if (min !== null && numero < min) {
                Swal.fire("Valor inválido", `${nombre} debe ser mayor o igual a ${min}.`, "error");
                return;
            }

            if (max !== null && numero > max) {
                Swal.fire("Valor inválido", `${nombre} no puede superar ${max}.`, "error");
                return;
            }

            if (regex && !regex.test(valor)) {
                Swal.fire("Error", `${nombre} tiene un formato incorrecto.`, "error");
                return;
            }
        }

        const parent = allCategories.find((c) => c.id === categoria.parentCategoryId);
        if (parent && Number(categoria.level) <= Number(parent.level)) {
            Swal.fire("Error", "El nivel debe ser mayor que el de la categoría padre.", "error");
            return;
        }

        const confirm = await Swal.fire({
            title: "¿Deseas crear esta categoría?",
            text: "Se registrará una nueva categoría con los datos ingresados.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, crear",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#d33",
        });

        if (!confirm.isConfirmed) return;

        // Crear categoría
        try {
            Swal.fire({
                title: "Creando categoría...",
                text: "Por favor, espera unos segundos.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });

            await createCategory({
                ...categoria,
                annualDepreciation: Number(categoria.annualDepreciation),
                usefulLifeYears: Number(categoria.usefulLifeYears),
                residualValuePct: Number(categoria.residualValuePct),
                level: Number(categoria.level),
                parentCategoryId: categoria.parentCategoryId || null,
            });

            Swal.close();
            await Swal.fire("Creada", "La categoría ha sido creada correctamente.", "success");

            onCreated?.();
            onClose?.();
        } catch (error) {
            console.error("Error al crear categoría:", error);
            Swal.close();
            Swal.fire("Error", "No se pudo crear la categoría.", "error");
        }
    };



    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Encabezado */}
                <div className="bg-green-600 text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaPlusCircle className="text-2xl" />
                        <h2 className="text-xl font-semibold">Crear Nueva Categoría</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white text-2xl hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                {/* Formulario */}
                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-gray-700">

                        {/* Código */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Código</label>
                            <input
                                type="text"
                                name="categoryCode"
                                value={categoria.categoryCode}
                                readOnly
                                className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Código generado automáticamente.</p>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Nombre</label>
                            <input
                                type="text"
                                name="name"
                                value={categoria.name || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nombre único de la categoría (por ejemplo, “Vehículos”, “Equipos de Cómputo”).
                            </p>
                        </div>

                        {/* Descripción */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold mb-1">Descripción</label>
                            <textarea
                                name="description"
                                value={categoria.description || ""}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Explica brevemente el propósito o tipo de activos que abarca esta categoría.
                            </p>
                        </div>

                        {/* Cuenta contable */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Cuenta Contable</label>
                            <input
                                type="number"
                                name="accountingAccount"
                                value={categoria.accountingAccount || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Número de cuenta contable asociada en el plan de cuentas (por ejemplo, 1041).
                            </p>
                        </div>

                        {/* Depreciación anual */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Depreciación Anual (%)</label>
                            <input
                                type="number"
                                name="annualDepreciation"
                                value={categoria.annualDepreciation || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Porcentaje anual de depreciación que se aplicará a los activos de esta categoría.
                            </p>
                        </div>

                        {/* Vida útil */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Vida Útil (Años)</label>
                            <input
                                type="number"
                                name="usefulLifeYears"
                                value={categoria.usefulLifeYears || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Número estimado de años durante los cuales el activo se considera útil.
                            </p>
                        </div>

                        {/* Valor residual */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Valor Residual (%)</label>
                            <input
                                type="number"
                                name="residualValuePct"
                                value={categoria.residualValuePct || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Porcentaje del valor original que conserva el activo al final de su vida útil.
                            </p>
                        </div>

                        {/* Nivel */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Nivel</label>
                            <input
                                type="number"
                                name="level"
                                value={categoria.level || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nivel jerárquico de la categoría (por ejemplo, 1 para principal, 2 para subcategoría).
                            </p>
                        </div>

                        {/* Categoría Padre */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Categoría Padre</label>
                            <select
                                name="parentCategoryId"
                                value={categoria.parentCategoryId || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">— Ninguna —</option>
                                {categoriasPadre.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Solo se muestran categorías activas disponibles.
                            </p>
                        </div>

                        {/* Checkboxes */}
                        <div className="sm:col-span-2 flex flex-wrap gap-6 mt-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="requiresSerial"
                                    checked={categoria.requiresSerial}
                                    onChange={handleChange}
                                />
                                <span>Requiere Serie</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="requiresPlate"
                                    checked={categoria.requiresPlate}
                                    onChange={handleChange}
                                />
                                <span>Requiere Placa</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isInventoriable"
                                    checked={categoria.isInventoriable}
                                    onChange={handleChange}
                                />
                                <span>Es Inventariable</span>
                            </label>
                        </div>

                        {/* Botones */}
                        <div className="sm:col-span-2 flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
                            >
                                Crear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CrearCategoria;