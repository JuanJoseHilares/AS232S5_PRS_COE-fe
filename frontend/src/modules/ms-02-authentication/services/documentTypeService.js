const API_BASE_URL = import.meta.env.VITE_DOCUMENT_TYPES_API || 'http://localhost:5004';
const CACHE_KEY = 'document_types_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

class DocumentTypeService {
    constructor() {
        this.defaultTypes = [
            { id: 1, code: 'RUC', description: 'Registro Único de Contribuyentes', length: 11, active: true },
            { id: 2, code: 'DNI', description: 'Documento Nacional de Identidad', length: 8, active: true },
            { id: 3, code: 'CE', description: 'Carné de Extranjería', length: 9, active: true },
            { id: 4, code: 'PAS', description: 'Pasaporte', length: 12, active: true }
        ];
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error('Document Type Service Error:', error);
            throw error;
        }
    }

    getFromCache(ignoreExpiration = false) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > CACHE_DURATION;

            if (isExpired && !ignoreExpiration) return null;

            return data;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    saveToCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    async getAllDocumentTypes() {
        try {
            // Verificar caché primero
            const cached = this.getFromCache();
            if (cached) {
                console.log('Document types loaded from cache');
                return cached;
            }

            // Llamar a la API
            const data = await this.request('/api/document-types');
            
            // Guardar en caché
            this.saveToCache(data);
            
            console.log('Document types loaded from API');
            return data;
        } catch (error) {
            console.warn('Failed to fetch document types from API, trying cache...', error.message);
            
            // Intentar usar caché aunque esté expirado
            const cached = this.getFromCache(true);
            if (cached) {
                console.log('Using expired cache as fallback');
                return cached;
            }

            // Fallback: datos por defecto
            console.warn('Using default document types as fallback');
            return this.defaultTypes;
        }
    }

    async getActiveDocumentTypes() {
        const types = await this.getAllDocumentTypes();
        return types.filter(t => t.active);
    }

    async getDocumentTypeById(id) {
        const types = await this.getAllDocumentTypes();
        return types.find(t => t.id === id);
    }

    clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY);
            console.log('Document types cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

const documentTypeService = new DocumentTypeService();
export default documentTypeService;
