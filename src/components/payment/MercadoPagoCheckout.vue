<script setup>
import { ordersApi } from '@/api/index';
import mercadoPagoService from '@/services/mercadopagoService';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast';
import { onMounted, onUnmounted, ref } from 'vue';
import PaymentFallback from './PaymentFallback.vue';

const props = defineProps({
    orderData: {
        type: Object,
        required: true
    },
    preferenceData: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['payment-success', 'payment-error', 'payment-pending', 'use-classic-mode']);

// Reactive state
const loading = ref(true);
const error = ref(null);
const processing = ref(false);
const paymentMethod = ref(null);
const cardBrick = ref(null);
const walletBrick = ref(null);
const configError = ref(false);
const initializationError = ref(null);

const toast = useToast();

// Initialize payment system
const initializePayment = async () => {
    loading.value = true;
    error.value = null;
    configError.value = false;
    initializationError.value = null;

    try {
        await mercadoPagoService.initialize();

        // Don't load payment brick automatically - wait for user selection
        // await nextTick()
        // await loadPaymentBrick()
    } catch (err) {
        console.error('Error initializing payment:', err);

        // Detectar tipo de error
        if (err.message.includes('public key is required') || err.message.includes('Invalid MercadoPago public key')) {
            configError.value = true;
        } else {
            initializationError.value = err.message || 'Error al inicializar el sistema de pago';
            error.value = initializationError.value;
        }
    } finally {
        loading.value = false;
    }
};

// Handle fallback events
const handleRetry = async () => {
    await initializePayment();
};

const handleUseClassicMode = () => {
    emit('use-classic-mode');
};

// Select payment method (unused but kept for potential future use)
// const selectPaymentMethod = async (method) => {
//     if (paymentMethod.value === method) return;

//     console.log('Selecting payment method:', method);

//     // Destroy existing bricks
//     await destroyBricks();

//     paymentMethod.value = method;

//     if (method === 'card' || method === 'wallet') {
//         // Wait for DOM update and element creation
//         await nextTick();

//         // Add a small delay to ensure DOM is fully updated
//         await new Promise((resolve) => setTimeout(resolve, 100));

//         await loadPaymentBrick();
//     }
// };

// Load payment brick based on selected method (unused but kept for potential future use)
// const loadPaymentBrick = async () => {
//     try {
//         if (paymentMethod.value === 'card') {
//             await loadCardBrick();
//         } else if (paymentMethod.value === 'wallet') {
//             await loadWalletBrick();
//         }
//     } catch (err) {
//         console.error('Error loading payment brick:', err);
//         error.value = 'Error al cargar el método de pago';
//     }
// };

// Load card payment brick (unused but kept for potential future use)
// const loadCardBrick = async () => {
//     try {
//         // Wait for DOM element to be available
//         await nextTick();

//         // Check if element exists
//         const element = document.getElementById('cardPaymentBrick');
//         if (!element) {
//             console.error('Card payment brick element not found in DOM');
//             throw new Error('Elemento de pago no encontrado. Intenta recargar la página.');
//         }

//         console.log('Creating card payment brick for element:', element);
//         console.log('Order data:', props.orderData);
//         console.log('Order total:', props.orderData.total, 'Parsed:', parseFloat(props.orderData.total));

//         cardBrick.value = await mercadoPagoService.createCardPaymentBrick('cardPaymentBrick', {
//             initialization: {
//                 amount: parseFloat(props.orderData.total),
//                 preferenceId: props.preferenceData?.preference_id || null
//             },
//             customization: {
//                 paymentMethods: {
//                     creditCard: 'all',
//                     debitCard: 'all',
//                     mercadoPago: props.preferenceData?.preference_id ? 'all' : 'wallet_purchase'
//                 }
//             },
//             callbacks: {
//                 onSubmit: async (cardFormData) => {
//                     return await processCardPayment(cardFormData);
//                 },
//                 onError: (error) => {
//                     console.error('Card brick error:', error);
//                     toast.add({
//                         severity: 'error',
//                         summary: 'Error en el pago',
//                         detail: 'Hubo un error al procesar tu tarjeta',
//                         life: 5000
//                     });
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error creating card brick:', error);
//         throw error;
//     }
// };

// Load wallet payment brick (unused but kept for potential future use)
// const loadWalletBrick = async () => {
//     try {
//         // Wait for DOM element to be available
//         await nextTick();

//         // Check if element exists
//         const element = document.getElementById('walletPaymentBrick');
//         if (!element) {
//             console.error('Wallet payment brick element not found in DOM');
//             throw new Error('Elemento de pago no encontrado. Intenta recargar la página.');
//         }

//         console.log('Creating wallet payment brick for element:', element);

//         walletBrick.value = await mercadoPagoService.createWalletBrick('walletPaymentBrick', {
//             initialization: {
//                 preferenceId: props.preferenceData.preference_id || null
//             },
//             callbacks: {
//                 onSubmit: async (walletFormData) => {
//                     return await processWalletPayment(walletFormData);
//                 },
//                 onError: (error) => {
//                     console.error('Wallet brick error:', error);
//                     toast.add({
//                         severity: 'error',
//                         summary: 'Error en el pago',
//                         detail: 'Hubo un error al procesar el pago con MercadoPago',
//                         life: 5000
//                     });
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error creating wallet brick:', error);
//         throw error;
//     }
// };

// Process card payment
const processCardPayment = async (cardFormData) => {
    processing.value = true;

    try {

        // Para Checkout Bricks, necesitamos generar una preferencia de pago y redirigir a MercadoPago
        // Usar el endpoint correcto del backend
        const response = await ordersApi.generatePaymentLink(props.orderData.id);

        const result = response.data;

        if (result && result.success) {
            toast.add({
                severity: 'success',
                summary: 'Procesando pago',
                detail: 'Procesando tu pago de forma segura',
                life: 3000
            });

            // Redirigir a MercadoPago en la misma pestaña
            const paymentUrl = result.data.init_point;
            if (paymentUrl) {
                // Guardar ID de orden para verificar el pago después
                localStorage.setItem('currentOrderId', props.orderData.id);

                // Redirigir directamente en la misma pestaña
                window.location.href = paymentUrl;
            } else {
                throw new Error('No se pudo obtener el enlace de pago');
            }

            return result.data;
        } else {
            console.error('Payment generation failed:', result);
            throw new Error(result?.message || 'Error al generar el pago - respuesta inválida del servidor');
        }
    } catch (error) {
        console.error('Error processing card payment:', error);
        console.error('Error details:', {
            response: error.response,
            data: error.response?.data,
            status: error.response?.status
        });

        let errorMessage = 'No se pudo procesar tu pago';

        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.response?.status === 500) {
            errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
        } else if (error.response?.status === 404) {
            errorMessage = 'Servicio de pago no encontrado. Contacta al soporte.';
        }

        toast.add({
            severity: 'error',
            summary: 'Error en el pago',
            detail: errorMessage,
            life: 5000
        });

        emit('payment-error', error);
        throw error;
    } finally {
        processing.value = false;
    }
};

