<script setup>
import { usersApi } from '@/api/index';
import { useAuthStore } from '@/stores/auth';
import { useReportsStore } from '@/stores/reports';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const reportsStore = useReportsStore();
const authStore = useAuthStore();
const toast = useToast();

// Estado reactivo
const selectedReport = ref('sales');
const showFilters = ref(false);
const filters = ref({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    client_id: null,
    user_id: null,
    status: '',
    format: 'pdf'
});

const availableClients = ref([]);
const availableUsers = ref([]);

// Computed properties
const reportTypes = ref([
    { label: 'Ventas', value: 'sales', icon: 'pi pi-chart-line', color: '#3b82f6' },
    { label: 'Compras', value: 'purchases', icon: 'pi pi-shopping-bag', color: '#10b981' },
    { label: 'Órdenes', value: 'orders', icon: 'pi pi-file-o', color: '#f59e0b' }
]);

const isLoading = computed(() => reportsStore.isLoading(selectedReport.value));
const validStatuses = computed(() => reportsStore.getValidStatuses);
const availableFormats = computed(() => reportsStore.getAvailableFormats);
const reportsHistory = computed(() => reportsStore.getRecentReports);

// Métodos del ciclo de vida
onMounted(async () => {
    try {
        if (authStore.userRole === 'admin') {
            const usersResponse = await usersApi.getUsers();
            if (usersResponse.data) {
                availableUsers.value = usersResponse.data.map((user) => ({
                    label: user.name,
                    value: user.id
                }));
            }
        }
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
    }
});

// Métodos
const generateReport = async () => {
    try {
        const validation = reportsStore.validateFilters(filters.value);
        if (!validation.isValid) {
            toast.add({
                severity: 'warn',
                summary: 'Datos incompletos',
                detail: Object.values(validation.errors).flat().join(', '),
                life: 5000
            });
            return;
        }

        let result;
        switch (selectedReport.value) {
            case 'sales':
                result = await reportsStore.generateSalesReport(filters.value);
                break;
            case 'purchases':
                result = await reportsStore.generatePurchasesReport(filters.value);
                break;
            case 'orders':
                result = await reportsStore.generateOrdersReport(filters.value);
                break;
            default:
                throw new Error('Tipo de reporte no válido');
        }

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Reporte generado',
                detail: result.message,
                life: 5000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al generar el reporte',
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al generar el reporte',
            life: 5000
        });
    }
};

const resetFilters = () => {
    filters.value = {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        client_id: null,
        user_id: null,
        status: '',
        format: 'pdf'
    };
};

