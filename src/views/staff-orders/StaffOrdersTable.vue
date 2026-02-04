<script setup>
import { useStaffOrdersStore } from '@/stores/staffOrders';
import { FilterMatchMode } from '@primevue/core/api';
import { ref } from 'vue';

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

const dt = ref();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

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

const exportCSV = () => {
    dt.value.exportCSV();
};
</script>

<template>
    <div class="staff-orders-table-container">
        <DataTable
            ref="dt"
            v-model:filters="filters"
            :value="orders"
            :loading="loading"
            paginator
            :rows="15"
            :rows-per-page-options="[10, 15, 25, 50]"
            paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            current-page-report-template="Mostrando {first} a {last} de {totalRecords} órdenes"
            responsive-layout="scroll"
            class="staff-orders-table"
            striped-rows
            data-key="id"
            filter-display="menu"
            :global-filter-fields="['id', 'client.name', 'client.email', 'client.identity_document', 'client.phone', 'total', 'status']"
            :meta-key-selection="false"
            :row-hover="true"
        >
            <template #empty>
                <div class="empty-state">
                    <i class="pi pi-shopping-cart" style="font-size: 3rem; color: var(--text-color-secondary)"></i>
                    <h3>No hay órdenes</h3>
                    <p>No se encontraron órdenes en el sistema</p>
                </div>
            </template>

            <template #loading>
                <div class="loading-state">
                    <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
                    <p>Cargando órdenes...</p>
                </div>
            </template>

            <template #header>
                <div class="table-header">
                    <div class="header-left">
                        <h4 class="header-title">Órdenes de Staff</h4>
                        <Badge :value="orders.length" severity="info" class="header-badge" />
                    </div>
                    <div class="header-right">
                        <span class="search-wrapper">
                            <i class="pi pi-search search-icon"></i>
                            <InputText v-model="filters['global'].value" placeholder="Buscar órdenes..." class="search-input" />
                        </span>
                        <Button v-tooltip.top="'Exportar CSV'" icon="pi pi-download" class="export-button" outlined @click="exportCSV" />
                    </div>
                </div>
            </template>

            <!-- ID de la orden -->
            <Column field="id" header="ID" :sortable="true" style="width: 80px">
                <template #body="{ data }">
                    <div class="order-id">
                        <span class="id-number">#{{ data.id }}</span>
                    </div>
                </template>
            </Column>

            <!-- Información del cliente -->
            <Column field="client" header="Cliente" :sortable="false" style="min-width: 200px">
                <template #body="{ data }">
                    <div v-if="data.client" class="client-info">
                        <div class="client-name">{{ data.client.name }}</div>
                        <div class="client-details">
                            <span class="email">{{ data.client.email }}</span>
                        </div>
                        <div v-if="data.client.identity_document || data.client.phone" class="client-contact">
                            <span v-if="data.client.identity_document" class="contact-item">
                                <i class="pi pi-id-card"></i>{{ data.client.identity_document }}
                            </span>
                            <span v-if="data.client.phone" class="contact-item">
                                <i class="pi pi-phone"></i>{{ data.client.phone }}
                            </span>
                        </div>
                    </div>
                    <span v-else class="no-client">Sin cliente</span>
                </template>
            </Column>

            <!-- Total de la orden -->
            <Column field="total" header="Total" :sortable="true" style="width: 120px">
                <template #body="{ data }">
                    <div class="order-total">
                        <span class="total-amount">S/ {{ formatCurrency(data.total) }}</span>
                    </div>
                </template>
            </Column>

            <!-- Estado de la orden -->
            <Column field="status" header="Estado" :sortable="true" style="width: 140px">
                <template #body="{ data }">
                    <div class="order-status">
                        <Tag 
                            :value="getStatusLabel(data.status)" 
                            :severity="getStatusSeverity(data.status)" 
                            :icon="getStatusIcon(data.status)" 
                            class="status-tag" 
                            :data-status="data.status"
                        />
                    </div>
                </template>
            </Column>

            <!-- Fecha y hora -->
            <Column field="created_at" header="Fecha" :sortable="true" style="width: 140px">
                <template #body="{ data }">
                    <div class="order-date">
                        <div class="date-value">{{ formatDate(data.created_at) }}</div>
                        <div class="time-value">{{ formatTime(data.created_at) }}</div>
                    </div>
                </template>
            </Column>

            <!-- Número de productos -->
            <Column field="order_details" header="Items" :sortable="false" style="width: 80px">
                <template #body="{ data }">
                    <div class="products-count">
                        <span class="count-badge">{{ getProductCount(data) }}</span>
                    </div>
                </template>
            </Column>

            <!-- Estado del pago -->
            <Column field="payment_status" header="Pago" :sortable="false" style="width: 110px">
                <template #body="{ data }">
                    <div class="payment-status">
                        <!-- Si tiene código de pago (pago completado) -->
                        <div v-if="data.codigo_payment">
                            <i 
                                v-tooltip.top="'Pago completado - Código: ' + data.codigo_payment" 
                                class="pi pi-check-circle payment-icon payment-approved"
                            ></i>
                        </div>
                        <!-- Si está pendiente de pago o pago fallido -->
                        <div v-else-if="data.status === 'pendiente_pago' || data.status === 'pago_fallido'">
                            <i 
                                v-tooltip.top="data.status === 'pago_fallido' ? 'Pago fallido - Pendiente de pago' : 'Pendiente de pago'" 
                                class="pi pi-times-circle payment-icon payment-pending"
                            ></i>
                        </div>
                        <!-- Sin información de pago -->
                        <span v-else class="no-payment">-</span>
                    </div>
                </template>
            </Column>

            <!-- Acciones -->
            <Column header="Acciones" :exportable="false" style="width: 120px">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button v-tooltip="'Ver detalle'" icon="pi pi-eye" class="p-button-rounded p-button-text p-button-info p-button-sm" @click="$emit('view-order', data)" />
                        <Button v-tooltip="'Cambiar estado'" icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-warning p-button-sm" :disabled="!canUpdateOrder(data)" @click="$emit('update-status', data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.staff-orders-table-container {
    width: 100%;
}

.staff-orders-table {
    box-shadow: none;
}

.staff-orders-table :deep(.p-datatable-header) {
    background: transparent;
    border: none;
    padding: 0;
}

.staff-orders-table :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-100);
    border: 1px solid var(--surface-200);
    padding: 1rem 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
}

