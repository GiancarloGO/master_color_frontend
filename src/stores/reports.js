import { reportsApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useReportsStore = defineStore('reportsStore', {
    state: () => ({
        // Estados de carga
        loading: {
            sales: false,
            purchases: false,
            orders: false
        },

        // Manejo de errores
        error: null,
        success: false,
        message: '',
        validationErrors: [],

        // Filtros por defecto
        defaultFilters: {
            start_date: '',
            end_date: '',
            client_id: null,
            user_id: null,
            status: '',
            format: 'pdf'
        },

        // Historial de reportes (caché de metadatos)
        reportsHistory: cache.getItem('reports_history') || [],

        // Estados válidos para filtros
        validStatuses: [
            { label: 'Todos', value: '' },
            { label: 'Pendiente', value: 'pending' },
            { label: 'Procesando', value: 'processing' },
            { label: 'Enviado', value: 'shipped' },
            { label: 'Entregado', value: 'delivered' },
            { label: 'Cancelado', value: 'cancelled' }
        ],

        // Formatos disponibles
        availableFormats: [
            { label: 'PDF', value: 'pdf', icon: 'pi pi-file-pdf' },
            { label: 'Excel', value: 'excel', icon: 'pi pi-file-excel' }
        ]
    }),

    getters: {
        // Estados de carga
        isLoading: (state) => (reportType) => state.loading[reportType] || false,
        isAnyLoading: (state) => Object.values(state.loading).some((loading) => loading),

        // Errores
        getError: (state) => state.error,
        getMessage: (state) => state.message,
        getValidationErrors: (state) => state.validationErrors,

        // Filtros y opciones
        getValidStatuses: (state) => state.validStatuses,
        getAvailableFormats: (state) => state.availableFormats,
        getDefaultFilters: (state) => state.defaultFilters,

        // Historial
        getReportsHistory: (state) => state.reportsHistory,
        getRecentReports: (state) => state.reportsHistory.slice(0, 10)
    },

    actions: {
        // Generar reporte de ventas
        async generateSalesReport(filters = {}) {
            this.loading.sales = true;
            this.resetError();

            try {
                const finalFilters = { ...this.defaultFilters, ...filters };
                const response = await reportsApi.generateSalesReport(finalFilters);

                // Crear archivo para descarga
                const blob = new Blob([response.data], {
                    type: finalFilters.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                const extension = finalFilters.format === 'pdf' ? '.pdf' : '.xlsx';
                const fileName = `reporte-ventas-${new Date().toISOString().split('T')[0]}${extension}`;
                link.setAttribute('download', fileName);

                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                // Guardar en historial
                this.addToHistory('sales', fileName, finalFilters);

                this.success = true;
                this.message = 'Reporte de ventas generado exitosamente';

                return { success: true, message: this.message };
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al generar reporte de ventas' };
            } finally {
                this.loading.sales = false;
            }
        },

        // Generar reporte de compras
        async generatePurchasesReport(filters = {}) {
            this.loading.purchases = true;
            this.resetError();

            try {
                const finalFilters = { ...this.defaultFilters, ...filters };
                const response = await reportsApi.generatePurchasesReport(finalFilters);

                const blob = new Blob([response.data], {
                    type: finalFilters.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                const extension = finalFilters.format === 'pdf' ? '.pdf' : '.xlsx';
                const fileName = `reporte-compras-${new Date().toISOString().split('T')[0]}${extension}`;
                link.setAttribute('download', fileName);

                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                // Guardar en historial
                this.addToHistory('purchases', fileName, finalFilters);

                this.success = true;
                this.message = 'Reporte de compras generado exitosamente';

                return { success: true, message: this.message };
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al generar reporte de compras' };
            } finally {
                this.loading.purchases = false;
            }
        },

        // Generar reporte de órdenes
        async generateOrdersReport(filters = {}) {
            this.loading.orders = true;
            this.resetError();

            try {
                const finalFilters = { ...this.defaultFilters, ...filters };
                const response = await reportsApi.generateOrdersReport(finalFilters);

                const blob = new Blob([response.data], {
                    type: finalFilters.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                const extension = finalFilters.format === 'pdf' ? '.pdf' : '.xlsx';
                const fileName = `reporte-ordenes-${new Date().toISOString().split('T')[0]}${extension}`;
                link.setAttribute('download', fileName);

                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                // Guardar en historial
                this.addToHistory('orders', fileName, finalFilters);

                this.success = true;
                this.message = 'Reporte de órdenes generado exitosamente';

                return { success: true, message: this.message };
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al generar reporte de órdenes' };
            } finally {
                this.loading.orders = false;
            }
        },

        // Agregar al historial
        addToHistory(type, fileName, filters) {
            const historyItem = {
                id: Date.now(),
                type,
                fileName,
                filters,
                generatedAt: new Date().toISOString(),
                generatedBy: 'admin' // Esto podría venir del auth store
            };

            this.reportsHistory.unshift(historyItem);

            // Mantener solo los últimos 50 reportes
            if (this.reportsHistory.length > 50) {
                this.reportsHistory = this.reportsHistory.slice(0, 50);
            }

            // Guardar en cache
            cache.setItem('reports_history', this.reportsHistory);
        },

        // Limpiar historial
        clearHistory() {
            this.reportsHistory = [];
            cache.removeItem('reports_history');
        },

        // Reiniciar errores
        resetError() {
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

        // Validar filtros
        validateFilters(filters) {
            const errors = {};

            if (!filters.format) {
                errors.format = ['El formato es requerido'];
            }

            if (filters.start_date && filters.end_date) {
                const startDate = new Date(filters.start_date);
                const endDate = new Date(filters.end_date);

                if (startDate > endDate) {
                    errors.start_date = ['La fecha de inicio debe ser anterior a la fecha de fin'];
                }
            }

            return {
                isValid: Object.keys(errors).length === 0,
                errors
            };
        },

        // Obtener filtros con valores por defecto
        getFiltersWithDefaults(userFilters = {}) {
            // Si no se proporcionan fechas, usar el último mes
            const defaultStartDate = userFilters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const defaultEndDate = userFilters.end_date || new Date().toISOString().split('T')[0];

            return {
                ...this.defaultFilters,
                start_date: defaultStartDate,
                end_date: defaultEndDate,
                ...userFilters
            };
        }
    }
});
