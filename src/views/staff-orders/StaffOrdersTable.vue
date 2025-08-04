<script setup>
import { useStaffOrdersStore } from '@/stores/staffOrders';

const props = defineProps({
    orders: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['view-order', 'update-status']);

const staffOrdersStore = useStaffOrdersStore();

function getStatusLabel(status) {
    return staffOrdersStore.getOrderStatusLabel(status);
}

function getStatusSeverity(status) {
    return staffOrdersStore.getOrderStatusSeverity(status);
}

function getStatusIcon(status) {
    return staffOrdersStore.getOrderStatusIcon(status);
}

function getPaymentStatusLabel(status) {
    const statusMap = {
        approved: 'Aprobado',
        pending: 'Pendiente',
        rejected: 'Rechazado',
        cancelled: 'Cancelado',
        refunded: 'Reembolsado'
    };
    return statusMap[status] || status;
}

function getPaymentStatusSeverity(status) {
    const statusMap = {
        approved: 'success',
        pending: 'warning',
        rejected: 'danger',
        cancelled: 'secondary',
        refunded: 'info'
    };
    return statusMap[status] || 'secondary';
}

function getProductCount(order) {
    if (order.order_details && Array.isArray(order.order_details)) {
        return order.order_details.length;
    }
    return 0;
}

function canUpdateOrder(order) {
    const finalStates = ['entregado', 'cancelado'];
    return !finalStates.includes(order.status);
}

function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(amount));
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>

<template>
    <DataTable
        :value="orders"
        :loading="loading"
        paginator
        :rows="15"
        :rows-per-page-options="[10, 15, 25, 50]"
        paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        current-page-report-template="Mostrando {first} a {last} de {totalRecords} órdenes"
        responsive-layout="scroll"
        class="p-datatable-striped"
        :global-filter-fields="['id', 'client.name', 'client.lastname', 'client.email', 'total', 'status']"
    >
        <template #empty>
            <div class="text-center py-8">
                <i class="pi pi-shopping-cart text-4xl text-surface-400 mb-4"></i>
                <p class="text-surface-500">No hay órdenes para mostrar</p>
            </div>
        </template>

        <template #loading>
            <div class="text-center py-8">
                <ProgressSpinner />
                <p class="text-surface-500 mt-2">Cargando órdenes...</p>
            </div>
        </template>

        <Column field="id" header="ID" :sortable="true" class="w-20">
            <template #body="{ data }">
                <span class="font-semibold text-primary-600">#{{ data.id }}</span>
            </template>
        </Column>

        <Column field="client" header="Cliente" :sortable="false" class="min-w-60">
            <template #body="{ data }">
                <div v-if="data.client">
                    <div class="font-semibold">{{ data.client.name }}</div>
                    <div class="text-sm text-surface-500">{{ data.client.email }}</div>
                    <div v-if="data.client.phone" class="text-sm text-surface-500"><i class="pi pi-phone text-xs mr-1"></i>{{ data.client.phone }}</div>
                </div>
                <span v-else class="text-surface-400">Sin cliente</span>
            </template>
        </Column>

        <Column field="total" header="Total" :sortable="true" class="w-32">
            <template #body="{ data }">
                <span class="font-semibold">S/ {{ formatCurrency(data.total) }}</span>
            </template>
        </Column>

        <Column field="status" header="Estado" :sortable="true" class="w-40">
            <template #body="{ data }">
                <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" :icon="getStatusIcon(data.status)" />
            </template>
        </Column>

        <Column field="created_at" header="Fecha" :sortable="true" class="w-40">
            <template #body="{ data }">
                <div>
                    <div class="font-medium">{{ formatDate(data.created_at) }}</div>
                    <div class="text-sm text-surface-500">{{ formatTime(data.created_at) }}</div>
                </div>
            </template>
        </Column>

        <Column field="order_details" header="Productos" :sortable="false" class="w-24">
            <template #body="{ data }">
                <div class="text-center">
                    <span class="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                        {{ getProductCount(data) }}
                    </span>
                </div>
            </template>
        </Column>

        <Column field="payment_status" header="Pago" :sortable="false" class="w-32">
            <template #body="{ data }">
                <div v-if="data.payments && data.payments.length > 0">
                    <Tag v-for="payment in data.payments" :key="payment.id" :value="getPaymentStatusLabel(payment.status)" :severity="getPaymentStatusSeverity(payment.status)" class="mb-1" />
                </div>
                <Tag v-else-if="data.status === 'pendiente_pago' || data.status === 'pago_fallido'" value="Pendiente" severity="warning" />
                <span v-else class="text-surface-400">-</span>
            </template>
        </Column>

        <Column header="Acciones" :exportable="false" style="min-width: 8rem">
            <template #body="{ data }">
                <div class="flex gap-2">
                    <Button v-tooltip.top="'Ver detalle'" icon="pi pi-eye" severity="info" size="small" @click="$emit('view-order', data)" />
                    <Button v-tooltip.top="'Cambiar estado'" icon="pi pi-pencil" severity="warning" size="small" :disabled="!canUpdateOrder(data)" @click="$emit('update-status', data)" />
                </div>
            </template>
        </Column>
    </DataTable>
</template>
