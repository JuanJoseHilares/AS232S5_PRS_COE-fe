import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import documentTypeService from "../../services/documentTypeService";
import personService from "../../services/personService";

export default function PersonModal({ isOpen, onClose, person, onSuccess }) {
  const [formData, setFormData] = useState({
    documentTypeId: "",
    documentNumber: "",
    personType: "N",
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    gender: "M",
    personalPhone: "",
    workPhone: "",
    personalEmail: "",
    address: "",
  });

  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDocumentTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (person) {
      let formattedBirthDate = "";
      if (person.birthDate) {
        try {
          let dateObj;
          if (Array.isArray(person.birthDate)) {
            const [year, month, day] = person.birthDate;
            dateObj = new Date(year, month - 1, day);
          } else {
            dateObj = new Date(person.birthDate);
          }
          if (!isNaN(dateObj.getTime())) {
            formattedBirthDate = dateObj.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn("Error al formatear fecha:", error);
        }
      }

      setFormData({
        documentTypeId: person.documentTypeId || "",
        documentNumber: person.documentNumber || "",
        personType: person.personType || "N",
        firstName: person.firstName || "",
        lastName: person.lastName || "",
        middleName: person.middleName || "",
        birthDate: formattedBirthDate,
        gender: person.gender || "M",
        personalPhone: person.personalPhone || "",
        workPhone: person.workPhone || "",
        personalEmail: person.personalEmail || "",
        address: person.address || "",
      });
    } else {
      setFormData({
        documentTypeId: "",
        documentNumber: "",
        personType: "N",
        firstName: "",
        lastName: "",
        middleName: "",
        birthDate: "",
        gender: "M",
        personalPhone: "",
        workPhone: "",
        personalEmail: "",
        address: "",
      });
    }
  }, [person, isOpen]);

  const loadDocumentTypes = async () => {
    try {
      const types = await documentTypeService.getActiveDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error('Error loading document types:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        documentTypeId: parseInt(formData.documentTypeId),
      };

      if (person) {
        await personService.updatePerson(person.id, dataToSend);
      } else {
        await personService.createPerson(dataToSend);
      }

      onSuccess();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar la persona",
        icon: "error",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-gray-100 animate-fadeInScale">
        {/* Header - Indigo */}
        <div className="px-8 py-6 border-b border-indigo-100 flex-shrink-0 flex justify-between items-center bg-indigo-600 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {person ? "Editar Persona" : "Nueva Persona"}
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                Completa los datos de la persona
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección: Documento de Identidad */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </span>
                Documento de Identidad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Tipo de Persona <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="personType"
                    value={formData.personType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="N">Persona Natural</option>
                    <option value="J">Persona Jurídica</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5 pl-1">Natural: Persona física, Jurídica: Empresa u organización</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="documentTypeId"
                    value={formData.documentTypeId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.code} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleChange}
                    placeholder="11 dígitos"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Fecha de Nacimiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Datos Personales */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                Datos Personales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Ej: Juan Carlos"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Ej: Pérez García"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Género <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Email Personal
                  </label>
                  <input
                    type="email"
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleChange}
                    placeholder="ejemplo@correo.com"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Teléfono Personal
                  </label>
                  <input
                    type="tel"
                    name="personalPhone"
                    value={formData.personalPhone}
                    onChange={handleChange}
                    placeholder="999 999 999"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Dirección
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Dirección completa..."
                    rows="2"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
              >
                {loading ? "Guardando..." : person ? "Actualizar Persona" : "Crear Persona"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
