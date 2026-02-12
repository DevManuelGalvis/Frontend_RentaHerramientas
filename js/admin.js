// js/admin.js
AuthManager.checkAuth(ROLES.ADMIN);

const user = AuthManager.getUser();
document.getElementById('user-name').textContent = `${user.nombre} ${user.apellido}`;

let usuarios = [];
let categorias = [];
let herramientas = [];
let reservas = [];
let pagos = [];
let devoluciones = [];

// ============= TABS =============
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('btn-primary', 'active');
            b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary', 'active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`tab-${tab}`).style.display = 'block';
    });
});

// ============= CARGAR ESTADÍSTICAS =============
async function cargarEstadisticas() {
    try {
        const [usuariosData, herramientasData, reservasData, ingresosTotales] = await Promise.all([
            ApiClient.get(API_ENDPOINTS.USUARIOS),
            ApiClient.get(API_ENDPOINTS.HERRAMIENTAS),
            ApiClient.get(API_ENDPOINTS.RESERVAS),
            ApiClient.get(`${API_ENDPOINTS.PAGOS}/ingresos-totales`)
        ]);
        
        document.getElementById('total-usuarios').textContent = usuariosData.length;
        document.getElementById('total-herramientas').textContent = herramientasData.length;
        document.getElementById('total-reservas').textContent = reservasData.length;
        document.getElementById('ingresos-totales').textContent = `$${ingresosTotales.toFixed(2)}`;
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ============= USUARIOS =============
async function cargarUsuarios() {
    try {
        usuarios = await ApiClient.get(API_ENDPOINTS.USUARIOS);
        mostrarUsuarios();
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

function mostrarUsuarios() {
    const tbody = document.querySelector('#tabla-usuarios tbody');
    tbody.innerHTML = usuarios.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.nombre} ${u.apellido}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-info">${u.rol}</span></td>
            <td><span class="badge ${u.activo ? 'badge-success' : 'badge-danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                ${u.activo ? `<button class="btn btn-danger btn-sm" onclick="desactivarUsuario(${u.id})">Desactivar</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function abrirModalUsuario() {
    document.getElementById('modal-usuario').classList.add('active');
}

function cerrarModalUsuario() {
    document.getElementById('modal-usuario').classList.remove('active');
    document.getElementById('form-usuario').reset();
}

document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const rol = formData.get('rol');
    
    // Datos básicos del usuario
    const usuarioData = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        email: formData.get('email'),
        password: formData.get('password'),
        telefono: formData.get('telefono') || null,
        direccion: formData.get('direccion') || null,
        rol: rol
    };
    
    try {
        // 1. Crear el usuario
        const usuarioResponse = await ApiClient.post(API_ENDPOINTS.USUARIOS, usuarioData);
        
        // 2. Crear el perfil según el rol
        if (rol === 'CLIENTE') {
            const clienteData = {
                usuarioId: usuarioResponse.id,
                documentoIdentidad: formData.get('documentoIdentidad') || null
            };
            await ApiClient.post(API_ENDPOINTS.CLIENTES, clienteData);
        } else if (rol === 'PROVEEDOR') {
            const proveedorData = {
                usuarioId: usuarioResponse.id,
                nombreEmpresa: formData.get('nombreEmpresa'),
                rut: formData.get('rut'),
                descripcion: formData.get('descripcion') || null
            };
            await ApiClient.post(API_ENDPOINTS.PROVEEDORES, proveedorData);
        }
        
        alert('Usuario creado exitosamente');
        cerrarModalUsuario();
        cargarUsuarios();
        cargarEstadisticas();
    } catch (error) {
        alert(error.message || 'Error al crear usuario');
    }
});

