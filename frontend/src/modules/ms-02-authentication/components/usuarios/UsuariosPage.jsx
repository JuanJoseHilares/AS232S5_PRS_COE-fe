import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import areaService from "../../services/areaService";
import personService from "../../services/personService";
import positionService from "../../services/positionService";
import userService from "../../services/userService";
import AssignmentsPage from "../assignments/AssignmentsPage";
import UserActionsMenu from "./UserActionsMenu";
import UserDetailModal from "./UserDetailModal";
import UserModal from "./UserModal";

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [persons, setPersons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ Datos de posiciones y áreas desde el servicio
  const [positions, setPositions] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    loadUsers();
    loadPositions();
    loadAreas();

    // Auto-refresh cada 60 segundos para actualizar estados de usuarios suspendidos/bloqueados
    const intervalId = setInterval(() => {
      loadUsers();
    }, 60000); // 60 segundos

    return () => clearInterval(intervalId);
  }, []);

  const loadPositions = async () => {
    try {
      const data = await positionService.getActivePositions();
      setPositions(data);
      console.log("✅ Posiciones cargadas:", data);
    } catch (error) {
      console.error("Error cargando posiciones:", error);
    }
  };

  const loadAreas = async () => {
    try {
      const data = await areaService.getActiveAreas();
      setAreas(data);
      console.log("✅ Áreas cargadas:", data);
    } catch (error) {
      console.error("Error cargando áreas:", error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Cargando usuarios...");

      // Cargar todos los usuarios
      const allUsersData = await userService.getAllUsers();
      console.log("✅ Todos los usuarios cargados:", allUsersData);

      // Cargar usuarios bloqueados
      let blockedUsersData = [];
      try {
        blockedUsersData = await userService.getBlockedUsers();
        console.log("✅ Usuarios bloqueados cargados:", blockedUsersData);
      } catch (err) {
        console.warn("⚠️ Error al cargar usuarios bloqueados:", err);
      }

      // Combinar usuarios: todos + bloqueados (evitando duplicados)
      const allUsers = Array.isArray(allUsersData) ? allUsersData : [];
      const blocked = Array.isArray(blockedUsersData) ? blockedUsersData : [];

      console.log("📋 Usuarios bloqueados del endpoint /blocked:", blocked.map(u => ({ id: u.id, username: u.username, status: u.status })));

      // Crear un mapa de IDs de usuarios bloqueados
      const blockedIds = new Set(blocked.map(u => u.id));

      // Marcar usuarios bloqueados en la lista general
      const combinedUsers = allUsers.map(user => {
        if (blockedIds.has(user.id)) {
          return { ...user, status: "BLOCKED" };
        }
        return user;
      });

      // Agregar usuarios bloqueados que no estén en la lista general
      blocked.forEach(blockedUser => {
        if (!combinedUsers.find(u => u.id === blockedUser.id)) {
          combinedUsers.push(blockedUser);
        }
      });

      console.log("📊 Usuarios combinados:", combinedUsers.length);
      console.log("🔒 Usuarios con status BLOCKED:", combinedUsers.filter(u => u.status === "BLOCKED").length);
      console.log("📋 Usuarios BLOCKED después de combinar:", combinedUsers.filter(u => u.status === "BLOCKED").map(u => ({ id: u.id, username: u.username })));

      setUsers(combinedUsers);

      // Cargar información de personas
      const personsData = await personService.getAllPersons();
      const personsMap = {};
      personsData.forEach((person) => {
        personsMap[person.id] = person;
      });
      setPersons(personsMap);
    } catch (err) {
      console.error("❌ Error al cargar usuarios:", err);
      setError(`Error al cargar los usuarios: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
      html: `
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p class="text-slate-600">Esta acción marcará al usuario como eliminado.<br/>Podrás restaurarlo después si es necesario.</p>
        </div>
      `,
      icon: null,
      showCancelButton: true,
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl shadow-2xl border border-slate-200",
        title: "text-2xl font-bold text-slate-900 mb-4",
        htmlContainer: "text-slate-600",
        confirmButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm btn-confirm-danger",
        cancelButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm",
      },
    });

    if (result.isConfirmed) {
      try {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const currentUserId = currentUser?.userId;

        if (!currentUserId) {
          console.warn("⚠️ No se pudo obtener el ID del usuario actual, continuando sin validación");
        }

        // Mostrar loading
        Swal.fire({
          title: "Eliminando...",
          html: `
            <div class="text-center py-4">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
              <p class="text-slate-600">Por favor espera un momento</p>
            </div>
          `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-2xl shadow-2xl",
          },
        });

        // ✅ ACTUALIZADO: No enviar currentUserId, se inyecta del JWT
        await userService.deleteUser(id);

        await Swal.fire({
          title: "¡Eliminado!",
          html: `
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-slate-600">El usuario ha sido eliminado correctamente</p>
            </div>
          `,
          icon: null,
          confirmButtonText: "Entendido",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-2xl shadow-2xl border border-slate-200",
            title: "text-2xl font-bold text-slate-900 mb-4",
            confirmButton: "btn-confirm-success",
          },
        });

        loadUsers();
      } catch (err) {
        Swal.fire({
          title: "Error al eliminar",
          html: `
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-slate-600">${err.message || "No se pudo eliminar el usuario"
            }</p>
            </div>
          `,
          icon: null,
          confirmButtonText: "Cerrar",
          customClass: {
            popup: "rounded-2xl shadow-2xl border border-slate-200",
            title: "text-2xl font-bold text-slate-900 mb-4",
            confirmButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm btn-confirm-danger",
          },
        });
        console.error(err);
      }
    }
  };

  const handleRestore = async (id) => {
    const result = await Swal.fire({
      title: "¿Restaurar usuario?",
      text: "El usuario volverá a estar activo en el sistema",
      icon: "question",
      showCancelButton: true,
      customClass: { confirmButton: 'btn-confirm-success' },
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        // ✅ No se necesita currentUserId, se inyecta automáticamente del JWT
        await userService.restoreUser(id);

        Swal.fire({
          title: "¡Restaurado!",
          text: "El usuario ha sido restaurado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        loadUsers();
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: `No se pudo restaurar el usuario: ${err.message}`,
          icon: "error",
          customClass: { confirmButton: 'btn-confirm-danger' },
        });
        console.error(err);
      }
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleEdit = (user) => {
    console.log("🔧 handleEdit llamado con usuario:", user);
    console.log("🔧 Datos del usuario a editar:", {
      id: user.id,
      username: user.username,
      personId: user.personId,
      status: user.status
    });

    // Primero establecer el usuario y el modo de edición
    setSelectedUser(user);
    setIsEditing(true);

    // Usar setTimeout para asegurar que los estados se actualicen antes de abrir el modal
    setTimeout(() => {
      setIsFormModalOpen(true);
      console.log("🔧 Modal abierto en modo edición");
    }, 10);
  };

  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const closeFormModal = () => {
    console.log("🔒 Cerrando modal de formulario");
    setIsFormModalOpen(false);
    setSelectedUser(null);
    setIsEditing(false);
    console.log("🔒 Estados limpiados - isEditing: false, selectedUser: null");
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
  };

  const handleFormSuccess = () => {
    Swal.fire({
      title: "¡Éxito!",
      text: isEditing
        ? "Usuario actualizado correctamente"
        : "Usuario creado correctamente",
      icon: "success",
      confirmButtonText: "Continuar",
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "text-slate-900 font-bold",
        htmlContainer: "text-slate-600",
        confirmButton: "rounded-lg px-6 py-2.5 font-medium btn-confirm-success",
      },
    });

    loadUsers();
    closeFormModal();
    if (isDetailModalOpen) closeDetailModal();
  };

  const getPersonName = (personId) => {
    const person = persons[personId];
    if (!person) return "-";
    return `${person.firstName || ""} ${person.lastName || ""}`.trim() || "-";
  };

  const getAreaName = (areaId) => {
    if (!areaId) return "-";
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : `ID: ${areaId.substring(0, 8)}...`;
  };

  const getPositionName = (positionId) => {
    if (!positionId) return "-";
    const position = positions.find(p => p.id === positionId);
    return position ? position.name : `ID: ${positionId.substring(0, 8)}...`;
  };

  const filteredUsers = users.filter((user) => {
    const personName = getPersonName(user.personId);
    const matchSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      personName.toLowerCase().includes(searchTerm.toLowerCase());

    // Determinar el estado real del usuario
    let userStatus = user.status;

    // Si tiene blockedUntil y la fecha es futura, está bloqueado
    if (user.blockedUntil) {
      const blockedUntilDate = new Date(user.blockedUntil);
      if (blockedUntilDate > new Date()) {
        userStatus = "BLOCKED";
      }
    }

    const matchStatus = userStatus === filterStatus;

    return matchSearch && matchStatus;
  });

  // Lógica de paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Resetear a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      let dateObj;

      // Si es un array (formato de Spring Boot con LocalDateTime)
      if (Array.isArray(date)) {
        // Array format: [year, month, day, hour, minute, second, nanosecond]
        const [year, month, day, hour = 0, minute = 0, second = 0] = date;
        // Nota: month en JavaScript es 0-indexed, pero Spring Boot envía 1-indexed
        dateObj = new Date(year, month - 1, day, hour, minute, second);
      } else {
        // Si es un string ISO o timestamp
        dateObj = new Date(date);
      }

      // Verificar si la fecha es válida
      if (isNaN(dateObj.getTime())) {
        return "-";
      }

      return new Intl.DateTimeFormat("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch (error) {
      console.warn("Error al formatear fecha:", date, error);
      return "-";
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si se está mostrando la vista de asignaciones, renderizar AssignmentsPage
  if (showAssignments) {
    return <AssignmentsPage onBack={() => setShowAssignments(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Azul */}
      <div className="bg-blue-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Usuarios
                </h1>
                <p className="text-blue-100 text-sm font-medium">
                  Administración de usuarios del sistema municipal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAssignments(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Asignaciones
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Usuario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Profesionales */}
      {users.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Usuarios */}
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Usuarios</p>
                  <p className="text-3xl font-bold text-slate-800">{users.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Activos */}
            <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Activos</p>
                  <p className="text-3xl font-bold text-slate-800">{users.filter((u) => u.status === "ACTIVE").length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Inactivos */}
            <div className="bg-white border-l-4 border-l-red-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inactivos</p>
                  <p className="text-3xl font-bold text-slate-800">{users.filter((u) => u.status === "INACTIVE").length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50 text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Suspendidos */}
            <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Suspendidos</p>
                  <p className="text-3xl font-bold text-slate-800">{users.filter((u) => u.status === "SUSPENDED").length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-yellow-50 text-yellow-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bloqueados */}
            <div className="bg-white border-l-4 border-l-purple-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bloqueados</p>
                  <p className="text-3xl font-bold text-slate-800">{users.filter((u) => u.status === "BLOCKED").length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="mt-2 text-sm underline hover:text-red-900"
          >
            Limpiar sesión y volver a login
          </button>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Buscar
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Username, nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
              >
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
                <option value="SUSPENDED">Suspendidos</option>
                <option value="BLOCKED">Bloqueados</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Profesional */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron usuarios</p>
                      <p className="text-slate-500">Intenta con otros filtros o agrega un nuevo usuario</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-slate-50 transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-white"
                  >
                    {/* Username con indicador de estado */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${user.status === "ACTIVE"
                          ? "bg-green-500"
                          : user.status === "SUSPENDED"
                            ? "bg-orange-500"
                            : user.status === "BLOCKED"
                              ? "bg-purple-500"
                              : "bg-red-500"
                          }`}></div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{user.username}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {user.status === "ACTIVE"
                              ? "Activo"
                              : user.status === "SUSPENDED"
                                ? "Suspendido"
                                : user.status === "BLOCKED"
                                  ? "Bloqueado"
                                  : "Inactivo"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Persona con indicador de estado */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${persons[user.personId]?.status === true || persons[user.personId]?.status === "ACTIVE"
                          ? persons[user.personId]?.gender === "F"
                            ? "bg-pink-500"
                            : "bg-blue-500"
                          : "bg-red-500"
                          }`}></div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{getPersonName(user.personId)}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {persons[user.personId]?.status === true || persons[user.personId]?.status === "ACTIVE" ? "Activo" : "Inactivo"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Área */}
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span className="text-xs font-medium text-blue-700">{getAreaName(user.areaId)}</span>
                      </div>
                    </td>

                    {/* Posición */}
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                        <svg className="w-3.5 h-3.5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                        </svg>
                        <span className="text-xs font-medium text-slate-700">{getPositionName(user.positionId)}</span>
                      </div>
                    </td>

                    {/* Último Login */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(user.lastLogin)}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {/* Ver Detalles */}
                        <button
                          onClick={() => handleViewDetail(user)}
                          className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => user.status !== "INACTIVE" && handleEdit(user)}
                          disabled={user.status === "INACTIVE"}
                          className={`p-2.5 rounded-lg transition-all duration-200 border shadow-sm ${user.status === "INACTIVE"
                            ? "text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed"
                            : "text-blue-600 hover:text-white hover:bg-blue-600 border-blue-200 hover:border-blue-600 hover:shadow-md"
                            }`}
                          title={user.status === "INACTIVE" ? "No se puede editar un usuario inactivo" : "Editar usuario"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Restaurar o Eliminar */}
                        {user.status === "INACTIVE" ? (
                          <button
                            onClick={() => handleRestore(user.id)}
                            className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                            title="Restaurar usuario"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 hover:shadow-md"
                            title="Eliminar usuario"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}

                        {/* Menú de Acciones (3 puntitos) */}
                        <UserActionsMenu user={user} onSuccess={loadUsers} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Profesional */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Información de registros */}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)}
                  </span>
                  <span>de</span>
                  <span className="font-semibold text-slate-900">{filteredUsers.length}</span>
                  <span>registros</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 ml-4">
                  <label className="text-slate-600 font-medium">Mostrar:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-slate-900 font-medium text-sm bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Controles de paginación */}
              <div className="flex items-center gap-2">
                {/* Botón Primera Página */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  title="Primera página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>

                {/* Botón Anterior */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  title="Página anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Mostrar siempre la primera página, última página, página actual y páginas adyacentes
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // Agregar puntos suspensivos si hay saltos
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[40px] h-10 px-3 rounded-lg font-semibold transition-all duration-200 ${currentPage === page
                              ? "bg-blue-600 text-white shadow-md"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  title="Página siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Botón Última Página */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  title="Última página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <UserModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
        user={isEditing ? selectedUser : null}
        users={users}
      />

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        user={selectedUser}
        onEdit={handleEdit}
        users={users}
      />
    </div>
  );
}
