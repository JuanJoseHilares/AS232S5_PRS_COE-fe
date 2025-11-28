import React, { useState, useEffect } from 'react';
import {
  getAllDisposals,
  getDisposalsByStatus,
  finalizeDisposal,
  cancelDisposal,
  deleteDisposal,
  DISPOSAL_STATUS,
  DISPOSAL_TYPES,
} from '../../services/disposalService';
import CreateDisposalModal from '../../components/disposals/CreateDisposalModal';
import AddAssetsToDisposalModal from '../../components/disposals/AddAssetsToDisposalModal';
import StartEvaluationModal from '../../components/disposals/StartEvaluationModal';
import TechnicalOpinionModal from '../../components/disposals/TechnicalOpinionModal';
import ResolveDisposalModal from '../../components/disposals/ResolveDisposalModal';
import { useAuth } from '../../../ms-02-authentication/hooks/useAuth';

/**
 * Página de gestión de expedientes de baja
 * 
 * FLUJO SIMPLIFICADO:
 * 1. Crear Expediente (con technicalReportAuthorId)
 * 2. Agregar Bienes
 * 3. Iniciar Evaluación (solo confirma - sin comité)
 * 4. [Opcional] Agregar Opinión Técnica
 * 5. Aprobar/Rechazar (Admin. Finanzas)
 * 6. Finalizar Baja Física
 */
