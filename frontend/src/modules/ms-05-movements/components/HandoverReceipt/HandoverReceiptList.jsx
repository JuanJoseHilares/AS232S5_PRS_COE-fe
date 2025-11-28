import { 
  EyeIcon, 
  PencilIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

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

export default function HandoverReceiptList({ 
  receipts = [],
  users = [],
  loading = false,
  error = null,
  onView, 
  onEdit, 
  onSign,
  onRetry
}) {

  const getUsernameById = (personId) => {
    if (!personId) return 'No asignado';
    const user = users.find(u => u.id === personId);
    return user ? user.username : 'No asignado';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Crear fecha directamente desde el string sin conversión de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.GENERATED;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${config.bgColor} mr-2`}></div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
          <IconComponent className="w-3.5 h-3.5 mr-1.5" />
          {config.label}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-lg shadow-sm">
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-full w-20 h-20 mb-6 flex items-center justify-center shadow-lg relative">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-300"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-10 w-10 border-4 border-t-slate-700"></div>
            <div className="absolute inset-1.5 bg-white rounded-full opacity-30"></div>
            <svg className="absolute inset-3.5 h-3 w-3 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            SL-SIPREB
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">🏛️ One moment, please...</h3>
        <p className="text-slate-600 mb-1">Consultando archivo municipal</p>
        <p className="text-slate-500 text-sm">Verificando documentos oficiales...</p>
        <div className="mt-4 flex space-x-1">
          <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
              onClick={onRetry}
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Actas de Entrega-Recepción
              </h3>
              <p className="text-sm text-gray-600">
                Gestión y seguimiento de actas patrimoniales
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                {receipts.length} {receipts.length === 1 ? 'acta' : 'actas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actas de entrega-recepción</h3>
          <p className="text-gray-500 mb-1 max-w-md mx-auto">
            Aún no se han creado actas de entrega-recepción para este municipio.
          </p>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Haz clic en "Nueva Acta" para crear la primera.
          </p>
          <div className="flex items-center justify-center">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-400">Esperando contenido...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Número de Acta
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Fecha
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Responsable Entrega
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Responsable Recepción
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {receipts
                .sort((a, b) => a.receiptNumber.localeCompare(b.receiptNumber))
                .map((receipt, index) => (
                <tr key={receipt.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{receipt.receiptNumber}</div>
                        <div className="text-xs text-gray-500">Acta #{receipt.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-medium">{formatDate(receipt.receiptDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getStatusBadge(receipt.receiptStatus)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-1.5 rounded-full mr-2">
                        <UserIcon className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-900">{getUsernameById(receipt.deliveringResponsibleId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-1.5 rounded-full mr-2">
                        <UserIcon className="h-3 w-3 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-900">{getUsernameById(receipt.receivingResponsibleId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-1">
                      <button
                        onClick={() => onView && onView(receipt)}
                        className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {receipt.receiptStatus !== 'FULLY_SIGNED' && receipt.receiptStatus !== 'VOIDED' && (
                        <>
                          <button
                            onClick={() => onEdit && onEdit(receipt)}
                            className="inline-flex items-center p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors duration-200"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => onSign && onSign(receipt)}
                            className="inline-flex items-center p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                            title="Firmar"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}