const clearHistory = () => {
    reportsStore.clearHistory();
    toast.add({
        severity: 'info',
        summary: 'Historial limpiado',
        detail: 'El historial de reportes ha sido eliminado',
        life: 3000
    });
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getReportTypeLabel = (type) => {
    const reportType = reportTypes.value.find((rt) => rt.value === type);
    return reportType ? reportType.label : type;
};

const getSelectedReportType = computed(() => {
    return reportTypes.value.find((rt) => rt.value === selectedReport.value);
});
</script>

<template>
    <div class="reports">
        <!-- Header del Dashboard -->
        <div class="reports__header">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-surface-900">Reportes Administrativos</h1>
                    <p class="text-surface-600 mt-1">Genera informes detallados de ventas, compras y órdenes</p>
                </div>
                <div class="flex items-center gap-3">
                    <Button :icon="showFilters ? 'pi pi-eye-slash' : 'pi pi-filter'" :label="showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'" severity="secondary" outlined @click="showFilters = !showFilters" />
                </div>
            </div>
        </div>

        <!-- Contenido -->
        <div class="reports__content space-y-6">
            <!-- Selector de Tipo de Reporte -->
            <section class="reports-section">
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="pi pi-list"></i>
                        Selecciona el tipo de reporte
                    </h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div v-for="type in reportTypes" :key="type.value" class="report-type-card" :class="{ selected: selectedReport === type.value }" @click="selectedReport = type.value">
                        <div class="card-icon" :style="{ color: type.color }">
                            <i :class="type.icon"></i>
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">{{ type.label }}</h3>
                            <p class="card-description">
                                <span v-if="type.value === 'sales'">Análisis detallado de ventas y comisiones</span>
                                <span v-else-if="type.value === 'purchases'">Histórico de compras por cliente</span>
                                <span v-else>Gestión completa de órdenes</span>
                            </p>
                        </div>
                        <div v-if="selectedReport === type.value" class="card-indicator">
                            <i class="pi pi-check"></i>
                        </div>
                    </div>
                </div>
            </section>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Panel Principal -->
                <div class="col-span-2">
                    <!-- Filtros -->
                    <Transition name="filters">
                        <section v-if="showFilters" class="reports-section mb-6">
                            <div class="section-header">
                                <h2 class="section-title">
                                    <i class="pi pi-sliders-h"></i>
                                    Filtros Avanzados
                                </h2>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <!-- Fechas -->
                                <div class="field">
                                    <label class="block text-surface-700 font-medium mb-2">Fecha de Inicio</label>
                                    <Calendar v-model="filters.start_date" date-format="dd/mm/yy" show-icon class="w-full" />
                                </div>
                                <div class="field">
                                    <label class="block text-surface-700 font-medium mb-2">Fecha de Fin</label>
                                    <Calendar v-model="filters.end_date" date-format="dd/mm/yy" show-icon class="w-full" />
                                </div>

                                <!-- Estado -->
                                <div class="field">
                                    <label class="block text-surface-700 font-medium mb-2">Estado</label>
                                    <Select v-model="filters.status" :options="validStatuses" option-label="label" option-value="value" placeholder="Todos los estados" class="w-full" clearable />
                                </div>

                                <!-- Usuario -->
                                <div v-if="selectedReport !== 'purchases' && availableUsers.length > 0" class="field">
                                    <label class="block text-surface-700 font-medium mb-2">Vendedor</label>
                                    <Select v-model="filters.user_id" :options="availableUsers" option-label="label" option-value="value" placeholder="Todos los vendedores" class="w-full" clearable />
                                </div>

                                <!-- Formato -->
                                <div class="field col-span-full">
                                    <label class="block text-surface-700 font-medium mb-2">Formato</label>
                                    <div class="flex gap-2">
                                        <Button
                                            v-for="format in availableFormats"
                                            :key="format.value"
                                            :label="format.label"
                                            :icon="format.icon"
                                            :severity="filters.format === format.value ? 'primary' : 'secondary'"
                                            :outlined="filters.format !== format.value"
                                            @click="filters.format = format.value"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-end">
                                <Button label="Limpiar Filtros" icon="pi pi-refresh" severity="secondary" text @click="resetFilters" />
                            </div>
                        </section>
                    </Transition>

                    <!-- Generación -->
                    <section class="reports-section">
                        <div class="text-center">
                            <Button :label="`Generar ${getSelectedReportType.label}`" icon="pi pi-download" size="large" :loading="isLoading" class="w-full max-w-sm" @click="generateReport" />
                            <p class="text-surface-600 text-sm mt-3">Formato: {{ filters.format.toUpperCase() }} • Período: {{ new Date(filters.start_date).toLocaleDateString() }} - {{ new Date(filters.end_date).toLocaleDateString() }}</p>
                        </div>
                    </section>
                </div>

                <!-- Sidebar -->
                <div class="col-span-1">
                    <!-- Historial -->
                    <section class="reports-section mb-6">
                        <div class="section-header">
                            <h2 class="section-title">
                                <i class="pi pi-history"></i>
                                Historial Reciente
                            </h2>
                            <Button v-if="reportsHistory.length > 0" icon="pi pi-trash" severity="danger" text size="small" @click="clearHistory" />
                        </div>

                        <div v-if="reportsHistory.length > 0" class="space-y-3">
                            <div v-for="report in reportsHistory.slice(0, 5)" :key="report.id" class="history-item">
                                <div class="flex items-center gap-3">
                                    <div class="history-icon">
                                        <i :class="report.fileName.endsWith('.pdf') ? 'pi pi-file-pdf' : 'pi pi-file-excel'"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-surface-900 text-sm truncate">
                                            {{ getReportTypeLabel(report.type) }}
                                        </div>
                                        <div class="text-xs text-surface-600 mt-1">
                                            {{ formatDate(report.generatedAt) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8">
                            <i class="pi pi-inbox text-4xl text-surface-400 mb-4"></i>
                            <p class="text-surface-500">No hay reportes generados</p>
                        </div>
                    </section>

                    <!-- Información -->
                    <section class="reports-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <i class="pi pi-info-circle"></i>
                                Información
                            </h2>
                        </div>
                        <div class="space-y-3 text-sm">
                            <div class="flex items-start gap-3">
                                <i class="pi pi-check-circle text-green-600 mt-1"></i>
                                <div>
                                    <strong class="text-surface-900">Descarga automática</strong>
                                    <p class="text-surface-600 mt-1">Los reportes se descargan automáticamente al completarse</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="pi pi-clock text-orange-600 mt-1"></i>
                                <div>
                                    <strong class="text-surface-900">Tiempo de procesamiento</strong>
                                    <p class="text-surface-600 mt-1">Los reportes grandes pueden tardar varios segundos</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.reports {
    @apply space-y-6;
}

.reports__header {
    @apply bg-white rounded-lg p-6 shadow-sm border border-surface-200;
}

.reports__content {
    @apply min-h-96;
}

.reports-section {
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

/* Report Type Cards */
.report-type-card {
    @apply bg-white border-2 border-surface-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary-300 hover:shadow-md relative;
}

.report-type-card.selected {
    @apply border-primary-500 bg-primary-50;
}

.card-icon {
    @apply w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-3 mx-auto text-2xl transition-all duration-200;
}

.report-type-card.selected .card-icon {
    @apply bg-primary-100;
}

.card-title {
    @apply text-lg font-semibold text-surface-900 mb-2 text-center;
}

.card-description {
    @apply text-sm text-surface-600 text-center;
}

.card-indicator {
    @apply absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs;
}

/* History Items */
.history-item {
    @apply p-3 bg-surface-50 rounded-lg border border-surface-200 hover:bg-surface-100 transition-colors;
}

.history-icon {
    @apply w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-primary-600;
}

.field {
    @apply mb-4;
}

.field label {
    @apply text-surface-700 font-medium;
}

/* Transitions */
.filters-enter-active,
.filters-leave-active {
    transition: all 0.3s ease;
}

.filters-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.filters-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
    .col-span-2 {
        grid-column: 1 / -1;
    }

    .col-span-1 {
        grid-column: 1 / -1;
    }
}

@media (max-width: 768px) {
    .reports__header .flex {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .reports-section {
        padding: 1rem;
    }

    .section-title {
        font-size: 1.125rem;
    }

    .grid {
        gap: 1rem;
    }

    .grid.grid-cols-1.md\\:grid-cols-3 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .grid.grid-cols-1.md\\:grid-cols-2 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .col-span-full .flex {
        flex-direction: column;
        gap: 0.5rem;
    }
}

/* Loading skeleton animation */
.loading-skeleton {
    @apply bg-surface-200 rounded;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>