.staff-orders-table :deep(.p-datatable-tbody > tr > td) {
    padding: 1rem 0.75rem;
    border: 1px solid var(--surface-200);
}

.staff-orders-table :deep(.p-datatable-tbody > tr:hover) {
    background: var(--surface-50);
}

/* Table Header */
.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.header-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
}

.header-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--text-color-secondary);
    z-index: 1;
}

.search-input {
    padding-left: 2.5rem;
    width: 250px;
    border-radius: 8px;
}

.export-button {
    border-radius: 8px;
}

/* Order ID */
.order-id {
    display: flex;
    justify-content: center;
}

.id-number {
    font-weight: 600;
    color: var(--primary-color);
    font-size: 0.875rem;
}

/* Client Info */
.client-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.client-name {
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.3;
}

.client-details {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.email {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.client-contact {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    margin-top: 0.25rem;
}

.contact-item {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.contact-item i {
    font-size: 0.6rem;
    color: var(--primary-color);
}

.no-client {
    color: var(--text-color-secondary);
    font-style: italic;
}

/* Order Total */
.order-total {
    text-align: center;
}

.total-amount {
    font-weight: 600;
    color: var(--green-600);
    font-size: 0.875rem;
}

/* Order Status */
.order-status {
    display: flex;
    justify-content: center;
}

.status-tag {
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    transition: all 0.2s ease;
}

/* Order Date */
.order-date {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.date-value {
    font-weight: 500;
    color: var(--text-color);
    font-size: 0.8rem;
}

.time-value {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
}

/* Products Count */
.products-count {
    display: flex;
    justify-content: center;
}

.count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--primary-100);
    color: var(--primary-700);
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.75rem;
}

/* Payment Status */
.payment-status {
    display: flex;
    justify-content: center;
}

.payment-icon {
    font-size: 1.5rem;
    cursor: help;
    transition: transform 0.2s ease;
}

.payment-icon:hover {
    transform: scale(1.1);
}

.payment-approved {
    color: #22c55e !important;
}

.payment-pending {
    color: #ef4444 !important;
}

.payment-tag {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
    margin-bottom: 0.25rem;
}

.no-payment {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
}

.action-buttons .p-button {
    width: 2rem;
    height: 2rem;
}

/* Empty and Loading States */
.empty-state,
.loading-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-color-secondary);
}

.empty-state h3 {
    margin: 1rem 0 0.5rem 0;
    color: var(--text-color);
}

.empty-state p,
.loading-state p {
    margin: 0;
    font-size: 0.875rem;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

/* Dark mode styles */
[data-theme='dark'] .total-amount {
    color: var(--green-400);
}

[data-theme='dark'] .staff-orders-table :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-800);
    border-color: var(--surface-700);
}

[data-theme='dark'] .staff-orders-table :deep(.p-datatable-tbody > tr > td) {
    border-color: var(--surface-700);
}

[data-theme='dark'] .staff-orders-table :deep(.p-datatable-tbody > tr:hover) {
    background: var(--surface-800);
}

[data-theme='dark'] .count-badge {
    background: var(--primary-900);
    color: var(--primary-100);
}


/* Responsive */
@media (max-width: 768px) {
    .staff-orders-table :deep(.p-datatable-thead > tr > th),
    .staff-orders-table :deep(.p-datatable-tbody > tr > td) {
        padding: 0.5rem 0.375rem;
        font-size: 0.8rem;
    }

    .table-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .header-right {
        justify-content: space-between;
    }

    .search-input {
        width: 100%;
        max-width: 200px;
    }

    .client-name {
        font-size: 0.875rem;
    }

    .action-buttons .p-button {
        width: 1.75rem;
        height: 1.75rem;
    }
}
</style>
