<script setup>
import { useOrdersStore } from '@/stores/orders';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

// Props
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

// Emits
const emit = defineEmits(['update:visible', 'payment-success', 'payment-failed']);

const ordersStore = useOrdersStore();
const toast = useToast();
const route = useRoute();

// Estado
const loading = ref(false);
const isPolling = ref(false);
const pollingInterval = ref(null);

// Computed
const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const orderTotal = computed(() => {
    return props.order?.total || 0;
});

// Watch for modal visibility changes
watch(
    () => props.visible,
    (newValue) => {
        if (newValue) {
            // Check if we need to resume polling from URL params
            checkAndResumePolling();
        } else {
            // Stop polling when modal closes
            stopPolling();
        }
    }
);

// Computed para verificar si tenemos una orden válida
const hasValidOrder = computed(() => {
    return props.order && props.order.id;
});

// Métodos
const closeModal = () => {
    stopPolling();
    isVisible.value = false;
    resetForm();
};

const resetForm = () => {
    loading.value = false;
    isPolling.value = false;
};

const checkAndResumePolling = () => {
    // Check URL params for order ID (when returning from MercadoPago)
    const orderParam = route.query.order;
    if (orderParam && !isPolling.value) {
        const orderId = parseInt(orderParam);
        if (orderId && orderId === props.order?.id) {
            startPolling(orderId);
        }
    }
};

const startPolling = (orderId) => {
    if (isPolling.value) return;

    isPolling.value = true;

    const pollPaymentStatus = async () => {
        try {
            const result = await ordersStore.checkPaymentStatus(orderId);

            if (result.success && result.data) {
                const paymentStatus = result.data.payment_status;

                if (import.meta.env.MODE === 'development') {
                    console.log('💳 Payment status:', paymentStatus);
                }

                // Stop polling if payment is completed (approved, rejected, or cancelled)
                if (['approved', 'rejected', 'cancelled'].includes(paymentStatus)) {
                    stopPolling();

                    if (paymentStatus === 'approved') {
                        handlePaymentSuccess(result.data);
                    } else {
                        handlePaymentError({ message: 'El pago no fue aprobado' });
                    }
                }
            }
        } catch (error) {
            if (import.meta.env.MODE === 'development') {
                console.error('💳 Error checking payment status:', error);
            }
        }
    };

    // Check immediately
    pollPaymentStatus();

    // Then check every 5 seconds
    pollingInterval.value = setInterval(pollPaymentStatus, 5000);
};

const stopPolling = () => {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
    }
    isPolling.value = false;
};

// Payment event handlers
const handlePaymentSuccess = (paymentData) => {
    toast.add({
        severity: 'success',
        summary: 'Pago Exitoso',
        detail: 'Tu pago ha sido procesado correctamente',
        life: 5000
    });

    emit('payment-success', paymentData);
    closeModal();
};

const handlePaymentError = (error) => {
    if (import.meta.env.MODE === 'development') {
        console.error('Payment error:', error);
    }

    toast.add({
        severity: 'error',
        summary: 'Error en el Pago',
        detail: error.message || 'No se pudo procesar el pago',
        life: 5000
    });

    emit('payment-failed', error);
};

// Process payment with MercadoPago
const processPayment = async () => {
    if (loading.value) return; // Prevent multiple calls

    loading.value = true;

    try {
        if (import.meta.env.MODE === 'development') {
            console.log('💳 Iniciando pago para orden:', props.order.id);
        }

        const result = await ordersStore.generatePaymentLink(props.order.id);

        if (result.success) {
            // Get init_point from response (handle both object and direct string)
            let paymentUrl;
            if (typeof result.data === 'string') {
                paymentUrl = result.data;
            } else if (result.data && result.data.init_point) {
                paymentUrl = result.data.init_point;
            } else {
                throw new Error('No se recibió URL de pago válida');
            }

            // Add locale parameter if not present
            try {
                const url = new URL(paymentUrl);
                if (!url.searchParams.has('locale')) {
                    url.searchParams.set('locale', 'es-PE');
                }
                paymentUrl = url.toString();
            } catch (e) {
                if (import.meta.env.MODE === 'development') {
                    console.warn('No se pudo analizar la URL de MercadoPago para añadir locale:', e);
                }
            }

            if (import.meta.env.MODE === 'development') {
                console.log('💳 URL de pago generada:', paymentUrl);
            }

            toast.add({
                severity: 'info',
                summary: 'Redirigiendo a MercadoPago',
                detail: 'Serás redirigido para completar tu pago...',
                life: 3000
            });

            // Start polling before redirect
            startPolling(props.order.id);

            // Redirect to MercadoPago
            window.location.href = paymentUrl;
        } else {
            throw new Error(result.message || 'Error al generar enlace de MercadoPago');
        }
    } catch (error) {
        if (import.meta.env.MODE === 'development') {
            console.error('💳 Error procesando pago:', error);
        }

        toast.add({
            severity: 'error',
            summary: 'Error de Pago',
            detail: error.message || 'No se pudo procesar el pago. Intente nuevamente.',
            life: 6000
        });
    } finally {
        loading.value = false;
    }
};

// Lifecycle hooks
onMounted(() => {
    checkAndResumePolling();
});

onBeforeUnmount(() => {
    stopPolling();
});
</script>

