import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  EyeIcon,
  InformationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import handoverReceiptService from '../../services/handoverReceiptService';

const statusConfig = {
  GENERATED: {
    label: 'Generado',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: DocumentTextIcon,
    bgColor: 'bg-blue-500'
  },
  PARTIALLY_SIGNED: {
    label: 'Parcialmente Firmado',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ClockIcon,
    bgColor: 'bg-amber-500'
  },
  FULLY_SIGNED: {
    label: 'Completamente Firmado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircleIcon,
    bgColor: 'bg-emerald-500'
  },
  VOIDED: {
    label: 'Anulado',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircleIcon,
    bgColor: 'bg-red-500'
  }
};

export default function HandoverReceiptDetails({ 
  receiptId, 
  municipalityId,
  users = [],
  movements = [],
  onClose, 
  onEdit, 
  onSign 
}) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getUsernameById = (personId) => {
    if (!personId) return 'No asignado';
    const user = users.find(u => u.id === personId);
    return user ? user.username : 'No asignado';
  };

  const getMovementInfo = (movementId) => {
    if (!movementId) return 'N/A';
    const movement = movements.find(m => m.id === movementId);
    if (movement) {
      return `${movement.movementNumber} - ${movement.movementType || 'Sin tipo'}`;
    }
    return movementId.slice(-8); // Mostrar últimos 8 caracteres del ID si no se encuentra
  };

  useEffect(() => {
    if (receiptId && municipalityId) {
      loadReceiptDetails();
    }
  }, [receiptId, municipalityId]);

  const loadReceiptDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await handoverReceiptService.getHandoverReceiptById(receiptId, municipalityId);
      setReceipt(data);
    } catch (err) {
      setError('Error al cargar los detalles del acta');
      console.error('Error loading receipt details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Crear fecha directamente desde el string sin conversión de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('es-ES');
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.GENERATED;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${config.bgColor} mr-3`}></div>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${config.color}`}>
          <IconComponent className="w-4 h-4 mr-2" />
          {config.label}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg relative">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300"></div>
                <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-t-slate-700"></div>
                <div className="absolute inset-1.5 bg-white rounded-full opacity-30"></div>
                <svg className="absolute inset-4 h-4 w-4 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                SL-SIPREB
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">🏛️ One moment, please...</h3>
            <p className="text-slate-600 text-lg mb-2">Consultando documento oficial</p>
            <p className="text-slate-500">Accediendo al archivo municipal...</p>
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Error</h3>
              <button 
                onClick={onClose} 
                className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-1 transition-colors duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={loadReceiptDetails}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl mr-4">
                <DocumentTextIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Acta de Entrega-Recepción
                </h3>
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full inline-block">
                  <span className="text-sm font-medium">ID: {receipt.id.slice(-8)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-140px)] overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Información Principal */}
              <div className="xl:col-span-3 space-y-8">
                
                {/* Información General */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Información General</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Número de Acta</label>
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 text-blue-500 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">{receipt.receiptNumber}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</label>
                        <div>
                          {getStatusBadge(receipt.receiptStatus)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha del Acta</label>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-green-500 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">{formatDate(receipt.receiptDate)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Movimiento</label>
                        <div className="flex items-center">
                          <EyeIcon className="h-4 w-4 text-purple-500 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">
                            {receipt.movementNumber || getMovementInfo(receipt.movementId)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participantes */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <UserIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Participantes</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsable de Entrega</label>
                        <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="bg-green-100 p-2 rounded-full mr-3">
                            <UserIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{getUsernameById(receipt.deliveringResponsibleId)}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsable de Recepción</label>
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <UserIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{getUsernameById(receipt.receivingResponsibleId)}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Testigo 1</label>
                        <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="bg-purple-100 p-2 rounded-full mr-3">
                            <UserIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{getUsernameById(receipt.witness1Id)}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Testigo 2</label>
                        <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <div className="bg-orange-100 p-2 rounded-full mr-3">
                            <UserIcon className="h-4 w-4 text-orange-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{getUsernameById(receipt.witness2Id)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-amber-100 p-2 rounded-lg mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Observaciones</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Observaciones de Entrega</label>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px]">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                          {receipt.deliveryObservations || 'Sin observaciones'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Observaciones de Recepción</label>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px]">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                          {receipt.receptionObservations || 'Sin observaciones'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Condiciones Especiales</label>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px]">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                          {receipt.specialConditions || 'Sin condiciones especiales'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel Lateral */}
              <div className="xl:col-span-1 space-y-6">
                
                {/* Fechas de Firma */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                        <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Estado de Firmas</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Firma de Entrega</label>
                      <div className={`p-4 rounded-lg border ${receipt.deliverySignatureDate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center">
                          {receipt.deliverySignatureDate ? (
                            <>
                              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                              <div>
                                <p className="text-sm font-semibold text-green-700">Firmado</p>
                                <p className="text-xs text-gray-600">{formatDateTime(receipt.deliverySignatureDate)}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-semibold text-gray-500">Pendiente</p>
                                <p className="text-xs text-gray-400">Sin firmar</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Firma de Recepción</label>
                      <div className={`p-4 rounded-lg border ${receipt.receptionSignatureDate ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center">
                          {receipt.receptionSignatureDate ? (
                            <>
                              <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-3" />
                              <div>
                                <p className="text-sm font-semibold text-blue-700">Firmado</p>
                                <p className="text-xs text-gray-600">{formatDateTime(receipt.receptionSignatureDate)}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-semibold text-gray-500">Pendiente</p>
                                <p className="text-xs text-gray-400">Sin firmar</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documento PDF */}
                {receipt.pdfDocumentPath && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="bg-red-100 p-2 rounded-lg mr-3">
                          <DocumentArrowDownIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Documento</h4>
                      </div>
                    </div>
                    <div className="p-6">
                      <button className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200">
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* Información de Auditoría */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded-lg mr-3">
                        <InformationCircleIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Información de Auditoría</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Generado por</label>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{getUsernameById(receipt.generatedBy)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Creación</label>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(receipt.createdAt)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Actualización</label>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(receipt.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}