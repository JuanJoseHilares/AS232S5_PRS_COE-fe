import { useEffect, useState } from "react";
import { getAllAreas, createArea, updateArea, deleteArea, restoreArea } from "../../services/areasApi";
import { FaLayerGroup, FaCheckCircle, FaBan, FaEdit, FaTrash, FaUndo, FaHashtag, FaSignature, FaListAlt, FaMapMarkerAlt, FaPhone, FaEnvelope, FaMoneyBillWave, FaCheckSquare, FaTimes, FaAlignLeft, FaEye } from "react-icons/fa";
import Swal from "sweetalert2";

export default function AreasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [nextCode, setNextCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentArea, setCurrentArea] = useState(null);
  const [viewArea, setViewArea] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // State for create area form
  const [createForm, setCreateForm] = useState({
    municipalityId: '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
    areaCode: '',
    name: '',
    description: '',
    hierarchicalLevel: '', // Iniciar vacío para forzar la selección
    physicalLocation: '',
    phone: '',
    email: '',
    annualBudget: '',
    _rawBudget: 0, // Para guardar el valor numérico sin formatear
    active: true,
    createdBy: '3bddf19a-2d5a-4ee7-8be4-63494fb411b8',
    responsibleId: null,
    parentAreaId: null
  });
  
  const [createErrors, setCreateErrors] = useState({});

  const formatCurrency = (value) => {
    if (!value) return '';
    // Convertir a número, manejar valores no numéricos
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0;
    // Formatear a moneda peruana
    return new Intl.NumberFormat('es-PE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Convertir de formato de moneda a número
  const parseCurrency = (value) => {
    if (!value) return 0;
    // Remover todo excepto números y punto decimal
    const numericValue = value.toString().replace(/[^0-9.]/g, '');
    // Asegurar formato numérico válido
    return parseFloat(numericValue) || 0;
  };

  const handleCreateInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'annualBudget') {
      // Solo permitir números, punto decimal y teclas de control
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Asegurar que solo haya un punto decimal
      const parts = numericValue.split('.');
      const formattedValue = parts.length > 1 
        ? `${parts[0]}.${parts.slice(1).join('').replace(/\./g, '')}`
        : numericValue;
      
      // Limitar a 2 decimales
      const decimalParts = formattedValue.split('.');
      const finalValue = decimalParts.length > 1 
        ? `${decimalParts[0]}.${decimalParts[1].slice(0, 2)}`
        : formattedValue;
      
      setCreateForm(prev => ({
        ...prev,
        [name]: finalValue,
        _rawBudget: parseFloat(finalValue) || 0
      }));
    } else if (name === 'phone') {
      // Solo permitir números, espacios, paréntesis, guiones y signo +
      const phoneValue = value.replace(/[^0-9\s()+-]/g, '');
      // Limitar a 15 caracteres
      const limitedValue = phoneValue.slice(0, 15);
      setCreateForm(prev => ({ ...prev, [name]: limitedValue }));
    } else if (type === 'checkbox') {
      setCreateForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setCreateForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpiar el error del campo cuando se empieza a editar
    if (createErrors[name]) {
      setCreateErrors(prev => {
        const newErrors = { ...prev };
        newErrors[name] = undefined;
        return newErrors;
      });
    }
  };

  const handleUpdateInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Limpiar el error del campo cuando el usuario comienza a escribir
    if (createErrors[name]) {
      setCreateErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    if (type === 'checkbox') {
      setCreateForm(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'phone') {
      // Validación en tiempo real para teléfono
      const phoneValue = value.replace(/[^0-9\s\-()]/g, '');
      setCreateForm(prev => ({
        ...prev,
        [name]: phoneValue
      }));
    } else if (name === 'annualBudget') {
      // Formatear moneda en tiempo real
      const numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      
      // Asegurarse de que solo haya un punto decimal
      if (parts.length > 2) return;
      
      // Limitar a 2 decimales
      if (parts[1] && parts[1].length > 2) return;
      
      setCreateForm(prev => ({
        ...prev,
        [name]: value === '' ? '' : numericValue
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!createForm.areaCode?.trim()) errors.areaCode = 'El código es requerido';
    if (!createForm.name?.trim()) errors.name = 'El nombre es requerido';
    if (!createForm.email?.trim()) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = 'Ingrese un correo electrónico válido';
    }
    if (!createForm.hierarchicalLevel || createForm.hierarchicalLevel === '') {
      errors.hierarchicalLevel = 'Debe seleccionar un nivel jerárquico';
    }
    
    if (!createForm.physicalLocation?.trim()) errors.physicalLocation = 'La ubicación es requerida';
    if (!createForm.phone?.trim()) errors.phone = 'El teléfono es requerido';
    
    // Validar presupuesto
    const budgetValue = parseCurrency(createForm.annualBudget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      errors.annualBudget = 'Ingrese un monto válido mayor a 0';
    }
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateUpdateForm = () => {
    const errors = {};
    
    // Validar nombre (requerido, mínimo 3 caracteres)
    if (!createForm.name || !createForm.name.trim()) {
      errors.name = 'El nombre del área es requerido';
    } else if (createForm.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (createForm.name.trim().length > 100) {
      errors.name = 'El nombre no puede tener más de 100 caracteres';
    }
    
    // Validar nivel jerárquico (requerido)
    if (!createForm.hierarchicalLevel) {
      errors.hierarchicalLevel = 'Seleccione un nivel jerárquico';
    }
    
    // Validar ubicación física (requerida, máximo 200 caracteres)
    if (!createForm.physicalLocation || !createForm.physicalLocation.trim()) {
      errors.physicalLocation = 'La ubicación física es requerida';
    } else if (createForm.physicalLocation.trim().length > 200) {
      errors.physicalLocation = 'La ubicación no puede tener más de 200 caracteres';
    }
    
    // Validar teléfono (formato flexible)
    if (!createForm.phone || !createForm.phone.trim()) {
      errors.phone = 'El teléfono es requerido';
    } else {
      // Acepta números, espacios, guiones, paréntesis y signo +
      const phoneRegex = /^[+]?[0-9\s\-()]+$/;
      const phoneDigits = createForm.phone.replace(/[^0-9+]/g, '');
      
      if (!phoneRegex.test(createForm.phone)) {
        errors.phone = 'Formato de teléfono no válido. Use números, espacios, guiones y paréntesis';
      } else if (phoneDigits.length < 7 || phoneDigits.length > 20) {
        errors.phone = 'El teléfono debe tener entre 7 y 20 dígitos';
      }
    }
    
    // Validar correo electrónico (formato estándar)
    if (!createForm.email || !createForm.email.trim()) {
      errors.email = 'El correo electrónico es requerido';
    } else {
      // Mejor expresión regular para validar emails
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(createForm.email)) {
        errors.email = 'Ingrese un correo electrónico válido (ejemplo: usuario@dominio.com)';
      } else if (createForm.email.length > 100) {
        errors.email = 'El correo no puede tener más de 100 caracteres';
      }
    }
    
    // Validar presupuesto anual (opcional, pero debe ser positivo)
    if (createForm.annualBudget && createForm.annualBudget.trim() !== '') {
      const budgetValue = parseFloat(createForm.annualBudget.replace(/[^0-9.]/g, ''));
      if (isNaN(budgetValue) || budgetValue < 0) {
        errors.annualBudget = 'Ingrese un monto válido (ejemplo: 1000.50)';
      } else if (budgetValue > 1000000000) { // 1 billón como límite superior
        errors.annualBudget = 'El monto no puede ser mayor a 1,000,000,000';
      }
    }
    
    // Validar descripción (opcional, máximo 500 caracteres)
    if (createForm.description && createForm.description.trim().length > 500) {
      errors.description = 'La descripción no puede tener más de 500 caracteres';
    }
    
    return errors;
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const errors = validateUpdateForm();
    
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      
      // Desplazarse al primer campo con error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        name: createForm.name.trim(),
        description: createForm.description?.trim() || '',
        phone: createForm.phone.replace(/[^0-9]/g, ''),
        email: createForm.email.trim().toLowerCase(),
        annualBudget: parseCurrency(createForm.annualBudget) || 0,
        active: createForm.active,
        hierarchicalLevel: parseInt(createForm.hierarchicalLevel),
        parentAreaId: createForm.hierarchicalLevel === '2' ? 'a1d4e22b-9b2f-43a3-923d-154bc3ef4a0c' : null,
        responsibleId: createForm.responsibleId
      };

      const updatedArea = await updateArea(currentArea.id, payload);
      
      // Update the item in place to maintain order
      setItems(prevItems => {
        const index = prevItems.findIndex(item => item.id === currentArea.id);
        if (index !== -1) {
          const newItems = [...prevItems];
          newItems[index] = { ...newItems[index], ...updatedArea };
          return newItems;
        }
        return prevItems;
      });
      
      setIsUpdateOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'El área se ha actualizado correctamente',
        showConfirmButton: false,
        timer: 2000
      });
      
    } catch (error) {
      console.error('Error al actualizar el área:', error);
      
      let errorMessage = 'Ocurrió un error al actualizar el área';
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage = 'No se encontró el área a actualizar';
        } else if (error.response.status === 400) {
          errorMessage = 'Datos de entrada inválidos. Verifique que los datos ingresados sean correctos.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Error en el servidor al intentar actualizar el área. Por favor, intente nuevamente más tarde.';
        }
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor');
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'Entendido'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errors = validateCreateForm();
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        municipalityId: '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
        areaCode: createForm.areaCode.trim().toUpperCase(),
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        hierarchicalLevel: parseInt(createForm.hierarchicalLevel),
        physicalLocation: createForm.physicalLocation.trim(),
        phone: createForm.phone.replace(/[^0-9]/g, ''),
        email: createForm.email.trim().toLowerCase(),
        annualBudget: parseCurrency(createForm.annualBudget) || 0,
        active: true,
        createdBy: '3bddf19a-2d5a-4ee7-8be4-63494fb411b8',
        responsibleId: createForm.responsibleId,
        parentAreaId: createForm.hierarchicalLevel === '2' ? 'a1d4e22b-9b2f-43a3-923d-154bc3ef4a0c' : null
      };

      const newArea = await createArea(payload);
      
      // Add the new area to the end of the list
      setItems(prevItems => [...prevItems, newArea]);
      
      setIsCreateOpen(false);
      setCreateForm({
        municipalityId: '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
        areaCode: '',
        name: '',
        description: '',
        hierarchicalLevel: '',
        physicalLocation: '',
        phone: '',
        email: '',
        annualBudget: '',
        _rawBudget: 0,
        active: true,
        createdBy: '3bddf19a-2d5a-4ee7-8be4-63494fb411b8',
        responsibleId: null,
        parentAreaId: null
      });
      
      Swal.fire({
        title: '¡Éxito!',
        text: 'Área creada correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      
    } catch (error) {
      console.error('Error al guardar el área:', error);
      
      let errorMessage = 'Ocurrió un error al guardar el área';
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.data && error.response.data.errors) {
          const validationErrors = {};
          Object.entries(error.response.data.errors).forEach(([field, messages]) => {
            validationErrors[field] = Array.isArray(messages) ? messages[0] : messages;
          });
          setCreateErrors(validationErrors);
          return;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Error del servidor: ${error.response.status}`;
        }
      } else if (error.request) {
        console.error('Error request:', error.request);
        errorMessage = 'No se recibió respuesta del servidor';
      } else {
        console.error('Error message:', error.message);
        errorMessage = `Error al configurar la petición: ${error.message}`;
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  const onRestore = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Restaurar área?",
      text: row.name || row.code || "",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    await restoreArea(row.id);
    setFilter("activos");
    await load();
    await Swal.fire({ icon: "success", title: "Área restaurada", toast: true, timer: 2000, position: "top-end", showConfirmButton: false });
  };

  const generateNextCode = () => {
    // Busca códigos como AR001, AR002... y genera el siguiente.
    const prefix = "AR";
    const nums = items
      .map((x) => (typeof x.code === "string" ? x.code : ""))
      .map((c) => {
        const m = c.match(/^([A-Za-z]{2})(\d{1,})$/);
        if (!m) return null;
        return m[1].toUpperCase() === prefix ? parseInt(m[2], 10) : null;
      })
      .filter((n) => typeof n === "number");
    const next = (nums.length ? Math.max(...nums) + 1 : 1).toString().padStart(3, "0");
    return `${prefix}${next}`;
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllAreas();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Error cargando áreas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateArea(editing.id ?? editing, form);
      } else {
        await createArea(form);
      }
      setForm({ name: "", code: "", description: "" });
      setEditing(null);
      await load();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Error al guardar el área');
    }
  };

  const onDelete = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Inactivar área?",
      text: row.name || row.code || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, inactivar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    await deleteArea(row.id);
    setFilter("inactivos");
    await load();
    await Swal.fire({ icon: "success", title: "Área inactivada", toast: true, timer: 2000, position: "top-end", showConfirmButton: false });
  };

  const onEdit = (row) => {
    setCurrentArea(row);
    setCreateForm(prev => ({
      ...prev,
      name: row.name || "",
      description: row.description || "",
      areaCode: row.areaCode || "",
      hierarchicalLevel: String(row.hierarchicalLevel) || "1",
      physicalLocation: row.physicalLocation || "",
      phone: row.phone || "",
      email: row.email || "",
      annualBudget: row.annualBudget ? formatCurrency(row.annualBudget) : "",
      _rawBudget: row.annualBudget || 0,
      active: row.active !== false,
      parentAreaId: row.parentAreaId || null,
      responsibleId: row.responsibleId || null
    }));
    setIsUpdateOpen(true);
  };

  const filtered = items.filter((x) => {
    const matchesSearch = 
      (x.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (x.areaCode || "").toLowerCase().includes(search.toLowerCase());
    
    if (filter === "todos") return matchesSearch;
    if (filter === "activos") return matchesSearch && (x.active === true);
    return matchesSearch && (x.active === false);
  });

  // Ordenar por código ascendente (compara parte numérica si existe)
  const filteredSorted = [...filtered].sort((a, b) => {
    const ac = String(a.code || "");
    const bc = String(b.code || "");
    const anum = parseInt((ac.match(/\d+/) || ["999999"]) [0], 10);
    const bnum = parseInt((bc.match(/\d+/) || ["999999"]) [0], 10);
    if (!isNaN(anum) && !isNaN(bnum) && anum !== bnum) return anum - bnum;
    // fallback al orden lexicográfico si no hay números o son iguales
    return ac.localeCompare(bc, undefined, { numeric: true, sensitivity: "base" });
  });

  const total = items.length;
  const totalActivas = items.filter((x) => (x.active ?? x.activo ?? false)).length;
  const totalInactivas = total - totalActivas;

  return (
    <div className="p-8 bg-gray-50 rounded-2xl shadow-md border border-gray-200 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Gestión de Areas</h1>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex items-center justify-between bg-blue-100 border-l-4 border-blue-600 rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm text-blue-600 font-semibold uppercase">Total</h2>
            <p className="text-3xl font-bold text-blue-800 mt-1">{total}</p>
          </div>
          <div className="text-blue-600 text-4xl"><FaLayerGroup /></div>
        </div>

        <div className="flex items-center justify-between bg-green-100 border-l-4 border-green-600 rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm text-green-600 font-semibold uppercase">Activas</h2>
            <p className="text-3xl font-bold text-green-800 mt-1">{totalActivas}</p>
          </div>
          <div className="text-green-600 text-4xl"><FaCheckCircle /></div>
        </div>

        <div className="flex items-center justify-between bg-amber-100 border-l-4 border-amber-600 rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm text-amber-600 font-semibold uppercase">Inactivas</h2>
            <p className="text-3xl font-bold text-amber-800 mt-1">{totalInactivas}</p>
          </div>
          <div className="text-amber-600 text-4xl"><FaBan /></div>
        </div>
      </div>

      {/* Filtros y botón Crear */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
          </div>
          <select
            value={filter}
            onChange={(e)=>setFilter(e.target.value)}
            className="w-full sm:w-56 border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas</option>
            <option value="activos">Activas</option>
            <option value="inactivos">Inactivas</option>
          </select>
        </div>
        <button
          type="button"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          onClick={() => { setCreateForm({ name: "", code: "", description: "", responsible: "", employeeCount: "", phone: "", email: "", annualBudget: "", budgetCenterCode: "", mission: "", vision: "", objectives: "", physicalLocationCode: "", physicalLocationName: "" }); setNextCode(generateNextCode()); setIsCreateOpen(true); }}
        >
          Crear Área
        </button>
      </div>

      {isUpdateOpen && currentArea && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
            <div className="bg-yellow-500 text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Actualizar Área: {currentArea?.name}</h2>
              <button 
                onClick={() => setIsUpdateOpen(false)} 
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Código del Área */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código del Área <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaHashtag className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="areaCode"
                      value={createForm.areaCode}
                      readOnly
                      className="pl-10 block w-full rounded-md border border-gray-300 bg-gray-100 cursor-not-allowed sm:text-sm"
                      placeholder="Ej: GGF"
                    />
                  </div>
                  {createErrors.areaCode && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.areaCode}</p>
                  )}
                </div>

                {/* Nombre del Área */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Área <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSignature className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={createForm.name}
                      readOnly
                      className="pl-10 block w-full rounded-md border border-gray-300 bg-gray-100 cursor-not-allowed sm:text-sm"
                      placeholder="Nombre del área"
                    />
                  </div>
                  {createErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.name}</p>
                  )}
                </div>

                {/* Nivel Jerárquico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel Jerárquico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaListAlt className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      name="hierarchicalLevel"
                      value={createForm.hierarchicalLevel}
                      onChange={handleUpdateInputChange}
                      className={`pl-10 block w-full rounded-md border ${createErrors.hierarchicalLevel ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    >
                      <option value="">Seleccione el Nivel jerárquico</option>
                      <option value="1">Nivel 1: Gerencia</option>
                      <option value="2">Nivel 2: Subgerencia</option>
                    </select>
                  </div>
                  {createErrors.hierarchicalLevel && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.hierarchicalLevel}</p>
                  )}
                </div>

                {/* Ubicación Física */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación Física <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="physicalLocation"
                      value={createForm.physicalLocation}
                      readOnly
                      className="pl-10 block w-full rounded-md border border-gray-300 bg-gray-100 cursor-not-allowed sm:text-sm"
                      placeholder="Ej: Piso 2, Oficina 201"
                    />
                  </div>
                  {createErrors.physicalLocation && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.physicalLocation}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      value={createForm.phone}
                      onChange={handleUpdateInputChange}
                      className={`pl-10 block w-full rounded-md border ${createErrors.phone ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="Ej: (01) 445-6600"
                    />
                  </div>
                  {createErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.phone}</p>
                  )}
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={createForm.email}
                      onChange={handleUpdateInputChange}
                      className={`pl-10 block w-full rounded-md border ${createErrors.email ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="ejemplo@munisur.gob.pe"
                    />
                  </div>
                  {createErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.email}</p>
                  )}
                </div>

                {/* Presupuesto Anual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Presupuesto Anual (S/.) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMoneyBillWave className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="annualBudget"
                      value={createForm.annualBudget}
                      onChange={handleUpdateInputChange}
                      className={`pl-10 block w-full rounded-md border ${createErrors.annualBudget ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="Ej: 260,000.00"
                    />
                  </div>
                  {createErrors.annualBudget && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.annualBudget}</p>
                  )}
                </div>

                {/* Estado */}
                <div className="flex items-center">
                  <div className="flex items-center h-5">
                    <input
                      id="active"
                      name="active"
                      type="checkbox"
                      checked={createForm.active}
                      onChange={handleUpdateInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="active" className="font-medium text-gray-700">
                      Activo
                    </label>
                  </div>
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3">
                      <FaAlignLeft className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      name="description"
                      rows={3}
                      value={createForm.description}
                      onChange={handleUpdateInputChange}
                      className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Descripción detallada del área..."
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsUpdateOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Área'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulario de creación */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Crear Nueva Área</h2>
              <button
                className="text-white text-2xl leading-none hover:text-gray-200"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-3 text-sm">
                {/* Código */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaHashtag className="inline mr-2 text-blue-500" />
                    Código <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaHashtag className="text-gray-400 text-sm" />
                    </div>
                    <input
                      type="text"
                      name="areaCode"
                      value={createForm.areaCode}
                      onChange={handleCreateInputChange}
                      className={`pl-8 w-full p-1.5 text-sm border rounded ${createErrors.areaCode ? 'border-red-500' : 'border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="Ej: DGA-PAT-02"
                    />
                  </div>
                  {createErrors.areaCode && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaBan className="mr-1" /> {createErrors.areaCode}
                    </p>
                  )}
                </div>


                {/* Nombre */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaSignature className="inline mr-2 text-blue-500" />
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSignature className="text-gray-400 text-sm" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={createForm.name}
                      onChange={handleCreateInputChange}
                      className={`pl-8 w-full p-1.5 text-sm border rounded ${createErrors.name ? 'border-red-500' : 'border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="Nombre del área"
                    />
                  </div>
                  {createErrors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaBan className="mr-1" /> {createErrors.name}
                    </p>
                  )}
                </div>

                {/* Nivel Jerárquico */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaListAlt className="inline mr-2 text-blue-500" />
                    Nivel Jerárquico <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaListAlt className="text-gray-400 text-sm" />
                      </div>
                      <select
                        name="hierarchicalLevel"
                        value={createForm.hierarchicalLevel}
                        onChange={handleCreateInputChange}
                        className={`pl-8 w-full p-1.5 text-sm border rounded appearance-none bg-white ${!createForm.hierarchicalLevel || createForm.hierarchicalLevel === '' ? 'text-gray-400' : 'text-gray-900'} ${createErrors.hierarchicalLevel ? 'border-red-500' : 'border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
                      >
                        <option value="" disabled selected>Seleccione el Nivel jerárquico</option>
                        <option value="1" className="text-gray-900">Nivel 1: Gerencia</option>
                        <option value="2" className="text-gray-900">Nivel 2: Subgerencia</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Simple hierarchical level selection */}
                    {createForm.hierarchicalLevel == 2 && (
                      <div className="text-xs text-gray-600 mt-1 pl-1">
                        Esta área será una Subgerencia.
                      </div>
                    )}
                    
                    {createErrors.hierarchicalLevel && (
                      <p className="text-sm text-red-600 flex items-center mt-1 pl-1">
                        <FaBan className="mr-1" /> {createErrors.hierarchicalLevel}
                      </p>
                    )}
                  </div>
                  {createErrors.hierarchicalLevel && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaBan className="mr-1" /> {createErrors.hierarchicalLevel}
                    </p>
                  )}
                </div>

                {/* Ubicación Física */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaMapMarkerAlt className="inline mr-2 text-blue-500" />
                    Ubicación Física <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="text-gray-400 text-sm" />
                    </div>
                    <input
                      type="text"
                      name="physicalLocation"
                      value={createForm.physicalLocation}
                      onChange={handleCreateInputChange}
                      className={`pl-8 w-full p-1.5 text-sm border rounded ${createErrors.physicalLocation ? 'border-red-500' : 'border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="Ubicación física del área"
                    />
                  </div>
                  {createErrors.physicalLocation && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaBan className="mr-1" /> {createErrors.physicalLocation}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaPhone className="inline mr-2 text-blue-500" />
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400 text-sm" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={createForm.phone}
                      onChange={handleCreateInputChange}
                      className={`pl-8 w-full p-1.5 text-sm border rounded ${createErrors.phone ? 'border-red-500' : 'border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="Ej: (01) 234-5678"
                    />
                  </div>
                  {createErrors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaBan className="mr-1" /> {createErrors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaEnvelope className="inline mr-2 text-blue-500" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400 text-sm" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={createForm.email}
                      onChange={handleCreateInputChange}
                      className={`pl-8 w-full p-1.5 text-sm border rounded ${createErrors.email ? 'border-red-500' : 'border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  {createErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaBan className="mr-1" /> {createErrors.email}
                    </p>
                  )}
                </div>

                {/* Presupuesto Anual */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaMoneyBillWave className="inline mr-2 text-blue-500" />
                    Presupuesto Anual (S/.) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMoneyBillWave className="text-gray-400 text-sm" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                      <input
                        type="text"
                        name="annualBudget"
                        value={createForm.annualBudget}
                        onChange={handleCreateInputChange}
                        onBlur={(e) => {
                          const value = parseCurrency(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            setCreateForm(prev => ({
                              ...prev,
                              annualBudget: formatCurrency(value),
                              _rawBudget: value
                            }));
                          }
                        }}
                        className={`pl-8 w-full p-1.5 text-sm border rounded ${createErrors.annualBudget ? 'border-red-500' : 'border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {createErrors.annualBudget && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaBan className="mr-1" /> {createErrors.annualBudget}
                    </p>
                  )}
                </div>

                {/* Estado */}
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      name="active"
                      checked={createForm.active}
                      onChange={handleCreateInputChange}
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-xs font-medium text-gray-700 flex items-center">
                      <FaCheckSquare className="mr-1 text-blue-500 text-xs" />
                      Área Activa
                    </label>
                  </div>
                </div>


                {/* ID del Municipio (hidden) */}
                <input type="hidden" name="municipalityId" value={createForm.municipalityId} />
                
                {/* ID del Creador (hidden) */}
                <input type="hidden" name="createdBy" value={createForm.createdBy} />

                {/* Descripción */}
                <div className="space-y-0.5">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    <FaListAlt className="inline mr-1 text-blue-500 text-xs" />
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={createForm.description}
                    onChange={handleCreateInputChange}
                    rows="3"
                    className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción detallada del área"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end space-x-2 border-t pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
                  disabled={loading}
                >
                  <FaBan className="inline mr-1 text-xs" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200 flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : (
                    <>
                      <FaCheckCircle className="inline mr-1 text-xs" />
                      Guardar Área
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}



      <div className="bg-white rounded-xl border overflow-x-auto">
        {loading ? (
          <div className="p-6">Cargando...</div>
        ) : (
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
              <tr>
                <th className="text-left p-3 font-semibold">Código</th>
                <th className="text-left p-3 font-semibold">Nombre</th>
                <th className="text-left p-3 font-semibold">Descripción</th>
                <th className="text-left p-3 font-semibold">Nivel Jerárquico</th>
                <th className="text-left p-3 font-semibold">Ubicación Física</th>
                <th className="text-left p-3 font-semibold">Teléfono</th>
                <th className="text-left p-3 font-semibold">Email</th>
                <th className="text-left p-3 font-semibold">Presupuesto Anual</th>
                <th className="text-left p-3 font-semibold">Estado</th>
                <th className="text-center p-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((row) => (
                <tr key={row.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{row.areaCode || "-"}</td>
                  <td className="p-3 font-medium">{row.name || "-"}</td>
                  <td className="p-3">{row.description || "-"}</td>
                  <td className="p-3">{row.hierarchicalLevel || "-"}</td>
                  <td className="p-3">{row.physicalLocation || "-"}</td>
                  <td className="p-3">{row.phone || "-"}</td>
                  <td className="p-3">{row.email || "-"}</td>
                  <td className="p-3 whitespace-nowrap">
                    {row.annualBudget ? (
                      <>S/ {new Intl.NumberFormat('es-PE', {
                        style: 'decimal',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(row.annualBudget)}</>
                    ) : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      row.active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {row.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        className="text-purple-600 hover:text-purple-800 p-2 rounded hover:bg-purple-50 transition-colors"
                        title="Ver detalles"
                        aria-label="Ver detalles"
                        onClick={(e) => { e.stopPropagation(); setViewArea(row); setIsViewOpen(true); }}
                      >
                        <FaEye />
                      </button>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
                        title="Editar"
                        aria-label="Editar"
                        onClick={(e)=>{ e.stopPropagation(); onEdit(row); }}
                      >
                        <FaEdit />
                      </button>
                      {!row.active && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRestore(row); }} 
                          className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 transition-colors"
                          title="Restaurar"
                        >
                          <FaUndo />
                        </button>
                      )}
                      {row.active && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(row); }} 
                          className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors"
                          title="Inactivar"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSorted.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={11}>No se encontraron resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* View Area Details Modal */}
      {isViewOpen && viewArea && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border-2 border-indigo-100">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Detalles del Área</h2>
              <button 
                onClick={() => setIsViewOpen(false)}
                className="text-white hover:text-indigo-200 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <FaHashtag className="mr-2 text-indigo-500" />
                      Información Básica
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Código</p>
                        <p className="font-medium">{viewArea.areaCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nombre</p>
                        <p className="font-medium">{viewArea.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nivel Jerárquico</p>
                        <p className="font-medium">
                          {viewArea.hierarchicalLevel === 1 ? 'Nivel 1: Gerencia' : 'Nivel 2: Subgerencia'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estado</p>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${viewArea.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium">{viewArea.active ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-blue-500" />
                      Ubicación
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Ubicación Física</p>
                        <p className="font-medium">{viewArea.physicalLocation || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium">{viewArea.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Correo Electrónico</p>
                        <p className="font-medium">{viewArea.email || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <FaMoneyBillWave className="mr-2 text-green-500" />
                      Información Financiera
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Presupuesto Anual</p>
                        <p className="font-medium">
                          {viewArea.annualBudget ? 
                            `S/ ${parseFloat(viewArea.annualBudget).toLocaleString('es-PE', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}` 
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <FaAlignLeft className="mr-2 text-purple-500" />
                      Descripción
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {viewArea.description || 'No hay descripción disponible.'}
                    </p>
                  </div>

                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsViewOpen(false);
                    setTimeout(() => setViewArea(null), 300);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-md hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
