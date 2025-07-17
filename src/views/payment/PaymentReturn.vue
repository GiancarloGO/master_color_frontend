<script setup>
import { ordersApi } from '@/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const status = ref('processing'); // processing, success, error, pending
const message = ref('Procesando la información de tu pago. Por favor, espera...');
const icon = ref('pi pi-spin pi-spinner');

// Helper function to get order_id from various sources
const getOrderId = () => {
    // Try to get from query params first (external_reference from MercadoPago)
    const { external_reference } = route.query;
    if (external_reference) return external_reference;

    // Try to get from localStorage (if stored during checkout)
    const storedOrderId = localStorage.getItem('currentOrderId');
    if (storedOrderId) return storedOrderId;

    // Try to get from sessionStorage
    const sessionOrderId = sessionStorage.getItem('currentOrderId');
    if (sessionOrderId) return sessionOrderId;

    return null;
};

// Helper function to start polling for payment status
const startPolling = (orderId, maxAttempts = 10, intervalMs = 5000) => {
    let attempts = 0;

    const poll = async () => {
        attempts++;
        try {
            const response = await ordersApi.getPaymentStatus(orderId);

            const processed = response.data.payment_status === 'approved' || response.data.order_status === 'pagado';

            if (processed) {
                // Payment was processed successfully
                status.value = 'success';
                icon.value = 'pi pi-check-circle';
                message.value = '¡Tu pago ha sido procesado correctamente!';

                toast.add({
                    severity: 'success',
                    summary: 'Pago Procesado',
                    detail: 'Tu pedido ha sido confirmado y el stock actualizado.',
                    life: 8000
                });

                setTimeout(() => {
                    router.push(`/orders?highlight=${orderId}`);
                }, 3000);
                return;
            }

            // If not processed and we haven't reached max attempts, continue polling
            if (attempts < maxAttempts) {
                setTimeout(poll, intervalMs);
            } else {
                // Max attempts reached, show pending status
                status.value = 'pending';
                icon.value = 'pi pi-clock';
                message.value = 'El procesamiento del pago está tomando más tiempo del esperado.';

                toast.add({
                    severity: 'warn',
                    summary: 'Procesamiento Pendiente',
                    detail: 'Te notificaremos cuando el pago sea confirmado.',
                    life: 8000
                });

                setTimeout(() => {
                    router.push(`/orders?highlight=${orderId}`);
                }, 4000);
            }
        } catch (error) {
            console.error('Error during polling:', error);
            if (attempts >= maxAttempts) {
                status.value = 'error';
                icon.value = 'pi pi-exclamation-triangle';
                message.value = 'Error al verificar el estado del pago.';

                toast.add({
                    severity: 'error',
                    summary: 'Error de Verificación',
                    detail: 'No pudimos verificar el estado del pago. Contacta soporte si el problema persiste.',
                    life: 8000
                });

                setTimeout(() => {
                    router.push('/orders');
                }, 4000);
            } else {
                setTimeout(poll, intervalMs);
            }
        }
    };

    poll();
};

onMounted(async () => {
    // Get payment_id from MercadoPago redirect
    const { payment_id } = route.query;

    // Get order_id from available sources
    const orderId = getOrderId();

    console.log('Payment return params:', route.params);
    console.log('Payment return query:', route.query);
    console.log('Detected order_id:', orderId);

    if (!payment_id) {
        status.value = 'error';
        icon.value = 'pi pi-exclamation-triangle';
        message.value = 'No se recibió información del pago.';

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Faltan parámetros de pago requeridos.',
            life: 8000
        });

        setTimeout(() => {
            router.push('/');
        }, 4000);
        return;
    }

    if (!orderId) {
        status.value = 'error';
        icon.value = 'pi pi-exclamation-triangle';
        message.value = 'No se pudo identificar el pedido.';

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se encontró información del pedido.',
            life: 8000
        });

        setTimeout(() => {
            router.push('/orders');
        }, 4000);
        return;
    }

    try {
        // Call backend to process payment return
        const response = await ordersApi.getPaymentStatus(orderId);

        const processed = response.data.payment_status === 'approved' || response.data.order_status === 'pagado';

        if (processed) {
            // Payment was processed immediately
            status.value = 'success';
            icon.value = 'pi pi-check-circle';
            message.value = '¡Tu pago ha sido procesado correctamente!';

            toast.add({
                severity: 'success',
                summary: 'Pago Exitoso',
                detail: 'Tu pedido ha sido confirmado y el stock actualizado.',
                life: 8000
            });

            // Clean up stored order ID
            localStorage.removeItem('currentOrderId');
            sessionStorage.removeItem('currentOrderId');

            setTimeout(() => {
                router.push(`/orders?highlight=${orderId}`);
            }, 3000);
        } else {
            // Payment no aprobado aún, iniciar polling con el intervalo recomendado
            const nextInterval = (response.data.polling?.recommended_interval || 5) * 1000;
            message.value = 'Verificando el estado de tu pago...';
            startPolling(orderId, 20, nextInterval);
        }
    } catch (error) {
        console.error('Error processing payment return:', error);

        // If backend call fails, start polling as fallback
        if (error.response?.status >= 500) {
            message.value = 'Verificando el estado de tu pago...';
            startPolling(orderId);
        } else {
            status.value = 'error';
            icon.value = 'pi pi-exclamation-triangle';
            message.value = 'Error al procesar la información del pago.';

            toast.add({
                severity: 'error',
                summary: 'Error de Procesamiento',
                detail: 'No pudimos procesar la información del pago. Contacta soporte.',
                life: 8000
            });

            setTimeout(() => {
                router.push('/orders');
            }, 4000);
        }
    }
});
</script>

<template>
    <div class="payment-return-container">
        <div class="card">
            <div class="status-icon" :class="`status-${status}`">
                <i :class="icon"></i>
            </div>
            <h2 class="status-title">{{ message }}</h2>
            <p class="status-description">
                Serás redirigido en unos segundos. Si no eres redirigido, haz clic
                <router-link to="/" class="text-blue-500 hover:underline">aquí</router-link>.
            </p>
        </div>
    </div>
</template>

<style scoped>
.payment-return-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    background-color: #f8fafc;
}

.card {
    background: white;
    padding: 3rem 4rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 600px;
}

.status-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
}

.status-icon .pi-spin {
    animation: pi-spin 1.5s infinite linear;
}

.status-success {
    color: #10b981;
}
.status-error {
    color: #ef4444;
}
.status-pending {
    color: #f59e0b;
}
.status-processing {
    color: #3b82f6;
}

.status-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.75rem;
}

.status-description {
    font-size: 1rem;
    color: #6b7280;
}
</style>