export default function DisposalManagementPage() {
  const { user } = useAuth();
  const [disposals, setDisposals] = useState([]);
  const [filteredDisposals, setFilteredDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddAssetsModal, setShowAddAssetsModal] = useState(false);
  const [showStartEvaluationModal, setShowStartEvaluationModal] = useState(false);
  const [showTechnicalOpinionModal, setShowTechnicalOpinionModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState(null);

  useEffect(() => {
    loadDisposals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [disposals, statusFilter, typeFilter, searchTerm]);

  const loadDisposals = async () => {
    try {
      setLoading(true);
      const data = await getAllDisposals();
      setDisposals(data);
    } catch (err) {
      setError('Error al cargar los expedientes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...disposals];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(d => d.fileStatus === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(d => d.disposalType === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.fileNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.disposalReason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDisposals(filtered);
  };

  const handleCreateDisposal = () => {
    setShowCreateModal(true);
  };

  const handleAddAssets = (disposal) => {
    setSelectedDisposal(disposal);
    setShowAddAssetsModal(true);
  };

  const handleStartEvaluation = (disposal) => {
    setSelectedDisposal(disposal);
    setShowStartEvaluationModal(true);
  };

  const handleAddOpinion = (disposal) => {
    setSelectedDisposal(disposal);
    setShowTechnicalOpinionModal(true);
  };

  const handleResolve = (disposal) => {
    setSelectedDisposal(disposal);
    setShowResolveModal(true);
  };

  const handleFinalize = async (disposal) => {
    if (!confirm('¿Está seguro de finalizar este expediente? Esta acción actualizará el estado de los bienes a BAJA.')) {
      return;
    }

    try {
      await finalizeDisposal(disposal.municipalityId, disposal.id);
      loadDisposals();
    } catch (err) {
      alert('Error al finalizar el expediente: ' + err.message);
    }
  };

  const handleCancel = async (disposal) => {
    const reason = prompt('Ingrese el motivo de cancelación:');
    if (!reason) return;

    try {
      await cancelDisposal(disposal.municipalityId, disposal.id, reason);
      loadDisposals();
    } catch (err) {
      alert('Error al cancelar el expediente: ' + err.message);
    }
  };

  const handleDelete = async (disposal) => {
    if (!confirm('¿Está seguro de eliminar este expediente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteDisposal(disposal.municipalityId, disposal.id);
      loadDisposals();
    } catch (err) {
      alert('Error al eliminar el expediente: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      INITIATED: { label: 'Iniciado', color: 'bg-blue-100 text-blue-800' },
      UNDER_EVALUATION: { label: 'En Evaluación', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
      EXECUTED: { label: 'Ejecutado', color: 'bg-purple-100 text-purple-800' },
      CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      OBSOLESCENCE: { label: 'Obsolescencia', icon: '📦' },
      DETERIORATION: { label: 'Deterioro', icon: '🔧' },
      LOSS: { label: 'Pérdida', icon: '❌' },
      THEFT: { label: 'Robo', icon: '🚨' },
      OTHER: { label: 'Otro', icon: '📝' },
    };

    const config = typeConfig[type] || { label: type, icon: '📄' };
    
    return (
      <span className="text-sm text-slate-600">
        {config.icon} {config.label}
      </span>
    );
  };

  const getActionButtons = (disposal) => {
    const actions = [];

    switch (disposal.fileStatus) {
      case 'INITIATED':
        actions.push(
          <button
            key="add-assets"
            onClick={() => handleAddAssets(disposal)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            title="Agregar bienes al expediente de baja"
          >
            📦 Agregar Bienes
          </button>,
          <button
            key="start-evaluation"
            onClick={() => handleStartEvaluation(disposal)}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            title="Iniciar evaluación técnica del expediente"
          >
            � Iniciar Evaluación
          </button>
        );
        break;

      case 'UNDER_EVALUATION':
        actions.push(
          <button
            key="add-opinion"
            onClick={() => handleAddOpinion(disposal)}
            className="px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 transition"
            title="Agregar opinión técnica sobre los bienes"
          >
            📋 Opinión Técnica
          </button>,
          <button
            key="resolve"
            onClick={() => handleResolve(disposal)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
            title="Aprobar o rechazar el expediente (solo Admin. Finanzas)"
          >
            ⚖️ Aprobar/Rechazar
          </button>
        );
        break;

      case 'APPROVED':
        actions.push(
          <button
            key="finalize"
            onClick={() => handleFinalize(disposal)}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            🏁 Finalizar
          </button>
        );
        break;

      case 'EXECUTED':
      case 'REJECTED':
      case 'CANCELLED':
        // No hay acciones disponibles para estos estados
        break;
    }

    // Botones comunes
    if (disposal.fileStatus !== 'EXECUTED') {
      actions.push(
        <button
          key="cancel"
          onClick={() => handleCancel(disposal)}
          className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 transition"
        >
          🚫 Cancelar
        </button>
      );
    }

    if (disposal.fileStatus === 'INITIATED') {
      actions.push(
        <button
          key="delete"
          onClick={() => handleDelete(disposal)}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          🗑️ Eliminar
        </button>
      );
    }

    return actions;
  };

  const getStatistics = () => {
    return {
      total: disposals.length,
      initiated: disposals.filter(d => d.fileStatus === 'INITIATED').length,
      underEvaluation: disposals.filter(d => d.fileStatus === 'UNDER_EVALUATION').length,
      approved: disposals.filter(d => d.fileStatus === 'APPROVED').length,
      executed: disposals.filter(d => d.fileStatus === 'EXECUTED').length,
    };
  };

  const stats = getStatistics();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              📋 Gestión de Bajas de Bienes Patrimoniales
            </h1>
            <p className="text-slate-600 mt-1">
              Administre los expedientes de baja de bienes patrimoniales
            </p>
          </div>
          <button
            onClick={handleCreateDisposal}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition shadow-lg"
          >
            ➕ Nuevo Expediente
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-slate-500">
            <p className="text-slate-600 text-sm">Total</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-slate-600 text-sm">Iniciados</p>
            <p className="text-2xl font-bold text-blue-600">{stats.initiated}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-slate-600 text-sm">En Evaluación</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.underEvaluation}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-slate-600 text-sm">Aprobados</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-slate-600 text-sm">Ejecutados</p>
            <p className="text-2xl font-bold text-purple-600">{stats.executed}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🔍 Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número o motivo..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📊 Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Todos</option>
              {DISPOSAL_STATUS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📁 Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Todos</option>
              {DISPOSAL_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            Cargando expedientes...
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadDisposals}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : filteredDisposals.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500">No se encontraron expedientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Expediente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredDisposals.map(disposal => (
                  <tr key={disposal.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {disposal.fileNumber}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-1">
                          {disposal.disposalReason}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(disposal.disposalType)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(disposal.fileStatus)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(disposal.expeditionDate).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {getActionButtons(disposal)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDisposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadDisposals();
          setShowCreateModal(false);
        }}
      />

      {selectedDisposal && (
        <>
          <AddAssetsToDisposalModal
            isOpen={showAddAssetsModal}
            onClose={() => {
              setShowAddAssetsModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowAddAssetsModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
          />

          <StartEvaluationModal
            isOpen={showStartEvaluationModal}
            onClose={() => {
              setShowStartEvaluationModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowStartEvaluationModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
          />

          <TechnicalOpinionModal
            isOpen={showTechnicalOpinionModal}
            onClose={() => {
              setShowTechnicalOpinionModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowTechnicalOpinionModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
            currentUserId={user?.id}
          />

          <ResolveDisposalModal
            isOpen={showResolveModal}
            onClose={() => {
              setShowResolveModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowResolveModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
          />
        </>
      )}
    </div>
  );
}
