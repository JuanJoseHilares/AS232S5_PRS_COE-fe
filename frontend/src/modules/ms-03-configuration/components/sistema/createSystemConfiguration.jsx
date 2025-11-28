import React, { useState } from "react";
import { createSystemConfiguration } from "../../services/apisystemconfigurations";
import Swal from "sweetalert2";

const SystemConfigurationCreateModal = ({ onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        category: "",
        key: "",
        value: false,
        dataType: "number",
        description: "",
        isEditable: true,
        requiresRestart: false,
        isSensitive: false,
        minimumValue: "",
        maximumValue: "",
        allowedValues: [],
        validationPattern: null,
        updatedAt: new Date().toISOString(),
    });

    const [newAllowedValue, setNewAllowedValue] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "dataType") {
            setFormData({
                ...formData,
                dataType: value,
                allowedValues: [],
                value: "",
            });
            return;
        }

        setFormData({
            ...formData,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "number"
                        ? value === ""
                            ? ""
                            : Number(value)
                        : value,
        });
    };

    const handleAddAllowedValue = () => {
        if (formData.dataType === "boolean") {
            if (newAllowedValue !== "true" && newAllowedValue !== "false") {
                Swal.fire("Valor inválido", "Solo se permiten true/false.", "warning");
                return;
            }
        }

        const trimmed =
            formData.dataType === "boolean"
                ? newAllowedValue === "true"
                    ? true
                    : false
                : newAllowedValue.trim();

        if (trimmed === "" && formData.dataType !== "boolean") return;

        if (formData.allowedValues.includes(trimmed)) {
            Swal.fire("Valor duplicado", "Este valor ya está en la lista.", "warning");
            return;
        }

        setFormData({
            ...formData,
            allowedValues: [...formData.allowedValues, trimmed],
        });
        setNewAllowedValue("");
    };

    const handleRemoveAllowedValue = (value) => {
        setFormData({
            ...formData,
            allowedValues: formData.allowedValues.filter((v) => v !== value),
        });
    };

    const validarCampos = () => {
        const camposObligatorios = [
            { campo: "category", label: "Categoría" },
            { campo: "key", label: "Clave" },
            { campo: "value", label: "Valor" },
            { campo: "description", label: "Descripción" },
        ];

        for (let item of camposObligatorios) {
            const valor = formData[item.campo];
            if (valor === "" || valor === null || valor === undefined) {
                Swal.fire(
                    "Campo obligatorio",
                    `El campo "${item.label}" no puede estar vacío.`,
                    "warning"
                );
                return false;
            }

            if (["category", "key"].includes(item.campo) && /\d/.test(valor)) {
                Swal.fire(
                    "Valor inválido",
                    `El campo "${item.label}" no puede contener números.`,
                    "warning"
                );
                return false;
            }
        }

        const { value, minimumValue, maximumValue, allowedValues, dataType, validationPattern } = formData;

        if (dataType === "boolean" && allowedValues.length === 0) {
            Swal.fire(
                "Valores permitidos requeridos",
                "Para el tipo boolean, debe definir al menos un valor permitido (true o false).",
                "warning"
            );
            return false;
        }

        if (dataType === "string" && allowedValues.length === 0) {
            Swal.fire(
                "Valores permitidos requeridos",
                "Para el tipo string, debe definir al menos un valor permitido.",
                "warning"
            );
            return false;
        }

        if (dataType === "number" && allowedValues.length === 0) {
            Swal.fire(
                "Valores permitidos requeridos",
                "Para el tipo number, debe definir al menos un valor permitido dentro del rango definido.",
                "warning"
            );
            return false;
        }

        switch (dataType) {
            case "number":
                if (
                    value === "" ||
                    minimumValue === "" ||
                    maximumValue === "" ||
                    isNaN(value) ||
                    isNaN(minimumValue) ||
                    isNaN(maximumValue)
                ) {
                    Swal.fire("Valor inválido", "Value, mínimo y máximo deben ser números válidos.", "warning");
                    return false;
                }

                if (parseFloat(value) < parseFloat(minimumValue) || parseFloat(value) > parseFloat(maximumValue)) {
                    Swal.fire("Valor fuera de rango", `El valor debe estar entre ${minimumValue} y ${maximumValue}.`, "warning");
                    return false;
                }

                for (let v of allowedValues) {
                    if (isNaN(v) || v < minimumValue || v > maximumValue) {
                        Swal.fire(
                            "Valores permitidos inválidos",
                            `Todos los valores permitidos deben ser números dentro del rango ${minimumValue} - ${maximumValue}.`,
                            "warning"
                        );
                        return false;
                    }
                }
                break;

            case "boolean":
                if (typeof value !== "boolean") {
                    Swal.fire("Valor inválido", "El valor debe ser true o false.", "warning");
                    return false;
                }
                for (let v of allowedValues) {
                    if (typeof v !== "boolean") {
                        Swal.fire("Valor permitido inválido", "Todos los valores permitidos deben ser true o false.", "warning");
                        return false;
                    }
                }
                break;

            case "string":
                if (validationPattern) {
                    let regex;
                    try {
                        regex = new RegExp(validationPattern);
                    } catch {
                        Swal.fire("Patrón inválido", "El patrón de validación no es válido.", "warning");
                        return false;
                    }

                    if (!regex.test(value)) {
                        Swal.fire("Valor inválido", "El valor no cumple con el patrón de validación.", "warning");
                        return false;
                    }

                    for (let v of allowedValues) {
                        if (!regex.test(v)) {
                            Swal.fire(
                                "Valor permitido inválido",
                                `El valor permitido "${v}" no cumple con el patrón de validación.`,
                                "warning"
                            );
                            return false;
                        }
                    }
                }
                break;

            default:
                break;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarCampos()) return;

        const confirm = await Swal.fire({
            title: "¿Crear configuración?",
            text: "Se creará una nueva configuración del sistema.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, crear",
            cancelButtonText: "Cancelar",
        });

        if (!confirm.isConfirmed) return;

        try {
            await createSystemConfiguration({
                ...formData,
                municipalityId: "24ad12a5-d9e5-4cdd-91f1-8fd0155c9471",
                value: formData.dataType === "number" ? Number(formData.value) : formData.value,
                minimumValue: formData.dataType === "number" ? Number(formData.minimumValue) : formData.minimumValue,
                maximumValue: formData.dataType === "number" ? Number(formData.maximumValue) : formData.maximumValue,
            });
            Swal.fire("Creado", "La configuración fue creada correctamente.", "success");
            onCreated();
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo crear la configuración.", "error");
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] p-6 border border-gray-200 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
                >
                    ✕
                </button>

                <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                    Crear Nueva Configuración
                </h3>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Campos básicos */}
                    {[
                        ["category", "Categoría", "text"],
                        ["key", "Clave", "text"],
                        ["description", "Descripción", "text"],
                        ["minimumValue", "Valor mínimo", "number"],
                        ["maximumValue", "Valor máximo", "number"]
                    ].map(([name, label, type]) => (
                        <div key={name}>
                            <label className="block font-semibold mb-1 text-gray-700">{label}</label>
                            <input
                                type={type}
                                name={name}
                                value={formData[name]}
                                onChange={handleChange}
                                placeholder={`Ingrese ${label.toLowerCase()}`}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    ))}

                    {/* Tipo de dato */}
                    <div>
                        <label className="block font-semibold mb-1 text-gray-700">Tipo de dato</label>
                        <select
                            name="dataType"
                            value={formData.dataType}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                        </select>
                    </div>

                    {/* Campo value */}
                    <div>
                        <label className="block font-semibold mb-1 text-gray-700">Valor</label>
                        {formData.dataType === "boolean" ? (
                            <select
                                name="value"
                                value={formData.value === "" ? "" : formData.value.toString()}
                                onChange={(e) =>
                                    handleChange({
                                        target: {
                                            name: "value",
                                            value: e.target.value === "true" ? true : false,
                                            type: "select-one",
                                        },
                                    })
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">Seleccione</option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        ) : (
                            <input
                                type="text"
                                name="value"
                                value={formData.value}
                                onChange={handleChange}
                                placeholder="Ingrese valor"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        )}
                    </div>

                    {/* Campo regex para string */}
                    {formData.dataType === "string" && (
                        <div className="col-span-2">
                            <label className="block font-semibold mb-1 text-gray-700">Patrón de validación (regex)</label>
                            <input
                                type="text"
                                name="validationPattern"
                                value={formData.validationPattern}
                                onChange={handleChange}
                                placeholder="Ej: ^[A-Za-z0-9]+$"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ingrese un patrón regex que el valor debe cumplir. Ej: ^[A-Za-z0-9]+$
                            </p>
                        </div>
                    )}

                    {/* Valores permitidos */}
                    <div className="col-span-2">
                        <label className="block font-semibold mb-1 text-gray-700">Valores permitidos</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.allowedValues.map((val, i) => (
                                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    {val.toString()}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAllowedValue(val)}
                                        className="text-red-500 hover:text-red-700 font-bold"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {formData.dataType === "boolean" ? (
                                <select
                                    value={newAllowedValue}
                                    onChange={(e) => setNewAllowedValue(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="">Seleccione</option>
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                </select>
                            ) : (
                                <input
                                    value={newAllowedValue}
                                    onChange={(e) => setNewAllowedValue(e.target.value)}
                                    placeholder="Agregar valor"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAllowedValue())}
                                />
                            )}
                            <button
                                type="button"
                                onClick={handleAddAllowedValue}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                Añadir
                            </button>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        {[
                            ["requiresRestart", "¿Requiere reinicio?"],
                            ["isSensitive", "¿Es sensible?"],
                        ].map(([name, label]) => (
                            <label key={name} className="flex items-center gap-2 text-gray-700">
                                <input
                                    type="checkbox"
                                    name={name}
                                    checked={formData[name]}
                                    onChange={handleChange}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                {label}
                            </label>
                        ))}
                    </div>

                    {/* Botones */}
                    <div className="col-span-2 flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                            Crear configuración
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SystemConfigurationCreateModal;