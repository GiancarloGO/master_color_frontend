<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

const props = defineProps({
    error: {
        type: String,
        default: null
    },
    configError: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['retry', 'use-classic-mode']);

const retrying = ref(false);

const retry = async () => {
    retrying.value = true;
    try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular delay
        emit('retry');
    } finally {
        retrying.value = false;
    }
};

const useClassicMode = () => {
    emit('use-classic-mode');
};
</script>

<template>
    <div class="payment-fallback">
        <!-- Error State -->
        <div v-if="error" class="error-container">
            <div class="error-icon">
                <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="error-content">
                <h3 class="error-title">Error al cargar el sistema de pagos</h3>
                <p class="error-message">{{ error }}</p>
                <div class="error-actions">
                    <Button label="Reintentar" icon="pi pi-refresh" class="retry-button" :loading="retrying" @click="retry" />
                    <Button label="Usar método clásico" icon="pi pi-external-link" class="classic-button" outlined @click="useClassicMode" />
                </div>
            </div>
        </div>

        <!-- Configuration Error -->
        <div v-else-if="configError" class="config-error-container">
            <div class="config-error-icon">
                <i class="pi pi-cog"></i>
            </div>
            <div class="config-error-content">
                <h3 class="config-error-title">Configuración requerida</h3>
                <p class="config-error-message">Para usar MercadoPago, necesitas configurar las variables de entorno:</p>
                <div class="config-code">
                    <code>VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code>
                </div>
                <p class="config-help">
                    Obtén tu clave pública en:
                    <a href="https://www.mercadopago.com.pe/developers" target="_blank" rel="noopener"> MercadoPago Developers </a>
                </p>
                <Button label="Continuar sin Bricks" icon="pi pi-arrow-right" class="continue-button" @click="useClassicMode" />
            </div>
        </div>

        <!-- Loading State -->
        <div v-else class="loading-container">
            <div class="loading-spinner">
                <ProgressSpinner />
            </div>
            <div class="loading-content">
                <h3 class="loading-title">Cargando sistema de pagos...</h3>
                <p class="loading-message">Por favor espera mientras cargamos las opciones de pago.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.payment-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 2rem;
}

/* Error State */
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 500px;
    gap: 1.5rem;
}

.error-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #fef2f2;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #dc2626;
    font-size: 2rem;
}

.error-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.error-message {
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
}

.error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.retry-button {
    background: #dc2626;
    border: none;
    color: white;
}

.retry-button:hover {
    background: #b91c1c;
}

.classic-button {
    border-color: #6b7280;
    color: #6b7280;
}

.classic-button:hover {
    background: #6b7280;
    color: white;
}

/* Configuration Error */
.config-error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 600px;
    gap: 1.5rem;
}

.config-error-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #fef3c7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;
    font-size: 2rem;
}

.config-error-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.config-error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.config-error-message {
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
}

.config-code {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: #374151;
    text-align: left;
    overflow-x: auto;
}

.config-help {
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
}

.config-help a {
    color: #3b82f6;
    text-decoration: none;
}

.config-help a:hover {
    text-decoration: underline;
}

.continue-button {
    background: #3b82f6;
    border: none;
    color: white;
}

.continue-button:hover {
    background: #2563eb;
}

/* Loading State */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
}

.loading-spinner {
    margin-bottom: 1rem;
}

.loading-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.loading-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.loading-message {
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
}

/* Responsive */
@media (max-width: 640px) {
    .payment-fallback {
        padding: 1rem;
        min-height: 250px;
    }

    .error-actions {
        flex-direction: column;
    }

    .error-title,
    .config-error-title {
        font-size: 1.25rem;
    }

    .config-code {
        font-size: 0.75rem;
        padding: 0.75rem;
    }
}
</style>
