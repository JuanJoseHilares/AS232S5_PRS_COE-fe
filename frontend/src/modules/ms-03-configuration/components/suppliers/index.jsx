import React, { useState, useEffect } from 'react';
import { getProveedores, getProveedoresInactivos, deleteProveedor, restaurarProveedor } from '../../services/api';
import SupplierModal from './SupplierModal';
import SupplierDetailModal from './SupplierDetailModal';
import Paginator from '../../../../shared/utils/Paginator';

export default function SuppliersModule() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Estados para modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Cargar proveedores
  useEffect(() => {
    loadProveedores();
  }, []);

  const loadProveedores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar todos los proveedores (activos e inactivos)
      const [activos, inactivos] = await Promise.all([
        getProveedores(),
        getProveedoresInactivos()
      ]);
      
      const todosProveedores = [...activos, ...inactivos];
      setProveedores(todosProveedores || []);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setError('Error al cargar los proveedores: ' + err.message);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const motivo = prompt('¿Por qué desea dar de baja este proveedor? (opcional)');
    if (motivo !== null) {
      try {
        await deleteProveedor(id);
        // Recargar la lista inmediatamente
        await loadProveedores();
        console.log('Proveedor eliminado correctamente');
      } catch (err) {
        console.error('Error al dar de baja:', err);
        alert('Error al dar de baja el proveedor: ' + err.message);
      }
    }
  };

  const handleRestore = async (id) => {
    const motivo = prompt('¿Por qué desea restaurar este proveedor? (opcional)');
    if (motivo !== null) {
      try {
        await restaurarProveedor(id);
        // Recargar la lista inmediatamente
        await loadProveedores();
        console.log('Proveedor restaurado correctamente');
      } catch (err) {
        console.error('Error al restaurar:', err);
        alert('Error al restaurar el proveedor: ' + err.message);
      }
    }
  };

  // Abrir modal para crear
  const handleCreate = () => {
    setSelectedProveedor(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  // Abrir modal de detalles
  const handleViewDetail = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDetailModalOpen(true);
  };

  // Cerrar modales
  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedProveedor(null);
    setIsEditing(false);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProveedor(null);
  };

  // Callback después de guardar
  const handleFormSuccess = () => {
    loadProveedores();
    closeFormModal();
    if (isDetailModalOpen) {
      closeDetailModal();
    }
  };

  // Filtrado de proveedores
  const filteredProveedores = proveedores.filter((proveedor) => {
    const matchSearch =
      proveedor.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.legalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.tradeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = filterEstado === 'TODOS' || 
      (filterEstado === 'ACTIVOS' && proveedor.active) ||
      (filterEstado === 'INACTIVOS' && !proveedor.active);

    return matchSearch && matchEstado;
  });

  // Calcular paginación
  const totalItems = filteredProveedores.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProveedores = filteredProveedores.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado]);

  // Handlers para paginación
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll al inicio de la tabla
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Badge de estado
  const getEstadoBadge = (active) => {
    return active 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Badge de calificación (1-5)
  const getQualificationBadge = (qualification) => {
    if (qualification >= 4) return 'bg-green-100 text-green-800';
    if (qualification >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Gestión de Proveedores
            </h1>
            <p className="text-slate-600">Administración y control de proveedores institucionales</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-700">
                    {proveedores.filter((p) => p.active).length}
                  </div>
                  <div className="text-sm text-green-600 mt-1 font-medium">
                    Proveedores Activos
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-slate-700">
                    {proveedores.filter((p) => !p.active).length}
                  </div>
                  <div className="text-sm text-slate-600 mt-1 font-medium">
                    Proveedores Inactivos
                  </div>
                </div>
                <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-700">
                    {proveedores.filter((p) => p.isStateProvider).length}
                  </div>
                  <div className="text-sm text-blue-600 mt-1 font-medium">
                    Proveedores del Estado
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-amber-700">
                    {proveedores.length > 0 ? (Math.round(proveedores.reduce((sum, p) => sum + p.qualification, 0) / proveedores.length * 10) / 10).toFixed(1) : '0.0'}/5
                  </div>
                  <div className="text-sm text-amber-600 mt-1 font-medium">
                    Calificación Promedio
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por RUC, razón social, nombre comercial o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estado
            </label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
            </select>
          </div>
        </div>


        {/* Botón Nuevo */}
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{totalItems}</span> proveedores encontrados
          </p>
          <button 
            onClick={handleCreate}
            className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium shadow-md transition duration-200 transform hover:scale-105"
          >
            + Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">RUC/Documento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Razón Social</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Nombre Comercial</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Contacto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Calificación</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg
                        className="w-16 h-16 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <p className="text-lg font-medium">No se encontraron proveedores</p>
                      <p className="text-sm mt-1">Intenta con otros filtros o agrega un nuevo proveedor</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProveedores.map((proveedor, index) => (
                  <tr
                    key={proveedor.id}
                    className={`hover:bg-slate-50 transition duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    {/* RUC/Documento */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 font-mono">
                        {proveedor.numeroDocumento}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {proveedor.id?.substring(0, 8)}...
                      </div>
                    </td>

                    {/* Razón Social */}
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium max-w-xs truncate">
                        {proveedor.legalName}
                      </div>
                      {proveedor.isStateProvider && (
                        <div className="text-xs text-blue-600 mt-1">
                          🏛️ Proveedor del Estado
                        </div>
                      )}
                    </td>

                    {/* Nombre Comercial */}
                    <td className="px-6 py-4">
                      <div className="text-slate-700">
                        {proveedor.tradeName || '-'}
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-6 py-4">
                      <div className="text-slate-700">
                        {proveedor.mainContact || '-'}
                      </div>
                      {proveedor.email && (
                        <div className="text-xs text-slate-500">{proveedor.email}</div>
                      )}
                    </td>

                    {/* Calificación */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getQualificationBadge(
                          proveedor.qualification
                        )}`}
                      >
                        {proveedor.qualification}/5
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(
                          proveedor.active
                        )}`}
                      >
                        {proveedor.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Ver */}
                        <button
                          onClick={() => handleViewDetail(proveedor)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition duration-150"
                          title="Ver detalles"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>

                        {proveedor.active ? (
                          <>
                            {/* Editar */}
                            <button
                              onClick={() => handleEdit(proveedor)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition duration-150"
                              title="Editar"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>

                            {/* Dar de Baja */}
                            <button
                              onClick={() => handleDelete(proveedor.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
                              title="Dar de baja"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </>
                        ) : (
                          /* Solo Restaurar para inactivos */
                          <button
                            onClick={() => handleRestore(proveedor.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition duration-150"
                            title="Restaurar proveedor"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginador */}
        {totalItems > 0 && (
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[10, 25, 50, 100]}
            showPageInfo={true}
            showItemsPerPage={true}
          />
        )}
      </div>


      {/* Modales */}
      <SupplierModal
        key={`form-${selectedProveedor?.id || 'new'}-${isEditing}`}
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
        proveedor={isEditing ? selectedProveedor : null}
      />

      <SupplierDetailModal
        key={`detail-${selectedProveedor?.id || 'view'}`}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        proveedor={selectedProveedor}
        onEdit={handleEdit}
      />
    </div>
  );
}
