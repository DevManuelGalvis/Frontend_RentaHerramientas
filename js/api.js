class ApiClient {
    static async request(url, options = {}) {
        const token = AuthManager.getToken();

        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                AuthManager.logout();
                throw new Error('Sesión expirada');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error en la petición');
            }

            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async get(url) {
        return this.request(url, { method: 'GET' });
    }

    static async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }

    static async patch(url, data = null) {
        return this.request(url, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : null
        });
    }
}