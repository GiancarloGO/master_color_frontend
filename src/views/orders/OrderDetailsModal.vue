<script setup>
import { useOrdersStore } from '@/stores/orders';
import { useConfirm } from 'primevue/useconfirm';
import { computed, watch } from 'vue';

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    orderId: {
        type: [Number, String],
        default: null
    }
});

// Emits
const emit = defineEmits(['update:visible', 'retry-payment', 'cancel-order']);

const ordersStore = useOrdersStore();
const confirm = useConfirm();

// Computed
const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const order = computed(() => {
    if (props.orderId) {
        // Prefer getCurrentOrder (loaded with full details) over getOrderById (from list)
        const currentOrder = ordersStore.getCurrentOrder;
        const orderFromList = ordersStore.getOrderById(props.orderId);
        const selectedOrder = currentOrder || orderFromList;


        return selectedOrder;
    }
    return null;
});

const orderStatusInfo = computed(() => {
    if (!order.value) return null;

    const status = order.value.status;
    return {
        label: ordersStore.getOrderStatusLabel(status),
        severity: ordersStore.getOrderStatusSeverity(status),
        icon: ordersStore.getOrderStatusIcon(status),
        description: ordersStore.getOrderStatusDescription(status)
    };
});

const canRetryPayment = computed(() => {
    return order.value && ordersStore.canPayOrder(order.value);
});

const canCancelOrder = computed(() => {
    if (!order.value) return false;
    // Estados permitidos para cancelar
    const cancellableStatuses = ['pendiente_pago', 'pendiente', 'confirmado', 'procesando'];
    return cancellableStatuses.includes(order.value.status);
});

const orderItems = computed(() => {
    if (!order.value) {
        return [];
    }

    // Check different possible data structures
    let items = [];

    if (order.value.items && order.value.items.length > 0) {
        items = order.value.items;
    } else if (order.value.products && order.value.products.length > 0) {
        items = order.value.products;
    } else if (order.value.order_details && order.value.order_details.length > 0) {
        // Map order_details to proper format
        items = order.value.order_details.map((detail) => ({
            id: detail.id,
            name: detail.product?.name || 'Producto sin nombre',
            description: detail.product?.description || '',
            image: detail.product?.image || '/placeholder-product.png',
            image_url: detail.product?.image_url || detail.product?.image || '/placeholder-product.png',
            category: detail.product?.category || '',
            sku: detail.product?.sku || '',
            brand: detail.product?.brand || '',
            quantity: detail.quantity || 1,
            price: detail.unit_price || detail.price || 0,
            unit_price: detail.unit_price || 0,
            subtotal: detail.subtotal || 0,
            product: detail.product,
            // Keep original detail for reference
            order_detail_id: detail.id,
            product_id: detail.product_id
        }));
    }


    return items;
});

const deliveryAddress = computed(() => {
    return order.value?.delivery_address || order.value?.address;
});

const orderTimeline = computed(() => {
    if (!order.value) return [];

    const timeline = [];
    const createdAt = new Date(order.value.created_at);

    timeline.push({
        status: 'created',
        label: 'Orden Creada',
        date: createdAt,
        icon: 'pi pi-plus-circle',
        completed: true
    });

    if (order.value.status !== 'pendiente_pago' && order.value.status !== 'pago_fallido') {
        timeline.push({
            status: 'paid',
            label: 'Pago Confirmado',
            date: order.value.paid_at ? new Date(order.value.paid_at) : null,
            icon: 'pi pi-check-circle',
            completed: true
        });
    }

    if (['confirmado', 'procesando', 'enviado', 'entregado'].includes(order.value.status)) {
        timeline.push({
            status: 'confirmed',
            label: 'Orden Confirmada',
            date: order.value.confirmed_at ? new Date(order.value.confirmed_at) : null,
            icon: 'pi pi-verified',
            completed: true
        });
    }

    if (['procesando', 'enviado', 'entregado'].includes(order.value.status)) {
        timeline.push({
            status: 'processing',
            label: 'En Proceso',
            date: order.value.processing_at ? new Date(order.value.processing_at) : null,
            icon: 'pi pi-cog',
            completed: true
        });
    }

    if (['enviado', 'entregado'].includes(order.value.status)) {
        timeline.push({
            status: 'shipped',
            label: 'Enviado',
            date: order.value.shipped_at ? new Date(order.value.shipped_at) : null,
            icon: 'pi pi-send',
            completed: true
        });
    }

    if (order.value.status === 'entregado') {
        timeline.push({
            status: 'delivered',
            label: 'Entregado',
            date: order.value.delivered_at ? new Date(order.value.delivered_at) : null,
            icon: 'pi pi-check',
            completed: true
        });
    }

    return timeline;
});

