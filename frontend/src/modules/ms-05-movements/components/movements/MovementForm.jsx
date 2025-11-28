import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon,
  TagIcon,
  CubeIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  PaperClipIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { MovementType, MovementTypeLabels, MovementStatus } from '../../types/movementTypes';
import authService from '../../../ms-02-authentication/services/auth.service';
import { getBienPatrimonialById } from '../../../ms-04-patrimonio/services/api';
import assetMovementService from '../../services/assetMovementService';
import { 
  uploadMultipleMovementDocuments, 
  prepareAttachedDocuments,
  parseAttachedDocuments,
  getFileIcon,
  formatFileSize
} from '../../services/movementDocumentService';

export default function MovementForm({
  municipalityId,
  movement = null,
  onSave,
  onCancel,
  assets = [],
  users = [],
  persons = [],
  areas = [],
  locations = [],
  loadingData = false
}) {
  // Estado para los activos a mostrar en el dropdown
  const [displayAssets, setDisplayAssets] = useState([]);
  
  // PRIMERO: Actualizar displayAssets cuando cambien los assets - SIEMPRE mostrar los assets disponibles
  useEffect(() => {
    console.log('🔄 Assets changed, updating displayAssets...', assets?.length || 0);
    if (assets && Array.isArray(assets)) {
      // SIEMPRE actualizar con los assets disponibles
      setDisplayAssets(assets);
      console.log('✅ Display assets updated with', assets.length, 'assets');
    } else {
      setDisplayAssets([]);
    }
  }, [assets]);
  
  // SEGUNDO: Si estamos editando y el activo actual no está en la lista, intentar cargarlo
  useEffect(() => {
    const loadCurrentAssetIfNeeded = async () => {
      // Si no estamos editando, no hacer nada
      if (!movement || !movement.assetId) {
        return;
      }
      
      // Si no hay assets cargados todavía, esperar
      if (!assets || assets.length === 0) {
        console.log('⏳ Waiting for assets to load before checking current asset...');
        return;
      }
      
      // Verificar si el activo actual está en la lista
      const assetInList = assets.find(a => {
        const assetId = a.id || a.assetId || a.uuid;
        return assetId === movement.assetId;
      });
      
      if (!assetInList) {
        console.log('⚠️ Current asset not in list, attempting to load it...', movement.assetId);
        try {
          const currentAsset = await getBienPatrimonialById(movement.assetId);
          console.log('✅ Current asset loaded:', currentAsset);
          // Agregar el activo actual al inicio de la lista
          setDisplayAssets(prev => {
            // Evitar duplicados
            const exists = prev.some(a => {
              const assetId = a.id || a.assetId || a.uuid;
              return assetId === movement.assetId;
            });
            if (exists) {
              console.log('✅ Asset already in display list');
              return prev;
            }
            console.log('✅ Adding current asset to display list');
            return [currentAsset, ...prev];
          });
        } catch (error) {
          console.error('❌ Error loading current asset (asset may not exist):', error);
          // NO bloquear - los assets disponibles ya están en displayAssets
          console.warn('⚠️ El activo del movimiento no existe. Los activos disponibles se muestran en la lista.');
          // Asegurarse de que displayAssets tenga los assets disponibles (ya deberían estar)
          if (assets && assets.length > 0 && displayAssets.length === 0) {
            setDisplayAssets(assets);
          }
        }
      } else {
        console.log('✅ Current asset is already in the list');
      }
    };
    
    // Ejecutar cuando tengamos el movement y los assets estén cargados
    if (!loadingData) {
      if (movement && movement.assetId) {
        if (assets && assets.length > 0) {
          loadCurrentAssetIfNeeded();
        } else {
          console.log('⏳ Assets not loaded yet, will check when they load');
        }
      }
    }
  }, [movement, assets, loadingData]);
  
  const [formData, setFormData] = useState({
    municipalityId: municipalityId,
    // movementNumber NO se incluye en el estado inicial - se genera automáticamente
    assetId: '',
    movementType: MovementType.REASSIGNMENT,
    movementSubtype: '',
    originResponsibleId: '',
    destinationResponsibleId: '',
    originAreaId: '',
    destinationAreaId: '',
    originLocationId: '',
    destinationLocationId: '',
    reason: '',
    observations: '',
    specialConditions: '',
    supportingDocumentNumber: '',
    supportingDocumentType: '',
    attachedDocuments: '',
    requiresApproval: true,
    movementStatus: MovementStatus.REQUESTED,
    requestingUser: '',
    executingUser: ''
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingAssetLocation, setLoadingAssetLocation] = useState(false);
  const [assetLocationLoaded, setAssetLocationLoaded] = useState(false);
  const [isFirstAssignment, setIsFirstAssignment] = useState(false);
  const [activeTab, setActiveTab] = useState('basica');
  
  // Estados para subida de documentos
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Obtener usuario actual logueado
    const currentUser = authService.getCurrentUser();
    const currentUserId = currentUser?.userId || currentUser?.id || 
                         (currentUser?.sub ? currentUser.sub : null) ||
                         (() => {
                           // Intentar obtener del localStorage directamente
                           try {
                             const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
                             return storedUser?.userId || storedUser?.id || null;
                           } catch {
                             return null;
                           }
                         })();

    if (movement) {
      // Si estamos editando, usar los valores del movimiento
      setFormData({
        municipalityId: movement.municipalityId || municipalityId,
        movementNumber: movement.movementNumber || '',
        assetId: movement.assetId || '',
        movementType: movement.movementType || MovementType.REASSIGNMENT,
        movementSubtype: movement.movementSubtype || '',
        originResponsibleId: movement.originResponsibleId || '',
        destinationResponsibleId: movement.destinationResponsibleId || '',
        originAreaId: movement.originAreaId || '',
        destinationAreaId: movement.destinationAreaId || '',
        originLocationId: movement.originLocationId || '',
        destinationLocationId: movement.destinationLocationId || '',
        reason: movement.reason || '',
        observations: movement.observations || '',
        specialConditions: movement.specialConditions || '',
        supportingDocumentNumber: movement.supportingDocumentNumber || '',
        supportingDocumentType: movement.supportingDocumentType || '',
        attachedDocuments: movement.attachedDocuments || '',
        requiresApproval: movement.requiresApproval !== undefined ? movement.requiresApproval : true,
        movementStatus: movement.movementStatus || MovementStatus.REQUESTED,
        requestingUser: movement.requestingUser || '',
        executingUser: movement.executingUser || ''
      });
      
      // Parsear documentos existentes si hay
      if (movement.attachedDocuments) {
        try {
          const parsedDocs = parseAttachedDocuments(movement.attachedDocuments);
          console.log('📎 Documentos parseados del movimiento:', parsedDocs);
          setUploadedDocuments(parsedDocs);
        } catch (error) {
          console.error('❌ Error al parsear documentos del movimiento:', error);
          setUploadedDocuments([]);
        }
      } else {
        setUploadedDocuments([]);
      }
    } else {
      // Si es un nuevo movimiento, pre-seleccionar el usuario ejecutor con el usuario actual
      // NOTA: requestingUser NO se pre-rellena - el usuario debe seleccionar una persona
      setFormData(prev => ({
        ...prev,
        // requestingUser: NO se pre-rellena - debe seleccionarse de la lista de personas
        executingUser: currentUserId || prev.executingUser, // Pre-rellenar con el usuario logueado
        municipalityId: municipalityId
      }));
      // Limpiar documentos para nuevo movimiento
      setUploadedDocuments([]);
      setSelectedFiles([]);
    }
  }, [movement, municipalityId]);
  
  // Debug: Ver qué datos están llegando (después de que formData esté inicializado)
  useEffect(() => {
    console.log('📊 MovementForm Debug Info:');
    console.log('  👥 Users count:', users.length);
    if (users.length > 0) {
      console.log('  👥 First user:', {
        id: users[0].id || users[0].userId || users[0].uuid,
        firstName: users[0].firstName || users[0].first_name,
        lastName: users[0].lastName || users[0].last_name,
        email: users[0].email
      });
    }
    console.log('  👤 Persons count:', persons.length);
    if (persons.length > 0) {
      console.log('  👤 First person:', {
        id: persons[0].id || persons[0].personId || persons[0].uuid,
        firstName: persons[0].firstName || persons[0].first_name,
        lastName: persons[0].lastName || persons[0].last_name
      });
    }
    console.log('  📦 Assets count:', assets.length);
    console.log('  📦 Display assets count:', displayAssets.length);
    console.log('  ⏳ Loading data:', loadingData);
    console.log('  ✏️ Editing movement:', !!movement);
    if (movement) {
      console.log('  ✏️ Movement assetId:', movement.assetId);
      console.log('  ✏️ FormData assetId:', formData.assetId);
      const assetInList = displayAssets.some(a => {
        const assetId = a.id || a.assetId || a.uuid;
        return assetId === movement.assetId;
      });
      console.log('  ✏️ Is asset in display list?', assetInList);
    }
    
    if (displayAssets.length > 0) {
      console.log('  📦 First display asset:', {
        id: displayAssets[0].id || displayAssets[0].assetId || displayAssets[0].uuid,
        code: displayAssets[0].assetCode || displayAssets[0].code,
        description: displayAssets[0].description || displayAssets[0].descripcion
      });
    }
  }, [users, persons, assets, displayAssets, movement, loadingData, formData.assetId]);

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Si se selecciona un activo y NO estamos editando un movimiento existente, auto-completar origen
    if (name === 'assetId' && value && !movement) {
      // Limpiar campos de origen primero
      setFormData(prev => ({
        ...prev,
        originAreaId: '',
        originLocationId: '',
        originResponsibleId: ''
      }));
      setIsFirstAssignment(false);
      // Luego cargar la ubicación actual del activo
      await loadCurrentAssetLocation(value);
    } else if (name === 'assetId' && !value && !movement) {
      // Si se deselecciona el activo, limpiar campos de origen
      setFormData(prev => ({
        ...prev,
        originAreaId: '',
        originLocationId: '',
        originResponsibleId: ''
      }));
      setIsFirstAssignment(false);
    }
  };

  const loadCurrentAssetLocation = async (assetId) => {
    if (!assetId || !municipalityId) return;
    
    try {
      setLoadingAssetLocation(true);
      setAssetLocationLoaded(false);
      console.log('🔍 Buscando ubicación actual del activo:', assetId);
      
      // Obtener todos los movimientos del activo
      const movements = await assetMovementService.getMovementsByAsset(assetId, municipalityId);
      
      if (!movements || movements.length === 0) {
        console.log('ℹ️ No se encontraron movimientos para este activo - es un activo nuevo sin historial');
        setIsFirstAssignment(true);
        // Limpiar campos de origen si no hay movimientos
        setFormData(prev => ({
          ...prev,
          originAreaId: '',
          originLocationId: '',
          originResponsibleId: ''
        }));
        setLoadingAssetLocation(false);
        return;
      }
      
      setIsFirstAssignment(false);

      // Primero intentar buscar el último movimiento completado (más confiable)
      const completedMovements = movements
        .filter(mov => mov.movementStatus === 'COMPLETED')
        .sort((a, b) => {
          const dateA = new Date(a.receptionDate || a.executionDate || a.requestDate || 0);
          const dateB = new Date(b.receptionDate || b.executionDate || b.requestDate || 0);
          return dateB - dateA; // Más reciente primero
        });

      let movementToUse = null;

      if (completedMovements.length > 0) {
        // Usar el último movimiento completado
        movementToUse = completedMovements[0];
        console.log('✅ Último movimiento completado encontrado:', movementToUse);
      } else {
        // Si no hay completados, buscar el último movimiento con información de destino
        // Excluir movimientos cancelados o rechazados
        const validMovements = movements
          .filter(mov => {
            const status = mov.movementStatus;
            return status !== 'CANCELLED' && status !== 'REJECTED' && 
                   (mov.destinationAreaId || mov.destinationLocationId || mov.destinationResponsibleId);
          })
          .sort((a, b) => {
            const dateA = new Date(a.requestDate || a.executionDate || a.receptionDate || 0);
            const dateB = new Date(b.requestDate || b.executionDate || b.receptionDate || 0);
            return dateB - dateA; // Más reciente primero
          });

        if (validMovements.length > 0) {
          movementToUse = validMovements[0];
          console.log('✅ Último movimiento válido encontrado (no completado):', movementToUse);
        } else {
          console.log('ℹ️ No se encontraron movimientos válidos con información de destino');
          setIsFirstAssignment(true);
          // Limpiar campos de origen si no hay movimientos válidos
          setFormData(prev => ({
            ...prev,
            originAreaId: '',
            originLocationId: '',
            originResponsibleId: ''
          }));
          setLoadingAssetLocation(false);
          return;
        }
      }

      // Auto-completar campos de origen con el destino del movimiento encontrado
      if (movementToUse) {
        const originData = {
          originAreaId: movementToUse.destinationAreaId || '',
          originLocationId: movementToUse.destinationLocationId || '',
          originResponsibleId: movementToUse.destinationResponsibleId || ''
        };

        setFormData(prev => ({
          ...prev,
          ...originData
        }));
        
        setAssetLocationLoaded(true);
        console.log('✅ Campos de origen auto-completados:', originData);
        
        // Ocultar el mensaje después de 5 segundos
        setTimeout(() => {
          setAssetLocationLoaded(false);
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Error al cargar la ubicación actual del activo:', error);
      // No mostrar error al usuario, simplemente no auto-completar
      setIsFirstAssignment(true);
    } finally {
      setLoadingAssetLocation(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    // NO validar movementNumber - se genera automáticamente en el backend
    // Solo validar si estamos editando (el campo estará visible pero no requerido)
    
    if (!formData.assetId) {
      newErrors.assetId = 'El activo es requerido';
    }
    if (!formData.movementType) {
      newErrors.movementType = 'El tipo de movimiento es requerido';
    }
    
    // Validación de Motivo (requerido)
    const reasonTrimmed = formData.reason ? formData.reason.trim() : '';
    if (!reasonTrimmed) {
      newErrors.reason = 'El motivo es requerido';
    } else if (reasonTrimmed.length < 10) {
      newErrors.reason = 'El motivo debe tener al menos 10 caracteres';
    } else if (reasonTrimmed.length > 500) {
      newErrors.reason = 'El motivo no puede exceder 500 caracteres';
    }
    
    // Validación de Observaciones (opcional pero con límite)
    if (formData.observations && formData.observations.trim().length > 1000) {
      newErrors.observations = 'Las observaciones no pueden exceder 1000 caracteres';
    }
    
    // Validación de Condiciones Especiales (opcional pero con límite)
    if (formData.specialConditions && formData.specialConditions.trim().length > 500) {
      newErrors.specialConditions = 'Las condiciones especiales no pueden exceder 500 caracteres';
    }
    
    if (!formData.requestingUser) {
      newErrors.requestingUser = 'La persona solicitante es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar selección de archivos
  const processFiles = (files) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    
    // Validar cantidad máxima (10 archivos)
    if (selectedFiles.length + uploadedDocuments.length + fileArray.length > 10) {
      setUploadError('Máximo 10 archivos permitidos');
      return;
    }
    
    // Validar tamaño de cada archivo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = fileArray.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      setUploadError(`Algunos archivos exceden el tamaño máximo de 10MB: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...fileArray]);
    setUploadError(null);
  };

  const handleFileChange = (event) => {
    processFiles(event.target.files);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handlers para drag & drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadingFiles && !saving && (selectedFiles.length + uploadedDocuments.length < 10)) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (uploadingFiles || saving) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  // Eliminar archivo seleccionado
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Eliminar documento ya subido
  const removeUploadedDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSaving(true);
    setErrors({}); // Limpiar errores previos
    setUploadError(null);
    
    try {
      // Obtener usuario actual para attachedDocuments
      const currentUser = authService.getCurrentUser();
      const currentUserId = currentUser?.userId || currentUser?.id || 
                           (currentUser?.sub ? currentUser.sub : null) ||
                           (() => {
                             try {
                               const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
                               return storedUser?.userId || storedUser?.id || null;
                             } catch {
                               return null;
                             }
                           })();

      // Si hay archivos seleccionados, subirlos primero
      let documentsToAttach = [...uploadedDocuments];
      console.log('📎 Documentos ya subidos:', uploadedDocuments);
      console.log('📎 Archivos seleccionados:', selectedFiles.length);
      
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        try {
          console.log('📤 Subiendo archivos...');
          const uploaded = await uploadMultipleMovementDocuments(
            selectedFiles,
            movement?.id || null, // movementId solo si estamos editando
            municipalityId,
            currentUserId
          );
          
          console.log('✅ Archivos subidos exitosamente:', uploaded);
          
          // Verificar si se subieron archivos exitosamente
          if (uploaded.length > 0) {
            documentsToAttach = [...documentsToAttach, ...uploaded];
            console.log('📎 Total de documentos a adjuntar:', documentsToAttach.length);
            
            // Limpiar archivos seleccionados después de subirlos exitosamente
            setSelectedFiles([]);
            // Actualizar la lista de documentos subidos para mostrarlos en la UI
            setUploadedDocuments(documentsToAttach);
          } else {
            // Si no se subió ningún archivo, mostrar advertencia pero permitir continuar
            console.warn('⚠️ No se pudieron subir los archivos, pero se continuará guardando el movimiento');
            setUploadError('Advertencia: No se pudieron subir los archivos. El movimiento se guardará sin documentos adjuntos. Puede intentar agregarlos después editando el movimiento.');
            // No retornar aquí - permitir que el movimiento se guarde sin documentos
          }
        } catch (error) {
          console.error('❌ Error uploading files:', error);
          // Mostrar error pero permitir continuar (los documentos son opcionales)
          setUploadError('Advertencia: Error al subir archivos. El movimiento se guardará sin documentos adjuntos. Puede intentar agregarlos después editando el movimiento.');
          // NO retornar aquí - permitir que el movimiento se guarde sin documentos
        } finally {
          setUploadingFiles(false);
        }
      }

      // Preparar datos del formulario
      // Asegurar que todos los documentos tengan el formato correcto
      const normalizedDocuments = documentsToAttach.map(doc => ({
        fileName: doc.fileName || doc.name || 'Documento sin nombre',
        fileUrl: doc.fileUrl || doc.url || '',
        fileType: doc.fileType || doc.type || '',
        fileSize: doc.fileSize || doc.size || 0,
        uploadedAt: doc.uploadedAt || new Date().toISOString(),
        uploadedBy: doc.uploadedBy || currentUserId || null,
      }));
      
      // Preparar attachedDocuments como JSON string
      // El backend espera un String, no un Array
      const attachedDocumentsString = normalizedDocuments.length > 0 
        ? JSON.stringify(normalizedDocuments) 
        : null; // Usar null en lugar de undefined para que se envíe correctamente
      
      console.log('📄 attachedDocuments preparado:', attachedDocumentsString);
      console.log('📄 Tipo:', typeof attachedDocumentsString);
      console.log('📄 Es string JSON válido?', attachedDocumentsString ? (() => { try { JSON.parse(attachedDocumentsString); return true; } catch { return false; } })() : 'N/A');
      console.log('📄 Documentos normalizados:', normalizedDocuments);
      
      const dataToSave = {
        ...formData,
        // NO incluir movementNumber si es un nuevo movimiento (se genera automáticamente)
        ...(movement ? {} : { movementNumber: undefined }),
        // Preparar attachedDocuments como JSON string (el backend espera String, no Array)
        attachedDocuments: attachedDocumentsString
      };
      
      // Eliminar movementNumber del objeto si es undefined
      if (!movement && dataToSave.movementNumber === undefined) {
        delete dataToSave.movementNumber;
      }

      console.log('💾 Saving movement data:', dataToSave);
      console.log('💾 attachedDocuments en dataToSave:', dataToSave.attachedDocuments);
      await onSave(dataToSave);
      // Si onSave no lanza error, el formulario se cierra automáticamente
    } catch (error) {
      console.error('❌ Error saving movement:', error);
      const errorMessage = error.message || 'Error al guardar el movimiento';
      setErrors({ submit: errorMessage });
      // No cerrar el formulario si hay error
    } finally {
      setSaving(false);
    }
  };

  const movementTypeOptions = Object.entries(MovementTypeLabels).map(([value, label]) => ({
    value,
    label
  }));

  // Definir las tabs del formulario con iconos
  const tabs = [
    { 
      id: 'basica', 
      label: 'Información Básica',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'origen-destino', 
      label: 'Origen y Destino',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 'usuarios-detalles', 
      label: 'Usuarios y Detalles',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      id: 'documentacion', 
      label: 'Documentación',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header sobrio */}
        <div className="sticky top-0 bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-700 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {movement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {movement ? 'Modifica la información del movimiento' : 'Completa los datos para crear un nuevo movimiento'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-300 hover:text-white hover:bg-slate-700 rounded-md p-1.5 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6 pt-4 border-b border-gray-200 bg-white">
          <nav className="flex space-x-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id ? { backgroundColor: '#334155' } : {}}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenedor con scroll */}
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          <form id="movement-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* TAB 1: INFORMACIÓN BÁSICA */}
            {activeTab === 'basica' && (
              <>
            {/* Sección: Información Básica */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span>Información Básica</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número de Movimiento - Solo mostrar en edición */}
                {movement && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <TagIcon className="h-4 w-4 text-gray-500" />
                      <span>Número de Movimiento</span>
                    </label>
                    <input
                      type="text"
                      name="movementNumber"
                      value={formData.movementNumber || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-600 focus:outline-none transition-all bg-gray-50 cursor-not-allowed"
                      placeholder="Se generará automáticamente"
                      disabled={true}
                      readOnly
                    />
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      El número de movimiento se genera automáticamente al crear
                    </p>
                  </div>
                )}
                
                {/* Mensaje informativo para nuevos movimientos */}
                {!movement && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Número de Movimiento Automático</p>
                        <p className="text-xs text-blue-600 mt-0.5">El número de movimiento se generará automáticamente al guardar.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CubeIcon className="h-4 w-4 text-gray-500" />
                    <span>Activo <span className="text-red-500">*</span></span>
                  </label>
                  <select
                    name="assetId"
                    value={formData.assetId || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-md text-gray-800 focus:outline-none transition-all bg-white ${
                      errors.assetId 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                  >
                <option value="">Seleccionar activo</option>
                {loadingData ? (
                  <option value="" disabled>Cargando activos...</option>
                ) : displayAssets.length === 0 ? (
                  <option value="" disabled>No hay activos disponibles</option>
                ) : (
                  displayAssets.map((asset, index) => {
                    const assetId = asset.id || asset.assetId || asset.uuid;
                    const assetCode = asset.assetCode || asset.code || asset.codigoPatrimonial || '';
                    const description = asset.description || asset.descripcion || asset.name || '';
                    const status = asset.assetStatus || asset.estadoBien || '';
                    const statusLabel = status === 'DISPONIBLE' ? 'Disponible' : 
                                      status === 'IN_USE' || status === 'EN_USO' ? 'En Uso' : 
                                      status || 'N/A';
                    
                    if (!assetId) {
                      console.warn('⚠️ Asset without ID at index', index, ':', asset);
                      return null; // No renderizar opciones sin ID
                    }
                    
                    return (
                      <option key={assetId} value={assetId}>
                        {assetCode ? `${assetCode} - ` : ''}{description}
                        {status ? ` [${statusLabel}]` : ''}
                      </option>
                    );
                  }).filter(Boolean) // Filtrar nulls
                )}
              </select>
                  {errors.assetId && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.assetId}
                    </p>
                  )}
                  {displayAssets.length > 0 && (
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {movement 
                        ? 'Se muestra el activo actual del movimiento y otros activos disponibles.' 
                        : 'Se muestran activos disponibles y en uso. Los activos en uso pueden ser reasignados o transferidos.'}
                    </p>
                  )}
                </div>

                {/* Tipo de Movimiento */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 text-gray-500" />
                    <span>Tipo de Movimiento <span className="text-red-500">*</span></span>
                  </label>
                  <select
                    name="movementType"
                    value={formData.movementType}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-md text-gray-800 focus:outline-none transition-all bg-white ${
                      errors.movementType 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                  >
                {movementTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
                  {errors.movementType && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.movementType}
                    </p>
                  )}
                </div>

                {/* Subtipo de Movimiento */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-500" />
                    <span>Subtipo de Movimiento</span>
                  </label>
                  <input
                    type="text"
                    name="movementSubtype"
                    value={formData.movementSubtype}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                    placeholder="Ej: TRANSFERENCIA_POR_ASCENSO"
                  />
                </div>
              </div>
            </div>
              </>
            )}

            {/* TAB 2: ORIGEN Y DESTINO */}
            {activeTab === 'origen-destino' && (
              <>
            {/* Sección: Responsables y Ubicaciones */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span>Responsables y Ubicaciones</span>
                </h3>
                {loadingAssetLocation && (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                    <span>Cargando ubicación actual...</span>
                  </div>
                )}
                {assetLocationLoaded && !loadingAssetLocation && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-md border border-green-200">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ubicación actual cargada</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Responsable Origen */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span>
                      Responsable Origen
                      {isFirstAssignment && (
                        <span className="ml-2 text-xs font-normal text-gray-500 italic">(Opcional - Primera asignación)</span>
                      )}
                    </span>
                  </label>
                  <select
                    name="originResponsibleId"
                    value={formData.originResponsibleId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                  >
                <option value="">
                  {isFirstAssignment 
                    ? "Seleccionar responsable (opcional - puede estar en almacén/patrimonio)" 
                    : "Seleccionar responsable"}
                </option>
                {loadingData ? (
                  <option value="" disabled>Cargando responsables...</option>
                ) : persons.length === 0 ? (
                  <option value="" disabled>No hay personas disponibles</option>
                ) : (
                  persons.map(person => {
                    const personId = person.id || person.personId || person.uuid;
                    const firstName = person.firstName || person.first_name || '';
                    const middleName = person.middleName || person.middle_name || '';
                    const lastName = person.lastName || person.last_name || '';
                    const businessName = person.businessName || person.business_name || '';
                    const personType = person.personType || person.person_type || '';
                    
                    if (!personId) {
                      console.warn('⚠️ Person without ID:', person);
                      return null;
                    }
                    
                    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Sin nombre';
                    const displayText = personType === 'J' || personType === 'JURIDICA' 
                      ? `${fullName}${businessName ? ` (${businessName})` : ' (Jurídica)'}`
                      : fullName;
                    
                    return (
                      <option key={personId} value={personId}>
                        {displayText}
                      </option>
                    );
                  }).filter(Boolean)
                )}
              </select>
              {isFirstAssignment && (
                <p className="mt-1.5 text-xs text-blue-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Primera asignación: El bien puede estar en almacén/depósito municipal sin responsable asignado.
                </p>
              )}
            </div>

                {/* Responsable Destino */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span>Responsable Destino</span>
                  </label>
                  <select
                    name="destinationResponsibleId"
                    value={formData.destinationResponsibleId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                  >
                <option value="">Seleccionar responsable</option>
                {loadingData ? (
                  <option value="" disabled>Cargando responsables...</option>
                ) : persons.length === 0 ? (
                  <option value="" disabled>No hay personas disponibles</option>
                ) : (
                  persons.map(person => {
                    const personId = person.id || person.personId || person.uuid;
                    const firstName = person.firstName || person.first_name || '';
                    const middleName = person.middleName || person.middle_name || '';
                    const lastName = person.lastName || person.last_name || '';
                    const businessName = person.businessName || person.business_name || '';
                    const personType = person.personType || person.person_type || '';
                    
                    if (!personId) {
                      console.warn('⚠️ Person without ID:', person);
                      return null;
                    }
                    
                    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Sin nombre';
                    const displayText = personType === 'J' || personType === 'JURIDICA' 
                      ? `${fullName}${businessName ? ` (${businessName})` : ' (Jurídica)'}`
                      : fullName;
                    
                    return (
                      <option key={personId} value={personId}>
                        {displayText}
                      </option>
                    );
                  }).filter(Boolean)
                )}
              </select>
            </div>

                {/* Área Origen */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <BuildingOffice2Icon className="h-4 w-4 text-gray-500" />
                    <span>
                      Área Origen
                      {isFirstAssignment && (
                        <span className="ml-2 text-xs font-normal text-gray-500 italic">(Opcional - Primera asignación)</span>
                      )}
                    </span>
                  </label>
                  <select
                    name="originAreaId"
                    value={formData.originAreaId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                  >
                <option value="">Seleccionar área</option>
                {areas.length === 0 ? (
                  <option value="" disabled>No hay áreas disponibles</option>
                ) : (
                  areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.areaCode ? `${area.areaCode} - ` : ''}{area.name}
                    </option>
                  ))
                )}
              </select>
            </div>

                {/* Área Destino */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <BuildingOffice2Icon className="h-4 w-4 text-gray-500" />
                    <span>Área Destino</span>
                  </label>
                  <select
                    name="destinationAreaId"
                    value={formData.destinationAreaId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                  >
                <option value="">Seleccionar área</option>
                {areas.length === 0 ? (
                  <option value="" disabled>No hay áreas disponibles</option>
                ) : (
                  areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.areaCode ? `${area.areaCode} - ` : ''}{area.name}
                    </option>
                  ))
                )}
              </select>
            </div>

                {/* Ubicación Origen */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span>
                      Ubicación Origen
                      {isFirstAssignment && (
                        <span className="ml-2 text-xs font-normal text-gray-500 italic">(Opcional - Primera asignación)</span>
                      )}
                    </span>
                  </label>
                  <select
                    name="originLocationId"
                    value={formData.originLocationId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                  >
                <option value="">Seleccionar ubicación</option>
                {locations.length === 0 ? (
                  <option value="" disabled>No hay ubicaciones disponibles</option>
                ) : (
                  locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.locationCode ? `${location.locationCode} - ` : ''}{location.name}
                    </option>
                  ))
                )}
              </select>
            </div>

                {/* Ubicación Destino */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span>Ubicación Destino</span>
                  </label>
                  <select
                    name="destinationLocationId"
                    value={formData.destinationLocationId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                  >
                <option value="">Seleccionar ubicación</option>
                {locations.length === 0 ? (
                  <option value="" disabled>No hay ubicaciones disponibles</option>
                ) : (
                  locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.locationCode ? `${location.locationCode} - ` : ''}{location.name}
                    </option>
                  ))
                )}
              </select>
            </div>

              </div>
            </div>
              </>
            )}

            {/* TAB 3: USUARIOS Y DETALLES */}
            {activeTab === 'usuarios-detalles' && (
              <>
            {/* Sección: Usuarios */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span>Usuarios del Movimiento</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Usuario Solicitante - Usa personas como Responsable Origen */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserCircleIcon className="h-4 w-4 text-gray-500" />
                    <span>Usuario Solicitante <span className="text-red-500">*</span></span>
                  </label>
                  <select
                    name="requestingUser"
                    value={formData.requestingUser}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-md text-gray-800 focus:outline-none transition-all bg-white ${
                      errors.requestingUser 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                  >
                <option value="">Seleccionar persona</option>
                {loadingData ? (
                  <option value="" disabled>Cargando personas...</option>
                ) : persons.length === 0 ? (
                  <option value="" disabled>No hay personas disponibles</option>
                ) : (
                  persons.map(person => {
                    const personId = person.id || person.personId || person.uuid;
                    const firstName = person.firstName || person.first_name || '';
                    const middleName = person.middleName || person.middle_name || '';
                    const lastName = person.lastName || person.last_name || '';
                    const businessName = person.businessName || person.business_name || '';
                    const personType = person.personType || person.person_type || '';
                    
                    if (!personId) {
                      console.warn('⚠️ Person without ID:', person);
                      return null;
                    }
                    
                    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Sin nombre';
                    const displayText = personType === 'J' || personType === 'JURIDICA' 
                      ? `${fullName}${businessName ? ` (${businessName})` : ' (Jurídica)'}`
                      : fullName;
                    
                    return (
                      <option key={personId} value={personId}>
                        {displayText}
                      </option>
                    );
                  }).filter(Boolean)
                )}
              </select>
                  {errors.requestingUser && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.requestingUser}
                    </p>
                  )}
                </div>

                {/* Usuario Ejecutor - Se rellena automáticamente con el usuario logueado y está deshabilitado */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserCircleIcon className="h-4 w-4 text-gray-500" />
                    <span>Usuario Ejecutor</span>
                  </label>
                  <select
                    name="executingUser"
                    value={formData.executingUser}
                    onChange={handleChange}
                    disabled={!movement} // Deshabilitado solo para nuevos movimientos
                    className={`w-full px-4 py-2.5 border rounded-md text-gray-800 focus:outline-none transition-all ${
                      !movement 
                        ? 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed' 
                        : 'border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white'
                    }`}
                  >
                <option value="">Seleccionar usuario</option>
                {loadingData ? (
                  <option value="" disabled>Cargando usuarios...</option>
                ) : users.length === 0 ? (
                  <option value="" disabled>No hay usuarios disponibles</option>
                ) : (
                  users.map(user => {
                    // Manejar diferentes estructuras de datos
                    const userId = user.id || user.userId || user.uuid;
                    const firstName = user.firstName || user.first_name || user.name || '';
                    const lastName = user.lastName || user.last_name || user.surname || '';
                    const email = user.email || user.emailAddress || '';
                    const displayName = firstName && lastName 
                      ? `${firstName} ${lastName}` 
                      : firstName || lastName || user.username || user.userName || 'Usuario sin nombre';
                    
                    if (!userId) {
                      console.warn('⚠️ User without ID:', user);
                      return null;
                    }
                    
                    return (
                      <option key={userId} value={userId}>
                        {displayName}{email ? ` (${email})` : ''}
                      </option>
                    );
                  }).filter(Boolean)
                )}
              </select>
              {!movement && formData.executingUser && (
                <p className="mt-1.5 text-xs text-blue-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pre-rellenado automáticamente con el usuario actual del sistema.
                </p>
              )}
            </div>
              </div>
            </div>

            {/* Sección: Información Adicional */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span>Información Adicional</span>
              </h3>
              <div className="space-y-4">
                {/* Motivo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
                    <span>Motivo <span className="text-red-500">*</span></span>
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    className={`w-full px-4 py-2.5 border rounded-md text-gray-800 focus:outline-none transition-all resize-none bg-white ${
                      errors.reason 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                    placeholder="Describa el motivo del movimiento (mínimo 10 caracteres)"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    {errors.reason ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.reason}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Mínimo 10 caracteres
                      </p>
                    )}
                    <p className={`text-xs ${(formData.reason?.length || 0) > 450 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {formData.reason?.length || 0} / 500
                    </p>
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-gray-500" />
                    <span>Observaciones</span>
                  </label>
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    rows={3}
                    maxLength={1000}
                    className={`w-full px-4 py-2.5 border rounded-md text-gray-800 focus:outline-none transition-all resize-none bg-white ${
                      errors.observations 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                    placeholder="Observaciones adicionales (opcional)"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    {errors.observations ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.observations}
                      </p>
                    ) : (
                      <div></div>
                    )}
                    <p className={`text-xs ${(formData.observations?.length || 0) > 900 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {formData.observations?.length || 0} / 1000
                    </p>
                  </div>
                </div>

                {/* Condiciones Especiales */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                    <span>Condiciones Especiales</span>
                  </label>
                  <textarea
                    name="specialConditions"
                    value={formData.specialConditions}
                    onChange={handleChange}
                    rows={2}
                    maxLength={500}
                    className={`w-full px-4 py-2.5 border rounded-md text-gray-800 focus:outline-none transition-all resize-none bg-white ${
                      errors.specialConditions 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-slate-500 focus:border-slate-500'
                    }`}
                    placeholder="Condiciones especiales del movimiento (opcional)"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    {errors.specialConditions ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.specialConditions}
                      </p>
                    ) : (
                      <div></div>
                    )}
                    <p className={`text-xs ${(formData.specialConditions?.length || 0) > 450 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {formData.specialConditions?.length || 0} / 500
                    </p>
                  </div>
                </div>
              </div>
            </div>
              </>
            )}

            {/* TAB 4: DOCUMENTACIÓN */}
            {activeTab === 'documentacion' && (
              <>
            {/* Sección: Documentos */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span>Documentos de Soporte</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Número de Documento de Soporte */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-gray-500" />
                    <span>Número de Documento de Soporte</span>
                  </label>
                  <input
                    type="text"
                    name="supportingDocumentNumber"
                    value={formData.supportingDocumentNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                    placeholder="Número de documento"
                  />
                </div>

                {/* Tipo de Documento de Soporte */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
                    <span>Tipo de Documento de Soporte</span>
                  </label>
                  <input
                    type="text"
                    name="supportingDocumentType"
                    value={formData.supportingDocumentType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                    placeholder="Tipo de documento"
                  />
                </div>
              </div>

              {/* Sección: Documentos Adjuntos */}
              <div className="mt-6 pt-6 border-t border-gray-300">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                  Archivos Adjuntos
                </h4>
                
                {/* Upload Area */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subir documentos (Máx. 10 archivos, 10MB cada uno)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label 
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${
                        isDragging 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      } ${
                        uploadingFiles || saving || (selectedFiles.length + uploadedDocuments.length >= 10) 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-slate-500">
                          <span className="font-semibold">Click para subir</span> o arrastra archivos
                        </p>
                        <p className="text-xs text-slate-400">PDF, DOC, DOCX, JPG, PNG, XLS, XLSX</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                        onChange={handleFileChange}
                        disabled={uploadingFiles || saving || (selectedFiles.length + uploadedDocuments.length >= 10)}
                        className="hidden"
                        id="file-upload-input"
                      />
                    </label>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploadingFiles && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700">Subiendo archivos...</span>
                    </div>
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                )}

                {/* Archivos seleccionados (pendientes de subir) */}
                {selectedFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Archivos seleccionados ({selectedFiles.length}):
                    </p>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar archivo"
                            disabled={uploadingFiles || saving}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de archivos subidos */}
                {uploadedDocuments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Archivos subidos ({uploadedDocuments.length}/10):
                    </p>
                    {uploadedDocuments.map((doc, index) => {
                      const fileUrl = doc.fileUrl || doc.url;
                      const fileName = doc.fileName || doc.name || 'Documento sin nombre';
                      const fileSize = doc.fileSize || doc.size || 0;
                      const fileType = doc.fileType || doc.type || '';
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{getFileIcon(fileType)}</span>
                            <div className="flex-1 min-w-0">
                              {fileUrl ? (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                                >
                                  {fileName}
                                </a>
                              ) : (
                                <p className="text-sm font-medium text-slate-700 truncate">{fileName}</p>
                              )}
                              <p className="text-xs text-slate-500">{formatFileSize(fileSize)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadedDocument(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar archivo"
                            disabled={uploadingFiles || saving}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Configuración */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span>Configuración</span>
              </h3>
              <div className="flex items-center p-4 bg-white rounded-md border border-gray-300">
                <input
                  type="checkbox"
                  name="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={handleChange}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded cursor-pointer"
                />
                <label className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
                  Requiere aprobación
                </label>
                <p className="ml-2 text-xs text-gray-500">
                  (El movimiento necesitará ser aprobado antes de ejecutarse)
                </p>
              </div>
            </div>
              </>
            )}

            {/* Footer Profesional */}
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 -mx-6 -mb-6">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {movement ? 'Actualizar Movimiento' : 'Crear Movimiento'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

