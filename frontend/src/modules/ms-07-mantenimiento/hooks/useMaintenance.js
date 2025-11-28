import { useCallback, useState } from 'react';
import maintenanceService from '../services/maintenanceService';

/**
 * Hook personalizado para gestionar mantenimientos
 * @returns {Object} Estado y funciones para gestionar mantenimientos
 */
export const useMaintenance = () => {
    const [maintenances, setMaintenances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar todos los mantenimientos
    const fetchMaintenances = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await maintenanceService.getAllMaintenances();
            setMaintenances(data);
            return data;
        } catch (err) {
            setError(err.message);
            setMaintenances([]);
            console.error('Error fetching maintenances:', err);
            // Don't throw to prevent uncaught promise errors
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar mantenimientos por estado
    const fetchMaintenancesByStatus = useCallback(async (status) => {
        setLoading(true);
        setError(null);
        try {
            const data = await maintenanceService.getMaintenancesByStatus(status);
            setMaintenances(data);
            return data;
        } catch (err) {
            setError(err.message);
            setMaintenances([]);
            console.error('Error fetching maintenances by status:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener mantenimiento por ID
    const getMaintenanceById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await maintenanceService.getMaintenanceById(id);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear nuevo mantenimiento
    const createMaintenance = useCallback(async (maintenanceData) => {
        setLoading(true);
        setError(null);
        try {
            const newMaintenance = await maintenanceService.createMaintenance(maintenanceData);
            setMaintenances(prev => [...prev, newMaintenance]);
            return newMaintenance;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Actualizar mantenimiento
    const updateMaintenance = useCallback(async (id, maintenanceData) => {
        setLoading(true);
        setError(null);
        try {
            const updatedMaintenance = await maintenanceService.updateMaintenance(id, maintenanceData);
            setMaintenances(prev =>
                prev.map(m => m.id === id ? updatedMaintenance : m)
            );
            return updatedMaintenance;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Iniciar mantenimiento
    const startMaintenance = useCallback(async (id, updatedBy, observations = null) => {
        setLoading(true);
        setError(null);
        try {
            const updatedMaintenance = await maintenanceService.startMaintenance(id, updatedBy, observations);
            setMaintenances(prev =>
                prev.map(m => m.id === id ? updatedMaintenance : m)
            );
            return updatedMaintenance;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Completar mantenimiento
    const completeMaintenance = useCallback(async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const updatedMaintenance = await maintenanceService.completeMaintenance(id, data);
            setMaintenances(prev =>
                prev.map(m => m.id === id ? updatedMaintenance : m)
            );
            return updatedMaintenance;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Suspender mantenimiento
    const suspendMaintenance = useCallback(async (id, nextDate, observations, updatedBy) => {
        setLoading(true);
        setError(null);
        try {
            const updatedMaintenance = await maintenanceService.suspendMaintenance(id, nextDate, observations, updatedBy);
            setMaintenances(prev =>
                prev.map(m => m.id === id ? updatedMaintenance : m)
            );
            return updatedMaintenance;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Cancelar mantenimiento
    const cancelMaintenance = useCallback(async (id, observations, updatedBy) => {
        setLoading(true);
        setError(null);
        try {
            const updatedMaintenance = await maintenanceService.cancelMaintenance(id, observations, updatedBy);
            setMaintenances(prev =>
                prev.map(m => m.id === id ? updatedMaintenance : m)
            );
            return updatedMaintenance;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Reprogramar mantenimiento
    const rescheduleMaintenance = useCallback(async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const updatedMaintenance = await maintenanceService.rescheduleMaintenance(id, data);
            setMaintenances(prev =>
                prev.map(m => m.id === id ? updatedMaintenance : m)
            );
            return updatedMaintenance;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        maintenances,
        loading,
        error,
        fetchMaintenances,
        fetchMaintenancesByStatus,
        getMaintenanceById,
        createMaintenance,
        updateMaintenance,
        startMaintenance,
        completeMaintenance,
        suspendMaintenance,
        cancelMaintenance,
        rescheduleMaintenance,
    };
};

export default useMaintenance;