// Métodos
const closeModal = () => {
    isVisible.value = false;
};

const retryPayment = () => {
    if (order.value) {
        emit('retry-payment', order.value);
        closeModal();
    }
};

const cancelOrder = () => {
    if (!order.value) return;

    confirm.require({
        header: 'Cancelar compra',
        message: 'Para cancelar la compra debes enviar un mensaje de WhatsApp al +51 999 830 565 indicando el número de tu orden y el motivo de la devolución.',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Abrir WhatsApp',
        rejectLabel: 'Cerrar',
        accept: () => {
            // Abrir WhatsApp
            const phone = '51999830565';
            const text = encodeURIComponent(`Hola, deseo cancelar la compra con número de orden #${order.value.id}. Motivo de la devolución: `);
            const waUrl = `https://wa.me/${phone}?text=${text}`;
            window.open(waUrl, '_blank');

            emit('cancel-order', order.value);
            closeModal();
        },
        reject: () => {
            // Solo cerrar modal de orden
            closeModal();
        }
    });

    // La lógica adicional se maneja en el diálogo de confirmación.
    return;
};

const getStatusIcon = (status) => {
    const iconMap = {
        pendiente_pago: 'pi pi-clock',
        pendiente: 'pi pi-hourglass',
        confirmado: 'pi pi-check-circle',
        procesando: 'pi pi-cog',
        enviado: 'pi pi-send',
        entregado: 'pi pi-check',
        pago_fallido: 'pi pi-times-circle',
        cancelado: 'pi pi-ban'
    };
    return iconMap[status] || 'pi pi-info-circle';
};

const formatDate = (dateString) => {
    if (!dateString) return 'Pendiente';

    return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return `S/ ${numericAmount.toFixed(2)}`;
};

const getStatusColor = (severity) => {
    const colorMap = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        secondary: '#6b7280'
    };
    return colorMap[severity] || '#6b7280';
};

const debugRefresh = async () => {
    if (props.orderId) {
        const result = await ordersStore.fetchOrderById(props.orderId);
    }
};

// Cargar detalles de la orden cuando se abra el modal
watch([isVisible, () => props.orderId], async ([visible, orderId]) => {
    if (visible && orderId) {

        const result = await ordersStore.fetchOrderById(orderId);


    }
});
</script>

