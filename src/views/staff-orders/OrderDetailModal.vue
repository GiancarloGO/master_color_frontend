<script setup>
import { useStaffOrdersStore } from '@/stores/staffOrders';
import { computed } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    order: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'change-status', 'status-updated']);

const staffOrdersStore = useStaffOrdersStore();

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

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

function getProductCount() {
    if (!props.order?.order_details) return 0;
    return props.order.order_details.length;
}

function canUpdateOrder() {
    if (!props.order) return false;
    const finalStates = ['entregado', 'cancelado'];
    return !finalStates.includes(props.order.status);
}

function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(amount));
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>

<template>
    <Dialog v-model:visible="dialogVisible" modal :header="`Detalle de Orden #${order?.id || ''}`" :style="{ width: '80vw' }" :maximizable="true" class="order-detail-modal">
        <div v-if="order" class="order-detail-content">
            <!-- Información general -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Información de la orden -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-shopping-cart"></i>
                            Información de la Orden
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="font-medium">ID:</span>
                                <span class="font-semibold text-primary-600">#{{ order.id }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Estado:</span>
                                <Tag :value="getStatusLabel(order.status)" :severity="getStatusSeverity(order.status)" :icon="getStatusIcon(order.status)" />
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Fecha de Creación:</span>
                                <span>{{ formatDateTime(order.created_at) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Última Actualización:</span>
                                <span>{{ formatDateTime(order.updated_at) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Código de Pago:</span>
                                <span class="font-mono">{{ order.codigo_payment || 'N/A' }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Información del cliente -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-user"></i>
                            Cliente
                        </div>
                    </template>
                    <template #content>
                        <div v-if="order.client" class="space-y-3">
                            <div class="flex justify-between">
                                <span class="font-medium">Nombre:</span>
                                <span>{{ order.client.name }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Email:</span>
                                <span>{{ order.client.email }}</span>
                            </div>
                            <div v-if="order.client.phone" class="flex justify-between">
                                <span class="font-medium">Teléfono:</span>
                                <span>
                                    <i class="pi pi-phone text-xs mr-1"></i>
                                    {{ order.client.phone }}
                                </span>
                            </div>
                            <div v-if="order.client.document_type && order.client.identity_document" class="flex justify-between">
                                <span class="font-medium">{{ order.client.document_type }}:</span>
                                <span>{{ order.client.identity_document }}</span>
                            </div>
                            <div v-if="order.client.client_type" class="flex justify-between">
                                <span class="font-medium">Tipo:</span>
                                <span class="capitalize">{{ order.client.client_type }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">ID Cliente:</span>
                                <span>#{{ order.client.id }}</span>
                            </div>
                        </div>
                        <div v-else class="text-surface-500">Sin información del cliente</div>
                    </template>
                </Card>
            </div>

            <!-- Dirección de entrega -->
            <Card v-if="order.delivery_address" class="mb-6">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-map-marker"></i>
                        Dirección de Entrega
                    </div>
                </template>
                <template #content>
                    <div class="space-y-4">
                        <div>
                            <span class="font-medium text-surface-700">Dirección Completa:</span>
                            <p class="mt-1 text-surface-900 font-medium">{{ order.delivery_address.address_full }}</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div v-if="order.delivery_address.district">
                                <span class="font-medium text-surface-700">Distrito:</span>
                                <p class="text-surface-900">{{ order.delivery_address.district }}</p>
                            </div>
                            <div v-if="order.delivery_address.province">
                                <span class="font-medium text-surface-700">Provincia:</span>
                                <p class="text-surface-900">{{ order.delivery_address.province }}</p>
                            </div>
                            <div v-if="order.delivery_address.department">
                                <span class="font-medium text-surface-700">Departamento:</span>
                                <p class="text-surface-900">{{ order.delivery_address.department }}</p>
                            </div>
                        </div>

                        <div v-if="order.delivery_address.reference" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div class="flex items-start gap-2">
                                <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
                                <div>
                                    <span class="font-medium text-blue-800">Referencia:</span>
                                    <p class="text-blue-700 mt-1">{{ order.delivery_address.reference }}</p>
                                </div>
                            </div>
                        </div>

                        <div v-if="order.delivery_address.postal_code" class="text-sm text-surface-600"><span class="font-medium">Código Postal:</span> {{ order.delivery_address.postal_code }}</div>
                    </div>
                </template>
            </Card>

            <!-- Productos -->
            <Card class="mb-6">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-box"></i>
                        Productos ({{ getProductCount() }})
                    </div>
                </template>
                <template #content>
                    <div v-if="order.order_details && order.order_details.length > 0">
                        <div class="space-y-4">
                            <div v-for="detail in order.order_details" :key="detail.id" class="border border-surface-200 rounded-lg p-4">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-lg">{{ detail.product?.name || 'Producto no disponible' }}</h4>
                                        <p v-if="detail.product?.description" class="text-surface-600 mt-1">
                                            {{ detail.product.description }}
                                        </p>
                                        <div class="flex gap-4 mt-2 text-sm text-surface-500">
                                            <span v-if="detail.product?.sku">SKU: {{ detail.product.sku }}</span>
                                            <span v-if="detail.product?.brand">Marca: {{ detail.product.brand }}</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-lg font-semibold">S/ {{ formatCurrency(detail.subtotal) }}</div>
                                        <div class="text-sm text-surface-500">{{ detail.quantity }} x S/ {{ formatCurrency(detail.unit_price) }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-8 text-surface-500">No hay productos en esta orden</div>
                </template>
            </Card>

            <!-- Resumen financiero -->
            <Card class="mb-6">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calculator"></i>
                        Resumen Financiero
                    </div>
                </template>
                <template #content>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span>S/ {{ formatCurrency(order.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Costo de Envío:</span>
                            <span>S/ {{ formatCurrency(order.shipping_cost) }}</span>
                        </div>
                        <div v-if="order.discount && parseFloat(order.discount) > 0" class="flex justify-between">
                            <span>Descuento:</span>
                            <span class="text-green-600">-S/ {{ formatCurrency(order.discount) }}</span>
                        </div>
                        <Divider />
                        <div class="flex justify-between text-lg font-semibold">
                            <span>Total:</span>
                            <span class="text-primary-600">S/ {{ formatCurrency(order.total) }}</span>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Información de pagos -->
            <Card v-if="order.payments && order.payments.length > 0" class="mb-6">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-credit-card"></i>
                        Información de Pagos
                    </div>
                </template>
                <template #content>
                    <div class="space-y-4">
                        <div v-for="payment in order.payments" :key="payment.id" class="border border-surface-200 rounded-lg p-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <div class="font-semibold">Pago #{{ payment.id }}</div>
                                    <div class="text-sm text-surface-500">{{ payment.payment_method }}</div>
                                </div>
                                <div class="text-right">
                                    <div class="font-semibold">S/ {{ formatCurrency(payment.amount) }}</div>
                                    <Tag :value="getPaymentStatusLabel(payment.status)" :severity="getPaymentStatusSeverity(payment.status)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Observaciones -->
            <Card v-if="order.observations">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-comment"></i>
                        Observaciones
                    </div>
                </template>
                <template #content>
                    <p class="whitespace-pre-wrap">{{ order.observations }}</p>
                </template>
            </Card>
        </div>

        <template #footer>
            <div class="flex justify-between">
                <Button label="Cambiar Estado" icon="pi pi-pencil" severity="warning" :disabled="!canUpdateOrder()" @click="$emit('change-status')" />
                <Button label="Cerrar" icon="pi pi-times" severity="secondary" @click="$emit('update:visible', false)" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.order-detail-modal :deep(.p-dialog) {
    max-height: 90vh;
}

.order-detail-content {
    max-height: 70vh;
    overflow-y: auto;
}
</style>