// Process wallet payment
const processWalletPayment = async (walletFormData) => {
    processing.value = true;

    try {

        // For wallet payments, redirect to MercadoPago
        if (walletFormData.init_point) {
            localStorage.setItem('currentOrderId', props.orderData.id);
            window.location.href = walletFormData.init_point;
            return;
        }

        // Otherwise, generate payment link using backend
        const response = await ordersApi.generatePaymentLink(props.orderData.id);
        const result = response.data;

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Procesando pago',
                detail: 'Procesando tu pago de forma segura',
                life: 3000
            });

            const paymentUrl = result.data.init_point;
            if (paymentUrl) {
                localStorage.setItem('currentOrderId', props.orderData.id);
                window.location.href = paymentUrl;
            } else {
                throw new Error('No se pudo obtener el enlace de pago');
            }

            return result.data;
        } else {
            throw new Error(result.message || 'Error al generar el pago');
        }
    } catch (error) {
        console.error('Error processing wallet payment:', error);

        const errorMessage = error.response?.data?.message || error.message || 'No se pudo procesar el pago';

        toast.add({
            severity: 'error',
            summary: 'Error en el pago',
            detail: errorMessage,
            life: 5000
        });

        emit('payment-error', error);
        throw error;
    } finally {
        processing.value = false;
    }
};