<template>
    <Dialog v-model:visible="isVisible" modal header="Procesar Pago" :style="{ width: '95vw', maxWidth: '800px' }" class="payment-modal" :closable="!loading" :close-on-escape="!loading">
        <div class="payment-content">
            <!-- No Valid Order -->
            <div v-if="!hasValidOrder" class="flex items-center justify-center py-8">
                <div class="text-center">
                    <i class="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4"></i>
                    <h3 class="text-xl text-gray-500 mb-2">Orden no válida</h3>
                    <p class="text-gray-400">No se pudo cargar la información de la orden</p>
                </div>
            </div>

            <!-- Loading State -->
            <div v-else-if="loading" class="flex items-center justify-center py-8">
                <div class="text-center">
                    <ProgressSpinner />
                    <p class="mt-4 text-gray-600">Preparando opciones de pago...</p>
                </div>
            </div>

            <!-- Payment Polling Status (fallback) -->
            <div v-else-if="isPolling" class="polling-status">
                <div class="polling-content">
                    <div class="polling-icon">
                        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
                    </div>
                    <h3 class="polling-title">Esperando confirmación de pago</h3>
                    <p class="polling-description">Hemos redirigido a MercadoPago. La página se actualizará automáticamente cuando el pago se complete.</p>
                    <div class="polling-actions">
                        <Button label="Cancelar verificación" icon="pi pi-times" class="p-button-outlined p-button-danger" @click="stopPolling" />
                    </div>
                </div>
            </div>

            <!-- Initial Payment Options -->
            <div v-else-if="hasValidOrder && !isPolling" class="payment-options">
                <div class="order-summary">
                    <h3 class="summary-title">
                        <i class="pi pi-shopping-cart"></i>
                        Resumen de la Orden #{{ order?.id || 'N/A' }}
                    </h3>
                    <div class="summary-details">
                        <div class="summary-row">
                            <span>Total a pagar:</span>
                            <span class="total-amount">S/ {{ (parseFloat(orderTotal) || 0).toFixed(2) }}</span>
                        </div>
                    </div>
                </div>

                <div class="payment-actions">
                    <div class="payment-method-info">
                        <i class="pi pi-info-circle text-blue-500"></i>
                        <div>
                            <h4 class="method-title">Pago con MercadoPago</h4>
                            <p class="method-description">Serás redirigido a MercadoPago para completar tu pago de forma segura.</p>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <Button class="pay-button" size="large" :loading="loading" :disabled="isPolling || loading" @click="processPayment">
                            <i class="pi pi-credit-card mr-2"></i>
                            Pagar con MercadoPago
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="modal-actions">
                <Button label="Cerrar" icon="pi pi-times" class="p-button-outlined" :disabled="loading || isPolling" @click="closeModal" />
                <div v-if="isPolling" class="polling-status-footer">
                    <i class="pi pi-info-circle text-blue-500 mr-2"></i>
                    <span class="text-sm text-blue-600">Verificando pago cada 5 segundos...</span>
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.payment-content {
    min-height: 400px;
}

/* Order Summary */
.order-summary {
    background: #f8fafc;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
}

.summary-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.summary-title i {
    color: #10b981;
}

.summary-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.1rem;
    font-weight: 600;
}

.total-amount {
    color: #10b981;
    font-size: 1.3rem;
}

/* Payment Options */
.payment-options {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
}

.payment-actions {
    background: #f8fafc;
    border-radius: 16px;
    padding: 2rem;
    border: 1px solid #e2e8f0;
}

.payment-method-info {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.method-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
}

.method-description {
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
}

.pay-button {
    background: linear-gradient(135deg, #00a0e6, #0073b7);
    border: none;
    color: white;
    font-weight: 600;
    padding: 1.25rem 3rem;
    border-radius: 12px;
    font-size: 1.1rem;
    box-shadow: 0 8px 16px rgba(0, 160, 230, 0.3);
    transition: all 0.3s ease;
    min-width: 300px;
}

.pay-button:hover {
    background: linear-gradient(135deg, #0073b7, #005a8a);
    box-shadow: 0 12px 24px rgba(0, 160, 230, 0.4);
    transform: translateY(-2px);
}

.pay-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

/* Payment Polling Status */
.polling-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 2rem;
    text-align: center;
}

.polling-content {
    max-width: 400px;
}

.polling-icon {
    margin-bottom: 1.5rem;
}

.polling-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
}

.polling-description {
    color: #6b7280;
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 2rem 0;
}

.polling-actions {
    margin-top: 1rem;
}

/* Modal Actions */
.modal-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.polling-status-footer {
    display: flex;
    align-items: center;
    color: #3b82f6;
    font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 640px) {
    .modal-actions {
        flex-direction: column;
    }

    .payment-options {
        padding: 0.5rem;
        gap: 1.5rem;
    }

    .payment-actions {
        padding: 1.5rem;
    }

    .payment-method-info {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
    }

    .pay-button {
        min-width: 100%;
        padding: 1rem 2rem;
        font-size: 1rem;
    }

    .action-buttons {
        gap: 0.75rem;
    }
}

/* Loading and error states */
.flex {
    display: flex;
}

.items-center {
    align-items: center;
}

.justify-center {
    justify-content: center;
}

.flex-col {
    flex-direction: column;
}

.py-8 {
    padding-top: 2rem;
    padding-bottom: 2rem;
}

.text-center {
    text-align: center;
}

.mt-4 {
    margin-top: 1rem;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.mb-4 {
    margin-bottom: 1rem;
}

.mr-2 {
    margin-right: 0.5rem;
}

.gap-3 {
    gap: 0.75rem;
}

.text-gray-600 {
    color: #4b5563;
}

.text-lg {
    font-size: 1.125rem;
}

.font-semibold {
    font-weight: 600;
}

.text-6xl {
    font-size: 3.75rem;
    line-height: 1;
}

.text-orange-500 {
    color: #f97316;
}

.text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
}

.text-gray-500 {
    color: #6b7280;
}

.text-gray-400 {
    color: #9ca3af;
}
</style>
