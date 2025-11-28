import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createPosition, updatePosition } from "../../services/positionApi";


const PositionForm = ({ position, positions = [], onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    positionCode: "",
    name: "",
    description: "",
    hierarchicalLevel: 1,
    baseSalary: 0,
    municipalityId: "",
    active: true,
  });


  const [errors, setErrors] = useState({});


  // ✅ Cargar datos si se está editando
  useEffect(() => {
    if (position) {
      setFormData({
        positionCode: position.positionCode || "",
        name: position.name || "",
        description: position.description || "",
        hierarchicalLevel: position.hierarchicalLevel || 1,
        baseSalary: position.baseSalary || 0,
        municipalityId: position.municipalityId || "",
        active: position.active ?? true,
      });
    } else {
      // Si es nuevo, limpiar el formulario
      setFormData({
        positionCode: "",
        name: "",
        description: "",
        hierarchicalLevel: 1,
        baseSalary: 0,
        municipalityId: "",
        active: true,
      });
    }
  }, [position]);


  // ✅ Manejo de cambio de valores
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = type === "number" ? (value === "" ? "" : Number(value)) : value.trimStart();
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    validateField(name, newValue);
  };


  // ✅ Validación campo por campo
  const validateField = (name, value) => {
    let newErrors = { ...errors };
    const hasSpaces = /\s/.test(value);


    switch (name) {
      case "positionCode":
        if (!value.trim()) newErrors.positionCode = "El código del cargo es obligatorio.";
        else if (hasSpaces) newErrors.positionCode = "El código del cargo no debe contener espacios.";
        else if (value.length < 4) newErrors.positionCode = "Debe tener al menos 4 caracteres.";
        else if (
          positions.some(
            (p) =>
              p.positionCode?.toLowerCase() === value.toLowerCase() &&
              p.id !== position?.id
          )
        )
          newErrors.positionCode = "⚠️ Ya existe un cargo con este código.";
        else delete newErrors.positionCode;
        break;


      case "municipalityId":
        if (!value.trim()) newErrors.municipalityId = "El código del municipio es obligatorio.";
        else if (hasSpaces) newErrors.municipalityId = "El código del municipio no debe contener espacios.";
        else if (value.length < 5) newErrors.municipalityId = "Debe tener al menos 5 caracteres.";
        else if (
          positions.some(
            (p) =>
              p.municipalityId?.toLowerCase() === value.toLowerCase() &&
              p.id !== position?.id
          )
        )
          newErrors.municipalityId = "⚠️ Ya existe un cargo con este municipio.";
        else delete newErrors.municipalityId;
        break;


      case "name":
        if (!value.trim()) newErrors.name = "El nombre es obligatorio.";
        else if (value.length < 5) newErrors.name = "Debe tener al menos 5 caracteres.";
        else delete newErrors.name;
        break;


      case "description":
        if (!value.trim()) newErrors.description = "La descripción es obligatoria.";
        else if (value.length < 5) newErrors.description = "Debe tener al menos 5 caracteres.";
        else delete newErrors.description;
        break;


      case "hierarchicalLevel":
        if (!value || Number(value) < 1)
          newErrors.hierarchicalLevel = "El nivel jerárquico debe ser 1 o mayor.";
        else delete newErrors.hierarchicalLevel;
        break;


      case "baseSalary":
        if (!value || Number(value) < 1)
          newErrors.baseSalary = "El salario base debe ser 1 o mayor.";
        else delete newErrors.baseSalary;
        break;


      default:
        break;
    }


    setErrors(newErrors);
  };


  // ✅ Validación completa antes de enviar
  const validateAll = () => {
    let newErrors = {};
    Object.entries(formData).forEach(([field, value]) => {
      if (value === "" || value === null || value === undefined)
        newErrors[field] = "Campo obligatorio.";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // ✅ Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();


    const isValid = validateAll();
    if (!isValid) {
      Swal.fire({
        icon: "error",
        title: "Errores en el formulario",
        text: "Corrige los campos en rojo antes de continuar.",
      });
      return;
    }


    try {
      if (position?.id) {
        await updatePosition(position.id, formData);
        Swal.fire("Actualizado", "El cargo fue actualizado correctamente.", "success");
      } else {
        await createPosition({ ...formData, active: true });
        Swal.fire("Creado", "El cargo fue creado correctamente.", "success");
        // Solo limpiar después de crear
        setFormData({
          positionCode: "",
          name: "",
          description: "",
          hierarchicalLevel: 1,
          baseSalary: 0,
          municipalityId: "",
          active: true,
        });
      }


      onSuccess();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar el cargo.", "error");
      console.error("Error saving position:", error);
    }
  };


  return (
    <div
      className="fixed inset-0 flex justify-center items-start pt-10 z-50 pointer-events-none"
      style={{ background: "transparent" }}
    >
      <div className="pointer-events-auto bg-white border border-gray-200 rounded-xl shadow-lg w-[90%] max-w-2xl p-8 animate-modal-fade">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center border-b border-gray-200 pb-3">
          {position ? "✏️ Editar Cargo" : "➕ Agregar Nuevo Cargo"}
        </h3>


        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
        >
          <Input
            label="Código del Cargo"
            name="positionCode"
            value={formData.positionCode}
            onChange={handleChange}
            required
            error={errors.positionCode}
            disabled={!!position}
          />


          <Input
            label="Código de Municipio"
            name="municipalityId"
            value={formData.municipalityId}
            onChange={handleChange}
            required
            error={errors.municipalityId}
            disabled={!!position}
          />


          <Input
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            error={errors.name}
          />


          <Input
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={handleChange}
            textarea
            error={errors.description}
          />


          <Input
            label="Nivel Jerárquico"
            name="hierarchicalLevel"
            type="number"
            value={formData.hierarchicalLevel}
            onChange={handleChange}
            min={1}
            error={errors.hierarchicalLevel}
          />


          <Input
            label="Salario Base (S/.)"
            name="baseSalary"
            type="number"
            step="0.01"
            value={formData.baseSalary}
            onChange={handleChange}
            min={1}
            error={errors.baseSalary}
          />


          <div className="flex justify-end md:col-span-2 mt-5 space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-all"
            >
              {position ? "Actualizar Cargo" : "Crear Cargo"}
            </button>
          </div>
        </form>
      </div>


      <style>
        {`
          @keyframes modalFade {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-modal-fade {
            animation: modalFade 0.2s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};


// ✅ Input reutilizable
const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  textarea = false,
  error,
  disabled = false,
  ...rest
}) => (
  <div className={`flex flex-col ${textarea ? "md:col-span-2" : ""}`}>
    <label
      className={`text-sm font-semibold mb-1 ${
        error ? "text-red-600" : "text-gray-700"
      }`}
    >
      {label} <span className="text-red-500">*</span>
    </label>


    {textarea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        disabled={disabled}
        className={`border rounded-lg p-2.5 resize-none text-gray-800 focus:outline-none transition-all ${
          error
            ? "border-red-500 focus:ring-red-500 bg-red-50"
            : "border-gray-300 focus:ring-blue-500"
        }`}
        {...rest}
      />
    ) : (
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        disabled={disabled}
        className={`border rounded-lg p-2.5 text-gray-800 focus:outline-none transition-all ${
          error
            ? "border-red-500 focus:ring-red-500 bg-red-50"
            : "border-gray-300 focus:ring-blue-500"
        }`}
        {...rest}
      />
    )}


    {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
  </div>
);


export default PositionForm;


