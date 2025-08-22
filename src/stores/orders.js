import { ordersApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useOrdersStore = defineStore('ordersStore', {
    state: () => ({
        orders: [],
        currentOrder: null,
        loading: false,
        paymentLoading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: [],
        paymentStatus: null,
        paymentPollingInterval: null,
        purchasedProducts: []
    }),

    getters: {
        getOrders: (state) => state.orders,
        getCurrentOrder: (state) => state.currentOrder,
        getOrderById: (state) => (id) => state.orders.find((order) => order.id === id),
        isLoading: (state) => state.loading,
        isPaymentLoading: (state) => state.paymentLoading,
        hasOrders: (state) => state.orders.length > 0,
        getError: (state) => state.error,
        getMessage: (state) => state.message,
        getPendingOrders: (state) => state.orders.filter((order) => order.status === 'pendiente_pago' || order.status === 'pago_fallido'),
        getActiveOrders: (state) => state.orders.filter((order) => ['confirmado', 'procesando', 'enviado'].includes(order.status)),
        getCompletedOrders: (state) => state.orders.filter((order) => order.status === 'entregado'),
        getPurchasedProducts: (state) => state.purchasedProducts
    },

    actions: {
        // Obtener todos los productos comprados del cliente
        async fetchPurchasedProducts(forceRefresh = false) {
            // Si ya tenemos datos y no se solicita refresco, usar caché
            if (!forceRefresh && this.purchasedProducts.length) return { success: true, data: this.purchasedProducts };

            this.resetState();
            try {
                const response = await ordersApi.getPurchasedProducts();

                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.purchasedProducts = processed.data.data || processed.data || [];
                    // Guardar caché
                    localStorage.setItem('purchasedProducts', JSON.stringify(this.purchasedProducts));
                }
                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al obtener productos comprados' };
            } finally {
                this.loading = false;
            }
        },
        // Obtener todas las órdenes del cliente
        async fetchOrders() {
            this.resetState();
            try {
                const response = await ordersApi.getMyOrders();

                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.orders = processed.data.orders || processed.data || [];
                }

                return processed;
            } catch (error) {
                console.error('💾 OrdersStore: Error fetching orders:', error);
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar las órdenes' };
            } finally {
                this.loading = false;
            }
        },

        // Obtener una orden específica
        async fetchOrderById(id) {
            this.resetState();
            try {
                const response = await ordersApi.getOrderById(id);

                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.currentOrder = processed.data.order || processed.data;
                }

                return processed;
            } catch (error) {
                console.error('💾 OrdersStore: Error fetching order:', error);
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar la orden' };
            } finally {
                this.loading = false;
            }
        },

        // Crear una nueva orden
        async createOrder(orderData) {
            this.resetState();
            try {
                // Validar datos antes de enviar
                if (!orderData.delivery_address_id) {
                    throw new Error('Dirección de entrega es requerida');
                }

                if (!orderData.products || orderData.products.length === 0) {
                    throw new Error('Debe agregar al menos un producto al carrito');
                }

                // Validar cada producto
                for (const product of orderData.products) {
                    if (!product.product_id || !product.quantity || product.quantity <= 0) {
                        throw new Error('Productos inválidos en el carrito');
                    }
                }

                const response = await ordersApi.createOrder(orderData);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    const newOrder = processed.data.order || processed.data;
                    this.orders.unshift(newOrder);
                    this.currentOrder = newOrder;

                    // Limpiar carrito localStorage
                    localStorage.removeItem('checkoutCart');
                    localStorage.removeItem('cart');
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al crear la orden' };
            } finally {
                this.loading = false;
            }
        },

        // Generar enlace de pago
        async generatePaymentLink(orderId) {
            this.paymentLoading = true;
            try {
                const response = await ordersApi.generatePaymentLink(orderId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    const paymentData = processed.data;
                    // Actualizar orden en el estado local
                    const orderIndex = this.orders.findIndex((order) => order.id === orderId);
                    if (orderIndex !== -1) {
                        this.orders[orderIndex].payment_status = 'pending';
                    }
                    return { success: true, data: paymentData };
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al generar enlace de pago' };
            } finally {
                this.paymentLoading = false;
            }
        },

        // Consultar estado de pago
        async checkPaymentStatus(orderId) {
            try {
                const response = await ordersApi.getPaymentStatus(orderId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    const statusData = processed.data;
                    this.paymentStatus = statusData;

                    // Actualizar orden en el estado local
                    const orderIndex = this.orders.findIndex((order) => order.id === orderId);
                    if (orderIndex !== -1) {
                        this.orders[orderIndex].payment_status = statusData.payment_status;
                        this.orders[orderIndex].status = statusData.order_status;
                    }

                    if (this.currentOrder && this.currentOrder.id === orderId) {
                        this.currentOrder.payment_status = statusData.payment_status;
                        this.currentOrder.status = statusData.order_status;
                    }
                }

                return processed;
            } catch (error) {
                console.error('Error checking payment status:', error);
                return { success: false, message: error.message || 'Error al consultar estado de pago' };
            }
        },

        // Cancelar orden
        async cancelOrder(orderId) {
            this.resetState();
            try {
                const response = await ordersApi.cancelOrder(orderId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Actualizar orden en el estado local
                    const orderIndex = this.orders.findIndex((order) => order.id === orderId);
                    if (orderIndex !== -1) {
                        this.orders[orderIndex].status = 'cancelado';
                    }

                    if (this.currentOrder && this.currentOrder.id === orderId) {
                        this.currentOrder.status = 'cancelado';
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cancelar la orden' };
            } finally {
                this.loading = false;
            }
        },

        // Iniciar polling de estado de pago
        startPaymentPolling(orderId, interval = 10000) {
            this.stopPaymentPolling();

            this.paymentPollingInterval = setInterval(async () => {
                const result = await this.checkPaymentStatus(orderId);

                if (result.success && this.paymentStatus) {
                    // Detener polling si el pago fue procesado (aprobado o rechazado)
                    if (['approved', 'rejected', 'cancelled'].includes(this.paymentStatus.payment_status)) {
                        this.stopPaymentPolling();
                    }
                }
            }, interval);
        },

        // Detener polling de estado de pago
        stopPaymentPolling() {
            if (this.paymentPollingInterval) {
                clearInterval(this.paymentPollingInterval);
                this.paymentPollingInterval = null;
            }
        },

        // Limpiar orden actual
        clearCurrentOrder() {
            this.currentOrder = null;
        },

        // Limpiar estado de pago
        clearPaymentStatus() {
            this.paymentStatus = null;
            this.stopPaymentPolling();
        },

        // Reiniciar estado
        resetState() {
            this.loading = true;
            this.error = null;
            this.success = false;
            this.message = '';
            this.validationErrors = [];
        },

        // Limpiar errores
        clearErrors() {
            this.error = null;
            this.validationErrors = [];
        },

        // Utilidades para estados de orden
        getOrderStatusLabel(status) {
            const statusMap = {
                pendiente_pago: 'Pendiente de Pago',
                pendiente: 'Pagado - Preparando Envío',
                confirmado: 'Confirmado',
                procesando: 'En Preparación',
                enviado: 'Enviado',
                entregado: 'Entregado',
                pago_fallido: 'Pago Fallido',
                cancelado: 'Cancelado'
            };
            return statusMap[status] || status;
        },

        getOrderStatusSeverity(status) {
            const statusMap = {
                pendiente_pago: 'warning',
                pendiente: 'info',
                confirmado: 'success',
                procesando: 'info',
                enviado: 'success',
                entregado: 'success',
                pago_fallido: 'danger',
                cancelado: 'secondary'
            };
            return statusMap[status] || 'secondary';
        },

        getOrderStatusIcon(status) {
            const iconMap = {
                pendiente_pago: 'pi pi-clock',
                pendiente: 'pi pi-check-circle',
                confirmado: 'pi pi-verified',
                procesando: 'pi pi-cog',
                enviado: 'pi pi-send',
                entregado: 'pi pi-check',
                pago_fallido: 'pi pi-times-circle',
                cancelado: 'pi pi-ban'
            };
            return iconMap[status] || 'pi pi-info-circle';
        },

        getOrderStatusDescription(status) {
            const descriptionMap = {
                pendiente_pago: 'Tu orden está esperando el pago para ser procesada',
                pendiente: 'Tu pago fue exitoso. Estamos preparando tu pedido para el envío',
                confirmado: 'Tu orden ha sido confirmada y está siendo preparada',
                procesando: 'Tu orden está siendo preparada en nuestro almacén',
                enviado: 'Tu orden ha sido enviada y está en camino',
                entregado: 'Tu orden ha sido entregada exitosamente',
                pago_fallido: 'Hubo un problema con el pago. Puedes intentar nuevamente',
                cancelado: 'Esta orden ha sido cancelada'
            };
            return descriptionMap[status] || 'Estado de la orden';
        },

        canPayOrder(order) {
            return ['pendiente_pago', 'pago_fallido'].includes(order.status);
        },

        canCancelOrder(order) {
            return ['pendiente_pago', 'pendiente'].includes(order.status);
        }
    }
});
