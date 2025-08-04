<script setup>
import AlertPanel from '@/components/dashboard/AlertPanel.vue';
import MetricCard from '@/components/dashboard/MetricCard.vue';
import ChartCard from '@/components/dashboard/ChartCard.vue';
import { useDashboardStore } from '@/stores/dashboard';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const dashboardStore = useDashboardStore();
const toast = useToast();

const selectedPeriod = ref(30);
const refreshing = ref(false);

const periodOptions = [
    { label: '7 días', value: 7 },
    { label: '30 días', value: 30 },
    { label: '90 días', value: 90 }
];

// Computed properties
const isLoading = computed(() => dashboardStore.isAnyLoading);
const overviewData = computed(() => dashboardStore.getOverview);
const generalMetrics = computed(() => dashboardStore.getGeneralMetrics);
const salesData = computed(() => dashboardStore.getSalesAnalytics);
const inventoryData = computed(() => dashboardStore.getInventoryAnalytics);
const customersData = computed(() => dashboardStore.getCustomersAnalytics);
const financialData = computed(() => dashboardStore.getFinancialAnalytics);
const performanceData = computed(() => dashboardStore.getPerformanceMetrics);

// Alerts adaptadas al formato del componente
const alerts = computed(() => {
    const rawAlerts = dashboardStore.getAlerts;
    if (!rawAlerts || !Array.isArray(rawAlerts)) return [];
    
    return rawAlerts.map((alert, index) => ({
        id: index + 1,
        type: alert.type === 'warning' ? 'low_stock' : 'pending_orders',
        title: alert.type === 'warning' ? 'Stock Bajo' : 'Órdenes Pendientes',
        message: alert.message,
        created_at: new Date().toISOString(),
        action: alert.action ? { 
            label: 'Ver detalles', 
            route: alert.action, 
            severity: alert.priority === 'high' ? 'warning' : 'info' 
        } : null
    }));
});

onMounted(async () => {
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        dashboardStore.setSelectedPeriod(selectedPeriod.value);
        const result = await dashboardStore.fetchAllDashboardData();
        
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: result.fromCache ? 'Cargado desde caché' : 'Cargado',
                detail: result.message || 'Dashboard cargado correctamente',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar el dashboard',
            life: 3000
        });
    }
}

async function refreshDashboard() {
    refreshing.value = true;
    try {
        const result = await dashboardStore.refreshAllData();
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Actualizado',
                detail: result.message || 'Dashboard actualizado correctamente',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar el dashboard',
            life: 3000
        });
    } finally {
        refreshing.value = false;
    }
}

async function handlePeriodChange(newPeriod) {
    selectedPeriod.value = newPeriod;
    dashboardStore.setSelectedPeriod(newPeriod);
    await loadDashboardData();
}

function handleAlertAction(alert) {
    if (alert.action && alert.action.route) {
        // Navegar a la ruta especificada
        window.location.href = alert.action.route;
    }
}
</script>

<template>
    <div class="dashboard">
        <!-- Header del Dashboard -->
        <div class="dashboard__header">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900">Dashboard Administrativo</h1>
                    <p class="text-surface-600 mt-1">Panel de control y métricas de Master Color</p>
                </div>

                <div class="flex items-center gap-3">
                    <Select v-model="selectedPeriod" :options="periodOptions" option-label="label" option-value="value" class="w-32" @change="handlePeriodChange(selectedPeriod)" />
                    <Button icon="pi pi-refresh" label="Actualizar" :loading="refreshing" @click="refreshDashboard" />
                </div>
            </div>
        </div>

        <!-- Contenido del Dashboard -->
        <div class="dashboard__content space-y-8">
            <!-- Métricas principales -->
            <section class="dashboard-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="pi pi-chart-bar"></i>
                        Resumen General
                    </h2>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard 
                        title="Total Órdenes" 
                        :value="generalMetrics.total_orders || 0" 
                        icon="pi pi-shopping-cart" 
                        type="number" 
                        severity="primary" 
                        :loading="isLoading" 
                    />
                    <MetricCard 
                        title="Total Clientes" 
                        :value="generalMetrics.total_customers || 0" 
                        icon="pi pi-users" 
                        type="number" 
                        severity="success" 
                        :loading="isLoading" 
                    />
                    <MetricCard 
                        title="Total Productos" 
                        :value="generalMetrics.total_products || 0" 
                        icon="pi pi-box" 
                        type="number" 
                        severity="info" 
                        :loading="isLoading" 
                    />
                    <MetricCard 
                        title="Ingresos Totales" 
                        :value="generalMetrics.total_revenue || 0" 
                        icon="pi pi-dollar" 
                        type="currency" 
                        severity="warning" 
                        :loading="isLoading" 
                    />
                </div>
            </section>

            <!-- Alertas y Actividad Reciente -->
            <section class="dashboard-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="pi pi-bell"></i>
                        Alertas y Actividad
                    </h2>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AlertPanel 
                        :alerts="alerts" 
                        :loading="isLoading" 
                        @alert-action="handleAlertAction" 
                    />
                    
                    <Card>
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-clock text-lg text-primary-600"></i>
                                <h3 class="text-lg font-semibold m-0">Órdenes Recientes</h3>
                            </div>
                        </template>
                        <template #content>
                            <div v-if="overviewData?.recent_activity?.recent_orders?.length" class="space-y-3">
                                <div 
                                    v-for="order in overviewData.recent_activity.recent_orders.slice(0, 5)" 
                                    :key="order.id"
                                    class="flex justify-between items-center p-3 bg-surface-50 rounded-lg"
                                >
                                    <div>
                                        <div class="font-medium text-surface-900">{{ order.client_name }}</div>
                                        <div class="text-sm text-surface-600">{{ order.items_count }} productos</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-primary-600">S/ {{ parseFloat(order.total).toFixed(2) }}</div>
                                        <Tag :value="order.status" severity="info" size="small" />
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center py-8">
                                <i class="pi pi-inbox text-4xl text-surface-400 mb-4"></i>
                                <p class="text-surface-500">No hay órdenes recientes</p>
                            </div>
                        </template>
                    </Card>
                </div>
            </section>

            <!-- Sección de Inventario -->
            <section v-if="inventoryData" class="dashboard-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="pi pi-box"></i>
                        Estado del Inventario
                    </h2>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <template #title>Niveles de Stock</template>
                        <template #content>
                            <div v-if="inventoryData.stock_levels" class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span>En Stock</span>
                                    <Tag :value="inventoryData.stock_levels.in_stock" severity="success" />
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Stock Bajo</span>
                                    <Tag :value="inventoryData.stock_levels.low_stock" severity="warning" />
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Sin Stock</span>
                                    <Tag :value="inventoryData.stock_levels.out_of_stock" severity="danger" />
                                </div>
                            </div>
                        </template>
                    </Card>

                    <Card>
                        <template #title>Productos con Stock Bajo</template>
                        <template #content>
                            <div v-if="inventoryData.low_stock_products?.length" class="space-y-2 max-h-48 overflow-y-auto">
                                <div 
                                    v-for="product in inventoryData.low_stock_products.slice(0, 5)" 
                                    :key="product.id"
                                    class="flex justify-between items-center text-sm"
                                >
                                    <span class="truncate">{{ product.name }}</span>
                                    <Tag :value="product.current_stock" severity="warning" size="small" />
                                </div>
                            </div>
                            <div v-else class="text-center py-4">
                                <p class="text-surface-500">Stock adecuado</p>
                            </div>
                        </template>
                    </Card>

                    <Card>
                        <template #title>Valor del Inventario</template>
                        <template #content>
                            <div v-if="inventoryData.inventory_value" class="space-y-3">
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-primary-600">
                                        S/ {{ parseFloat(inventoryData.inventory_value.total_sale_value || 0).toFixed(2) }}
                                    </div>
                                    <div class="text-sm text-surface-600">Valor total de venta</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-semibold text-surface-700">
                                        {{ inventoryData.inventory_value.total_quantity || 0 }}
                                    </div>
                                    <div class="text-sm text-surface-600">Productos en stock</div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </section>

            <!-- Sección de Clientes -->
            <section v-if="customersData" class="dashboard-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="pi pi-users"></i>
                        Análisis de Clientes
                    </h2>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <template #title>Mejores Clientes</template>
                        <template #content>
                            <div v-if="customersData.top_customers?.length" class="space-y-3">
                                <div 
                                    v-for="customer in customersData.top_customers.slice(0, 5)" 
                                    :key="customer.id"
                                    class="flex justify-between items-center p-3 bg-surface-50 rounded-lg"
                                >
                                    <div>
                                        <div class="font-medium text-surface-900">{{ customer.name }}</div>
                                        <div class="text-sm text-surface-600">{{ customer.total_orders }} órdenes</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-success-600">S/ {{ parseFloat(customer.total_spent).toFixed(2) }}</div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center py-4">
                                <p class="text-surface-500">No hay datos disponibles</p>
                            </div>
                        </template>
                    </Card>

                    <Card>
                        <template #title>Métricas de Clientes</template>
                        <template #content>
                            <div v-if="customersData.customer_lifetime_value" class="space-y-4">
                                <div class="text-center">
                                    <div class="text-xl font-bold text-primary-600">
                                        S/ {{ parseFloat(customersData.customer_lifetime_value.avg_ltv || 0).toFixed(2) }}
                                    </div>
                                    <div class="text-sm text-surface-600">Valor promedio por cliente</div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div class="text-lg font-semibold text-surface-700">
                                            {{ parseFloat(customersData.customer_lifetime_value.avg_orders || 0).toFixed(1) }}
                                        </div>
                                        <div class="text-sm text-surface-600">Órdenes promedio</div>
                                    </div>
                                    <div>
                                        <div class="text-lg font-semibold text-surface-700">
                                            S/ {{ parseFloat(customersData.customer_lifetime_value.avg_order_value || 0).toFixed(2) }}
                                        </div>
                                        <div class="text-sm text-surface-600">Valor promedio orden</div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </section>

            <!-- Sección Financiera -->
            <section v-if="financialData" class="dashboard-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="pi pi-dollar"></i>
                        Resumen Financiero
                    </h2>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <template #title>Estado de Pagos</template>
                        <template #content>
                            <div v-if="financialData.payment_status?.length" class="space-y-3">
                                <div 
                                    v-for="status in financialData.payment_status" 
                                    :key="status.status"
                                    class="flex justify-between items-center"
                                >
                                    <span class="capitalize">{{ status.status }}</span>
                                    <div class="text-right">
                                        <div class="font-semibold">{{ status.count }}</div>
                                        <div class="text-sm text-surface-600">S/ {{ parseFloat(status.total).toFixed(2) }}</div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <Card>
                        <template #title>Resumen Financiero</template>
                        <template #content>
                            <div v-if="financialData.financial_summary" class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span>Ingresos Brutos</span>
                                    <span class="font-semibold text-success-600">
                                        S/ {{ parseFloat(financialData.financial_summary.gross_revenue || 0).toFixed(2) }}
                                    </span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Ingresos Netos</span>
                                    <span class="font-semibold text-primary-600">
                                        S/ {{ parseFloat(financialData.financial_summary.net_revenue || 0).toFixed(2) }}
                                    </span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Pagos Pendientes</span>
                                    <span class="font-semibold text-warning-600">
                                        S/ {{ parseFloat(financialData.financial_summary.pending_payments || 0).toFixed(2) }}
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <Card>
                        <template #title>Métricas de Rendimiento</template>
                        <template #content>
                            <div v-if="performanceData?.kpis" class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span>Tasa de Conversión</span>
                                    <Tag :value="`${parseFloat(performanceData.kpis.conversion_rate || 0).toFixed(1)}%`" severity="success" />
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Valor Promedio Orden</span>
                                    <span class="font-semibold">S/ {{ parseFloat(performanceData.kpis.average_order_value || 0).toFixed(2) }}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Tasa de Cumplimiento</span>
                                    <Tag :value="`${parseFloat(performanceData.kpis.order_fulfillment_rate || 0).toFixed(1)}%`" severity="info" />
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.dashboard {
    @apply space-y-6;
}

.dashboard__header {
    @apply bg-white rounded-lg p-6 shadow-sm border border-surface-200;
}

.dashboard__content {
    @apply min-h-96;
}

.dashboard-section {
    @apply bg-white rounded-lg p-6 shadow-sm border border-surface-200;
}

.section-header {
    @apply mb-6;
}

.section-title {
    @apply text-xl font-semibold text-surface-900 flex items-center gap-2;
}

.section-title i {
    @apply text-primary-600;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .dashboard__header .flex {
        @apply flex-col items-start gap-4;
    }
    
    .dashboard-section {
        @apply p-4;
    }
    
    .section-title {
        @apply text-lg;
    }
    
    .grid {
        @apply gap-4;
    }
}

/* Skeletons para loading states */
.loading-skeleton {
    @apply bg-surface-200 rounded;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>
