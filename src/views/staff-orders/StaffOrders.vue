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
const searchQuery = ref('');
const searchType = ref('all');

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

const searchTypeOptions = [
    { label: 'Todo', value: 'all' },
    { label: 'ID de Orden', value: 'order_id' },
    { label: 'Nombre de Cliente', value: 'client_name' },
    { label: 'Email de Cliente', value: 'client_email' }
];

const statistics = computed(() => staffOrdersStore.getStatistics);

onMounted(async () => {
    await loadData();
    console.log('StaffOrders', staffOrdersStore.getOrders);
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
    if (!searchQuery.value.trim()) {
        await applyFilters();
        return;
    }

    const searchData = {
        search: searchQuery.value.trim(),
        search_type: searchType.value
    };

    await staffOrdersStore.searchOrders(searchData, { paginate: true });
}

function clearFilters() {
    filters.value = {
        status: '',
        date_from: null,
        date_to: null
    };
    searchQuery.value = '';
    searchType.value = 'all';
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

        <!-- Filtros y búsqueda -->
        <div class="bg-surface-50 border border-surface-200 rounded-lg p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Búsqueda -->
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-1">Buscar</label>
                    <div class="flex gap-2">
                        <InputText v-model="searchQuery" placeholder="ID, cliente, email..." class="flex-1" @keyup.enter="performSearch" />
                        <Button icon="pi pi-search" :disabled="!searchQuery.trim()" @click="performSearch" />
                    </div>
                </div>

                <!-- Filtro por estado -->
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-1">Estado</label>
                    <Dropdown v-model="filters.status" :options="statusOptions" option-label="label" option-value="value" placeholder="Todos los estados" class="w-full" @change="applyFilters" />
                </div>

                <!-- Fecha desde -->
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-1">Desde</label>
                    <DatePicker v-model="filters.date_from" placeholder="Fecha desde" date-format="yy-mm-dd" @date-select="applyFilters" />
                </div>

                <!-- Fecha hasta -->
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-1">Hasta</label>
                    <DatePicker v-model="filters.date_to" placeholder="Fecha hasta" date-format="yy-mm-dd" @date-select="applyFilters" />
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button icon="pi pi-filter-slash" label="Limpiar Filtros" severity="secondary" @click="clearFilters" />
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
