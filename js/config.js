const API_BASE_URL = 'http://localhost:8081';

const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    
    CATEGORIAS: `${API_BASE_URL}/api/categorias`,
    
    HERRAMIENTAS: `${API_BASE_URL}/api/herramientas`,
    HERRAMIENTAS_DISPONIBLES: `${API_BASE_URL}/api/herramientas/disponibles`,
    
    USUARIOS: `${API_BASE_URL}/api/usuarios`,
    
    CLIENTES: `${API_BASE_URL}/api/clientes`,
    
    PROVEEDORES: `${API_BASE_URL}/api/proveedores`,
    
    RESERVAS: `${API_BASE_URL}/api/reservas`,
    
    PAGOS: `${API_BASE_URL}/api/pagos`,
    
    FACTURAS: `${API_BASE_URL}/api/facturas`,
    
    DEVOLUCIONES: `${API_BASE_URL}/api/devoluciones`
};

const ROLES = {
    ADMIN: 'ADMINISTRADOR',
    PROVEEDOR: 'PROVEEDOR',
    CLIENTE: 'CLIENTE'
};