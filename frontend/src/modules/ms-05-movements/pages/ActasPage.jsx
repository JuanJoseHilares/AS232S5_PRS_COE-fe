import { useState, useEffect } from 'react';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import HandoverReceiptList from '../components/HandoverReceipt/HandoverReceiptList';
import HandoverReceiptForm from '../components/HandoverReceipt/HandoverReceiptForm';
import HandoverReceiptDetails from '../components/HandoverReceipt/HandoverReceiptDetails';
import HandoverReceiptSignature from '../components/HandoverReceipt/HandoverReceiptSignature';
import { useHandoverReceipts } from '../hooks/useHandoverReceipts';
import handoverUserService from '../services/handoverUserService';
import assetMovementService from '../services/assetMovementService';


export default function ActasPage() {
  // UUID real de municipio de tu base de datos
  const municipalityId = '24ad12a5-d9e5-4cdd-91f1-8fd0355c9473';
 
  const {
    receipts,
    loading,
    error,
    loadReceipts,
    createReceipt,
    updateReceiptData,
    signReceipt
  } = useHandoverReceipts(municipalityId);


  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [statusFilter, setStatusFilter] = useState('GENERATED');
  const [users, setUsers] = useState([]);
  const [availableMovements, setAvailableMovements] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);


  // Cargar usuarios y movimientos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUsers(true);
        setLoadingMovements(true);
       
        // Cargar usuarios
        const userData = await handoverUserService.getUsersByMunicipality(municipalityId);
        setUsers(userData);
        console.log('✅ Users loaded:', userData.length);
       
        // Cargar movimientos
        const movementsData = await assetMovementService.getAllMovements(municipalityId);
        setAvailableMovements(movementsData);
        console.log('✅ Movements loaded:', movementsData.length);
       
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setUsers([]);
        setAvailableMovements([]);
      } finally {
        setLoadingUsers(false);
        setLoadingMovements(false);
      }
    };


    loadData();
  }, [municipalityId]);


  const handleCreateNew = async () => {
    setSelectedReceipt(null);
   
    // Recargar movimientos antes de abrir el formulario
    try {
      setLoadingMovements(true);
      const movementsData = await assetMovementService.getAllMovements(municipalityId);
      console.log('🔄 Movements reloaded for form:', movementsData.length);
      setAvailableMovements(movementsData);
      setLoadingMovements(false);
    } catch (error) {
      console.error('Error reloading movements:', error);
      setLoadingMovements(false);
    }
   
    setShowForm(true);
  };


  const handleEdit = (receipt) => {
    setSelectedReceipt(receipt);
    setShowForm(true);
  };


  const handleView = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDetails(true);
  };


  const handleSign = (receipt) => {
    setSelectedReceipt(receipt);
    setShowSignature(true);
  };


  const handleFormSave = async (receiptData) => {
    try {
      if (selectedReceipt) {
        await updateReceiptData(selectedReceipt.id, receiptData);
      } else {
        await createReceipt(receiptData);
      }
      setShowForm(false);
      setSelectedReceipt(null);
      await loadReceipts();
    } catch (error) {
      console.error('Error saving receipt:', error);
    }
  };


  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedReceipt(null);
  };


  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedReceipt(null);
  };


  const handleSignatureComplete = async (signatureData) => {
    try {
      await signReceipt(selectedReceipt.id, signatureData);
    } catch (error) {
      console.error('Error signing receipt:', error);
    } finally {
      setShowSignature(false);
      setSelectedReceipt(null);
      await loadReceipts(); // Refresh the list siempre, incluso si hay error
    }
  };


  const handleSignatureCancel = () => {
    setShowSignature(false);
    setSelectedReceipt(null);
  };


  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'GENERATED', label: 'Generado' },
    { value: 'PARTIALLY_SIGNED', label: 'Parcialmente Firmado' },
    { value: 'FULLY_SIGNED', label: 'Completamente Firmado' },
    { value: 'VOIDED', label: 'Anulado' }
  ];


  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Actas de Entrega-Recepción
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de actas de entrega-recepción de bienes patrimoniales
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            disabled={loadingMovements || loadingUsers}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loadingMovements || loadingUsers
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {loadingMovements || loadingUsers ? 'Cargando datos...' : 'Nueva Acta'}
          </button>
        </div>


        {/* Filtros */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center">
            <FunnelIcon className="h-4 w-4 text-gray-400 mr-2" />
            <label className="text-sm font-medium text-gray-700 mr-2">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* Estado de Loading Global */}
      {loading && (
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
          <p className="text-slate-600 mb-1">Iniciando sistema municipal</p>
          <p className="text-slate-500 text-sm">Verificando permisos oficiales...</p>
          <div className="mt-4 flex space-x-1">
            <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      )}


      {/* Error Global */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={loadReceipts}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Lista de Actas */}
      {!loading && (
        <HandoverReceiptList
          receipts={statusFilter ? receipts.filter(r => r.receiptStatus === statusFilter) : receipts}
          users={users}
          loading={loading}
          error={error}
          onView={handleView}
          onEdit={handleEdit}
          onSign={handleSign}
          onRetry={loadReceipts}
        />
      )}


      {/* Formulario Modal */}
      {showForm && (() => {
        console.log('Rendering form with:', {
          movements: availableMovements,
          movementsLength: availableMovements?.length,
          users: users,
          usersLength: users?.length,
          loadingMovements,
          loadingUsers
        });
        return (
          <HandoverReceiptForm
            municipalityId={municipalityId}
            receipt={selectedReceipt}
            movements={availableMovements}
            users={users}
            loadingMovements={loadingMovements}
            loadingUsers={loadingUsers}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        );
      })()}


      {/* Detalles Modal */}
      {showDetails && selectedReceipt && (
        <HandoverReceiptDetails
          receiptId={selectedReceipt.id}
          municipalityId={municipalityId}
          users={users}
          movements={availableMovements}
          onClose={handleDetailsClose}
          onEdit={handleEdit}
          onSign={handleSign}
        />
      )}


      {/* Firma Modal */}
      {showSignature && selectedReceipt && (
        <HandoverReceiptSignature
          receipt={selectedReceipt}
          municipalityId={municipalityId}
          onSigned={handleSignatureComplete}
          onCancel={handleSignatureCancel}
        />
      )}
    </div>
  );
}