<template>
    <Dialog v-model:visible="isVisible" modal :header="`Detalles de la Orden #${order?.id || ''}`" :style="{ width: '95vw', maxWidth: '800px' }" class="order-details-modal">
        <div v-if="order" class="order-details">
            <!-- Header con estado -->
            <div class="order-header">
                <div class="order-info">
                    <h3 class="order-title">Orden #{{ order.id }}</h3>
                    <p class="order-date">{{ formatDate(order.created_at) }}</p>
                </div>
                <div class="order-status-section">
                    <div class="status-card">
                        <div class="status-icon-wrapper">
                            <i :class="orderStatusInfo.icon" :style="{ color: getStatusColor(orderStatusInfo.severity) }"></i>
                        </div>
                        <div class="status-content">
                            <h4 class="status-title">{{ orderStatusInfo.label }}</h4>
                            <p class="status-description">{{ orderStatusInfo.description }}</p>
                            <div v-if="order.status === 'pendiente'" class="status-highlight success">
                                <i class="pi pi-check-circle"></i>
                                <span>Pago confirmado</span>
                            </div>
                            <div v-else-if="order.status === 'pendiente_pago'" class="status-highlight warning">
                                <i class="pi pi-clock"></i>
                                <span>Esperando pago</span>
                            </div>
                            <div v-else-if="order.status === 'enviado'" class="status-highlight info">
                                <i class="pi pi-truck"></i>
                                <span>En camino</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Timeline de la orden -->
            <div class="order-timeline">
                <h4 class="section-title">
                    <i class="pi pi-history"></i>
                    Estado de la Orden
                </h4>
                <div class="timeline">
                    <div v-for="(step, index) in orderTimeline" :key="step.status" class="timeline-item" :class="{ completed: step.completed }">
                        <div class="timeline-marker">
                            <i :class="step.icon"></i>
                        </div>
                        <div class="timeline-content">
                            <h5 class="timeline-title">{{ step.label }}</h5>
                            <p class="timeline-date">{{ formatDate(step.date) }}</p>
                        </div>
                        <div v-if="index < orderTimeline.length - 1" class="timeline-connector"></div>
                    </div>
                </div>
            </div>

            <!-- Productos -->
            <div class="order-products">
                <h4 class="section-title">
                    <i class="pi pi-shopping-bag"></i>
                    Productos ({{ orderItems.length }})
                </h4>
                <!-- Debug info -->
                <div v-if="orderItems.length === 0" class="debug-info" style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem">
                    <p><strong>Debug Info:</strong></p>
                    <p>Order ID: {{ order?.id }}</p>
                    <p>Order Keys: {{ order ? Object.keys(order).join(', ') : 'No order' }}</p>
                    <p>Items: {{ order?.items?.length || 0 }}</p>
                    <p>Products: {{ order?.products?.length || 0 }}</p>
                    <p>Order Details: {{ order?.order_details?.length || 0 }}</p>
                    <p>Is Loading: {{ ordersStore.isLoading }}</p>
                    <p>Has Error: {{ !!ordersStore.getError }}</p>
                    <Button label="Debug Refresh" class="p-button-sm" style="margin-top: 0.5rem" @click="debugRefresh" />
                </div>
                <div class="products-list">
                    <div v-for="item in orderItems" :key="item.id" class="product-item">
                        <img :src="item.image_url || item.image || '/placeholder-product.png'" :alt="item.name" class="product-image" />
                        <div class="product-details">
                            <h5 class="product-name">{{ item.name }}</h5>
                            <p class="product-category">{{ item.category }}</p>
                            <div class="product-meta">
                                <span v-if="item.sku" class="product-sku">SKU: {{ item.sku }}</span>
                                <span v-if="item.brand" class="product-brand">{{ item.brand }}</span>
                            </div>
                        </div>
                        <div class="product-quantity">
                            <span class="quantity-label">Cantidad:</span>
                            <span class="quantity-value">{{ item.quantity || 1 }}</span>
                        </div>
                        <div class="product-pricing">
                            <div class="unit-price">
                                <span class="price-label">Precio unitario:</span>
                                <span class="price-value">{{ formatCurrency(item.unit_price || item.price || 0) }}</span>
                            </div>
                            <div class="total-price">
                                <span class="total-label">Subtotal:</span>
                                <span class="total-value">
                                    {{ formatCurrency(item.subtotal || (item.unit_price || item.price || 0) * (item.quantity || 1)) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dirección de entrega -->
            <div v-if="deliveryAddress" class="delivery-address">
                <h4 class="section-title">
                    <i class="pi pi-map-marker"></i>
                    Dirección de Entrega
                </h4>
                <div class="address-card">
                    <div class="address-content">
                        <p class="address-full">{{ deliveryAddress.address_full }}</p>
                        <p class="address-location">{{ deliveryAddress.district }}, {{ deliveryAddress.province }}, {{ deliveryAddress.department }}</p>
                        <p v-if="deliveryAddress.postal_code" class="address-postal">CP: {{ deliveryAddress.postal_code }}</p>
                        <p v-if="deliveryAddress.reference" class="address-reference">Ref: {{ deliveryAddress.reference }}</p>
                    </div>
                </div>
            </div>

            <!-- Resumen de costos -->
            <div class="order-summary">
                <h4 class="section-title">
                    <i class="pi pi-calculator"></i>
                    Resumen de Costos
                </h4>
                <div class="summary-details">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>{{ formatCurrency(order.subtotal || order.total) }}</span>
                    </div>
                    <div v-if="order.shipping_cost" class="summary-row">
                        <span>Envío:</span>
                        <span>{{ formatCurrency(order.shipping_cost) }}</span>
                    </div>
                    <div v-if="order.discount" class="summary-row discount">
                        <span>Descuento:</span>
                        <span>-{{ formatCurrency(order.discount) }}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>{{ formatCurrency(order.total) }}</span>
                    </div>
                </div>
            </div>

            <!-- Observaciones -->
            <div v-if="order.observations" class="order-observations">
                <h4 class="section-title">
                    <i class="pi pi-comment"></i>
                    Observaciones
                </h4>
                <div class="observations-content">
                    <p>{{ order.observations }}</p>
                </div>
            </div>
        </div>

        <!-- Estado de carga -->
        <div v-else-if="ordersStore.isLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner loading-icon"></i>
            <p>Cargando detalles de la orden...</p>
        </div>

        <!-- Estado de error -->
        <div v-else class="error-state">
            <i class="pi pi-exclamation-triangle error-icon"></i>
            <p>No se pudieron cargar los detalles de la orden</p>
        </div>

        <template #footer>
            <div class="modal-actions">
                <Button label="Cerrar" icon="pi pi-times" class="p-button-outlined" @click="closeModal" />
                <Button v-if="canCancelOrder" label="Cancelar Orden" icon="pi pi-ban" class="p-button-outlined p-button-danger" @click="cancelOrder" />
                <Button v-if="canRetryPayment" label="Pagar Ahora" icon="pi pi-credit-card" class="payment-button" @click="retryPayment" />
            </div>
        </template>
    </Dialog>
    <ConfirmDialog />
</template>

<style scoped>
.order-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Header */
.order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    gap: 1rem;
}

.order-info {
    flex: 1;
}

.order-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.order-date {
    color: #6b7280;
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
}

.order-status-section {
    display: flex;
    justify-content: flex-end;
    min-width: 280px;
}

.status-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    max-width: 300px;
}

