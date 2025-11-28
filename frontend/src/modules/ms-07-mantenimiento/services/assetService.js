import { ASSET_ENDPOINTS } from '../config/api.js';

class AssetService {
    constructor() {
        // No almacenar token en constructor, obtenerlo dinámicamente
    }

    // Obtener token actual de localStorage
    getToken() {
        return localStorage.getItem('accessToken');
    }

    async getAllAssets() {
        try {
            // Usar endpoints desde la configuración centralizada
            const endpoints = ASSET_ENDPOINTS.FALLBACK_OPTIONS;
            const token = this.getToken();

            console.log('🔍 Intentando cargar activos desde:', endpoints);

            let data = null;
            let successUrl = null;

            for (const url of endpoints) {
                try {
                    console.log(`📡 Probando URL: ${url}`);
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token && { 'Authorization': `Bearer ${token}` })
                        },
                    });

                    console.log(`📊 Respuesta de ${url}: ${response.status} ${response.statusText}`);

                    if (response.ok) {
                        const raw = await response.json();
                        // Manejar diferentes formatos de respuesta
                        data = Array.isArray(raw)
                            ? raw
                            : Array.isArray(raw.data)
                                ? raw.data
                                : Array.isArray(raw.content)
                                    ? raw.content
                                    : Array.isArray(raw.bienes)
                                        ? raw.bienes
                                        : Array.isArray(raw.assets)
                                            ? raw.assets
                                            : [];
                        successUrl = url;
                        console.log(`✅ Activos obtenidos exitosamente desde ${url}: ${data.length} registros`);
                        break;
                    }
                } catch (err) {
                    console.warn(`⚠️ Error en ${url}:`, err.message);
                    continue;
                }
            }

            if (!data || data.length === 0) {
                console.error('❌ No se pudo obtener activos de ningún endpoint');
                throw new Error('No se pudo obtener activos del MS-04. Verifica que el servicio esté activo.');
            }

            return data;
        } catch (error) {
            console.error('❌ Error al cargar activos:', error);
            throw error;
        }
    }

    /**
     * Obtener activos disponibles para mantenimiento
     * Filtra solo activos activos y que no estén en mantenimiento
     */
    async getAvailableAssets() {
        try {
            const allAssets = await this.getAllAssets();

            // Filtrar solo activos disponibles (excluir BAJA y MAINTENANCE)
            const availableAssets = allAssets.filter(asset => {
                // Verificar que el activo NO esté dado de baja
                const notInactive =
                    asset.assetStatus !== 'BAJA' &&
                    asset.assetStatus !== 'INACTIVE' &&
                    asset.assetStatus !== 'INACTIVO';

                // Verificar que NO esté en mantenimiento
                const notInMaintenance =
                    asset.assetStatus !== 'MAINTENANCE' &&
                    asset.assetStatus !== 'EN_MANTENIMIENTO' &&
                    asset.assetStatus !== 'MANTENIMIENTO';

                return notInactive && notInMaintenance;
            });

            return availableAssets;
        } catch (error) {
            console.error('Error al cargar activos disponibles:', error);
            throw error;
        }
    }

    async updateAssetStatus(assetId, nuevoEstado, motivo) {
        try {
            const response = await fetch(`${ASSET_ENDPOINTS.BY_ID(assetId)}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nuevoEstado,
                    motivo
                }),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el estado del activo');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al actualizar estado del activo:', error);
            throw error;
        }
    }
}

const assetService = new AssetService();
export default assetService;