document.getElementById('usuario-rol-select').addEventListener('change', (e) => {
    const rol = e.target.value;
    const clienteFields = document.getElementById('usuario-cliente-fields');
    const proveedorFields = document.getElementById('usuario-proveedor-fields');
    
    clienteFields.style.display = 'none';
    proveedorFields.style.display = 'none';
    
    document.querySelector('[name="nombreEmpresa"]').required = false;
    document.querySelector('[name="rut"]').required = false;
    
    if (rol === 'CLIENTE') {
        clienteFields.style.display = 'block';
    } else if (rol === 'PROVEEDOR') {
        proveedorFields.style.display = 'block';
        document.querySelector('[name="nombreEmpresa"]').required = true;
        document.querySelector('[name="rut"]').required = true;
    }
});

async function desactivarUsuario(id) {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    
    try {
        await ApiClient.patch(`${API_ENDPOINTS.USUARIOS}/${id}/desactivar`);
        alert('Usuario desactivado exitosamente');
        cargarUsuarios();
    } catch (error) {
        alert(error.message || 'Error al desactivar usuario');
    }
}

// ============= CATEGORÍAS =============
async function cargarCategorias() {
    try {
        categorias = await ApiClient.get(API_ENDPOINTS.CATEGORIAS);
        mostrarCategorias();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

function mostrarCategorias() {
    const tbody = document.querySelector('#tabla-categorias tbody');
    tbody.innerHTML = categorias.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.nombre}</td>
            <td>${c.descripcion || '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editarCategoria(${c.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="eliminarCategoria(${c.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function abrirModalCategoria() {
    document.getElementById('modal-categoria-title').textContent = 'Crear Categoría';
    document.getElementById('form-categoria').reset();
    document.getElementById('modal-categoria').classList.add('active');
}

function cerrarModalCategoria() {
    document.getElementById('modal-categoria').classList.remove('active');
    document.getElementById('form-categoria').reset();
}

function editarCategoria(id) {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;
    
    document.getElementById('modal-categoria-title').textContent = 'Editar Categoría';
    const form = document.getElementById('form-categoria');
    form.elements['id'].value = categoria.id;
    form.elements['nombre'].value = categoria.nombre;
    form.elements['descripcion'].value = categoria.descripcion || '';
    document.getElementById('modal-categoria').classList.add('active');
}

document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion')
    };
    const id = formData.get('id');
    
    try {
        if (id) {
            await ApiClient.put(`${API_ENDPOINTS.CATEGORIAS}/${id}`, data);
            alert('Categoría actualizada exitosamente');
        } else {
            await ApiClient.post(API_ENDPOINTS.CATEGORIAS, data);
            alert('Categoría creada exitosamente');
        }
        cerrarModalCategoria();
        cargarCategorias();
    } catch (error) {
        alert(error.message || 'Error al guardar categoría');
    }
});

async function eliminarCategoria(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
        await ApiClient.delete(`${API_ENDPOINTS.CATEGORIAS}/${id}`);
        alert('Categoría eliminada exitosamente');
        cargarCategorias();
    } catch (error) {
        alert(error.message || 'Error al eliminar categoría');
    }
}

// ============= HERRAMIENTAS =============
async function cargarHerramientas() {
    try {
        herramientas = await ApiClient.get(API_ENDPOINTS.HERRAMIENTAS);
        mostrarHerramientas();
    } catch (error) {
        console.error('Error al cargar herramientas:', error);
    }
}

