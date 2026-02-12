AuthManager.checkAuth(ROLES.PROVEEDOR);

const user = AuthManager.getUser();
document.getElementById('user-name').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('proveedorId').value = user.perfilId;

let categorias = [];
let herramientas = [];
let reservas = [];
let devoluciones = [];
let facturas = [];

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

async function cargarEstadisticas() {
    try {
        const herramientasData = await ApiClient.get(`${API_ENDPOINTS.HERRAMIENTAS}/proveedor/${user.perfilId}`);
        const reservasData = await ApiClient.get(`${API_ENDPOINTS.RESERVAS}/proveedor/${user.perfilId}`);
        const devolucionesPendientes = await ApiClient.get(`${API_ENDPOINTS.DEVOLUCIONES}/pendientes`);
        
        const herramientasDisponibles = herramientasData.filter(h => h.disponible).length;
        
        document.getElementById('total-herramientas').textContent = herramientasData.length;
        document.getElementById('total-reservas').textContent = reservasData.length;
        document.getElementById('herramientas-disponibles').textContent = herramientasDisponibles;
        document.getElementById('devoluciones-pendientes').textContent = devolucionesPendientes.length;
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

async function cargarCategorias() {
    try {
        categorias = await ApiClient.get(API_ENDPOINTS.CATEGORIAS);
        llenarSelectCategorias();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

function llenarSelectCategorias() {
    const select = document.getElementById('select-categoria');
    select.innerHTML = '<option value="">Selecciona una categoría</option>' + 
        categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

async function cargarHerramientas() {
    try {
        herramientas = await ApiClient.get(`${API_ENDPOINTS.HERRAMIENTAS}/proveedor/${user.perfilId}`);
        mostrarHerramientas();
    } catch (error) {
        console.error('Error al cargar herramientas:', error);
    }
}

function mostrarHerramientas() {
    const tbody = document.querySelector('#tabla-herramientas tbody');
    if (herramientas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No tienes herramientas registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = herramientas.map(h => `
        <tr>
            <td>${h.id}</td>
            <td>${h.nombre}</td>
            <td>${h.nombreCategoria}</td>
            <td>${h.marca || '-'}</td>
            <td>$${h.precioPorDia}</td>
            <td><span class="badge ${h.disponible ? 'badge-success' : 'badge-danger'}">${h.disponible ? 'Sí' : 'No'}</span></td>
            <td>${h.cantidadDisponible}</td>
            <td><span class="badge badge-info">${h.estado}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editarHerramienta(${h.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="eliminarHerramienta(${h.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function abrirModalHerramienta() {
    document.getElementById('modal-herramienta-title').textContent = 'Agregar Herramienta';
    document.getElementById('form-herramienta').reset();
    document.getElementById('proveedorId').value = user.perfilId;
    document.getElementById('modal-herramienta').classList.add('active');
}

function cerrarModalHerramienta() {
    document.getElementById('modal-herramienta').classList.remove('active');
    document.getElementById('form-herramienta').reset();
}

function editarHerramienta(id) {
    const herramienta = herramientas.find(h => h.id === id);
    if (!herramienta) return;
    
    document.getElementById('modal-herramienta-title').textContent = 'Editar Herramienta';
    const form = document.getElementById('form-herramienta');
    form.elements['id'].value = herramienta.id;
    form.elements['proveedorId'].value = user.perfilId;
    form.elements['nombre'].value = herramienta.nombre;
    form.elements['categoriaId'].value = herramienta.categoriaId;
    form.elements['descripcion'].value = herramienta.descripcion || '';
    form.elements['marca'].value = herramienta.marca || '';
    form.elements['modelo'].value = herramienta.modelo || '';
    form.elements['imagenUrl'].value = herramienta.imagenUrl || '';
    form.elements['precioPorDia'].value = herramienta.precioPorDia;
    form.elements['precioPorSemana'].value = herramienta.precioPorSemana || '';
    form.elements['estado'].value = herramienta.estado;
    form.elements['cantidadDisponible'].value = herramienta.cantidadDisponible;
    form.elements['disponible'].checked = herramienta.disponible;
    form.elements['especificacionesTecnicas'].value = herramienta.especificacionesTecnicas || '';
    
    document.getElementById('modal-herramienta').classList.add('active');
}

document.getElementById('form-herramienta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
        proveedorId: parseInt(formData.get('proveedorId')),
        categoriaId: parseInt(formData.get('categoriaId')),
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion') || null,
        marca: formData.get('marca') || null,
        modelo: formData.get('modelo') || null,
        imagenUrl: formData.get('imagenUrl') || null,
        precioPorDia: parseFloat(formData.get('precioPorDia')),
        precioPorSemana: formData.get('precioPorSemana') ? parseFloat(formData.get('precioPorSemana')) : null,
        estado: formData.get('estado'),
        disponible: formData.get('disponible') === 'on',
        cantidadDisponible: parseInt(formData.get('cantidadDisponible')),
        especificacionesTecnicas: formData.get('especificacionesTecnicas') || null
    };
    
    const id = formData.get('id');
    
    try {
        if (id) {
            await ApiClient.put(`${API_ENDPOINTS.HERRAMIENTAS}/${id}`, data);
            alert('Herramienta actualizada exitosamente');
        } else {
            await ApiClient.post(API_ENDPOINTS.HERRAMIENTAS, data);
            alert('Herramienta creada exitosamente');
        }
        cerrarModalHerramienta();
        cargarHerramientas();
        cargarEstadisticas();
    } catch (error) {
        alert(error.message || 'Error al guardar herramienta');
    }
});

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

async function cargarReservas() {
    try {
        reservas = await ApiClient.get(`${API_ENDPOINTS.RESERVAS}/proveedor/${user.perfilId}`);
        mostrarReservas();
    } catch (error) {
        console.error('Error al cargar reservas:', error);
    }
}

function mostrarReservas() {
    const tbody = document.querySelector('#tabla-reservas tbody');
    if (reservas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay reservas</td></tr>';
        return;
    }
    
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
            <td>
                ${r.estado === 'PENDIENTE' ? `
                    <button class="btn btn-success btn-sm" onclick="confirmarReserva(${r.id})">Confirmar</button>
                ` : ''}
                ${r.estado === 'CONFIRMADA' ? `
                    <button class="btn btn-primary btn-sm" onclick="iniciarReserva(${r.id})">Iniciar</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

async function confirmarReserva(id) {
    if (!confirm('¿Confirmar esta reserva?')) return;
    
    try {
        await ApiClient.patch(`${API_ENDPOINTS.RESERVAS}/${id}/estado?nuevoEstado=CONFIRMADA`);
        alert('Reserva confirmada exitosamente');
        cargarReservas();
    } catch (error) {
        alert(error.message || 'Error al confirmar reserva');
    }
}

async function iniciarReserva(id) {
    if (!confirm('¿Iniciar esta reserva? (El equipo está siendo entregado)')) return;
    
    try {
        await ApiClient.patch(`${API_ENDPOINTS.RESERVAS}/${id}/estado?nuevoEstado=EN_CURSO`);
        alert('Reserva iniciada exitosamente');
        cargarReservas();
    } catch (error) {
        alert(error.message || 'Error al iniciar reserva');
    }
}

async function cargarDevoluciones() {
    try {
        const todasDevoluciones = await ApiClient.get(API_ENDPOINTS.DEVOLUCIONES);
        devoluciones = todasDevoluciones.filter(d => {
            const reserva = reservas.find(r => r.id === d.reservaId);
            return reserva !== undefined;
        });
        mostrarDevoluciones();
    } catch (error) {
        console.error('Error al cargar devoluciones:', error);
    }
}

function mostrarDevoluciones() {
    const tbody = document.querySelector('#tabla-devoluciones tbody');
    if (devoluciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay devoluciones</td></tr>';
        return;
    }
    
    tbody.innerHTML = devoluciones.map(d => `
        <tr>
            <td>${d.id}</td>
            <td>${d.reservaId}</td>
            <td>${new Date(d.fechaDevolucion).toLocaleString()}</td>
            <td><span class="badge badge-info">${d.estadoEquipo}</span></td>
            <td>${d.reporteDanos || 'Sin daños'}</td>
            <td><span class="badge ${d.aceptadoPorProveedor ? 'badge-success' : 'badge-warning'}">
                ${d.aceptadoPorProveedor ? 'Aceptada' : 'Pendiente'}
            </span></td>
            <td>
                ${!d.aceptadoPorProveedor ? `
                    <button class="btn btn-success btn-sm" onclick="aceptarDevolucion(${d.id})">Aceptar</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

async function aceptarDevolucion(id) {
    if (!confirm('¿Aceptar esta devolución?')) return;
    
    try {
        await ApiClient.patch(`${API_ENDPOINTS.DEVOLUCIONES}/${id}/aceptar`);
        alert('Devolución aceptada exitosamente');
        cargarDevoluciones();
        cargarEstadisticas();
    } catch (error) {
        alert(error.message || 'Error al aceptar devolución');
    }
}

async function cargarFacturas() {
    try {
        facturas = await ApiClient.get(`${API_ENDPOINTS.FACTURAS}/proveedor/${user.perfilId}`);
        mostrarFacturas();
    } catch (error) {
        console.error('Error al cargar facturas:', error);
    }
}

function mostrarFacturas() {
    const tbody = document.querySelector('#tabla-facturas tbody');
    if (facturas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay facturas</td></tr>';
        return;
    }
    
    tbody.innerHTML = facturas.map(f => `
        <tr>
            <td>${f.id}</td>
            <td>${f.numeroFactura}</td>
            <td>${new Date(f.fechaEmision).toLocaleDateString()}</td>
            <td>$${f.total}</td>
            <td>${f.urlPDF ? `<a href="${f.urlPDF}" target="_blank" class="btn btn-primary btn-sm">Ver PDF</a>` : 'N/A'}</td>
        </tr>
    `).join('');
}

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

cargarEstadisticas();
cargarCategorias();
cargarHerramientas();
cargarReservas();
cargarDevoluciones();
cargarFacturas();