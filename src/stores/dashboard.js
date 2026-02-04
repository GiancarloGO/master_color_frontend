import { dashboardApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useDashboardStore = defineStore('dashboardStore', {
    state: () => ({
        // Vista general
        overview: null,

        // Análisis de ventas
        salesAnalytics: null,

        // Análisis de inventario
        inventoryAnalytics: null,

        // Análisis de clientes
        customersAnalytics: null,

        // Análisis financiero
        financialAnalytics: null,

        // Métricas de rendimiento
        performanceMetrics: null,

        // Estados de carga
        loading: {
            overview: false,
            sales: false,
            inventory: false,
            customers: false,
            financial: false,
            performance: false
        },

        // Manejo de errores
        error: null,
        success: false,
        message: '',
        validationErrors: [],

        // Configuración de períodos
        defaultPeriod: 30, // días
        selectedPeriod: 30,

        // Configuración de caché
        cacheConfig: {
            ttl: 5 * 60 * 1000, // 5 minutos en milisegundos
            keys: {
                overview: 'dashboard_overview',
                sales: 'dashboard_sales',
                inventory: 'dashboard_inventory',
                customers: 'dashboard_customers',
                financial: 'dashboard_financial',
                performance: 'dashboard_performance'
            }
        }
    }),

    getters: {
        // Vista general
        getOverview: (state) => state.overview,
        getGeneralMetrics: (state) => state.overview?.summary || {},
        getRecentActivity: (state) => state.overview?.recent_activity || {},
        getAlerts: (state) => state.overview?.alerts || [],

        // Ventas
        getSalesAnalytics: (state) => state.salesAnalytics,
        getSalesTrend: (state) => state.salesAnalytics?.sales_trend || [],
        getRevenueTrend: (state) => state.salesAnalytics?.revenue_trend || [],
        getOrdersByStatus: (state) => state.salesAnalytics?.orders_by_status || {},
        getTopProducts: (state) => state.salesAnalytics?.top_products || [],
        getPaymentMethods: (state) => state.salesAnalytics?.payment_methods || [],
        getSalesByCategory: (state) => state.salesAnalytics?.sales_by_category || [],
        getHourlySales: (state) => state.salesAnalytics?.hourly_sales || [],
        getMonthlyComparison: (state) => state.salesAnalytics?.monthly_comparison || {},

        // Inventario
        getInventoryAnalytics: (state) => state.inventoryAnalytics,
        getStockLevels: (state) => state.inventoryAnalytics?.stock_levels || {},
        getLowStockProducts: (state) => state.inventoryAnalytics?.low_stock_products || [],
        getStockMovements: (state) => state.inventoryAnalytics?.stock_movements || [],
        getInventoryValue: (state) => state.inventoryAnalytics?.inventory_value || {},
        getProductsByCategory: (state) => state.inventoryAnalytics?.products_by_category || [],
        getStockTurnover: (state) => state.inventoryAnalytics?.stock_turnover || [],

        // Clientes
        getCustomersAnalytics: (state) => state.customersAnalytics,
        getCustomerGrowth: (state) => state.customersAnalytics?.customer_growth || [],
        getCustomerSegmentation: (state) => state.customersAnalytics?.segmentation || {},
        getTopCustomers: (state) => state.customersAnalytics?.top_customers || [],
        getCustomerLifetimeValue: (state) => state.customersAnalytics?.lifetime_value || {},
        getCustomerRetention: (state) => state.customersAnalytics?.retention || {},
        getGeographicDistribution: (state) => state.customersAnalytics?.geographic_distribution || [],

        // Financiero
        getFinancialAnalytics: (state) => state.financialAnalytics,
        getRevenueBreakdown: (state) => state.financialAnalytics?.revenue_breakdown || [],
        getProfitMargins: (state) => state.financialAnalytics?.profit_margins || [],
        getCashFlow: (state) => state.financialAnalytics?.cash_flow || [],
        getPaymentStatus: (state) => state.financialAnalytics?.payment_status || {},
        getFinancialSummary: (state) => state.financialAnalytics?.financial_summary || {},

        // Rendimiento
        getPerformanceMetrics: (state) => state.performanceMetrics,
        getKPIs: (state) => state.performanceMetrics?.kpis || {},
        getConversionRates: (state) => state.performanceMetrics?.conversion_rates || {},
        getFulfillmentMetrics: (state) => state.performanceMetrics?.fulfillment || {},
        getProductPerformance: (state) => state.performanceMetrics?.product_performance || [],

        // Estados de carga
        isLoading: (state) => (section) => state.loading[section] || false,
        isAnyLoading: (state) => Object.values(state.loading).some((loading) => loading),

        // Errores
        getError: (state) => state.error,
        getMessage: (state) => state.message,

        // Utilidades
        getSelectedPeriod: (state) => state.selectedPeriod
    },

    actions: {
        // Configurar período de análisis
        setSelectedPeriod(period) {
            this.selectedPeriod = period;
        },

        // Utilidades de caché
        getCacheKey(section, params = {}) {
            const baseKey = this.cacheConfig.keys[section];
            const paramsString = Object.keys(params).length > 0 ? `_${JSON.stringify(params)}` : '';
            return `${baseKey}${paramsString}`;
        },

        isCacheValid(cacheData) {
            if (!cacheData || !cacheData.timestamp) return false;
            const now = Date.now();
            return now - cacheData.timestamp < this.cacheConfig.ttl;
        },

        getCachedData(section, params = {}) {
            const cacheKey = this.getCacheKey(section, params);
            const cachedData = cache.getItem(cacheKey);

            if (cachedData && this.isCacheValid(cachedData)) {
                return cachedData.data;
            }
            return null;
        },

        setCachedData(section, data, params = {}) {
            const cacheKey = this.getCacheKey(section, params);
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            cache.setItem(cacheKey, cacheData);
        },

        clearCache(section = null) {
            if (section) {
                const cacheKey = this.getCacheKey(section);
                cache.removeItem(cacheKey);
            } else {
                // Limpiar todo el caché del dashboard
                Object.values(this.cacheConfig.keys).forEach((key) => {
                    cache.removeItem(key);
                });
            }
        },

        // Vista general del dashboard
        async fetchOverview(params = {}, useCache = true) {
            const finalParams = { period: this.selectedPeriod, ...params };

            // Intentar obtener datos del caché primero
            if (useCache) {
                const cachedData = this.getCachedData('overview', finalParams);
                if (cachedData) {
                    this.overview = cachedData;
                    return { success: true, message: 'Datos cargados desde caché', fromCache: true };
                }
            }

            this.loading.overview = true;
            this.resetError();

            try {
                const response = await dashboardApi.getOverview(finalParams);

                console.log('Respuesta de getOverview:', response);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.overview = processed.data;
                    // Guardar en caché
                    this.setCachedData('overview', processed.data, finalParams);
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar vista general' };
            } finally {
                this.loading.overview = false;
            }
        },

        // Análisis de ventas
        async fetchSalesAnalytics(params = {}, useCache = true) {
            const finalParams = { period: this.selectedPeriod, ...params };

            // Intentar obtener datos del caché primero
            if (useCache) {
                const cachedData = this.getCachedData('sales', finalParams);
                if (cachedData) {
                    this.salesAnalytics = cachedData;
                    return { success: true, message: 'Datos cargados desde caché', fromCache: true };
                }
            }

            this.loading.sales = true;
            this.resetError();

            try {
                const response = await dashboardApi.getSalesAnalytics(finalParams);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.salesAnalytics = processed.data;
                    // Guardar en caché
                    this.setCachedData('sales', processed.data, finalParams);
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar análisis de ventas' };
            } finally {
                this.loading.sales = false;
            }
        },

        // Análisis de inventario
        async fetchInventoryAnalytics(params = {}, useCache = true) {
            const finalParams = { period: this.selectedPeriod, ...params };

            // Intentar obtener datos del caché primero
            if (useCache) {
                const cachedData = this.getCachedData('inventory', finalParams);
                if (cachedData) {
                    this.inventoryAnalytics = cachedData;
                    return { success: true, message: 'Datos cargados desde caché', fromCache: true };
                }
            }

            this.loading.inventory = true;
            this.resetError();

            try {
                const response = await dashboardApi.getInventoryAnalytics(finalParams);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.inventoryAnalytics = processed.data;
                    // Guardar en caché
                    this.setCachedData('inventory', processed.data, finalParams);
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar análisis de inventario' };
            } finally {
                this.loading.inventory = false;
            }
        },

        // Análisis de clientes
        async fetchCustomersAnalytics(params = {}, useCache = true) {
            const finalParams = { period: this.selectedPeriod, ...params };

            // Intentar obtener datos del caché primero
            if (useCache) {
                const cachedData = this.getCachedData('customers', finalParams);
                if (cachedData) {
                    this.customersAnalytics = cachedData;
                    return { success: true, message: 'Datos cargados desde caché', fromCache: true };
                }
            }

            this.loading.customers = true;
            this.resetError();

            try {
                const response = await dashboardApi.getCustomersAnalytics(finalParams);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.customersAnalytics = processed.data;
                    // Guardar en caché
                    this.setCachedData('customers', processed.data, finalParams);
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar análisis de clientes' };
            } finally {
                this.loading.customers = false;
            }
        },

        // Análisis financiero
        async fetchFinancialAnalytics(params = {}, useCache = true) {
            const finalParams = { period: this.selectedPeriod, ...params };

            // Intentar obtener datos del caché primero
            if (useCache) {
                const cachedData = this.getCachedData('financial', finalParams);
                if (cachedData) {
                    this.financialAnalytics = cachedData;
                    return { success: true, message: 'Datos cargados desde caché', fromCache: true };
                }
            }

            this.loading.financial = true;
            this.resetError();

            try {
                const response = await dashboardApi.getFinancialAnalytics(finalParams);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.financialAnalytics = processed.data;
                    // Guardar en caché
                    this.setCachedData('financial', processed.data, finalParams);
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar análisis financiero' };
            } finally {
                this.loading.financial = false;
            }
        },

        // Métricas de rendimiento
        async fetchPerformanceMetrics(params = {}, useCache = true) {
            const finalParams = { period: this.selectedPeriod, ...params };

            // Intentar obtener datos del caché primero
            if (useCache) {
                const cachedData = this.getCachedData('performance', finalParams);
                if (cachedData) {
                    this.performanceMetrics = cachedData;
                    return { success: true, message: 'Datos cargados desde caché', fromCache: true };
                }
            }

            this.loading.performance = true;
            this.resetError();

            try {
                const response = await dashboardApi.getPerformanceMetrics(finalParams);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.performanceMetrics = processed.data;
                    // Guardar en caché
                    this.setCachedData('performance', processed.data, finalParams);
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar métricas de rendimiento' };
            } finally {
                this.loading.performance = false;
            }
        },

        // Cargar todos los datos del dashboard
        async fetchAllDashboardData(params = {}, useCache = true) {
            try {
                const promises = [
                    this.fetchOverview(params, useCache),
                    this.fetchSalesAnalytics(params, useCache),
                    this.fetchInventoryAnalytics(params, useCache),
                    this.fetchCustomersAnalytics(params, useCache),
                    this.fetchFinancialAnalytics(params, useCache),
                    this.fetchPerformanceMetrics(params, useCache)
                ];

                const results = await Promise.all(promises);
                const fromCache = results.some((result) => result.fromCache);

                return {
                    success: true,
                    message: fromCache ? 'Dashboard cargado' : 'Dashboard cargado correctamente',
                    fromCache
                };
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                return { success: false, message: 'Error al cargar el dashboard' };
            }
        },

        // Recargar datos específicos (forzar nueva consulta)
        async refreshSection(section, params = {}) {
            // Limpiar caché de la sección antes de recargar
            this.clearCache(section);

            switch (section) {
                case 'overview':
                    return await this.fetchOverview(params, false);
                case 'sales':
                    return await this.fetchSalesAnalytics(params, false);
                case 'inventory':
                    return await this.fetchInventoryAnalytics(params, false);
                case 'customers':
                    return await this.fetchCustomersAnalytics(params, false);
                case 'financial':
                    return await this.fetchFinancialAnalytics(params, false);
                case 'performance':
                    return await this.fetchPerformanceMetrics(params, false);
                default:
                    return { success: false, message: 'Sección no válida' };
            }
        },

        // Limpiar datos
        clearDashboardData() {
            this.overview = null;
            this.salesAnalytics = null;
            this.inventoryAnalytics = null;
            this.customersAnalytics = null;
            this.financialAnalytics = null;
            this.performanceMetrics = null;
            // También limpiar caché
            this.clearCache();
        },

        // Refrescar todos los datos (forzar nueva consulta)
        async refreshAllData(params = {}) {
            this.clearCache(); // Limpiar todo el caché
            return await this.fetchAllDashboardData(params, false);
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

        // Utilidades de formato
        formatCurrency(amount) {
            if (!amount) return '0.00';
            return new Intl.NumberFormat('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(parseFloat(amount));
        },

        formatPercentage(value) {
            if (!value) return '0%';
            return `${parseFloat(value).toFixed(1)}%`;
        },

        formatNumber(value) {
            if (!value) return '0';
            return new Intl.NumberFormat('es-PE').format(parseInt(value));
        }
    }
});
