import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

// Crear instancia de Axios con configuración base
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 900000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true'
    }
});

// Interceptor para solicitudes
api.interceptors.request.use(
    (config) => {
        // Obtener token del localStorage si existe
        const { getToken } = useAuthStore();
        if (getToken) {
            config.headers.Authorization = 'Bearer ' + getToken;
        }

        // Debug log para órdenes
        if (config.url && config.url.includes('/client/orders')) {
            console.log('🌐 API Request:', {
                method: config.method,
                url: config.url,
                baseURL: config.baseURL,
                fullUrl: config.baseURL + config.url
            });
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para respuestas
api.interceptors.response.use(
    function (response) {
        if (response.config.responseType === 'blob') {
            return response; // Devolver la respuesta completa para blobs
        }

        // Debug log para órdenes
        if (response.config.url && response.config.url.includes('/client/orders')) {
            console.log('🌐 API Response:', {
                url: response.config.url,
                status: response.status,
                data: response.data
            });
        }

        // Si el backend ya responde con la estructura estándar, solo retorna response.data
        // Si algún endpoint no cumple, aquí puedes adaptarlo
        return response.data;
    },
    function (error) {
        // Si el backend responde, intenta adaptar la estructura al estándar
        let backendData = error.response && error.response.data;
        let errResponse = {
            success: false,
            message: backendData?.message || error.message || 'Error de red',
            data: null,
            status: error.response ? error.response.status : 0,
            details: backendData?.details || {
                exception: error.name,
                error_message: error.message,
                trace: backendData?.trace || []
            },
            validationErrors: backendData?.errors || []
        };

        // Mensajes amigables según código de estado
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Manejar token expirado o no válido
                    if (error.config.url && !error.config.url.includes('/auth/login')) {
                        // Si no es una petición de login, probablemente el token expiró
                        console.log('🔐 Token expirado o inválido, limpiando sesión...');

                        // Importar y usar el store de auth para hacer logout
                        import('@/stores/auth').then(({ useAuthStore }) => {
                            const authStore = useAuthStore();
                            authStore.clearAllData();

                            // Redirigir a login solo si no estamos ya en una página pública
                            if (window.location.pathname !== '/' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                                window.location.href = '/';
                            }
                        });

                        errResponse.message = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
                    } else {
                        errResponse.message = 'Credenciales incorrectas. Por favor, inténtelo nuevamente.';
                    }
                    break;
                case 403:
                    errResponse.message = 'Usuario deshabilitado o no registrado.';
                    break;
                case 404:
                    errResponse.message = 'Recurso no encontrado.';
                    break;
                case 422:
                    // Si errors es un objeto tipo { campo: [mensajes] }
                    let validationMsgs = [];
                    if (backendData?.errors && typeof backendData.errors === 'object' && !Array.isArray(backendData.errors)) {
                        validationMsgs = Object.entries(backendData.errors).flatMap(([field, messages]) => messages.map((msg) => `${field}: ${msg}`));
                        errResponse.validationErrors = validationMsgs;
                    } else if (Array.isArray(backendData?.errors)) {
                        validationMsgs = backendData.errors;
                        errResponse.validationErrors = validationMsgs;
                    } else if (Array.isArray(backendData?.details)) {
                        validationMsgs = backendData.details;
                        errResponse.validationErrors = validationMsgs;
                    }

                    errResponse.message = 'Error de validación. Por favor, revise los campos.';
                    break;
                case 500:
                    errResponse.message = 'Error interno del servidor. Intente más tarde.';
                    break;
                default:
                    errResponse.message = `Error ${error.response.status}: ${error.response.statusText}`;
                    break;
            }
        } else if (error.code === 'ECONNABORTED') {
            // eslint-disable-next-line no-console
            console.error('error', error);
            errResponse.message = 'La solicitud ha tardado demasiado tiempo. Intente nuevamente.';
        } else {
            // eslint-disable-next-line no-console
            console.error('error', error);
            errResponse.message = 'Error de conexión. Verifique su red.';
        }

        return Promise.reject(errResponse);
    }
);

export default api;
