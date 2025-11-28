import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaEdit } from "react-icons/fa";
import { updateCategory, getAllActiveCategories } from "../../services/apiCategory";

const EditarCategoria = ({ categoria, onClose, onUpdated }) => {
    const [form, setForm] = useState({
        categoryCode: categoria.categoryCode || "",
        name: categoria.name || "",
        description: categoria.description || "",
        accountingAccount: categoria.accountingAccount || "",
        annualDepreciation: categoria.annualDepreciation || "",
        usefulLifeYears: categoria.usefulLifeYears || "",
        residualValuePct: categoria.residualValuePct || "",
        level: categoria.level || 1,
        requiresSerial: categoria.requiresSerial || false,
        requiresPlate: categoria.requiresPlate || false,
        isInventoriable: categoria.isInventoriable || false,
        parentCategoryId: categoria.parentCategoryId || null,
        municipalityId: "24ad12a5-d9e5-4cdd-91f1-8fd0355c9473",
    });

    const [allCategories, setAllCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getAllActiveCategories();
                const activeSorted = data
                    .filter(c => c.active && c.id !== categoria.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setAllCategories(activeSorted);
            } catch (error) {
                console.error("Error al cargar categorías:", error);
            }
        };
        fetchCategories();
    }, [categoria.id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value === "" ? null : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const regexLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.,-]+$/;

        if (!form.name?.trim() || !form.description?.trim()) {
            Swal.fire("Campos vacíos", "El nombre y la descripción son obligatorios.", "warning");
            return;
        }

        if (!regexLetras.test(form.name)) {
            Swal.fire("Error", "El nombre solo puede contener letras, espacios y algunos signos (.,-).", "error");
            return;
        }

        if (!regexLetras.test(form.description)) {
            Swal.fire("Error", "La descripción solo puede contener letras, espacios y algunos signos (.,-).", "error");
            return;
        }

        if (form.name.length < 3 || form.name.length > 50) {
            Swal.fire("Error", "El nombre debe tener entre 3 y 50 caracteres.", "error");
            return;
        }

        if (form.description.length < 5 || form.description.length > 200) {
            Swal.fire("Error", "La descripción debe tener entre 5 y 200 caracteres.", "error");
            return;
        }

        const nombreDuplicado = allCategories.some(
            (c) => c.name.toLowerCase().trim() === form.name.toLowerCase().trim()
        );
        if (nombreDuplicado) {
            Swal.fire("Duplicado", "Ya existe una categoría activa con ese nombre.", "warning");
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
            const valor = form[campo];
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

        const parent = allCategories.find((c) => c.id === form.parentCategoryId);
        if (parent && Number(form.level) <= Number(parent.level)) {
            Swal.fire("Error", "El nivel debe ser mayor que el de la categoría padre.", "error");
            return;
        }

        const confirm = await Swal.fire({
            title: "¿Deseas guardar los cambios?",
            text: "Se actualizarán los datos de esta categoría.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#d33",
        });

        if (!confirm.isConfirmed) return;

        try {
            Swal.fire({
                title: "Actualizando categoría...",
                text: "Por favor, espera unos segundos.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });

            await updateCategory(categoria.id, {
                ...form,
                annualDepreciation: Number(form.annualDepreciation),
                usefulLifeYears: Number(form.usefulLifeYears),
                residualValuePct: Number(form.residualValuePct),
                level: Number(form.level),
                parentCategoryId: form.parentCategoryId || null,
            });

            Swal.close();
            await Swal.fire("Actualizada", "La categoría se actualizó correctamente.", "success");

            onUpdated?.();
            onClose?.();
        } catch (error) {
            console.error("Error al actualizar categoría:", error);
            Swal.close();
            Swal.fire("Error", "No se pudo actualizar la categoría.", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Encabezado */}
                <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaEdit className="text-2xl" />
                        <h2 className="text-xl font-semibold">Editar Categoría</h2>
                    </div>
                    <button onClick={onClose} className="text-white text-2xl hover:text-gray-200">✕</button>
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
                                value={form.categoryCode}
                                readOnly
                                className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Código interno generado automáticamente.</p>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Nombre</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
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
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Explica brevemente el propósito o tipo de activos que abarca esta categoría.
                            </p>
                        </div>

                        {/* Campos numéricos */}
                        {[
                            { name: "accountingAccount", label: "Cuenta Contable", desc: "Número de cuenta contable (ej. 1041)." },
                            { name: "annualDepreciation", label: "Depreciación Anual (%)", desc: "Porcentaje anual de depreciación." },
                            { name: "usefulLifeYears", label: "Vida Útil (Años)", desc: "Años durante los cuales el activo es útil." },
                            { name: "residualValuePct", label: "Valor Residual (%)", desc: "Porcentaje del valor original conservado." },
                            { name: "level", label: "Nivel", desc: "Nivel jerárquico (1=principal, 2=subcategoría...)." }
                        ].map((f) => (
                            <div key={f.name}>
                                <label className="block text-sm font-semibold mb-1">{f.label}</label>
                                <input
                                    type="number"
                                    name={f.name}
                                    value={form[f.name]}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
                            </div>
                        ))}

                        {/* Categoría padre */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Categoría Padre</label>
                            <select
                                name="parentCategoryId"
                                value={form.parentCategoryId || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Ninguna —</option>
                                {allCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Solo se muestran categorías activas.</p>
                        </div>

                        {/* Checkboxes */}
                        <div className="sm:col-span-2 flex flex-wrap gap-6 mt-2">
                            {[
                                { name: "requiresSerial", label: "Requiere Serie" },
                                { name: "requiresPlate", label: "Requiere Placa" },
                                { name: "isInventoriable", label: "Es Inventariable" }
                            ].map((chk) => (
                                <label key={chk.name} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name={chk.name}
                                        checked={form[chk.name]}
                                        onChange={handleChange}
                                    />
                                    <span>{chk.label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Botones */}
                        <div className="sm:col-span-2 text-right mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-200 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-300 mr-3"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditarCategoria;