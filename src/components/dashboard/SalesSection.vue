<script setup>
import { computed, watch } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import MetricCard from './MetricCard.vue';
import ChartCard from './ChartCard.vue';
import ChartWrapper from './ChartWrapper.vue';

const props = defineProps({
    selectedPeriod: {
        type: Number,
        default: 30
    }
});

const emit = defineEmits(['period-change']);

const dashboardStore = useDashboardStore();

const loading = computed(() => dashboardStore.isLoading('sales'));
const salesData = computed(() => dashboardStore.getSalesAnalytics);

const periodOptions = [
    { label: '7 días', value: 7 },
    { label: '30 días', value: 30 },
    { label: '90 días', value: 90 }
];

// Computed para verificar si hay datos (retorna boolean)
const hasSalesTrendData = computed(() => {
    return !!(salesData.value?.sales_trend && salesData.value.sales_trend.length > 0);
});

const hasOrdersStatusData = computed(() => {
    return !!(salesData.value?.orders_by_status && Object.keys(salesData.value.orders_by_status).length > 0);
});

const hasTopProductsData = computed(() => {
    return !!(salesData.value?.top_products && salesData.value.top_products.length > 0);
});

const hasPaymentMethodsData = computed(() => {
    return !!(salesData.value?.payment_methods && salesData.value.payment_methods.length > 0);
});

const hasMonthlyComparisonData = computed(() => {
    return !!(salesData.value?.monthly_comparison && salesData.value.monthly_comparison.current_month && salesData.value.monthly_comparison.previous_month);
});

// Datos para gráficos
const salesTrendChartData = computed(() => {
    if (!hasSalesTrendData.value) return {};

    const trend = salesData.value.sales_trend;

    return {
        labels: trend.map((item) => formatDate(item.date)),
        datasets: [
            {
                label: 'Órdenes',
                data: trend.map((item) => item.orders),
                borderColor: '#3B82F6',
                backgroundColor: '#3B82F6',
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Ingresos (S/)',
                data: trend.map((item) => item.revenue),
                borderColor: '#10B981',
                backgroundColor: '#10B981',
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    };
});

const ordersStatusChartData = computed(() => {
    if (!hasOrdersStatusData.value) return {};

    const statusData = salesData.value.orders_by_status;
    const labels = Object.keys(statusData).map((status) => getStatusLabel(status));
    const data = Object.values(statusData);

    return {
        labels,
        datasets: [
            {
                data,
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
                borderWidth: 0
            }
        ]
    };
});

const topProductsChartData = computed(() => {
    if (!hasTopProductsData.value) return {};

    const products = salesData.value.top_products.slice(0, 10);

    return {
        labels: products.map((product) => product.name),
        datasets: [
            {
                label: 'Cantidad Vendida',
                data: products.map((product) => product.total_quantity),
                backgroundColor: '#3B82F6',
                borderColor: '#3B82F6',
                borderWidth: 1
            }
        ]
    };
});

const paymentMethodsChartData = computed(() => {
    if (!hasPaymentMethodsData.value) return {};

    const methods = salesData.value.payment_methods;

    return {
        labels: methods.map((method) => method.method),
        datasets: [
            {
                data: methods.map((method) => method.count),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                borderWidth: 0
            }
        ]
    };
});

const monthlyComparisonChartData = computed(() => {
    if (!hasMonthlyComparisonData.value) return {};

    const comparison = salesData.value.monthly_comparison;

    return {
        labels: ['Órdenes', 'Ingresos (S/)'],
        datasets: [
            {
                label: 'Mes Anterior',
                data: [comparison.previous_month.orders, comparison.previous_month.revenue],
                backgroundColor: '#94A3B8'
            },
            {
                label: 'Mes Actual',
                data: [comparison.current_month.orders, comparison.current_month.revenue],
                backgroundColor: '#3B82F6'
            }
        ]
    };
});

// Opciones de gráficos
const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'Órdenes'
            }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'Ingresos (S/)'
            },
            grid: {
                drawOnChartArea: false
            }
        }
    },
    plugins: {
        legend: {
            position: 'top'
        }
    }
};

const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right'
        }
    }
};

const horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        x: {
            beginAtZero: true
        }
    }
};

const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right'
        }
    }
};

const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
};

// Funciones auxiliares
function getOrdersTrend() {
    if (!salesData.value?.monthly_comparison) return null;
    const growth = salesData.value.monthly_comparison.growth;
    return growth ? { value: growth.orders, period: 'vs mes anterior' } : null;
}

function getRevenueTrend() {
    if (!salesData.value?.monthly_comparison) return null;
    const growth = salesData.value.monthly_comparison.growth;
    return growth ? { value: growth.revenue, period: 'vs mes anterior' } : null;
}

function getStatusLabel(status) {
    const labels = {
        pendiente_pago: 'Pendiente Pago',
        pendiente: 'Pendiente',
        confirmado: 'Confirmado',
        procesando: 'Procesando',
        enviado: 'Enviado',
        entregado: 'Entregado',
        cancelado: 'Cancelado',
        pago_fallido: 'Pago Fallido'
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit'
    });
}

function handlePeriodChange(period) {
    emit('period-change', period);
}

function refreshSalesData() {
    dashboardStore.refreshSection('sales');
}
</script>

<template>
    <div class="sales-section">
        <!-- Métricas principales de ventas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard title="Órdenes Hoy" :value="salesData?.today_orders || 0" icon="pi pi-shopping-cart" type="number" severity="primary" :trend="getOrdersTrend()" :loading="loading" />

            <MetricCard title="Ingresos Hoy" :value="salesData?.today_revenue || 0" icon="pi pi-dollar" type="currency" severity="success" :trend="getRevenueTrend()" :loading="loading" />

            <MetricCard title="Ticket Promedio" :value="salesData?.average_order_value || 0" icon="pi pi-chart-line" type="currency" severity="info" :loading="loading" />

            <MetricCard title="Tasa Conversión" :value="salesData?.conversion_rate || 0" icon="pi pi-percentage" type="percentage" severity="warning" :loading="loading" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Tendencia de ventas -->
            <ChartCard
                title="Tendencia de Ventas"
                subtitle="Órdenes e ingresos por día"
                icon="pi pi-chart-line"
                :loading="loading"
                :has-data="hasSalesTrendData"
                :periods="periodOptions"
                :default-period="selectedPeriod"
                @period-change="handlePeriodChange"
                @refresh="refreshSalesData"
            >
                <template #chart>
                    <ChartWrapper type="line" :data="salesTrendChartData" :options="lineChartOptions" class="h-80" />
                </template>
            </ChartCard>

            <!-- Órdenes por estado -->
            <ChartCard title="Estado de Órdenes" subtitle="Distribución por estado actual" icon="pi pi-chart-pie" :loading="loading" :has-data="hasOrdersStatusData" @refresh="refreshSalesData">
                <template #chart>
                    <ChartWrapper type="doughnut" :data="ordersStatusChartData" :options="doughnutChartOptions" class="h-80" />
                </template>
            </ChartCard>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Top productos -->
            <ChartCard title="Productos Más Vendidos" subtitle="Por cantidad vendida" icon="pi pi-star" :loading="loading" :has-data="hasTopProductsData" @refresh="refreshSalesData">
                <template #chart>
                    <ChartWrapper type="bar" :data="topProductsChartData" :options="horizontalBarOptions" class="h-80" />
                </template>
            </ChartCard>

            <!-- Métodos de pago -->
            <ChartCard title="Métodos de Pago" subtitle="Preferencias de pago" icon="pi pi-credit-card" :loading="loading" :has-data="hasPaymentMethodsData" @refresh="refreshSalesData">
                <template #chart>
                    <ChartWrapper type="pie" :data="paymentMethodsChartData" :options="pieChartOptions" class="h-80" />
                </template>
            </ChartCard>
        </div>

        <!-- Comparación mensual -->
        <ChartCard title="Comparación Mensual" subtitle="Mes actual vs anterior" icon="pi pi-calendar" :loading="loading" :has-data="hasMonthlyComparisonData" @refresh="refreshSalesData">
            <template #chart>
                <ChartWrapper type="bar" :data="monthlyComparisonChartData" :options="barChartOptions" class="h-64" />
            </template>
        </ChartCard>
    </div>
</template>

<style scoped>
.sales-section {
    @apply space-y-6;
}
</style>
