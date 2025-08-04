import { authApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('authStore', {
    state: () => ({
        userType: cache.getItem('userType') || 'client', // 'user' o 'client'
        token: cache.getItem('token') || null,
        user: cache.getItem('currentUser') || null,
        userRole: cache.getItem('userRole') || 'client',
        expiresAt: cache.getItem('expiresAt') || null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: []
    }),
    getters: {
        isAuthenticated: (state) => !!state.user,
        currentUser: (state) => state.user,
        isLoading: (state) => state.loading,
        getToken: (state) => state.token,
        getUserType: (state) => state.userType,
        getUserRole: (state) => state.userRole
    },
    actions: {
        async login(payload, type = 'client') {
            this.resetState();
            this.setUserType(type);
            try {
                // Usar la interfaz unificada authApi
                const response = await authApi.login(payload, type);

                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.setToken(processed.data.access_token);
                    this.setExpiration(processed.data.expiresIn);
                    this.setUser(processed.data.user);
                    this.startRefreshInterval();
                    if (processed.data.user.role_name) {
                        this.setUserRole(processed.data.user.role_name.toLowerCase());
                    } else {
                        this.setUserRole('client');
                    }
                }
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
            } finally {
                this.loading = false;
            }
        },
        async register(payload, type = 'client') {
            this.loading = true;
            this.setUserType(type);
            try {
                // Usar la interfaz unificada authApi
                const response = await authApi.register(payload, type);

                const processed = handleProcessSuccess(response, this);
                this.token = processed.data.access_token;
                this.user = processed.data.user;
                if (processed.data.user.role_name) {
                    this.setUserRole(processed.data.user.role_name.toLowerCase());
                } else {
                    this.setUserRole('client');
                }
                cache.setItem('token', this.token);
                cache.setItem('currentUser', this.user);
            } catch (error) {
                console.log(error);
                this.error = error;
                handleProcessError(error, this);
            } finally {
                this.loading = false;
            }
        },
        async logout() {
            this.loading = true;
            try {
                // Usar la interfaz unificada authApi con el tipo de usuario almacenado
                await authApi.logout(this.userType);
            } catch (error) {
                // Log del error pero no impedir el logout local
                console.error('Error en logout del servidor:', error);
            }

            // Limpiar el estado local independientemente del resultado del servidor
            this.clearAllData();

            this.loading = false;
        },

        // Nuevo método para limpiar todos los datos
        clearAllData() {
            // Limpiar estado del store
            this.token = null;
            this.user = null;
            this.userType = 'client'; // Resetear a valor por defecto
            this.userRole = 'client';
            this.expiresAt = null;
            this.error = null;
            this.success = false;
            this.message = '';
            this.validationErrors = [];

            // Limpiar timer de refresh
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }

            // Limpiar cache básico de auth
            cache.removeItem('token');
            cache.removeItem('currentUser');
            cache.removeItem('userType');
            cache.removeItem('userRole');
            cache.removeItem('expiresAt');

            // Limpiar datos específicos de cliente/órdenes
            localStorage.removeItem('checkoutCart');
            localStorage.removeItem('cart');
            localStorage.removeItem('pendingCart');
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('currentOrderId');

            // Limpiar cualquier configuración de sesión
            sessionStorage.clear();

            console.log('✅ Logout completado - todos los datos limpiados');
        },
        async refresh() {
            this.loading = true;
            try {
                // Usar la interfaz unificada authApi con el tipo de usuario almacenado
                const response = await authApi.refresh(this.userType);

                const processed = handleProcessSuccess(response, this);
                this.token = processed.data.access_token;
                this.user = processed.data.user;
                if (processed.data.user.role_name) {
                    this.setUserRole(processed.data.user.role_name.toLowerCase());
                } else {
                    this.setUserRole('client');
                }
                cache.setItem('token', this.token);
                cache.setItem('currentUser', this.user);
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
            } finally {
                this.loading = false;
            }
        },
        async me() {
            this.loading = true;
            try {
                // Usar la interfaz unificada authApi con el tipo de usuario almacenado
                const response = await authApi.me(this.userType);

                const processed = handleProcessSuccess(response, this);
                this.user = processed.data.user;
                if (processed.data.user.role_name) {
                    this.setUserRole(processed.data.user.role_name.toLowerCase());
                } else {
                    this.setUserRole('client');
                }
                cache.setItem('currentUser', this.user);
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
            } finally {
                this.loading = false;
            }
        },
        startRefreshInterval() {
            if (this.refreshTimer) clearInterval(this.refreshTimer);

            this.refreshTimer = setInterval(async () => {
                if (!this.token || !this.expiresAt) return;

                const now = Date.now();
                const timeLeft = this.expiresAt - now;

                console.log('Token refresh check. Time left: ', timeLeft);

                if (timeLeft < 90_000) {
                    console.log('Intentando refrescar token como el tiempo restante es menor a 90 segundos.');
                    await this.refresh();
                }
            }, 60_000); // Verifica cada 60s
        },

        setUser(user) {
            if (this.user !== user) {
                this.user = user;
                cache.setItem('currentUser', user);
            }
        },

        setUserType(type) {
            if (this.userType !== type && (type === 'user' || type === 'client')) {
                this.userType = type;
                cache.setItem('userType', type);
            }
        },
        setUserRole(role) {
            this.userRole = role;
            cache.setItem('userRole', role);
        },

        getUserTypeFromCache() {
            const cachedType = cache.getItem('userType');
            if (cachedType && (cachedType === 'user' || cachedType === 'client')) {
                this.userType = cachedType;
            }
            return this.userType;
        },

        setToken(token) {
            if (this.token !== token) {
                this.token = token;
                cache.setItem('token', token);
            }
        },

        setExpiration(expiresInSeconds) {
            const expirationTime = Date.now() + expiresInSeconds * 1000;
            if (this.expiresAt !== expirationTime) {
                this.expiresAt = expirationTime;
                cache.setItem('expiresAt', expirationTime);
            }
        },

        // Método para limpiar datos de auth pero mantener userType
        clearAuthData() {
            this.user = null;
            this.token = null;
            this.expiresAt = null;
            this.success = false;
            this.message = '';
            this.validationErrors = [];
            // No limpiamos userType para mantener la preferencia del usuario

            cache.removeItem('currentUser');
            cache.removeItem('token');
            cache.removeItem('expiresAt');

            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
        },
        resetState() {
            this.loading = true;
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        },

        /**
         * Verifica el email del usuario utilizando el token enviado por correo
         * @param {Object} payload - Contiene el token de verificación
         * @returns {Promise<void>}
         */
        async verifyEmail(payload) {
            this.resetState();
            try {
                // Solo disponible para clientes
                const response = await authApi.verifyEmail(payload);

                const processed = handleProcessSuccess(response, this);

                if (processed.success && this.user) {
                    // Actualizar el estado del usuario si está autenticado
                    this.user = {
                        ...this.user,
                        email_verified_at: new Date().toISOString()
                    };
                    cache.setItem('currentUser', this.user);
                }

                return processed;
            } catch (error) {
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al verificar el email' };
            } finally {
                this.loading = false;
            }
        },

        /**
         * Reenvía el correo de verificación al usuario actual
         * @param {Object} payload - Puede contener el email si es necesario
         * @returns {Promise<void>}
         */
        async resendVerificationEmail(payload = {}) {
            this.resetState();
            try {
                // Si no se proporciona un email y el usuario está autenticado, usar su email
                if (!payload.email && this.user && this.user.email) {
                    payload = { email: this.user.email };
                }

                // Solo disponible para clientes
                const response = await authApi.resendVerificationEmail(payload);

                return handleProcessSuccess(response, this);
            } catch (error) {
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al reenviar el correo de verificación' };
            } finally {
                this.loading = false;
            }
        },

        /**
         * Solicita un enlace para restablecer la contraseña
         * @param {Object} payload - Contiene el email del usuario
         * @returns {Promise<Object>} - Resultado de la operación
         */
        async forgotPassword(payload) {
            this.resetState();
            try {
                const response = await authApi.forgotPassword(payload);
                return handleProcessSuccess(response, this);
            } catch (error) {
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al solicitar el restablecimiento de contraseña' };
            } finally {
                this.loading = false;
            }
        },

        /**
         * Restablece la contraseña del usuario utilizando el token
         * @param {Object} payload - Contiene email, token, password y password_confirmation
         * @returns {Promise<Object>} - Resultado de la operación
         */
        async resetPassword(payload) {
            this.resetState();
            try {
                const response = await authApi.resetPassword(payload);
                return handleProcessSuccess(response, this);
            } catch (error) {
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al restablecer la contraseña' };
            } finally {
                this.loading = false;
            }
        },

        /**
         * Cambia la contraseña del usuario autenticado
         * @param {Object} payload - Contiene current_password, password y password_confirmation
         * @returns {Promise<Object>} - Resultado de la operación
         */
        async changePassword(payload) {
            this.resetState();
            try {
                const response = await authApi.changePassword(payload);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Al cambiar la contraseña exitosamente, invalidar tokens y cerrar sesión
                    this.clearAuthData();
                }

                return processed;
            } catch (error) {
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cambiar la contraseña' };
            } finally {
                this.loading = false;
            }
        }
    }
});