.status-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.status-icon-wrapper i {
    font-size: 1.25rem;
}

.status-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.status-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
    line-height: 1.3;
}

.status-description {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
    margin: 0;
}

.status-highlight {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.5rem;
    padding: 0.375rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
}

.status-highlight.success {
    background: #d1fae5;
    color: #059669;
}

.status-highlight.warning {
    background: #fef3c7;
    color: #d97706;
}

.status-highlight.info {
    background: #dbeafe;
    color: #1e40af;
}

.status-highlight i {
    font-size: 0.75rem;
    flex-shrink: 0;
}

/* Animations */
.status-icon-wrapper:has(.pi-check-circle) i {
    animation: pulse-success 2s infinite;
}

.status-icon-wrapper:has(.pi-cog) i {
    animation: spin 2s linear infinite;
}

@keyframes pulse-success {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.1);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Títulos de sección */
.section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.section-title i {
    color: #10b981;
}

/* Timeline */
.timeline {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
}

.timeline-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
}

.timeline-marker {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
    z-index: 2;
}

.timeline-item.completed .timeline-marker {
    background: #10b981;
    color: white;
}

.timeline-content {
    flex: 1;
}

.timeline-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.timeline-date {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0.25rem 0 0 0;
}

.timeline-connector {
    position: absolute;
    left: 19px;
    top: 40px;
    width: 2px;
    height: 40px;
    background: #e5e7eb;
    z-index: 1;
}

.timeline-item.completed .timeline-connector {
    background: #10b981;
}

/* Productos */
.products-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.product-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.product-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
    background: #f8fafc;
    border-radius: 8px;
    flex-shrink: 0;
}

.product-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.product-name {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.product-category {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
}

.product-meta {
    display: flex;
    gap: 1rem;
    margin-top: 0.25rem;
}

.product-sku,
.product-brand {
    font-size: 0.75rem;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
}

.product-quantity {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-width: 80px;
}

.quantity-label {
    font-size: 0.75rem;
    color: #6b7280;
}

.quantity-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #10b981;
    background: #ecfdf5;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
}

.product-pricing {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: 120px;
}

.unit-price,
.total-price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
}

.price-label,
.total-label {
    font-size: 0.75rem;
    color: #6b7280;
}

.price-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.total-value {
    font-size: 1rem;
    font-weight: 600;
    color: #10b981;
}

/* Dirección */
.address-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid #e2e8f0;
}

.address-full {
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
}

.address-location,
.address-postal,
.address-reference {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0.25rem 0;
}

/* Resumen */
.summary-details {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid #e2e8f0;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    font-size: 0.95rem;
}

.summary-row:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
}

.summary-row.discount {
    color: #059669;
}

.summary-row.total {
    font-size: 1.1rem;
    font-weight: 700;
    color: #10b981;
    border-top: 2px solid #e5e7eb;
    margin-top: 0.5rem;
    padding-top: 1rem;
}

/* Observaciones */
.observations-content {
    background: #f0f9ff;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid #e0f2fe;
}

.observations-content p {
    color: #0c4a6e;
    margin: 0;
    line-height: 1.5;
}

/* Estados de carga y error */
.loading-state,
.error-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
}

.loading-icon,
.error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.loading-icon {
    color: #10b981;
}

.error-icon {
    color: #ef4444;
}

/* Acciones del modal */
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.payment-button {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    border-radius: 8px;
}

.payment-button:hover {
    background: linear-gradient(135deg, #059669, #047857);
}

/* Responsive */
@media (max-width: 768px) {
    .order-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }

    .order-status-section {
        justify-content: center;
        min-width: auto;
        width: 100%;
    }

    .status-card {
        max-width: none;
        width: 100%;
        text-align: center;
        flex-direction: column;
        align-items: center;
    }

    .status-content {
        align-items: center;
        text-align: center;
    }

    .status-highlight {
        justify-content: center;
    }

    .product-item {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        text-align: center;
    }

    .modal-actions {
        flex-direction: column;
    }

    .timeline-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .timeline-connector {
        display: none;
    }
}
</style>