// Process bank transfer
const processBankTransfer = async () => {
    processing.value = true;

    try {

        // Para transferencia bancaria, generar preferencia de pago también
        const response = await ordersApi.generatePaymentLink(props.orderData.id);
        const result = response.data;

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Pedido confirmado',
                detail: 'Redirigiendo a las opciones de pago',
                life: 3000
            });

            // Redirigir a MercadoPago donde el usuario podrá elegir transferencia bancaria
            const paymentUrl = result.data.init_point;
            if (paymentUrl) {
                localStorage.setItem('currentOrderId', props.orderData.id);
                window.location.href = paymentUrl;
            } else {
                // Si no hay URL, emitir como pago pendiente
                emit('payment-pending', result.data);
            }
        } else {
            throw new Error(result.message || 'Error al procesar el pedido');
        }
    } catch (error) {
        console.error('Error processing bank transfer:', error);

        const errorMessage = error.response?.data?.message || error.message || 'No se pudo procesar tu pedido';

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        });

        emit('payment-error', error);
    } finally {
        processing.value = false;
    }
};

// Destroy all bricks
const destroyBricks = async () => {
    if (cardBrick.value) {
        await mercadoPagoService.destroyBrick(cardBrick.value);
        cardBrick.value = null;
    }

    if (walletBrick.value) {
        await mercadoPagoService.destroyBrick(walletBrick.value);
        walletBrick.value = null;
    }
};

// Proceed to MercadoPago (simplified flow)
const proceedToMercadoPago = async () => {
    processing.value = true;

    try {

        // Generate payment link using the correct backend endpoint
        const response = await ordersApi.generatePaymentLink(props.orderData.id);

        // The response.data contains the payment data directly
        const paymentData = response.data;

        // Check if we have the required payment URLs
        if (paymentData && paymentData.init_point) {

            toast.add({
                severity: 'success',
                summary: 'Procesando pago',
                detail: 'Procesando tu pago de forma segura',
                life: 3000
            });

            // Redirect to MercadoPago using the generated preference
            const paymentUrl = paymentData.init_point;
            if (paymentUrl) {
                // Save order ID for payment verification after redirect (según la guía)
                localStorage.setItem('pendingOrderId', props.orderData.id);

                // Log the payment URL for debugging
                const returnUrl = `${window.location.origin}/payment-return`;

                window.location.href = paymentUrl;
            } else {
                throw new Error('No se pudo obtener el enlace de pago');
            }

            return paymentData;
        } else {
            console.error('Payment generation failed - missing payment URLs:', paymentData);
            throw new Error('Error al generar el pago - no se recibieron las URLs de pago');
        }
    } catch (error) {
        console.error('Error proceeding to MercadoPago:', error);
        console.error('Error details:', {
            response: error.response,
            data: error.response?.data,
            status: error.response?.status
        });

        let errorMessage = 'No se pudo procesar tu pago';

        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.response?.status === 500) {
            errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
        } else if (error.response?.status === 404) {
            errorMessage = 'Servicio de pago no encontrado. Contacta al soporte.';
        }

        toast.add({
            severity: 'error',
            summary: 'Error en el pago',
            detail: errorMessage,
            life: 5000
        });

        emit('payment-error', error);
        throw error;
    } finally {
        processing.value = false;
    }
};

// Format price
const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
};

// Lifecycle hooks
onMounted(() => {
    initializePayment();
});

onUnmounted(() => {
    destroyBricks();
});
</script>

