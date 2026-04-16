// ═══════════════════════════════════════════
// API LAYER — Fetch wrapper with auth support
// ═══════════════════════════════════════════

const API_BASE = 'http://localhost:3000/api/v1';

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            credentials: 'include',
            headers: {},
            ...options,
        };

        if (!(options.body instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
            if (options.body && typeof options.body === 'object') {
                config.body = JSON.stringify(options.body);
            }
        }

        try {
            let response = await fetch(url, config);

            if (response.status === 401 && !endpoint.includes('refresh-token') && !endpoint.includes('login')) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    response = await fetch(url, config);
                } else {
                    Auth.logout();
                    window.location.href = '/login.html';
                    throw new Error('Session expired. Please log in again.');
                }
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection.');
            }
            throw error;
        }
    }

    async refreshToken() {
        try {
            const response = await fetch(`${this.baseURL}/user/refresh-token`, {
                method: 'POST',
                credentials: 'include',
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    }

    patch(endpoint, body) {
        return this.request(endpoint, { method: 'PATCH', body });
    }

    put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    postForm(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
        });
    }
}

const api = new ApiClient(API_BASE);
