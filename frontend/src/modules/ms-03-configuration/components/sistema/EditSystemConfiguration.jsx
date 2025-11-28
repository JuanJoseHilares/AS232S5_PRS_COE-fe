import React, { useState, useEffect } from "react";
import { updateSystemConfiguration } from "../../services/apisystemconfigurations";
import Swal from "sweetalert2";

const SystemConfigurationEditModal = ({ config, onClose, onUpdated }) => {
    const [formData, setFormData] = useState({
        category: "",
        key: "",
        value: "",
        dataType: "string",
        description: "",
        isEditable: true,
        requiresRestart: false,
        isSensitive: false,
        minimumValue: "",
        maximumValue: "",
        allowedValues: [],
        validationPattern: "",
        updatedAt: new Date().toISOString(),
    });

    const [newAllowedValue, setNewAllowedValue] = useState("");

    useEffect(() => {
        if (config) {
            setFormData({
                category: config.category || "",
                key: config.key || "",
                value: config.value ?? "",
                dataType: config.dataType || "string",
                description: config.description || "",
                isEditable: config.isEditable ?? true,
                requiresRestart: config.requiresRestart ?? false,
                isSensitive: config.isSensitive ?? false,
                minimumValue: config.minimumValue ?? "",
                maximumValue: config.maximumValue ?? "",
                allowedValues: Array.isArray(config.allowedValues)
                    ? config.allowedValues
                    : config.allowedValues
                        ? config.allowedValues.split(",").map((v) => v.trim())
                        : [],
                validationPattern: config.validationPattern || "",
            });
        }
    }, [config]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "dataType") {
            setFormData({
                ...formData,
                dataType: value,
                value: value === "boolean" ? "false" : "",
                allowedValues: [],
                validationPattern: value === "string" ? formData.validationPattern : "",
            });
            return;
        }
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleAddAllowedValue = () => {
        const trimmed = newAllowedValue.trim();
        if (!trimmed) return;

        if (formData.dataType === "number" && isNaN(trimmed)) {
            Swal.fire("Valor inválido", "Solo se permiten números.", "warning");
            return;
        }

        if (formData.allowedValues.includes(trimmed)) {
            Swal.fire("Duplicado", "El valor ya existe en la lista.", "info");
            return;
        }

        setFormData({
            ...formData,
            allowedValues: [...formData.allowedValues, trimmed],
        });
        setNewAllowedValue("");
    };

    const handleRemoveAllowedValue = (val) => {
        setFormData({
            ...formData,
            allowedValues: formData.allowedValues.filter((v) => v !== val),
        });
    };

    const validarCampos = () => {
        const { category, key, value, dataType, description, allowedValues, minimumValue, maximumValue, validationPattern } = formData;

        if (!category.trim() || !key.trim() || !description.trim()) {
            Swal.fire("Campo vacío", "Complete todos los campos obligatorios.", "warning");
            return false;
        }

        if (/\d/.test(category) || /\d/.test(key)) {
            Swal.fire("Valor inválido", "Categoría o clave no deben contener números.", "warning");
            return false;
        }

        if ((dataType === "number" || dataType === "boolean") && allowedValues.length === 0) {
            Swal.fire("Campo obligatorio", "Debe agregar al menos un valor permitido.", "warning");
            return false;
        }

        if (dataType === "string") {
            if (!validationPattern || !validationPattern.trim()) {
                Swal.fire("Campo obligatorio", "Debe ingresar un patrón de validación (regex).", "warning");
                return false;
            }
            if (allowedValues.length === 0) {
                Swal.fire("Campo obligatorio", "Debe agregar al menos un valor permitido.", "warning");
                return false;
            }
        }

        if (dataType === "number") {
            const min = minimumValue !== "" ? Number(minimumValue) : null;
            const max = maximumValue !== "" ? Number(maximumValue) : null;

            if (value === "" || isNaN(value)) {
                Swal.fire("Valor inválido", "Ingrese un número válido.", "warning");
                return false;
            }

            if (min !== null && max !== null && min > max) {
                Swal.fire("Rango inválido", "El valor mínimo no puede ser mayor que el máximo.", "warning");
                return false;
            }

            const numVal = Number(value);

            if (min !== null && numVal < min) {
                Swal.fire("Rango inválido", `El valor no puede ser menor que el mínimo (${min}).`, "warning");
                return false;
            }
            if (max !== null && numVal > max) {
                Swal.fire("Rango inválido", `El valor no puede ser mayor que el máximo (${max}).`, "warning");
                return false;
            }

            for (const val of allowedValues) {
                if (isNaN(val)) {
                    Swal.fire("Valor inválido", `El valor permitido "${val}" no es un número.`, "warning");
                    return false;
                }
                const numAllowed = Number(val);
                if (min !== null && numAllowed < min) {
                    Swal.fire("Rango inválido", `El valor permitido ${val} es menor que el mínimo (${min}).`, "warning");
                    return false;
                }
                if (max !== null && numAllowed > max) {
                    Swal.fire("Rango inválido", `El valor permitido ${val} es mayor que el máximo (${max}).`, "warning");
                    return false;
                }
            }
        }

        if (dataType === "string" && validationPattern) {
            let regex;
            try {
                regex = new RegExp(validationPattern);
            } catch {
                Swal.fire("Regex inválido", "El patrón ingresado no es válido.", "error");
                return false;
            }

            if (!regex.test(value)) {
                Swal.fire("No cumple con el patrón", "El valor no coincide con la expresión regular.", "warning");
                return false;
            }

            for (const val of allowedValues) {
                if (!regex.test(val)) {
                    Swal.fire("Valor inválido", `El valor permitido "${val}" no cumple el patrón definido.`, "warning");
                    return false;
                }
            }

        }

        if (allowedValues.length > 0 && !allowedValues.includes(value)) {
            Swal.fire(
                "Valor no permitido",
                `El valor actual "${value}" no está en la lista de valores permitidos.`,
                "warning"
            );
            return false;
        }


        return true;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarCampos()) return;

        const confirm = await Swal.fire({
            title: "¿Guardar cambios?",
            text: "Se actualizará la configuración seleccionada.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
        });

        if (!confirm.isConfirmed) return;

        try {
            const payload = {
                ...formData,
                municipalityId: "24ad12a5-d9e5-4cdd-91f1-8fd0155c9471",
                value:
                    formData.dataType === "number"
                        ? Number(formData.value)
                        : formData.dataType === "boolean"
                            ? formData.value === "true"
                            : formData.value,
                minimumValue: formData.dataType === "number" ? Number(formData.minimumValue) : null,
                maximumValue: formData.dataType === "number" ? Number(formData.maximumValue) : null,
                allowedValues:
                    formData.dataType === "number"
                        ? formData.allowedValues.map(Number)
                        : formData.allowedValues,
                updatedAt: new Date().toISOString(),
            };

            await updateSystemConfiguration(config.id, payload);
            Swal.fire("Actualizado", "La configuración fue modificada correctamente.", "success");
            onUpdated();
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo actualizar la configuración.", "error");
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
                    Editar Configuración
                </h3>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Categoría */}
                    <div>
                        <label className="block font-semibold mb-1 text-gray-700">Categoría</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>

                    {/* Clave */}
                    <div>
                        <label className="block font-semibold mb-1 text-gray-700">Clave</label>
                        <input
                            type="text"
                            name="key"
                            value={formData.key}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>

                    {/* Tipo de dato */}
                    <div>
                        <label className="block font-semibold mb-1 text-gray-700">Tipo de dato</label>
                        <select
                            name="dataType"
                            value={formData.dataType}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                        </select>
                    </div>

                    {/* Valor */}
                    <div>
                        <label className="block font-semibold mb-1 text-gray-700">Valor</label>
                        {formData.dataType === "boolean" ? (
                            <select
                                name="value"
                                value={formData.value}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        ) : (
                            <input
                                type={formData.dataType === "number" ? "number" : "text"}
                                name="value"
                                value={formData.value}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                        )}
                    </div>

                    {/* Rango para number */}
                    {formData.dataType === "number" && (
                        <>
                            <div>
                                <label className="block font-semibold mb-1 text-gray-700">Valor mínimo</label>
                                <input
                                    type="number"
                                    name="minimumValue"
                                    value={formData.minimumValue}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1 text-gray-700">Valor máximo</label>
                                <input
                                    type="number"
                                    name="maximumValue"
                                    value={formData.maximumValue}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                        </>
                    )}

                    {/* Patrón regex */}
                    {formData.dataType === "string" && (
                        <div className="col-span-2">
                            <label className="block font-semibold mb-1 text-gray-700">
                                Patrón de validación (regex)
                            </label>
                            <input
                                type="text"
                                name="validationPattern"
                                value={formData.validationPattern}
                                onChange={handleChange}
                                placeholder="Ejemplo: ^[a-zA-Z]+$"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                        </div>
                    )}

                    {/* Valores permitidos */}
                    <div className="col-span-2">
                        <label className="block font-semibold mb-1 text-gray-700">Valores permitidos</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.allowedValues.map((val) => (
                                <span
                                    key={val}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                                >
                                    {val}
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
                            <input
                                type="text"
                                value={newAllowedValue}
                                onChange={(e) => setNewAllowedValue(e.target.value)}
                                placeholder="Agregar valor"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAllowedValue())}
                            />
                            <button
                                type="button"
                                onClick={handleAddAllowedValue}
                                disabled={!newAllowedValue.trim()}
                                className={`px-3 py-2 rounded-md transition ${newAllowedValue.trim()
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Añadir
                            </button>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="col-span-2">
                        <label className="block font-semibold mb-1 text-gray-700">Descripción</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            rows={2}
                        />
                    </div>

                    {/* Checkboxes */}
                    <div className="col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
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
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SystemConfigurationEditModal;