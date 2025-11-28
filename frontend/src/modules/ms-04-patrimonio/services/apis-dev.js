// Servicio general para endpoints del microservicio de patrimonio
// Construye la base API a partir de variables de entorno.
const API_BASE =
  import.meta.env.VITE_PATRIMONIO_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_PATRIMONIO_API_URL ||
  'http://localhost:5003/api/v1/dev-support';

// ===============================
// Función genérica para obtener listas
// ===============================
async function fetchList(path) {
  const url = `${API_BASE}/${path}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Error ${res.status} al obtener ${path}: ${txt}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`❌ Error en fetchList(${path}):`, err);
    throw err;
  }
}

// ===============================
// Funciones específicas (cada una con su normalización)
// ===============================

export const getCategorias = async () => {
  const list = await fetchList('categorias');
  return list.map(x => ({
    id: x.id || x._id || x.codigoCategoria || x.codigo || null,
    nombre: x.nombre || x.descripcion || null,
    codigoCategoria: x.codigoCategoria || x.codigo || null,
    raw: x,
  }));
};

export const getProveedores = async () => {
  const list = await fetchList('proveedores');
  return list.map(x => ({
    id: x.id || x._id || x.codigoProveedor || x.codigo || null,
    razonSocial: x.razonSocial || x.nombre || null,
    codigoProveedor: x.codigoProveedor || x.codigo || null,
    raw: x,
  }));
};

export const getUbicaciones = async () => {
  const list = await fetchList('ubicaciones');
  return list.map(x => ({
    id: x.id || x._id || x.codigoUbicacion || x.codigo || null,
    nombre: x.nombre || x.codigoUbicacion || null,
    codigoUbicacion: x.codigoUbicacion || x.codigo || null,
    raw: x,
  }));
};

export const getResponsables = async () => {
  const list = await fetchList('responsables');
  return list.map(x => ({
    id: x.id || x._id || x.personaId || x.codigoEmpleado || null,
    nombres: x.nombres || x.razonSocial || null,
    codigoEmpleado: x.codigoEmpleado || null,
    personaId: x.personaId || null,
    raw: x,
  }));
};

export const getAreas = async () => {
  const list = await fetchList('areas');
  return list.map(x => ({
    id: x.id || x._id || x.codigoArea || x.codigo || null,
    nombre: x.nombre || x.codigoArea || null,
    codigoArea: x.codigoArea || x.codigo || null,
    raw: x,
  }));
};

// ===============================
// Exportación agrupada
// ===============================
export default {
  getCategorias,
  getProveedores,
  getUbicaciones,
  getResponsables,
  getAreas,
};
