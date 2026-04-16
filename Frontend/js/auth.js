// ═══════════════════════════════════════════
// AUTH — Manage authentication state
// ═══════════════════════════════════════════

const Auth = {
    USER_KEY: 'viewtube_user',

    getUser() {
        try {
            const data = localStorage.getItem(this.USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    isLoggedIn() {
        return this.getUser() !== null;
    },

    logout() {
        localStorage.removeItem(this.USER_KEY);
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    redirectIfLoggedIn(target = '/home.html') {
        if (this.isLoggedIn()) {
            window.location.href = target;
        }
    }
};