<template>
    <div class="mercadopago-checkout">
        <!-- Loading, Error, or Config Error State -->
        <PaymentFallback v-if="loading || error || configError" :error="initializationError" :config-error="configError" @retry="handleRetry" @use-classic-mode="handleUseClassicMode" />

        <!-- Payment Options -->
        <div v-else class="space-y-6">
            <!-- Order Summary -->
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-800 mb-3">Resumen de la orden</h3>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>S/ {{ formatPrice(orderData.subtotal) }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span>Costo de envío:</span>
                        <span>S/ {{ formatPrice(orderData.shipping_cost) }}</span>
                    </div>
                    <div v-if="orderData.discount > 0" class="flex justify-between text-sm text-green-600">
                        <span>Descuento:</span>
                        <span>-S/ {{ formatPrice(orderData.discount) }}</span>
                    </div>
                    <div class="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>S/ {{ formatPrice(orderData.total) }}</span>
                    </div>
                </div>
            </div>

            <!-- Payment Method Selection -->
            <div class="space-y-4">
                <h3 class="font-semibold text-gray-800">Proceder al pago</h3>
                <p class="text-gray-600">Completa tu pago de forma segura sin salir de la aplicación</p>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="pi pi-shield text-blue-600 text-2xl mr-3"></i>
                        <div class="flex-1">
                            <h4 class="font-semibold text-blue-800">Pago seguro con MercadoPago</h4>
                            <p class="text-blue-700 text-sm mt-1">Acepta tarjetas de crédito, débito, transferencias bancarias y otros métodos de pago</p>
                        </div>
                    </div>

                    <Button label="Pagar con MercadoPago" icon="pi pi-external-link" class="mt-4 w-full bg-blue-600 border-blue-600 hover:bg-blue-700" :loading="processing" size="large" @click="proceedToMercadoPago" />
                </div>
            </div>

            <!-- Payment Method Instructions -->
            <div v-if="!paymentMethod" class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <i class="pi pi-arrow-up text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-700 mb-2">Selecciona un método de pago</h3>
                <p class="text-gray-500">Elige cómo deseas pagar tu pedido para continuar</p>
            </div>

            <!-- Payment Brick Container -->
            <div v-show="paymentMethod" class="payment-brick-container">
                <!-- Card Payment Brick -->
                <div v-if="paymentMethod === 'card'" id="cardPaymentBrick" class="mp-card-payment-brick"></div>

                <!-- Wallet Payment Brick -->
                <div v-if="paymentMethod === 'wallet'" id="walletPaymentBrick" class="mp-wallet-payment-brick"></div>

                <!-- Bank Transfer Info -->
                <div v-if="paymentMethod === 'transfer'" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-start">
                        <i class="pi pi-info-circle text-blue-500 mr-3 mt-1"></i>
                        <div>
                            <h4 class="font-medium text-blue-800">Transferencia Bancaria</h4>
                            <p class="text-blue-700 text-sm mt-1">Después de confirmar tu pedido, recibirás los datos bancarios para realizar la transferencia.</p>
                        </div>
                    </div>
                    <Button label="Confirmar Pedido" class="mt-4" :loading="processing" @click="processBankTransfer" />
                </div>
            </div>

            <!-- Processing State -->
            <div v-if="processing" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <div class="text-center">
                        <ProgressSpinner />
                        <h3 class="mt-4 font-medium">Procesando pago...</h3>
                        <p class="text-gray-600 text-sm mt-2">Por favor, no cierres esta ventana.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.mercadopago-checkout {
    max-width: 600px;
    margin: 0 auto;
}

.payment-brick-container {
    margin-top: 1.5rem;
}

.mp-card-payment-brick,
.mp-wallet-payment-brick {
    border-radius: 8px;
    overflow: hidden;
}

/* Estilos para los bricks de MercadoPago */
:deep(.mp-card-payment-brick) {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

:deep(.mp-wallet-payment-brick) {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .mercadopago-checkout {
        padding: 0 1rem;
    }
}
</style>
