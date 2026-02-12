AuthManager.checkAuth(ROLES.CLIENTE);

const user = AuthManager.getUser();
document.getElementById('user-name').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('clienteId').value = user.perfilId;

let categorias = [];
let herramientas = [];
let reservas = [];
let pagos = [];
let herramientaSeleccionada = null;

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
        const reservasData = await ApiClient.get(`${API_ENDPOINTS.RESERVAS}/cliente/${user.perfilId}`);
        const pagosData = await ApiClient.get(`${API_ENDPOINTS.PAGOS}/cliente/${user.perfilId}`);
        
        const reservasActivas = reservasData.filter(r => 
            r.estado === 'CONFIRMADA' || r.estado === 'EN_CURSO' || r.estado === 'PENDIENTE'
        ).length;
        
        const totalGastado = pagosData.reduce((sum, p) => sum + parseFloat(p.monto), 0);
        
        document.getElementById('total-reservas').textContent = reservasData.length;
        document.getElementById('reservas-activas').textContent = reservasActivas;
        document.getElementById('total-pagos').textContent = pagosData.length;
        document.getElementById('total-gastado').textContent = `$${totalGastado.toFixed(2)}`;
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

async function cargarCategorias() {
    try {
        categorias = await ApiClient.get(API_ENDPOINTS.CATEGORIAS);
        llenarFiltroCategorias();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

function llenarFiltroCategorias() {
    const select = document.getElementById('filtro-categoria');
    select.innerHTML = '<option value="">Todas las categorías</option>' + 
        categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

document.getElementById('filtro-categoria').addEventListener('change', (e) => {
    const categoriaId = e.target.value;
    cargarHerramientas(categoriaId || null);
});

async function cargarHerramientas(categoriaId = null) {
    try {
        const url = categoriaId 
            ? `${API_ENDPOINTS.HERRAMIENTAS}/categoria/${categoriaId}/disponibles`
            : API_ENDPOINTS.HERRAMIENTAS_DISPONIBLES;
        herramientas = await ApiClient.get(url);
        mostrarHerramientas();
    } catch (error) {
        console.error('Error al cargar herramientas:', error);
    }
}

function mostrarHerramientas() {
    const container = document.getElementById('herramientas-grid');
    if (herramientas.length === 0) {
        container.innerHTML = '<p class="text-center">No hay herramientas disponibles</p>';
        return;
    }

    container.innerHTML = herramientas.map(h => `
        <div class="card">
            ${h.imagenUrl ? `<img src="${h.imagenUrl}" alt="${h.nombre}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">` : ''}
            <h3>${h.nombre}</h3>
            <p><strong>Categoría:</strong> ${h.nombreCategoria}</p>
            <p><strong>Proveedor:</strong> ${h.nombreProveedor}</p>
            <p><strong>Marca:</strong> ${h.marca || 'N/A'}</p>
            <p><strong>Precio por día:</strong> $${h.precioPorDia}</p>
            ${h.precioPorSemana ? `<p><strong>Precio por semana:</strong> $${h.precioPorSemana}</p>` : ''}
            <p><strong>Disponibles:</strong> ${h.cantidadDisponible}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">${h.descripcion || ''}</p>
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="abrirModalReserva(${h.id})">Alquilar</button>
        </div>
    `).join('');
}

async function cargarReservas() {
    try {
        reservas = await ApiClient.get(`${API_ENDPOINTS.RESERVAS}/cliente/${user.perfilId}`);
        mostrarReservas();
    } catch (error) {
        console.error('Error al cargar reservas:', error);
    }
}

function mostrarReservas() {
    const tbody = document.querySelector('#tabla-reservas tbody');
    if (reservas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No tienes reservas</td></tr>';
        return;
    }
    
    tbody.innerHTML = reservas.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${r.nombreHerramienta}</td>
            <td>${r.fechaInicio}</td>
            <td>${r.fechaFin}</td>
            <td>${r.diasAlquiler}</td>
            <td>$${r.costoTotal}</td>
            <td><span class="badge ${getBadgeClaseEstado(r.estado)}">${r.estado}</span></td>
            <td>
                ${r.estado === 'PENDIENTE' ? `
                    <button class="btn btn-danger btn-sm" onclick="cancelarReserva(${r.id})">Cancelar</button>
                ` : ''}
                ${r.estado === 'CONFIRMADA' && !tienePago(r.id) ? `
                    <button class="btn btn-success btn-sm" onclick="abrirModalPago(${r.id}, ${r.costoTotal})">Pagar</button>
                ` : ''}
                ${r.estado === 'EN_CURSO' ? `
                    <button class="btn btn-primary btn-sm" onclick="abrirModalDevolucion(${r.id})">Devolver</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function tienePago(reservaId) {
    return pagos.some(p => p.reservaId === reservaId);
}

function abrirModalReserva(herramientaId) {
    herramientaSeleccionada = herramientas.find(h => h.id === herramientaId);
    if (!herramientaSeleccionada) return;
    
    document.getElementById('herramientaId').value = herramientaId;
    document.getElementById('cantidad-disponible').textContent = herramientaSeleccionada.cantidadDisponible;
    document.getElementById('cantidad').max = herramientaSeleccionada.cantidadDisponible;
    
    document.getElementById('herramienta-info').innerHTML = `
        <div class="alert alert-info">
            <strong>${herramientaSeleccionada.nombre}</strong><br>
            Precio por día: $${herramientaSeleccionada.precioPorDia}<br>
            ${herramientaSeleccionada.precioPorSemana ? `Precio por semana: $${herramientaSeleccionada.precioPorSemana}<br>` : ''}
            Disponibles: ${herramientaSeleccionada.cantidadDisponible}
        </div>
    `;
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaInicio').min = hoy;
    document.getElementById('fechaFin').min = hoy;
    
    document.getElementById('modal-reserva').classList.add('active');
}

function cerrarModalReserva() {
    document.getElementById('modal-reserva').classList.remove('active');
    document.getElementById('form-reserva').reset();
    herramientaSeleccionada = null;
}

document.getElementById('fechaInicio').addEventListener('change', calcularCostoReserva);
document.getElementById('fechaFin').addEventListener('change', calcularCostoReserva);
document.getElementById('cantidad').addEventListener('change', calcularCostoReserva);

function calcularCostoReserva() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const cantidad = parseInt(document.getElementById('cantidad').value) || 1;
    
    if (!fechaInicio || !fechaFin || !herramientaSeleccionada) return;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    if (dias <= 0) {
        document.getElementById('dias-alquiler').textContent = '0';
        document.getElementById('costo-total').textContent = '0.00';
        return;
    }
    
    let costoPorUnidad;
    
    if (herramientaSeleccionada.precioPorSemana && dias >= 7) {
        const semanas = Math.floor(dias / 7);
        const diasRestantes = dias % 7;
        costoPorUnidad = (semanas * parseFloat(herramientaSeleccionada.precioPorSemana)) + 
                         (diasRestantes * parseFloat(herramientaSeleccionada.precioPorDia));
    } else {
        costoPorUnidad = dias * parseFloat(herramientaSeleccionada.precioPorDia);
    }
    
    const costoTotal = costoPorUnidad * cantidad;
    
    document.getElementById('dias-alquiler').textContent = dias;
    document.getElementById('costo-total').textContent = costoTotal.toFixed(2);
}

document.getElementById('form-reserva').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const fechaInicio = formData.get('fechaInicio');
    const fechaFin = formData.get('fechaFin');
    const cantidad = parseInt(formData.get('cantidad'));
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diasAlquiler = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    let costoPorUnidad;
    if (herramientaSeleccionada.precioPorSemana && diasAlquiler >= 7) {
        const semanas = Math.floor(diasAlquiler / 7);
        const diasRestantes = diasAlquiler % 7;
        costoPorUnidad = (semanas * parseFloat(herramientaSeleccionada.precioPorSemana)) + 
                         (diasRestantes * parseFloat(herramientaSeleccionada.precioPorDia));
    } else {
        costoPorUnidad = diasAlquiler * parseFloat(herramientaSeleccionada.precioPorDia);
    }
    
    const costoTotal = costoPorUnidad * cantidad;
    
    const data = {
        clienteId: parseInt(formData.get('clienteId')),
        herramientaId: parseInt(formData.get('herramientaId')),
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        diasAlquiler: diasAlquiler,
        costoTotal: costoTotal,
        estado: 'PENDIENTE',
        direccionEntrega: formData.get('direccionEntrega') || null,
        notasCliente: formData.get('notasCliente') || null,
        cantidad: cantidad
    };
    
    try {
        await ApiClient.post(API_ENDPOINTS.RESERVAS, data);
        alert('Reserva creada exitosamente. Espera la confirmación del proveedor.');
        cerrarModalReserva();
        cargarReservas();
        cargarHerramientas();
        cargarEstadisticas();
    } catch (error) {
        alert(error.message || 'Error al crear reserva');
    }
});

async function cancelarReserva(id) {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
    
    try {
        await ApiClient.delete(`${API_ENDPOINTS.RESERVAS}/${id}/cancelar`);
        alert('Reserva cancelada exitosamente');
        cargarReservas();
        cargarEstadisticas();
    } catch (error) {
        alert(error.message || 'Error al cancelar reserva');
    }
}

async function cargarPagos() {
    try {
        pagos = await ApiClient.get(`${API_ENDPOINTS.PAGOS}/cliente/${user.perfilId}`);
        mostrarPagos();
    } catch (error) {
        console.error('Error al cargar pagos:', error);
    }
}

function mostrarPagos() {
    const tbody = document.querySelector('#tabla-pagos tbody');
    if (pagos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No tienes pagos registrados</td></tr>';
        return;
    }
    
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

function abrirModalPago(reservaId, monto) {
    document.getElementById('pagoReservaId').value = reservaId;
    document.getElementById('monto-pagar').textContent = parseFloat(monto).toFixed(2);
    document.getElementById('modal-pago').classList.add('active');
}

function cerrarModalPago() {
    document.getElementById('modal-pago').classList.remove('active');
    document.getElementById('form-pago').reset();
}

document.getElementById('form-pago').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const monto = parseFloat(document.getElementById('monto-pagar').textContent);
    
    const data = {
        reservaId: parseInt(formData.get('reservaId')),
        monto: monto,
        metodoPago: formData.get('metodoPago'),
        estadoPago: 'COMPLETADO',
        numeroTransaccion: formData.get('numeroTransaccion'),
        comprobantePago: formData.get('comprobantePago') || null
    };
    
    try {
        await ApiClient.post(API_ENDPOINTS.PAGOS, data);
        alert('Pago registrado exitosamente');
        cerrarModalPago();
        cargarPagos();
        cargarReservas();
        cargarEstadisticas();
    } catch (error) {
        alert(error.message || 'Error al registrar pago');
    }
});

function abrirModalDevolucion(reservaId) {
    document.getElementById('devolucionReservaId').value = reservaId;
    document.getElementById('modal-devolucion').classList.add('active');
}

function cerrarModalDevolucion() {
    document.getElementById('modal-devolucion').classList.remove('active');
    document.getElementById('form-devolucion').reset();
}

document.getElementById('form-devolucion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
        reservaId: parseInt(formData.get('reservaId')),
        estadoEquipo: formData.get('estadoEquipo'),
        reporteDanos: formData.get('reporteDanos') || null,
        aceptadoPorProveedor: false
    };
    
    try {
        await ApiClient.post(API_ENDPOINTS.DEVOLUCIONES, data);
        alert('Devolución registrada exitosamente. Espera la confirmación del proveedor.');
        cerrarModalDevolucion();
        cargarReservas();
        cargarEstadisticas();
    } catch (error) {
        alert(error.message || 'Error al registrar devolución');
    }
});

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

cargarEstadisticas();
cargarCategorias();
cargarHerramientas();
cargarReservas();
cargarPagos();