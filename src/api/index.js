import axios from './axios';

// Auth para usuarios (administradores, empleados, etc.)
export const login = (payload) => axios.post('/auth/login', payload);
export const register = (payload) => axios.post('/auth/register', payload);
export const logout = () => axios.post('/auth/logout');
export const refresh = () => axios.post('/auth/refresh');
export const me = () => axios.post('/auth/me');

// Auth para clientes (compradores)
export const loginClient = (payload) => axios.post('/client/auth/login', payload);
export const registerClient = (payload) => axios.post('/client/auth/register', payload);
export const logoutClient = () => axios.post('/client/auth/logout');
export const refreshClient = () => axios.post('/client/auth/refresh');
export const meClient = () => axios.post('/client/auth/me');
export const verifyEmail = (payload) => axios.post('/client/auth/verify-email', payload);
export const resendVerificationEmail = (payload) => axios.post('/client/auth/resend-verification', payload);
export const forgotPassword = (payload) => axios.post('/client/auth/forgot-password', payload);
export const resetPassword = (payload) => axios.post('/client/auth/reset-password', payload);

// Función genérica para seleccionar el endpoint correcto según el tipo de usuario
export const authApi = {
    login: (payload, type = 'user') => (type === 'client' ? loginClient(payload) : login(payload)),
    register: (payload, type = 'user') => (type === 'client' ? registerClient(payload) : register(payload)),
    logout: (type = 'user') => (type === 'client' ? logoutClient() : logout()),
    refresh: (type = 'user') => (type === 'client' ? refreshClient() : refresh()),
    me: (type = 'user') => (type === 'client' ? meClient() : me()),
    verifyEmail: (payload) => verifyEmail(payload), // Solo disponible para clientes
    resendVerificationEmail: (payload) => resendVerificationEmail(payload), // Solo disponible para clientes
    forgotPassword: (payload) => forgotPassword(payload), // Solo disponible para clientes
    resetPassword: (payload) => resetPassword(payload) // Solo disponible para clientes
};

// Funciones para direcciones de clientes
export const clientAddressesApi = {
    getAddresses: () => axios.get('/client/addresses'),
    getAddressById: (id) => axios.get(`/client/addresses/${id}`),
    createAddress: (payload) => axios.post('/client/addresses', payload),
    updateAddress: (id, payload) => axios.put(`/client/addresses/${id}`, payload),
    deleteAddress: (id) => axios.delete(`/client/addresses/${id}`),
    setMainAddress: (id) => axios.put(`/client/addresses/${id}/set-main`)
};

// Funciones para usuarios
export const usersApi = {
    getUsers: () => axios.get('/users'),
    getUserById: (id) => axios.get(`/users/${id}`),
    createUser: (payload) => axios.post('/users', payload),
    updateUser: (id, payload) => axios.put(`/users/${id}`, payload),
    deleteUser: (id) => axios.delete(`/users/${id}`)
};

// Funciones para roles
export const rolesApi = {
    getRoles: () => axios.get('/roles'),
    getRoleById: (id) => axios.get(`/roles/${id}`),
    createRole: (payload) => axios.post('/roles', payload),
    updateRole: (id, payload) => axios.put(`/roles/${id}`, payload),
    deleteRole: (id) => axios.delete(`/roles/${id}`)
};

// Funciones para productos
export const productsApi = {
    getProducts: () => axios.get('/products'),
    getPublicProducts: () => axios.get('/products/public'),
    getProductById: (id) => axios.get(`/products/${id}`),
    createProduct: (formData) =>
        axios.post('/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }),
    updateProduct: (id, formData) =>
        axios.post(`/products/updateProduct/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }),
    deleteProduct: (id) => axios.delete(`/products/${id}`)
};

// Funciones para stock
export const stockApi = {
    getStocks: () => axios.get('/stocks'),
    getStockById: (id) => axios.get(`/stocks/${id}`),
    getStocksForMovements: () => axios.get('/stocks/for-movements'),
    // Intentar obtener stocks por producto específico
    getStockByProductId: (productId) => axios.get(`/stocks/product/${productId}`),
    // Alternativa: obtener todos los stocks con información de productos
    getAllStocksWithProducts: () => axios.get('/stocks/with-products')
};

// Funciones para stock movements
export const stockMovementsApi = {
    getStockMovements: () => axios.get('/stock-movements'),
    getStockMovementById: (id) => axios.get(`/stock-movements/${id}`),
    createStockMovement: (payload) => axios.post('/stock-movements', payload),
    updateStockMovement: (id, payload) => axios.put(`/stock-movements/${id}`, payload),
    deleteStockMovement: (id) => axios.delete(`/stock-movements/${id}`),
    cancelStockMovement: (id) => axios.patch(`/stock-movements/${id}/cancel`)
};

// Funciones para órdenes de clientes
export const ordersApi = {
    // Crear orden desde carrito
    createOrder: (payload) => axios.post('/client/orders', payload),

    // Obtener órdenes del cliente autenticado
    getMyOrders: () => axios.get('/client/orders?include=products,order_details'),

    // Obtener orden específica del cliente
    getOrderById: (id) => axios.get(`/client/orders/${id}?include=products,order_details`),

    // Generar link de pago para una orden
    generatePaymentLink: (orderId) => axios.post(`/client/orders/${orderId}/payment`),

    // Consultar estado de pago (endpoint correcto según la guía)
    getPaymentStatus: (orderId) => axios.get(`/payment-status/${orderId}`),

    // Cancelar orden (solo si está en pendiente_pago)
    cancelOrder: (orderId) => axios.patch(`/client/orders/${orderId}/cancel`),

    // Obtener todos los productos comprados por el cliente (sin paginación)
    getPurchasedProducts: (paginate = false) => axios.get(`/client/orders/purchased-products${paginate === false ? '?paginate=false' : ''}`)
};

// Funciones para pagos con MercadoPago Bricks
export const paymentsApi = {
    // Procesar pago con datos de Checkout Bricks
    processPayment: (payload) => axios.post('/client/payments/process', payload),

    // Crear preferencia de pago para Bricks
    createPaymentPreference: (orderId) => axios.post(`/client/orders/${orderId}/payment-preference`),

    // Verificar estado de pago
    verifyPayment: (paymentId) => axios.get(`/client/payments/${paymentId}/verify`),

    // Obtener historial de pagos
    getPaymentHistory: () => axios.get('/client/payments/history')
};

// Funciones para direcciones de entrega del cliente
export const addressesApi = {
    // Obtener direcciones del cliente autenticado
    getMyAddresses: () => axios.get('/client/addresses'),

    // Crear nueva dirección
    createAddress: (payload) => axios.post('/client/addresses', payload),

    // Actualizar dirección
    updateAddress: (id, payload) => axios.put(`/client/addresses/${id}`, payload),

    // Eliminar dirección
    deleteAddress: (id) => axios.delete(`/client/addresses/${id}`),

    // Marcar dirección como principal
    setMainAddress: (id) => axios.patch(`/client/addresses/${id}/set-main`)
};

// Funciones para manejo de retorno de pagos de MercadoPago
export const paymentReturnApi = {
    // Procesar retorno de pago de MercadoPago (sin autenticación)
    processPaymentReturn: (payload) =>
        axios.post('/payment-return', payload, {
            // Sin headers de autenticación
            headers: {
                'Content-Type': 'application/json'
            }
        })
};
