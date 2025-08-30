import { staffOrdersApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useStaffOrdersStore = defineStore('staffOrdersStore', {
    state: () => ({
        orders: [],
        currentOrder: null,
        statistics: null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: [],
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            perPage: 15
        },
        filters: {
            status: '',
            client_id: '',
            date_from: '',
            date_to: '',
            paginate: true
        }
    }),

    getters: {
        getOrders: (state) => state.orders,
        getCurrentOrder: (state) => state.currentOrder,
        getOrderById: (state) => (id) => state.orders.find((order) => order.id === id),
        getStatistics: (state) => state.statistics,
        isLoading: (state) => state.loading,
        hasOrders: (state) => state.orders.length > 0,
        getError: (state) => state.error,
        getMessage: (state) => state.message,

        // Filtros por estado
        getPendingPaymentOrders: (state) => state.orders.filter((order) => order.status === 'pendiente_pago'),
        getPendingOrders: (state) => state.orders.filter((order) => order.status === 'pendiente'),
        getConfirmedOrders: (state) => state.orders.filter((order) => order.status === 'confirmado'),
        getProcessingOrders: (state) => state.orders.filter((order) => order.status === 'procesando'),
        getShippedOrders: (state) => state.orders.filter((order) => order.status === 'enviado'),
        getDeliveredOrders: (state) => state.orders.filter((order) => order.status === 'entregado'),
        getCancelledOrders: (state) => state.orders.filter((order) => order.status === 'cancelado'),
        getFailedPaymentOrders: (state) => state.orders.filter((order) => order.status === 'pago_fallido'),

        // Contadores
        getTotalOrdersCount: (state) => state.statistics?.total_orders || 0,
        getPendingOrdersCount: (state) => state.statistics?.pending_orders || 0,
        getTodayOrdersCount: (state) => state.statistics?.today_orders || 0,
        getTotalRevenue: (state) => state.statistics?.total_revenue || '0.00',
        getPendingRevenue: (state) => state.statistics?.pending_revenue || '0.00'
    },

    actions: {
        // Obtener todas las órdenes con filtros
        async fetchOrders(params = {}) {
            this.resetState();
            try {
                const queryParams = { ...this.filters, ...params };
                const response = await staffOrdersApi.getOrders(queryParams);
                console.log('💾 StaffOrdersStore: Raw orders response:', response);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Si la respuesta tiene paginación
                    if (processed.data.data) {
                        this.orders = processed.data.data;
                        this.pagination = {
                            currentPage: processed.data.current_page || 1,
                            totalPages: processed.data.last_page || 1,
                            totalItems: processed.data.total || 0,
                            perPage: processed.data.per_page || 15
                        };
                    } else {
                        // Sin paginación
                        this.orders = processed.data || [];
                    }
                }

                console.log('💾 StaffOrdersStore: Orders set to:', this.orders);

                return processed;
            } catch (error) {
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
                const response = await staffOrdersApi.getOrderById(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.currentOrder = processed.data.order || processed.data;
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar la orden' };
            } finally {
                this.loading = false;
            }
        },

        // Actualizar estado de una orden
        async updateOrderStatus(id, statusData) {
            this.resetState();
            try {
                const response = await staffOrdersApi.updateOrderStatus(id, statusData);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    const updatedOrder = processed.data.order || processed.data;

                    // Actualizar en la lista de órdenes
                    const orderIndex = this.orders.findIndex((order) => order.id === id);
                    if (orderIndex !== -1) {
                        this.orders[orderIndex] = { ...this.orders[orderIndex], ...updatedOrder };
                    }

                    // Actualizar orden actual si coincide
                    if (this.currentOrder && this.currentOrder.id === id) {
                        this.currentOrder = { ...this.currentOrder, ...updatedOrder };
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al actualizar el estado de la orden' };
            } finally {
                this.loading = false;
            }
        },

        // Obtener estadísticas de órdenes
        async fetchOrderStatistics() {
            try {
                const response = await staffOrdersApi.getOrderStatistics();
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.statistics = processed.data;
                }

                return processed;
            } catch (error) {
                console.error('Error fetching order statistics:', error);
                return { success: false, message: error.message || 'Error al cargar las estadísticas' };
            }
        },

        // Obtener órdenes por estado específico
        async fetchOrdersByStatus(status, params = {}) {
            this.resetState();
            try {
                const response = await staffOrdersApi.getOrdersByStatus(status, params);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    if (processed.data.data) {
                        this.orders = processed.data.data;
                        this.pagination = {
                            currentPage: processed.data.current_page || 1,
                            totalPages: processed.data.last_page || 1,
                            totalItems: processed.data.total || 0,
                            perPage: processed.data.per_page || 15
                        };
                    } else {
                        this.orders = processed.data || [];
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar las órdenes' };
            } finally {
                this.loading = false;
            }
        },

        // Buscar órdenes
        async searchOrders(searchData, params = {}) {
            this.resetState();
            try {
                const response = await staffOrdersApi.searchOrders(searchData, params);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    if (processed.data.data) {
                        this.orders = processed.data.data;
                        this.pagination = {
                            currentPage: processed.data.current_page || 1,
                            totalPages: processed.data.last_page || 1,
                            totalItems: processed.data.total || 0,
                            perPage: processed.data.per_page || 15
                        };
                    } else {
                        this.orders = processed.data || [];
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error en la búsqueda' };
            } finally {
                this.loading = false;
            }
        },

        // Actualizar filtros
        updateFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
        },

        // Limpiar filtros
        clearFilters() {
            this.filters = {
                status: '',
                client_id: '',
                date_from: '',
                date_to: '',
                paginate: true
            };
        },

        // Limpiar orden actual
        clearCurrentOrder() {
            this.currentOrder = null;
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
                pendiente: 'Pendiente',
                confirmado: 'Confirmado',
                procesando: 'Procesando',
                enviado: 'Enviado',
                entregado: 'Entregado',
                cancelado: 'Cancelado',
                pago_fallido: 'Pago Fallido'
            };
            return statusMap[status] || status;
        },

        getOrderStatusSeverity(status) {
            const statusMap = {
                pendiente_pago: 'warning',     // Amarillo - esperando pago
                pendiente: 'secondary',        // Gris - orden nueva
                confirmado: 'info',           // Azul - confirmada pero no iniciada
                procesando: 'primary',        // Morado - en proceso activo
                enviado: 'warning',          // Naranja - en tránsito
                entregado: 'success',        // Verde - completada
                cancelado: 'danger',         // Rojo - cancelada
                pago_fallido: 'danger'       // Rojo - error de pago
            };
            return statusMap[status] || 'secondary';
        },

        getOrderStatusIcon(status) {
            const iconMap = {
                pendiente_pago: 'pi pi-clock',
                pendiente: 'pi pi-hourglass',
                confirmado: 'pi pi-check-circle',
                procesando: 'pi pi-cog',
                enviado: 'pi pi-send',
                entregado: 'pi pi-verified',
                cancelado: 'pi pi-times-circle',
                pago_fallido: 'pi pi-exclamation-triangle'
            };
            return iconMap[status] || 'pi pi-info-circle';
        },

        // Validar transiciones de estado
        getValidStatusTransitions(currentStatus) {
            const transitions = {
                pendiente_pago: ['pendiente', 'cancelado', 'pago_fallido'],
                pendiente: ['confirmado', 'cancelado'],
                confirmado: ['procesando', 'cancelado'],
                procesando: ['enviado', 'cancelado'],
                enviado: ['entregado'],
                entregado: [],
                cancelado: [],
                pago_fallido: ['pendiente_pago', 'cancelado']
            };
            return transitions[currentStatus] || [];
        },

        canUpdateStatus(order, newStatus) {
            const validTransitions = this.getValidStatusTransitions(order.status);
            return validTransitions.includes(newStatus);
        }
    }
});
