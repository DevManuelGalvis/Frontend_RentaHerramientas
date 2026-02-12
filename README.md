# RentTools - Frontend de Alquiler de Herramientas

Frontend web para la plataforma **RentTools**, sistema de alquiler de herramientas y equipos. Desarrollado con HTML, CSS y JavaScript vanilla (sin frameworks). Se conecta a una API REST backend (por defecto en `http://localhost:8080`).

---

## Índice

- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Roles y flujos](#roles-y-flujos)
- [API y endpoints](#api-y-endpoints)
- [Páginas y funcionalidades](#páginas-y-funcionalidades)

---

## Estructura del proyecto

```
Frontend_RentaHerramientas/
├── index.html              # Página principal (público)
├── login.html              # Inicio de sesión
├── register.html           # Registro de usuarios (Cliente/Proveedor)
├── README.md               # Este archivo
│
├── admin/
│   └── dashboard.html      # Panel de administrador
│
├── cliente/
│   └── dashboard.html      # Panel de cliente
│
├── proveedor/
│   └── dashboard.html      # Panel de proveedor
│
├── css/
│   └── styles.css          # Estilos globales (variables, navbar, cards, formularios, etc.)
│
└── js/
    ├── config.js           # URL base de la API y endpoints
    ├── auth.js             # AuthManager: login, logout, redirección por rol
    ├── api.js              # ApiClient: peticiones HTTP con token Bearer
    ├── admin.js            # Lógica del panel administrador
    ├── cliente.js          # Lógica del panel cliente
    └── proveedor.js        # Lógica del panel proveedor
```

### Descripción de archivos clave

| Archivo | Descripción |
|--------|-------------|
| **config.js** | Define `API_BASE_URL` (por defecto `http://localhost:8080`), `API_ENDPOINTS` y constantes `ROLES`. |
| **auth.js** | Clase `AuthManager`: guarda token y usuario en `localStorage`, redirige al dashboard según rol, comprueba autenticación y permisos. |
| **api.js** | Clase `ApiClient`: métodos `get`, `post`, `put`, `delete`, `patch`; envía `Authorization: Bearer <token>`; ante 401 hace logout y redirige a login. |

---

## Requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari).
- Backend de RentTools en ejecución (API REST en el puerto configurado, por defecto **8080**).
- Para servir el frontend sin problemas de CORS/rutas: un servidor HTTP local (opcional pero recomendado).

---

## Configuración

### URL del backend

Edita `js/config.js` y cambia la constante si tu API no está en `localhost:8080`:

```javascript
const API_BASE_URL = 'http://localhost:8080';  // Cambiar si es necesario
```

### Rutas relativas

Las páginas dentro de `admin/`, `cliente/` y `proveedor/` usan rutas relativas al raíz (por ejemplo `/login.html`). Para que funcionen bien:

- Sirve el proyecto desde la **raíz** de `Frontend_RentaHerramientas` (no desde una subcarpeta).
- Si abres archivos con `file://`, el logout y algunas redirecciones pueden usar `/login.html`; es más fiable usar un servidor local.

---

## Ejecución

### Opción 1: Servidor local (recomendado)

Desde la raíz del proyecto:

**Con Node.js (npx):**
```bash
npx serve .
```
Por defecto sirve en `http://localhost:3000`. Abre esa URL en el navegador.

**Con Python 3:**
```bash
# Python 3
python -m http.server 8000
```
Abre `http://localhost:8000`.

**Con PHP:**
```bash
php -S localhost:8000
```
Abre `http://localhost:8000`.

### Opción 2: Abrir directamente

Abre `index.html` en el navegador (doble clic o arrastrar al navegador).  
Ten en cuenta que algunas redirecciones asumen un origen con raíz (por ejemplo `/login.html`), por lo que puede haber diferencias según el navegador.

### Backend

Asegúrate de tener el backend de RentTools corriendo en la URL configurada en `config.js` (por defecto `http://localhost:8080`). Sin el backend, login, registro, listados y acciones no funcionarán.

---

## Roles y flujos

| Rol | Constante en código | Dashboard | Descripción |
|-----|---------------------|-----------|-------------|
| **Administrador** | `ROLES.ADMIN` = `'ADMINISTRADOR'` | `/admin/dashboard.html` | Gestión de usuarios, categorías, herramientas, reservas, pagos y devoluciones. |
| **Proveedor** | `ROLES.PROVEEDOR` = `'PROVEEDOR'` | `/proveedor/dashboard.html` | Alta/edición de herramientas, reservas de sus herramientas, devoluciones y facturas. |
| **Cliente** | `ROLES.CLIENTE` = `'CLIENTE'` | `/cliente/dashboard.html` | Ver herramientas, crear reservas, pagar y registrar devoluciones. |

- **Registro:** solo se puede elegir **Cliente** o **Proveedor**. El rol Administrador se asigna por backend.
- Tras **login** o **registro**, el frontend redirige al dashboard según el rol devuelto por la API.
- Las páginas de dashboard comprueban el rol; si no coincide, redirigen al dashboard correspondiente o a login.

---

## API y endpoints

El frontend espera una API REST con la siguiente base y rutas (definidas en `config.js`):

| Recurso | Endpoints utilizados (resumen) |
|---------|--------------------------------|
| **Auth** | `POST /auth/login`, `POST /auth/register` |
| **Categorías** | `GET /api/categorias` (+ CRUD en admin) |
| **Herramientas** | `GET /api/herramientas`, `GET /api/herramientas/disponibles`, `GET /api/herramientas/categoria/:id/disponibles`, `GET /api/herramientas/proveedor/:id` (+ CRUD proveedor/admin) |
| **Usuarios** | `GET /api/usuarios` (+ crear usuario en admin) |
| **Clientes** | `POST /api/clientes` (al crear usuario cliente) |
| **Proveedores** | `POST /api/proveedores` (al crear usuario proveedor) |
| **Reservas** | `GET/POST /api/reservas`, `GET /api/reservas/cliente/:id`, `GET /api/reservas/proveedor/:id` |
| **Pagos** | `GET/POST /api/pagos`, `GET /api/pagos/cliente/:id`, `GET /api/pagos/ingresos-totales` |
| **Facturas** | `GET /api/facturas` (proveedor) |
| **Devoluciones** | `GET/POST /api/devoluciones`, `GET /api/devoluciones/pendientes` |

Las peticiones autenticadas envían el header:  
`Authorization: Bearer <token>`.

---

## Páginas y funcionalidades

### Públicas (sin login)

- **index.html**
  - Hero y enlaces a registro y herramientas.
  - Listado de categorías (`/api/categorias`).
  - Listado de herramientas disponibles (todas o por categoría).
  - Filtro por categoría.
  - Botón “Alquilar” lleva a registro.

- **login.html**
  - Formulario email + contraseña.
  - Envío a `POST /auth/login`; guarda token y usuario; redirige al dashboard según rol.

- **register.html**
  - Formulario: nombre, apellido, email, contraseña, teléfono, dirección, **rol** (Cliente o Proveedor).
  - Campos extra: **Cliente** → documento de identidad; **Proveedor** → nombre empresa, RUT, descripción.
  - Envío a `POST /auth/register`; guarda token y usuario; redirige al dashboard.

### Panel Administrador (`admin/dashboard.html`)

- Estadísticas: total usuarios, herramientas, reservas, ingresos totales.
- Pestañas:
  - **Usuarios:** listado, crear usuario (incluye crear perfil Cliente o Proveedor).
  - **Categorías:** listado, crear/editar categoría.
  - **Herramientas:** listado de todas las herramientas.
  - **Reservas:** listado de todas las reservas.
  - **Pagos:** listado de todos los pagos.
  - **Devoluciones:** listado de todas las devoluciones.

### Panel Cliente (`cliente/dashboard.html`)

- Estadísticas: mis reservas, reservas activas, pagos realizados, total gastado.
- Pestañas:
  - **Explorar herramientas:** listado con filtro por categoría; botón “Alquilar” abre modal de reserva.
  - **Mis reservas:** listado; acciones según estado (pagar, devolver, etc.).
  - **Mis pagos:** listado de pagos del cliente.
- Modales: crear reserva (fechas, cantidad, dirección, notas, cálculo de días y costo), registrar pago, registrar devolución.

### Panel Proveedor (`proveedor/dashboard.html`)

- Estadísticas: mis herramientas, reservas, herramientas disponibles, devoluciones pendientes.
- Pestañas:
  - **Mis herramientas:** listado; agregar, editar y eliminar herramientas (categoría, precio/día, precio/semana, cantidad, estado, imagen, etc.).
  - **Reservas:** reservas de sus herramientas.
  - **Devoluciones:** devoluciones de equipos (aceptar/rechazar según implementación backend).
  - **Facturas:** listado de facturas del proveedor.

---

## Estilos y UI

- **css/styles.css**: variables CSS (colores primarios, éxito, peligro, texto, fondo, bordes), layout (contenedor, grid), navbar, hero, cards, formularios, tablas, botones, badges, modales y alertas.
- Diseño adaptable y coherente en todas las páginas.

---

## Resumen de ejecución rápida

1. Clonar o abrir el proyecto en la carpeta `Frontend_RentaHerramientas`.
2. Configurar `API_BASE_URL` en `js/config.js` si el backend no está en `http://localhost:8080`.
3. Iniciar el backend de RentTools (por ejemplo en el puerto 8080).
4. Servir el frontend desde la raíz del proyecto, por ejemplo:  
   `npx serve .`  
   y abrir la URL indicada (ej. `http://localhost:3000`).
5. Navegar a la raíz para ver la página principal, registrarse o iniciar sesión y usar los dashboards según el rol.

---

*RentTools - Frontend. Proyecto Spring.*

## Integrantes y proyecto frontend

| Integrante | Usuario GitHub | Enlace |
|------------|----------------|--------|
| **Freddy Ramón** | FreddyR03 | https://github.com/FreddyR03 |
| **Manuel Galvis** | DevManuelGalvis | https://github.com/DevManuelGalvis |
| **Jhoan Díaz** | JhoanS5 | https://github.com/JhoanS5 |

