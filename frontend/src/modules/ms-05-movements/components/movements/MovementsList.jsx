import { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  CubeIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import assetMovementService from '../../services/assetMovementService';
import { MovementStatusConfig, formatDateOnly, MovementTypeLabels } from '../../types/movementTypes';
import Paginator from '../../../../shared/utils/Paginator';
import { usePagination } from '../../../../shared/utils/usePagination';
import { getBienPatrimonialById } from '../../../ms-04-patrimonio/services/api';

export default function MovementsList({ 
  municipalityId, 
  onView, 
  onEdit,
  onDelete,
  onRestore,
  statusFilter = null,
  typeFilter = null,
  activeFilter = 'active', // 'active', 'inactive', 'all'
  movements: externalMovements = null, // Recibir movimientos como prop opcional
  loading: externalLoading = false, // Recibir estado de carga como prop opcional
  error: externalError = null // Recibir error como prop opcional
}) {
  const [internalMovements, setInternalMovements] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalError, setInternalError] = useState(null);
  const [assetNames, setAssetNames] = useState({}); // Mapa de assetId -> nombre
  const [loadingAssetNames, setLoadingAssetNames] = useState(false);

  // Si se pasan movimientos como props, usarlos; si no, cargarlos internamente
  const movements = externalMovements !== null ? externalMovements : internalMovements;
  const loading = externalMovements !== null ? externalLoading : internalLoading;
  const error = externalMovements !== null ? externalError : internalError;

  // Paginación
  const {
    paginatedData: paginatedMovements,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
  } = usePagination(movements, 10);

  // Resetear a la primera página cuando cambian los filtros o los movimientos
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, movements.length]);

  useEffect(() => {
    // Solo cargar internamente si no se pasan movimientos como props
    if (externalMovements === null) {
      loadMovements();
    }
  }, [municipalityId, statusFilter, typeFilter, externalMovements]);

  // Cargar nombres de activos cuando cambian los movimientos
  useEffect(() => {
    if (movements && movements.length > 0) {
      loadAssetNames(movements);
    }
  }, [movements]);

  const loadMovements = async () => {
    try {
      setInternalLoading(true);
      setInternalError(null);
      
      let data;
      if (statusFilter) {
        data = await assetMovementService.getMovementsByStatus(statusFilter, municipalityId);
      } else if (typeFilter) {
        data = await assetMovementService.getMovementsByType(typeFilter, municipalityId);
      } else {
        data = await assetMovementService.getAllMovements(municipalityId);
      }
      
      setInternalMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      setInternalError('Error al cargar los movimientos');
      console.error('Error loading movements:', err);
      setInternalMovements([]);
    } finally {
      setInternalLoading(false);
    }
  };

  const loadAssetNames = async (movementsList) => {
    if (!movementsList || movementsList.length === 0) return;
    
    try {
      setLoadingAssetNames(true);
      const assetIds = movementsList
        .map(mov => mov.assetId)
        .filter(Boolean)
        .filter((id, index, self) => self.indexOf(id) === index); // IDs únicos
      
      const namesMap = {};
      
      // Cargar nombres en paralelo
      await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const asset = await getBienPatrimonialById(assetId);
            if (asset) {
              let name = asset.description || asset.descripcion || asset.assetCode || asset.codigoPatrimonial || assetId;
              
              // Limpiar el nombre: remover información de ubicación que pueda estar concatenada (ej: " - Recepción", " - Auditorio Municipal")
              // Buscar patrones como " - " seguido de texto y removerlo
              if (name && typeof name === 'string') {
                // Remover todo lo que viene después de " - " si existe
                const locationPattern = /\s*-\s*[^-]+$/;
                name = name.replace(locationPattern, '').trim();
              }
              
              namesMap[assetId] = name;
            } else {
              namesMap[assetId] = assetId; // Fallback al ID si no se encuentra
            }
          } catch (err) {
            console.warn(`Error loading asset ${assetId}:`, err);
            namesMap[assetId] = assetId; // Fallback al ID si hay error
          }
        })
      );
      
      setAssetNames(prev => ({ ...prev, ...namesMap }));
    } catch (error) {
      console.error('Error loading asset names:', error);
    } finally {
      setLoadingAssetNames(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = MovementStatusConfig[status] || MovementStatusConfig.REQUESTED;
    
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${config.bgColor} mr-2`}></div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-slate-600"></div>
            <p className="text-sm text-gray-600">Cargando movimientos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={loadMovements}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">

      {movements.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <ArrowPathIcon className="h-10 w-10 text-gray-400" />
          </div>
          {activeFilter === 'inactive' ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay movimientos inactivos</h3>
              <p className="text-gray-500 mb-1 max-w-md mx-auto">
                No se encontraron movimientos eliminados o inactivos.
              </p>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Todos los movimientos están activos en el sistema.
              </p>
            </>
          ) : activeFilter === 'all' ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay movimientos registrados</h3>
              <p className="text-gray-500 mb-1 max-w-md mx-auto">
                No se encontraron movimientos (activos ni inactivos) para este municipio.
              </p>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Haz clic en "Nuevo Movimiento" para crear el primero.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay movimientos activos</h3>
              <p className="text-gray-500 mb-1 max-w-md mx-auto">
                Aún no se han registrado movimientos activos para este municipio.
              </p>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Haz clic en "Nuevo Movimiento" para crear el primero.
              </p>
            </>
          )}
          <div className="flex items-center justify-center">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-400">Esperando contenido...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200" style={{ backgroundColor: '#36454F' }}>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <div className="flex items-center">
                    <ArrowsUpDownIcon className="h-4 w-4 mr-2 text-white" />
                    Número
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Activo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-white" />
                    Fecha Solicitud
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Motivo
                </th>
                {(onView || onEdit || onDelete || onRestore) && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedMovements.map((movement, index) => (
                <tr key={movement.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <ArrowPathIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{movement.movementNumber}</div>
                        <div className="text-xs text-gray-500">ID: {movement.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="min-w-0">
                      {loadingAssetNames ? (
                        <div className="text-sm text-gray-400">Cargando...</div>
                      ) : movement.assetId ? (
                        <div className="text-sm text-gray-900 font-medium truncate" title={assetNames[movement.assetId] || movement.assetId}>
                          {assetNames[movement.assetId] || movement.assetId}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">Sin activo</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {MovementTypeLabels[movement.movementType] || movement.movementType}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-medium">
                        {formatDateOnly(movement.requestDate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getStatusBadge(movement.movementStatus)}
                  </td>
                  <td className="px-6 py-5">
                    <div 
                      className="text-sm text-gray-900 truncate cursor-help" 
                      title={movement.reason || 'Sin motivo'}
                      style={{ maxWidth: '200px' }}
                    >
                      {movement.reason || 'Sin motivo'}
                    </div>
                  </td>
                  {(onView || onEdit || onDelete || onRestore) && (
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-1">
                        {onView && (
                          <button
                            onClick={() => onView(movement)}
                            className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        {(() => {
                          // Determinar si el movimiento está activo (misma lógica que en MovementsPage)
                          let isActive = true;
                          if (movement.active !== undefined) {
                            isActive = movement.active === true;
                          } else if (movement.deleted !== undefined) {
                            isActive = movement.deleted === false;
                          } else if (movement.deletedAt) {
                            isActive = false;
                          }
                          
                          // Si está inactivo, mostrar botón de restaurar (solo si onRestore existe)
                          if (!isActive && onRestore) {
                            return (
                              <button
                                onClick={() => onRestore(movement)}
                                className="inline-flex items-center p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200"
                                title="Restaurar"
                              >
                                <ArrowUturnLeftIcon className="h-4 w-4" />
                              </button>
                            );
                          }
                          
                          // Si está activo, mostrar botón de editar (solo si el estado lo permite y onEdit existe)
                          if (onEdit && (movement.movementStatus === 'REQUESTED' || movement.movementStatus === 'APPROVED')) {
                            return (
                              <button
                                onClick={() => onEdit(movement)}
                                className="inline-flex items-center p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors duration-200"
                                title="Editar"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            );
                          }
                          
                          return null;
                        })()}
                        
                        {(() => {
                          // Determinar si el movimiento está activo (misma lógica que en MovementsPage)
                          let isActive = true;
                          if (movement.active !== undefined) {
                            isActive = movement.active === true;
                          } else if (movement.deleted !== undefined) {
                            isActive = movement.deleted === false;
                          } else if (movement.deletedAt) {
                            isActive = false;
                          }
                          
                          // Solo mostrar botón de eliminar si está activo y onDelete existe
                          return isActive && onDelete && (
                            <button
                              onClick={() => onDelete(movement)}
                              className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
  );
}

