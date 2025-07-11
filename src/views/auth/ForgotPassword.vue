<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers } from '@vuelidate/validators';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const authStore = useAuthStore();
const router = useRouter();

// Estado
const emailValue = ref('');
const loading = ref(false);
const success = ref(false);
const error = ref(false);
const errorMessage = ref('');

// Reglas de validación
const rules = {
    emailValue: {
        required: helpers.withMessage('El correo electrónico es requerido', required),
        email: helpers.withMessage('Ingrese un correo electrónico válido', email)
    }
};

const v$ = useVuelidate(rules, { emailValue });

const handleSubmit = async () => {
    const isFormValid = await v$.value.$validate();
    if (!isFormValid) return;

    loading.value = true;
    error.value = false;
    success.value = false;

    try {
        const response = await authStore.forgotPassword({ email: emailValue.value });
        if (response.success) {
            success.value = true;
            emailValue.value = '';
            v$.value.$reset();
        } else {
            error.value = true;
            errorMessage.value = response.message || 'Ocurrió un error al procesar tu solicitud.';
        }
    } catch (err) {
        error.value = true;
        errorMessage.value = err.message || 'Ocurrió un error al procesar tu solicitud.';
    } finally {
        loading.value = false;
    }
};

const goToLogin = () => {
    router.push({ name: 'login' });
};
</script>

<template>
    <div class="forgot-password-container">
        <div class="forgot-password-card">
            <div class="text-center mb-5">
                <div class="text-900 text-3xl font-bold mb-3">¿Olvidaste tu contraseña?</div>
                <span class="text-600 font-medium">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</span>
            </div>

            <div>
                <div v-if="success" class="success-message">
                    <div class="flex align-items-center">
                        <i class="pi pi-check-circle success-icon mr-3"></i>
                        <div>
                            <div class="success-title">Correo enviado</div>
                            <div class="success-text">Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada.</div>
                        </div>
                    </div>
                    <div class="mt-4 flex justify-content-center">
                        <Button label="Volver al inicio de sesión" icon="pi pi-sign-in" class="p-button-success" @click="goToLogin" />
                    </div>
                </div>

                <div v-if="error" class="error-message">
                    <div class="flex align-items-center">
                        <i class="pi pi-times-circle error-icon mr-3"></i>
                        <div>
                            <div class="error-title">Error</div>
                            <div class="error-text">{{ errorMessage }}</div>
                        </div>
                    </div>
                </div>

                <form v-if="!success" class="forgot-form" @submit.prevent="handleSubmit">
                    <div class="field mb-4">
                        <label for="email" class="form-label">Correo electrónico</label>
                        <span class="p-input-icon-left w-full">
                            <IconField>
                                <InputIcon class="pi pi-envelope" />
                                <InputText id="email" v-model="emailValue" type="email" class="w-full" :class="{ 'p-invalid': v$.emailValue.$invalid && v$.emailValue.$dirty }" placeholder="Ingresa tu correo electrónico" />
                            </IconField>
                        </span>
                        <small v-if="v$.emailValue.$invalid && v$.emailValue.$dirty" class="p-error block mt-1">
                            {{ v$.emailValue.$errors[0].$message }}
                        </small>
                    </div>

                    <div class="form-actions">
                        <Button type="submit" class="p-button-primary w-full mb-4" :loading="loading" :disabled="loading">
                            <template #loading>
                                <i class="pi pi-spin pi-spinner mr-2"></i>
                                <span>Enviando...</span>
                            </template>
                            <i v-if="!loading" class="pi pi-envelope mr-2"></i>
                            <span>Enviar enlace de recuperación</span>
                        </Button>
                        <div class="flex align-items-center justify-content-center">
                            <a class="back-link" @click="goToLogin">Volver al inicio de sesión</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.forgot-password-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 1rem;
    background-color: var(--surface-ground, #f8f9fa);
}

.forgot-password-card {
    background-color: var(--surface-card, #ffffff);
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 2rem;
    width: 100%;
    max-width: 550px;
    border: 1px solid var(--surface-border, #dee2e6);
    transition: all 0.3s ease;
}

.form-label {
    display: block;
    font-weight: 600;
    color: var(--text-color, #343a40);
    margin-bottom: 0.5rem;
    font-size: 0.9375rem;
}

.success-message {
    background-color: #ecfdf5;
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    border-left: 4px solid #10b981;
    animation: fadeIn 0.5s ease-out;
}

.success-icon {
    color: #10b981;
    font-size: 1.75rem;
}

.success-title {
    color: #064e3b;
    font-weight: 700;
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
}

.success-text {
    color: #065f46;
    font-size: 0.9375rem;
}

.error-message {
    background-color: #fef2f2;
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    border-left: 4px solid #ef4444;
    animation: fadeIn 0.5s ease-out;
}

.error-icon {
    color: #ef4444;
    font-size: 1.75rem;
}

.error-title {
    color: #7f1d1d;
    font-weight: 700;
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
}

.error-text {
    color: #991b1b;
    font-size: 0.9375rem;
}

.form-actions {
    margin-top: 2rem;
}

.back-link {
    color: var(--primary-color, #4f46e5);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.2s ease;
    font-size: 0.9375rem;

    &:hover {
        color: var(--primary-600, #4338ca);
        text-decoration: underline;
    }
}

.forgot-form {
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .forgot-password-card {
        padding: 1.5rem;
    }
}
</style>
