<script setup>
import MercadoPagoCheckout from '@/components/payment/MercadoPagoCheckout.vue';
import { useOrdersStore } from '@/stores/orders';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

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

// Estado
const loading = ref(false);
const useBricks = ref(true); // Activar modo Bricks por defecto para pagos integrados
const preferenceData = ref(null);

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
    async (newValue) => {
        if (newValue && props.order?.id) {
            // Inicializar preferencia de pago para modo Bricks
            await initializePaymentPreference();
        }
    }
);

// Computed para verificar si tenemos una orden válida
const hasValidOrder = computed(() => {
    return props.order && props.order.id;
});

// Métodos
const closeModal = () => {
    stopPolling(); // Stop polling when modal closes
    isVisible.value = false;
    resetForm();
};

const resetForm = () => {
    preferenceData.value = null;
};

const initializePaymentPreference = async () => {
    if (!props.order?.id) return;

    loading.value = true;

    try {
        const result = await ordersStore.generatePaymentLink(props.order.id);

        if (result.success) {
            preferenceData.value = result.data;
        } else {
            throw new Error(result.message || 'Error al generar preferencia de pago');
        }
    } catch (error) {
        console.error('Error initializing payment preference:', error);
        console.error('Error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        let errorMessage = 'No se pudo inicializar el pago';

        if (error.response?.status === 500) {
            errorMessage = 'Error interno del servidor. Verifica que la orden exista y esté en estado pendiente_pago.';
        } else if (error.response?.status === 404) {
            errorMessage = 'La orden no fue encontrada. Por favor, crea una nueva orden.';
        } else if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || 'Datos de la orden inválidos.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        toast.add({
            severity: 'error',
            summary: 'Error de pago',
            detail: errorMessage,
            life: 8000
        });
    } finally {
        loading.value = false;
    }
};

// Handlers for MercadoPago Checkout events
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
    console.error('Payment error:', error);

    toast.add({
        severity: 'error',
        summary: 'Error en el Pago',
        detail: error.message || 'No se pudo procesar el pago',
        life: 5000
    });

    emit('payment-failed', error);
};

const handlePaymentPending = (paymentData) => {
    toast.add({
        severity: 'info',
        summary: 'Pago Pendiente',
        detail: 'Tu pago está siendo procesado',
        life: 5000
    });

    emit('payment-success', paymentData);
    closeModal();
};

// State for payment polling
const paymentWindow = ref(null);
const pollingInterval = ref(null);
const isPolling = ref(false);

// Modo clásico de MercadoPago con nueva ventana y polling
const switchToClassicMode = async () => {
    useBricks.value = false;
    loading.value = true;

    try {
        console.log('💳 Iniciando pago en modo clásico para orden:', props.order.id);
        const result = await ordersStore.generatePaymentLink(props.order.id);

        if (result.success) {
            // Determinar URL según entorno (sandbox vs producción)
            const paymentUrl = result.data.init_point;

            console.log('💳 URL de pago generada:', paymentUrl);

            // Usar iframe integrado en lugar de nueva ventana
            console.log('💳 Usando iframe integrado para el pago');

            toast.add({
                severity: 'info',
                summary: 'Preparando pago',
                detail: 'Abriendo formulario de pago integrado...',
                life: 3000
            });

            // Guardar ID de orden para polling
            localStorage.setItem('pendingOrderId', props.order.id);
            localStorage.setItem('currentOrderId', props.order.id);

            // Redirigir directamente a MercadoPago
            window.location.href = paymentUrl;
        } else {
            throw new Error(result.message || 'Error al generar enlace de MercadoPago');
        }
    } catch (error) {
        console.error('💳 Error en modo clásico:', error);
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

// Start polling for payment status (unused but kept for potential future use)
// const startPaymentPolling = () => {
//     if (pollingInterval.value) {
//         clearInterval(pollingInterval.value);
//     }

//     isPolling.value = true;
//     let attempts = 0;
//     const maxAttempts = 60; // 5 minutes (60 * 5 seconds)

//     pollingInterval.value = setInterval(async () => {
//         attempts++;
//         console.log(`💳 Payment polling attempt ${attempts}/${maxAttempts}`);

//         try {
//             // Check if payment window is closed
//             if (paymentWindow.value && paymentWindow.value.closed) {
//                 console.log('💳 Payment window closed, checking payment status...');
//             }

//             // Check payment status
//             const response = await ordersStore.checkPaymentStatus(props.order.id);

//             if (response.success && ordersStore.paymentStatus) {
//                 const status = ordersStore.paymentStatus;
//                 console.log('💳 Payment status:', status);

//                 // Payment completed successfully
//                 if (status.payment_status === 'approved' && status.order_status === 'pendiente') {
//                     stopPolling();
//                     localStorage.removeItem('pendingOrderId');

//                     toast.add({
//                         severity: 'success',
//                         summary: 'Pago Completado',
//                         detail: 'Tu pago ha sido procesado exitosamente',
//                         life: 5000
//                     });

//                     emit('payment-success', status);
//                     closeModal();
//                     return;
//                 }

//                 // Payment failed or rejected
//                 if (status.payment_status === 'rejected' || status.order_status === 'pago_fallido') {
//                     stopPolling();
//                     localStorage.removeItem('pendingOrderId');

//                     toast.add({
//                         severity: 'error',
//                         summary: 'Pago Rechazado',
//                         detail: 'El pago fue rechazado. Puedes intentar nuevamente.',
//                         life: 5000
//                     });

//                     emit('payment-failed', { message: 'Pago rechazado' });
//                     return;
//                 }
//             }

//             // Stop polling after max attempts
//             if (attempts >= maxAttempts) {
//                 stopPolling();

//                 toast.add({
//                     severity: 'warn',
//                     summary: 'Verificación en progreso',
//                     detail: 'La verificación del pago continúa. Te notificaremos cuando esté listo.',
//                     life: 8000
//                 });
//             }
//         } catch (error) {
//             console.error('Error polling payment status:', error);

//             // Stop polling after too many errors
//             if (attempts >= 10) {
//                 stopPolling();

//                 toast.add({
//                     severity: 'error',
//                     summary: 'Error de verificación',
//                     detail: 'No se pudo verificar el estado del pago. Contacta con soporte.',
//                     life: 8000
//                 });
//             }
//         }
//     }, 5000); // Poll every 5 seconds
// };

// Stop polling
const stopPolling = () => {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
    }
    isPolling.value = false;

    // Close payment window if still open
    if (paymentWindow.value && !paymentWindow.value.closed) {
        paymentWindow.value.close();
    }
};

// Cleanup on component unmount
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

            <!-- Bricks Integration -->
            <div v-else-if="useBricks && preferenceData">
                <MercadoPagoCheckout :order-data="order" :preference-data="preferenceData" @payment-success="handlePaymentSuccess" @payment-error="handlePaymentError" @payment-pending="handlePaymentPending" @use-classic-mode="switchToClassicMode" />
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
                        <Button class="pay-button" size="large" :loading="loading" :disabled="isPolling" @click="initializePaymentPreference">
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