function mostrarHerramientas() {
    const tbody = document.querySelector('#tabla-herramientas tbody');
    tbody.innerHTML = herramientas.map(h => `
        <tr>
            <td>${h.id}</td>
            <td>${h.nombre}</td>
            <td>${h.nombreCategoria}</td>
            <td>${h.nombreProveedor}</td>
            <td>$${h.precioPorDia}</td>
            <td><span class="badge ${h.disponible ? 'badge-success' : 'badge-danger'}">${h.disponible ? 'Sí' : 'No'}</span></td>
            <td><span class="badge badge-info">${h.estado}</span></td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="eliminarHerramienta(${h.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function eliminarHerramienta(id) {
    if (!confirm('¿Estás seguro de eliminar esta herramienta?')) return;
    
    try {
        await ApiClient.delete(`${API_ENDPOINTS.HERRAMIENTAS}/${id}`);
        alert('Herramienta eliminada exitosamente');
        cargarHerramientas();
        cargarEstadisticas();
    } catch (error) {
        alert(error.message || 'Error al eliminar herramienta');
    }
}

// ============= RESERVAS =============
async function cargarReservas() {
    try {
        reservas = await ApiClient.get(API_ENDPOINTS.RESERVAS);
        mostrarReservas();
    } catch (error) {
        console.error('Error al cargar reservas:', error);
    }
}

function mostrarReservas() {
    const tbody = document.querySelector('#tabla-reservas tbody');
    tbody.innerHTML = reservas.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${r.nombreCliente}</td>
            <td>${r.nombreHerramienta}</td>
            <td>${r.fechaInicio}</td>
            <td>${r.fechaFin}</td>
            <td>${r.diasAlquiler}</td>
            <td>$${r.costoTotal}</td>
            <td><span class="badge ${getBadgeClaseEstado(r.estado)}">${r.estado}</span></td>
        </tr>
    `).join('');
}

// ============= PAGOS =============
async function cargarPagos() {
    try {
        pagos = await ApiClient.get(API_ENDPOINTS.PAGOS);
        mostrarPagos();
    } catch (error) {
        console.error('Error al cargar pagos:', error);
    }
}

function mostrarPagos() {
    const tbody = document.querySelector('#tabla-pagos tbody');
    tbody.innerHTML = pagos.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.reservaId}</td>
            <td>$${p.monto}</td>
            <td>${p.metodoPago}</td>
            <td><span class="badge ${getBadgeClaseEstadoPago(p.estadoPago)}">${p.estadoPago}</span></td>
            <td>${new Date(p.fechaPago).toLocaleDateString()}</td>
            <td>${p.numeroTransaccion}</td>
        </tr>
    `).join('');
}

// ============= DEVOLUCIONES =============
async function cargarDevoluciones() {
    try {
        devoluciones = await ApiClient.get(API_ENDPOINTS.DEVOLUCIONES);
        mostrarDevoluciones();
    } catch (error) {
        console.error('Error al cargar devoluciones:', error);
    }
}

function mostrarDevoluciones() {
    const tbody = document.querySelector('#tabla-devoluciones tbody');
    tbody.innerHTML = devoluciones.map(d => `
        <tr>
            <td>${d.id}</td>
            <td>${d.reservaId}</td>
            <td>${new Date(d.fechaDevolucion).toLocaleString()}</td>
            <td><span class="badge badge-info">${d.estadoEquipo}</span></td>
            <td><span class="badge ${d.aceptadoPorProveedor ? 'badge-success' : 'badge-warning'}">${d.aceptadoPorProveedor ? 'Sí' : 'No'}</span></td>
            <td>${d.reporteDanos || '-'}</td>
        </tr>
    `).join('');
}

// ============= UTILIDADES =============
function getBadgeClaseEstado(estado) {
    const clases = {
        'PENDIENTE': 'badge-warning',
        'CONFIRMADA': 'badge-info',
        'EN_CURSO': 'badge-success',
        'COMPLETADA': 'badge-success',
        'CANCELADA': 'badge-danger'
    };
    return clases[estado] || 'badge-info';
}

function getBadgeClaseEstadoPago(estado) {
    const clases = {
        'PENDIENTE': 'badge-warning',
        'COMPLETADO': 'badge-success',
        'FALLIDO': 'badge-danger',
        'REEMBOLSADO': 'badge-info'
    };
    return clases[estado] || 'badge-info';
}

// ============= INICIALIZAR =============
cargarEstadisticas();
cargarUsuarios();
cargarCategorias();
cargarHerramientas();
cargarReservas();
cargarPagos();
cargarDevoluciones();