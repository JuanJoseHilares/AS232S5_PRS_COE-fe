import React, { useState, useEffect } from 'react';
import { getBienesPatrimoniales, deleteBienPatrimonial, restaurarBienPatrimonial } from '../../services/api';
import AssetModal from '../../components/assets/AssetModal';
import AssetDetailModal from '../../components/assets/AssetDetailModal';
import DepreciationHistoryModal from '../../components/depreciation/DepreciationHistoryModal';
import Paginator from '../../../../shared/utils/Paginator';
import { usePagination } from '../../../../shared/utils/usePagination';

/**
 * Página principal de gestión de bienes patrimoniales
 * Muestra listado, búsqueda, filtros y acciones sobre los bienes
 */
export default function AssetListPage() {
  const [bienes, setBienes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [sortField, setSortField] = useState('assetCode');
  const [sortDirection, setSortDirection] = useState('asc');
  
  
  // Estados para modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBien, setSelectedBien] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  

  // Cargar bienes patrimoniales
  useEffect(() => {
    loadBienes();
  }, []);

  const loadBienes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBienesPatrimoniales();
      setBienes(data);
    } catch (err) {
      setError('Error al cargar los bienes patrimoniales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const motivo = prompt('¿Por qué desea dar de baja este bien? (opcional)');
    if (motivo !== null) { // null = canceló, string vacío = aceptó sin escribir
      try {
        await deleteBienPatrimonial(id, motivo || 'Bien dado de baja');
        loadBienes();
      } catch (err) {
        alert('Error al dar de baja el bien');
      }
    }
  };
  

  const handleRestore = async (id) => {
    const motivo = prompt('¿Por qué desea restaurar este bien? (opcional)');
    if (motivo !== null) {
      try {
        await restaurarBienPatrimonial(id, motivo || 'Bien restaurado');
        loadBienes();
      } catch (err) {
        alert('Error al restaurar el bien');
      }
    }
  };

  // Abrir modal para crear
  const handleCreate = () => {
    setSelectedBien(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (bien) => {
    setSelectedBien(bien);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  // Abrir modal de detalles
  const handleViewDetail = (bien) => {
    setSelectedBien(bien);
    setIsDetailModalOpen(true);
  };

  // Cerrar modales
  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedBien(null);
    setIsEditing(false);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBien(null);
  };

  // Callback después de guardar
  const handleFormSuccess = () => {
    loadBienes();
    closeFormModal();
    // Si el modal de detalles está abierto, cerrarlo para forzar recarga
    if (isDetailModalOpen) {
      closeDetailModal();
    }
  };
  // Depreciación
  const openDepreciationModal = (bien) => {
  setSelectedAsset(bien); // <- guarda todo el objeto
  setShowDepModal(true);
};


  // Función para manejar el ordenamiento
  const handleSort = (field) => {
    if (sortField === field) {
      // Si ya está ordenado por este campo, cambiar dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nuevo campo, ordenar ascendente por defecto
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrado de bienes
  const filteredBienes = bienes.filter((bien) => {
    const matchSearch =
      (bien.assetCode || bien.codigoPatrimonial)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bien.description || bien.descripcion)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bien.brand || bien.marca)?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrar por estado
    let matchEstado;
    if (filterEstado === 'TODOS') {
      // "TODOS" excluye bienes en BAJA
      matchEstado = (bien.assetStatus || bien.estadoBien) !== 'BAJA';
    } else {
      // Filtrar por el estado específico seleccionado
      matchEstado = (bien.assetStatus || bien.estadoBien) === filterEstado;
    }

    return matchSearch && matchEstado;
  });

  // Ordenamiento de bienes
  const sortedBienes = [...filteredBienes].sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'assetCode':
        aValue = (a.assetCode || a.codigoPatrimonial || '').toLowerCase();
        bValue = (b.assetCode || b.codigoPatrimonial || '').toLowerCase();
        break;
      case 'description':
        aValue = (a.description || a.descripcion || '').toLowerCase();
        bValue = (b.description || b.descripcion || '').toLowerCase();
        break;
      case 'brand':
        aValue = (a.brand || a.marca || '').toLowerCase();
        bValue = (b.brand || b.marca || '').toLowerCase();
        break;
      case 'value':
        aValue = a.currentValue || a.valorActual || a.acquisitionValue || a.valorAdquisicion || 0;
        bValue = b.currentValue || b.valorActual || b.acquisitionValue || b.valorAdquisicion || 0;
        break;
      case 'acquisitionDate':
        aValue = new Date(a.acquisitionDate || a.fechaAdquisicion || 0).getTime();
        bValue = new Date(b.acquisitionDate || b.fechaAdquisicion || 0).getTime();
        break;
      case 'status':
        aValue = (a.assetStatus || a.estadoBien || '').toLowerCase();
        bValue = (b.assetStatus || b.estadoBien || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Aplicar paginación a los datos ordenados
  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
  } = usePagination(sortedBienes, 10);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value || 0);
  };

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE');
  };

  // Badge de estado
  const getEstadoBadge = (estado) => {
    const estados = {
      DISPONIBLE: 'bg-green-100 text-green-800',
      EN_USO: 'bg-blue-100 text-blue-800',
      MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
      BAJA: 'bg-red-100 text-red-800',
      PRESTADO: 'bg-purple-100 text-purple-800',
    };
    return estados[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          Gestión de Bienes Patrimoniales
        </h1>
        <p className="text-slate-600">
          Administración y control de activos institucionales
        </p>
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
              placeholder="Buscar por código, descripción o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_USO">En Uso</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="BAJA">Baja</option>
              <option value="PRESTADO">Prestado</option>
            </select>
          </div>
        </div>

        {/* Botón Nuevo */}
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{totalItems}</span> bienes encontrados
          </p>
          <button 
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-md transition duration-200 transform hover:scale-105"
          >
            + Nuevo Bien
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-600 transition select-none"
                  onClick={() => handleSort('assetCode')}
                >
                  <div className="flex items-center gap-2">
                    Código
                    {sortField === 'assetCode' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-600 transition select-none"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-2">
                    Descripción
                    {sortField === 'description' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-600 transition select-none"
                  onClick={() => handleSort('brand')}
                >
                  <div className="flex items-center gap-2">
                    Marca/Modelo
                    {sortField === 'brand' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-600 transition select-none"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center gap-2">
                    Valor
                    {sortField === 'value' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-600 transition select-none"
                  onClick={() => handleSort('acquisitionDate')}
                >
                  <div className="flex items-center gap-2">
                    Fecha Adq.
                    {sortField === 'acquisitionDate' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-600 transition select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Estado
                    {sortField === 'status' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedData.length === 0 ? (
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
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-lg font-medium">No se encontraron bienes patrimoniales</p>
                      <p className="text-sm mt-1">Intenta con otros filtros o agrega un nuevo bien</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((bien, index) => (
                  <tr
                    key={bien.id}
                    className={`hover:bg-slate-50 transition duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    {/* Código */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{bien.assetCode || bien.codigoPatrimonial}</div>
                      {(bien.serialNumber || bien.serie) && (
                        <div className="text-xs text-slate-500">S/N: {bien.serialNumber || bien.serie}</div>
                      )}
                    </td>

                    {/* Descripción */}
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium max-w-xs truncate">
                        {bien.description || bien.descripcion}
                      </div>
                      {bien.detalles && (
                        <div className="text-xs text-slate-500 max-w-xs truncate">
                          {bien.detalles}
                        </div>
                      )}
                    </td>

                    {/* Marca/Modelo */}
                    <td className="px-6 py-4">
                      <div className="text-slate-700">
                        {bien.brand || bien.marca || '-'}
                      </div>
                      {(bien.model || bien.modelo) && (
                        <div className="text-xs text-slate-500">{bien.model || bien.modelo}</div>
                      )}
                    </td>

                    {/* Valor */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {formatCurrency(bien.currentValue || bien.valorActual || bien.acquisitionValue || bien.valorAdquisicion)}
                      </div>
                      {(bien.currency || bien.moneda) && (bien.currency || bien.moneda) !== 'PEN' && (
                        <div className="text-xs text-slate-500">{bien.currency || bien.moneda}</div>
                      )}
                    </td>

                    {/* Fecha Adquisición */}
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(bien.acquisitionDate || bien.fechaAdquisicion)}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(
                          bien.assetStatus || bien.estadoBien
                        )}`}
                      >
                        {bien.assetStatus || bien.estadoBien || 'DISPONIBLE'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Ver */}
                        <button
                          onClick={() => handleViewDetail(bien)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-150"
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

                        {(bien.assetStatus || bien.estadoBien) !== 'BAJA' ? (
                          <>
                            {/* Editar */}
                            <button
                              onClick={() => handleEdit(bien)}
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
                            {bien.isDepreciable && (
  <button
    onClick={() => openDepreciationModal(bien)} // <- objeto completo
    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition duration-150"
    title="Historial de depreciación"
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
        d="M12 8v8m4-4H8m12 0A10 10 0 1112 2a10 10 0 0110 10z"
      />
    </svg>
  </button>
)}

                            {/* Dar de Baja */}
                            <button
                              onClick={() => handleDelete(bien.id)}
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
                          /* Restaurar */
                          <button
                            onClick={() => handleRestore(bien.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition duration-150"
                            title="Restaurar bien"
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
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      {/* Footer con estadísticas */}
      {totalItems > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {bienes.filter((b) => (b.assetStatus || b.estadoBien) !== 'BAJA').length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Total Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {bienes.filter((b) => (b.assetStatus || b.estadoBien) === 'DISPONIBLE').length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {bienes.filter((b) => (b.assetStatus || b.estadoBien) === 'EN_USO').length}
              </div>
              <div className="text-sm text-slate-600 mt-1">En Uso</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {bienes.filter((b) => (b.assetStatus || b.estadoBien) === 'BAJA').length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Dados de Baja</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {formatCurrency(
                  bienes
                    .filter((b) => (b.assetStatus || b.estadoBien) !== 'BAJA')
                    .reduce((sum, b) => sum + (b.currentValue || b.valorActual || b.acquisitionValue || b.valorAdquisicion || 0), 0)
                )}
              </div>
              <div className="text-sm text-slate-600 mt-1">Valor Total Activo</div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <AssetModal
        key={`form-${selectedBien?.id || 'new'}`}
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
        bien={isEditing ? selectedBien : null}
      />

      <AssetDetailModal
        key={`detail-${selectedBien?.id || 'view'}`}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        bien={selectedBien}
        onEdit={handleEdit}
      />
      {showDepModal && (
  <DepreciationHistoryModal
    asset={selectedAsset} // <- objeto completo
    onClose={() => setShowDepModal(false)}
  />
)}


    </div>
  );
}
