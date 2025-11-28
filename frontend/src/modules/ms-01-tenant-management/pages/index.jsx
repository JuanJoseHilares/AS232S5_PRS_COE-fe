import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  getMunicipalidades,
  getMunicipalidadById,
  createMunicipalidad,
  updateMunicipalidad,
  deleteMunicipalidad
} from '../services/municipalidadService';
import MunicipalidadModal from '../components/MunicipalidadModal';
import MunicipalidadDetailModal from '../components/MunicipalidadDetailModal';
import MunicipalidadStats from '../components/MunicipalidadStats';

const MunicipalidadPage = () => {
  const [municipalidades, setMunicipalidades] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('todos');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // Sorting state
  const [sortField, setSortField] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  const loadMunicipalidades = async () => {
    try {
      const response = await getMunicipalidades();
      setMunicipalidades(response?.data || []);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      setMunicipalidades([]); // Aseguramos que sea un array vacío en caso de error
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las municipalidades'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMunicipalidades();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedState]);

  // Filtrar municipalidades según los criterios de búsqueda y estado
  const filteredMunicipalidades = municipalidades.filter(municipalidad => {
    // Búsqueda por texto
    const matchesSearch = searchTerm.toLowerCase().trim() === '' ||
      municipalidad.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      municipalidad.ruc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      municipalidad.distrito?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      municipalidad.provincia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      municipalidad.departamento?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por estado seleccionado
    const matchesState = selectedState === 'todos' ||
      (selectedState === 'activo' && municipalidad.activo === true) ||
      (selectedState === 'inactivo' && municipalidad.activo === false);

    return matchesSearch && matchesState;
  });

  // Sorting helper
  const compareValues = (a, b) => (a > b) - (a < b);
  const getFieldValue = (m, field) => {
    switch (field) {
      case 'nombre':
        return (m.nombre || '').toLowerCase();
      case 'ruc':
        return (m.ruc || '').toString();
      case 'tipo':
        return (m.tipo || '').toString();
      case 'ubicacion':
        return `${m.distrito || ''}|${m.provincia || ''}|${m.departamento || ''}`.toLowerCase();
      case 'estado':
        return m.activo ? 1 : 0; // activos primero si asc
      default:
        return '';
    }
  };
  const sortedMunicipalidades = [...filteredMunicipalidades].sort((a, b) => {
    const va = getFieldValue(a, sortField);
    const vb = getFieldValue(b, sortField);
    const cmp = compareValues(va, vb);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const totalItems = sortedMunicipalidades.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedMunicipalidades = sortedMunicipalidades.slice(startIndex, endIndex);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };
  const SortIcon = ({ field }) => (
    <span className="ml-1 inline-block align-middle">
      {sortField !== field ? (
        <svg className="w-3 h-3 text-gray-400 inline" viewBox="0 0 20 20" fill="currentColor"><path d="M7 7l3-3 3 3H7zm6 6l-3 3-3-3h6z"/></svg>
      ) : sortOrder === 'asc' ? (
        <svg className="w-3 h-3 text-gray-600 inline" viewBox="0 0 20 20" fill="currentColor"><path d="M7 13l3-3 3 3H7z"/></svg>
      ) : (
        <svg className="w-3 h-3 text-gray-600 inline" viewBox="0 0 20 20" fill="currentColor"><path d="M7 7l3 3 3-3H7z"/></svg>
      )}
    </span>
  );

  const handleCreate = async (data) => {
    try {
      await createMunicipalidad(data);
      await loadMunicipalidades();
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Municipalidad creada correctamente'
      });
    } catch (error) {
      console.error('Error al crear municipalidad:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear la municipalidad'
      });
    }
  };

  const handleUpdate = async (data) => {
    try {
      // Comparar datos actuales con nuevos para enviar solo los cambios
      const changes = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== selectedMunicipalidad[key]) {
          changes[key] = data[key];
        }
      });

      console.log('Enviando cambios:', changes);
      
      if (Object.keys(changes).length === 0) {
        setIsModalOpen(false);
        setSelectedMunicipalidad(null);
        return; // No hay cambios que actualizar
      }

      const updatedMunicipalidad = await updateMunicipalidad(selectedMunicipalidad.id, changes);
      console.log('Municipalidad actualizada:', updatedMunicipalidad);
      
      // Actualizar la lista de municipalidades
      const updatedList = municipalidades.map(m => 
        m.id === selectedMunicipalidad.id ? { ...m, ...changes } : m
      );
      setMunicipalidades(updatedList);
      
      setIsModalOpen(false);
      setSelectedMunicipalidad(null);
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Municipalidad actualizada correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar municipalidad:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la municipalidad'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Desactivar municipalidad?',
        text: "La municipalidad será marcada como inactiva",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusConfirm: false,
        focusCancel: true
      });

      if (result.isConfirmed) {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Desactivando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Realizar la actualización solo del campo activo
        await updateMunicipalidad(id, { activo: false });
        
        // Recargar los datos
        await loadMunicipalidades();

        // Mostrar mensaje de éxito
        await Swal.fire({
          icon: 'success',
          title: '¡Desactivado!',
          text: 'La municipalidad ha sido desactivada correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al desactivar municipalidad:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo desactivar la municipalidad. Por favor, inténtelo nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleRestore = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Restaurar municipalidad?',
        text: "La municipalidad será activada nuevamente",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, restaurar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusConfirm: false,
        focusCancel: true
      });

      if (result.isConfirmed) {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Restaurando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Realizar la actualización del estado a activo
        await updateMunicipalidad(id, { activo: true });
        
        // Recargar los datos
        await loadMunicipalidades();

        // Mostrar mensaje de éxito
        await Swal.fire({
          icon: 'success',
          title: '¡Restaurada!',
          text: 'La municipalidad ha sido activada correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al restaurar municipalidad:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo restaurar la municipalidad. Por favor, inténtelo nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const openModal = (municipalidad = null) => {
    setSelectedMunicipalidad(municipalidad);
    setIsModalOpen(true);
  };

  const openDetailModal = (municipalidad) => {
    setSelectedMunicipalidad(municipalidad);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Gestión de Municipalidades
        </h1>
        <p className="text-gray-600">Administración y control de municipalidades</p>
      </div>

      {!isLoading && <MunicipalidadStats municipalidades={municipalidades} />}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : municipalidades.length === 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">Error al cargar las municipalidades</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-600">Buscar</label>
          <input
            type="text"
            placeholder="Buscar por nombre, RUC o ubicación..."
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-600">Estado</label>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          + Nueva Municipalidad
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('nombre')} className="hover:text-gray-700">
                      Nombre <SortIcon field="nombre" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('ruc')} className="hover:text-gray-700">
                      RUC <SortIcon field="ruc" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('tipo')} className="hover:text-gray-700">
                      Tipo <SortIcon field="tipo" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('ubicacion')} className="hover:text-gray-700">
                      Ubicación <SortIcon field="ubicacion" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button type="button" onClick={() => toggleSort('estado')} className="hover:text-gray-700">
                      Estado <SortIcon field="estado" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedMunicipalidades.map((municipalidad) => (
                  <tr key={municipalidad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {municipalidad.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {municipalidad.ubigeo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {municipalidad.ruc}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        municipalidad.tipo === 'PROVINCIAL' ? 'bg-purple-100 text-purple-800' :
                        municipalidad.tipo === 'DISTRITAL' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {municipalidad.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {municipalidad.distrito}
                      </div>
                      <div className="text-xs text-gray-500">
                        {municipalidad.provincia}, {municipalidad.departamento}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        municipalidad.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {municipalidad.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {/* Botón Ver Detalles - Siempre visible */}
                      <button
                        onClick={() => openDetailModal(municipalidad)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Botones solo para municipalidades activas */}
                      {municipalidad.activo && (
                        <>
                          <button
                            onClick={() => openModal(municipalidad)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(municipalidad.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Desactivar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Botón Restaurar - Solo para municipalidades inactivas */}
                      {!municipalidad.activo && (
                        <button
                          onClick={() => handleRestore(municipalidad.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Restaurar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {municipalidades.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <p className="text-gray-500 text-lg">No se encontraron municipalidades</p>
                        <p className="text-gray-400 text-sm">
                          Intenta con otros filtros o agrega una nueva municipalidad
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white">
            <div className="text-sm text-gray-600">
              Mostrando {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} de {totalItems}
            </div>
            <div className="flex items-center space-x-1">
              <button
                className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
              >
                «
              </button>
              <button
                className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }).slice(Math.max(0, currentPage - 3), currentPage + 2).map((_, idx) => {
                const n = Math.max(1, currentPage - 2) + idx;
                if (n > totalPages) return null;
                return (
                  <button
                    key={n}
                    className={`px-3 py-1 text-sm rounded border ${n === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700'}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
              <button
                className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      <MunicipalidadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMunicipalidad(null);
        }}
        onSubmit={selectedMunicipalidad ? handleUpdate : handleCreate}
        onSuccess={() => {
          loadMunicipalidades();
          setIsModalOpen(false);
          setSelectedMunicipalidad(null);
        }}
        initialData={selectedMunicipalidad}
      />

      <MunicipalidadDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMunicipalidad(null);
        }}
        municipalidad={selectedMunicipalidad}
      />
    </div>
  );
};

export default MunicipalidadPage;
