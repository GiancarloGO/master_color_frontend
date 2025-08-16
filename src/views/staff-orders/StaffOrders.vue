<script setup>
import { useStaffOrdersStore } from '@/stores/staffOrders';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import OrderDetailModal from './OrderDetailModal.vue';
import OrderStatusModal from './OrderStatusModal.vue';
import StaffOrdersTable from './StaffOrdersTable.vue';

const staffOrdersStore = useStaffOrdersStore();
const toast = useToast();

const orderDetailDialog = ref(false);
const statusDialog = ref(false);
const selectedOrder = ref(null);
const filters = ref({
    status: '',
    date_from: null,
    date_to: null
});

const statusOptions = [
    { label: 'Todos los estados', value: '' },
    { label: 'Pendiente de Pago', value: 'pendiente_pago' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Confirmado', value: 'confirmado' },
    { label: 'Procesando', value: 'procesando' },
    { label: 'Enviado', value: 'enviado' },
    { label: 'Entregado', value: 'entregado' },
    { label: 'Cancelado', value: 'cancelado' },
    { label: 'Pago Fallido', value: 'pago_fallido' }
];

const statistics = computed(() => staffOrdersStore.getStatistics);

const hasActiveFilters = computed(() => {
    return !!(filters.value.status || filters.value.date_from || filters.value.date_to);
});

onMounted(async () => {
    await loadData();
});

async function loadData() {
    try {
        await Promise.all([staffOrdersStore.fetchOrders({ paginate: true }), staffOrdersStore.fetchOrderStatistics()]);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los datos',
            life: 3000
        });
    }
}

async function refreshOrders() {
    await loadData();
    toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Datos actualizados correctamente',
        life: 3000
    });
}

async function applyFilters() {
    const filterParams = {};

    if (filters.value.status) {
        filterParams.status = filters.value.status;
    }

    if (filters.value.date_from) {
        filterParams.date_from = formatDateForAPI(filters.value.date_from);
    }

    if (filters.value.date_to) {
        filterParams.date_to = formatDateForAPI(filters.value.date_to);
    }

    await staffOrdersStore.fetchOrders({ ...filterParams, paginate: true });
}

async function performSearch() {
    await applyFilters();
}

function clearFilters() {
    filters.value = {
        status: '',
        date_from: null,
        date_to: null
    };
    staffOrdersStore.clearFilters();
    refreshOrders();
}

function viewOrder(order) {
    selectedOrder.value = order;
    orderDetailDialog.value = true;
}

function openStatusDialog(order) {
    selectedOrder.value = order;
    statusDialog.value = true;
}

async function handleStatusUpdate() {
    orderDetailDialog.value = false;
    statusDialog.value = false;
    await refreshOrders();

    toast.add({
        severity: 'success',
        summary: 'Estado Actualizado',
        detail: 'El estado de la orden se actualizó correctamente',
        life: 3000
    });
}

function formatDateForAPI(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(amount));
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-surface-900">Gestión de Órdenes</h1>
                <p class="text-surface-600 mt-1">Administra las órdenes de compra de los clientes</p>
            </div>
            <Button icon="pi pi-refresh" label="Actualizar" :loading="staffOrdersStore.isLoading" class="ml-2" @click="refreshOrders" />
        </div>

        <!-- Estadísticas -->
        <div v-if="statistics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-600 text-sm font-medium">Total Órdenes</p>
                        <p class="text-2xl font-bold text-blue-900">{{ statistics.total_orders || 0 }}</p>
                    </div>
                    <i class="pi pi-shopping-cart text-blue-500 text-2xl"></i>
                </div>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-yellow-600 text-sm font-medium">Pendientes</p>
                        <p class="text-2xl font-bold text-yellow-900">{{ statistics.pending_orders || 0 }}</p>
                    </div>
                    <i class="pi pi-clock text-yellow-500 text-2xl"></i>
                </div>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-600 text-sm font-medium">Hoy</p>
                        <p class="text-2xl font-bold text-green-900">{{ statistics.today_orders || 0 }}</p>
                    </div>
                    <i class="pi pi-calendar text-green-500 text-2xl"></i>
                </div>
            </div>

            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-600 text-sm font-medium">Ingresos</p>
                        <p class="text-2xl font-bold text-purple-900">S/ {{ formatCurrency(statistics.total_revenue) }}</p>
                    </div>
                    <i class="pi pi-dollar text-purple-500 text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-surface-50 border border-surface-200 rounded-lg p-4 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-surface-900">Filtros de Órdenes</h3>
                <div class="flex gap-2">
                    <Button icon="pi pi-filter-slash" label="Limpiar Filtros" severity="secondary" outlined size="small" @click="clearFilters" />
                    <Button icon="pi pi-filter" label="Aplicar Filtros" :disabled="!hasActiveFilters" @click="performSearch" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Filtro por estado -->
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Estado de la Orden</label>
                    <Dropdown v-model="filters.status" :options="statusOptions" option-label="label" option-value="value" placeholder="Seleccionar estado" class="w-full" show-clear @change="applyFilters" />
                </div>

                <!-- Fecha desde -->
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Fecha Desde</label>
                    <Calendar v-model="filters.date_from" placeholder="Seleccionar fecha" date-format="dd/mm/yy" show-icon show-button-bar class="w-full" @date-select="applyFilters" />
                </div>

                <!-- Fecha hasta -->
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Fecha Hasta</label>
                    <Calendar v-model="filters.date_to" placeholder="Seleccionar fecha" date-format="dd/mm/yy" show-icon show-button-bar class="w-full" @date-select="applyFilters" />
                </div>
            </div>

            <!-- Filtros aplicados -->
            <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-surface-200">
                <span class="text-sm font-medium text-surface-700 mb-2 block">Filtros aplicados:</span>
                <div class="flex flex-wrap gap-2">
                    <Tag
                        v-if="filters.status"
                        severity="warning"
                        icon="pi pi-filter"
                        removable
                        @remove="
                            filters.status = '';
                            applyFilters();
                        "
                    >
                        Estado: {{ statusOptions.find((s) => s.value === filters.status)?.label }}
                    </Tag>
                    <Tag
                        v-if="filters.date_from"
                        severity="success"
                        icon="pi pi-calendar"
                        removable
                        @remove="
                            filters.date_from = null;
                            applyFilters();
                        "
                    >
                        Desde: {{ formatDate(filters.date_from) }}
                    </Tag>
                    <Tag
                        v-if="filters.date_to"
                        severity="success"
                        icon="pi pi-calendar"
                        removable
                        @remove="
                            filters.date_to = null;
                            applyFilters();
                        "
                    >
                        Hasta: {{ formatDate(filters.date_to) }}
                    </Tag>
                </div>
            </div>
        </div>

        <!-- Tabla de órdenes -->
        <StaffOrdersTable :orders="staffOrdersStore.getOrders" :loading="staffOrdersStore.isLoading" @view-order="viewOrder" @update-status="openStatusDialog" />

        <!-- Modal de detalle de orden -->
        <OrderDetailModal v-model:visible="orderDetailDialog" :order="selectedOrder" @status-updated="handleStatusUpdate" />

        <!-- Modal de actualización de estado -->
        <OrderStatusModal v-model:visible="statusDialog" :order="selectedOrder" @status-updated="handleStatusUpdate" />
    </div>
</template>
