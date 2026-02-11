class AuthManager {
    static saveAuth(authResponse) {
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('user', JSON.stringify({
            usuarioId: authResponse.usuarioId,
            nombre: authResponse.nombre,
            apellido: authResponse.apellido,
            email: authResponse.email,
            rol: authResponse.rol,
            perfilId: authResponse.perfilId
        }));
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static isAuthenticated() {
        return this.getToken() !== null;
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    static redirectToDashboard() {
        const user = this.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        switch (user.rol) {
            case ROLES.ADMIN:
                window.location.href = '/admin/dashboard.html';
                break;
            case ROLES.PROVEEDOR:
                window.location.href = '/proveedor/dashboard.html';
                break;
            case ROLES.CLIENTE:
                window.location.href = '/cliente/dashboard.html';
                break;
            default:
                window.location.href = '/login.html';
        }
    }

    static checkAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }

        const user = this.getUser();
        if (requiredRole && user.rol !== requiredRole) {
            alert('No tienes permisos para acceder a esta página');
            this.redirectToDashboard();
            return false;
        }

        return true;
    }
}