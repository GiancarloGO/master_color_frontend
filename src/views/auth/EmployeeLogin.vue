<script setup>
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

// Estado
const email = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);
const emailError = ref('');
const passwordError = ref('');

// Estado para recuperación de contraseña
const showForgotPasswordDialog = ref(false);
const forgotPasswordEmail = ref('');
const forgotPasswordLoading = ref(false);
const forgotPasswordEmailError = ref('');
const forgotPasswordSuccess = ref(false);

// Métodos
const validateForm = () => {
    let isValid = true;
    emailError.value = '';
    passwordError.value = '';

    if (!email.value) {
        emailError.value = 'El correo electrónico es requerido';
        isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
        emailError.value = 'Ingrese un correo electrónico válido';
        isValid = false;
    }

    if (!password.value) {
        passwordError.value = 'La contraseña es requerida';
        isValid = false;
    } else if (password.value.length < 6) {
        passwordError.value = 'La contraseña debe tener al menos 6 caracteres';
        isValid = false;
    }

    return isValid;
};

const login = async () => {
    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'Por favor corrige los errores en el formulario',
            life: 3000
        });
        return;
    }

    loading.value = true;

    let payload = {
        email: email.value,
        password: password.value
    };

    await authStore.login(payload, 'user'); // <-- Cambiado a 'user'

    if (authStore.success) {
        toast.add({ severity: 'success', summary: 'Inicio de sesión exitoso', detail: 'Bienvenido, empleado.', life: 3000 });
        router.push('/profile');
    } else {
        if (authStore.validationErrors && authStore.validationErrors.length > 0) {
            authStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: authStore.message, life: 3000 });
        }
    }

    loading.value = false;
};

const goToClientLogin = () => {
    router.push('/auth/login');
};

const goToStore = () => {
    router.push('/');
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

// Métodos para recuperación de contraseña
const openForgotPasswordDialog = () => {
    forgotPasswordEmail.value = email.value; // Pre-llenar con el email del login si existe
    forgotPasswordEmailError.value = '';
    forgotPasswordSuccess.value = false;
    showForgotPasswordDialog.value = true;
};

const closeForgotPasswordDialog = () => {
    showForgotPasswordDialog.value = false;
};

const validateForgotPasswordEmail = () => {
    forgotPasswordEmailError.value = '';

    if (!forgotPasswordEmail.value) {
        forgotPasswordEmailError.value = 'El correo electrónico es requerido';
        return false;
    } else if (!/^\S+@\S+\.\S+$/.test(forgotPasswordEmail.value)) {
        forgotPasswordEmailError.value = 'Ingrese un correo electrónico válido';
        return false;
    }

    return true;
};

const submitForgotPassword = async () => {
    if (!validateForgotPasswordEmail()) {
        return;
    }

    forgotPasswordLoading.value = true;

    try {
        const result = await authStore.forgotPassword({ email: forgotPasswordEmail.value });

        if (result.success) {
            forgotPasswordSuccess.value = true;
            toast.add({
                severity: 'success',
                summary: 'Correo enviado',
                detail: 'Hemos enviado un enlace de recuperación a tu correo electrónico.',
                life: 5000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'No se pudo enviar el correo de recuperación.',
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ocurrió un error al procesar tu solicitud.',
            life: 5000
        });
    } finally {
        forgotPasswordLoading.value = false;
    }
};
</script>

<template>
    <!-- Diálogo de recuperación de contraseña (idéntico) -->
    <Dialog v-model:visible="showForgotPasswordDialog" modal header="Recuperar contraseña" :style="{ width: '450px' }" :closable="!forgotPasswordLoading">
        <div class="password-recovery-dialog">
            <div v-if="!forgotPasswordSuccess" class="p-2">
                <p class="text-gray-700 mb-4">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                <div class="mb-4">
                    <label for="forgotPasswordEmail" class="block text-sm font-bold text-gray-800 mb-2">Correo electrónico</label>
                    <span class="p-input-icon-left w-full">
                        <IconField>
                            <InputIcon class="pi pi-envelope" />
                            <InputText id="forgotPasswordEmail" v-model="forgotPasswordEmail" type="email" class="w-full" placeholder="correo@ejemplo.com" :disabled="forgotPasswordLoading" :class="{ 'p-invalid': forgotPasswordEmailError }" />
                        </IconField>
                    </span>
                    <small v-if="forgotPasswordEmailError" class="p-error block mt-1">
                        {{ forgotPasswordEmailError }}
                    </small>
                </div>
            </div>
            <div v-else class="p-2 text-center">
                <div class="mb-4 success-animation">
                    <i class="pi pi-check-circle text-green-500 text-5xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">¡Correo enviado!</h3>
                <p class="text-gray-700 mb-4">Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada y sigue las instrucciones.</p>
            </div>
            <div class="flex justify-end pt-4">
                <Button v-if="!forgotPasswordSuccess" label="Cancelar" icon="pi pi-times" class="p-button-outlined p-button-secondary mr-2" :disabled="forgotPasswordLoading" @click="closeForgotPasswordDialog" />
                <Button v-if="!forgotPasswordSuccess" label="Enviar enlace" icon="pi pi-envelope" class="p-button-primary" :loading="forgotPasswordLoading" @click="submitForgotPassword" />
                <Button v-else label="Cerrar" icon="pi pi-check" class="p-button-primary" @click="closeForgotPasswordDialog" />
            </div>
        </div>
    </Dialog>

    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-1 sm:p-2 md:p-4 py-4 sm:py-6 md:py-8">
        <div class="w-full max-w-6xl">
            <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div class="flex flex-col lg:flex-row min-h-[450px] sm:min-h-[500px] md:min-h-[600px] max-h-none lg:max-h-screen">
                    <!-- Panel lateral izquierdo -->
                    <div class="lg:w-1/2 bg-blue-700 p-4 sm:p-6 md:p-8 lg:p-12 text-white relative overflow-hidden min-h-[350px] sm:min-h-[380px] md:min-h-[400px] lg:min-h-0">
                        <!-- Elementos decorativos de fondo -->
                        <div class="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full -translate-y-32 translate-x-32"></div>
                        <div class="absolute bottom-0 left-0 w-48 h-48 bg-blue-900 opacity-20 rounded-full translate-y-24 -translate-x-24"></div>
                        <div class="relative z-10 h-full flex flex-col justify-center py-2">
                            <!-- Logo y título -->
                            <div class="text-center lg:text-left mb-8">
                                <div class="flex items-center justify-center lg:justify-start mb-6">
                                    <div class="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                                        <img src="/mc.png" alt="Master Color Logo" class="w-16 h-16 object-contain" />
                                    </div>
                                </div>
                                <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-sm">Acceso Empleados</h1>
                                <p class="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-50 font-light leading-relaxed">Solo personal autorizado</p>
                            </div>
                            <!-- Características -->
                            <div class="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
                                <div class="flex items-center space-x-4">
                                    <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                        <i class="pi pi-users text-blue-700 text-lg font-bold"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-lg text-white">Acceso Interno</h3>
                                        <p class="text-blue-100 text-sm font-medium">Solo empleados de Master Color</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-4">
                                    <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                        <i class="pi pi-id-card text-blue-700 text-lg font-bold"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-lg text-white">Identificación Segura</h3>
                                        <p class="text-blue-100 text-sm font-medium">Tus datos están protegidos</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-4">
                                    <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                        <i class="pi pi-cog text-blue-700 text-lg font-bold"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-lg text-white">Herramientas de Gestión</h3>
                                        <p class="text-blue-100 text-sm font-medium">Acceso al dashboard administrativo</p>
                                    </div>
                                </div>
                            </div>
                            <!-- Call to action -->
                            <div class="mt-3 sm:mt-4 p-2 sm:p-3 md:p-4">
                                <Button
                                    label="Volver a Login Cliente"
                                    icon="pi pi-user"
                                    class="w-full p-button-filled bg-gray-200 border-gray-200 text-blue-900 font-bold text-lg hover:bg-gray-100 hover:border-gray-300 hover:text-blue-800 transition-all duration-300 shadow-lg"
                                    @click="goToClientLogin"
                                />
                            </div>
                        </div>
                    </div>
                    <!-- Panel de login -->
                    <div class="lg:w-1/2 p-4 sm:p-6 md:p-8 lg:p-12 bg-white overflow-y-auto max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] lg:max-h-screen">
                        <div class="max-w-md mx-auto">
                            <!-- Header del formulario -->
                            <div class="text-center mb-4 sm:mb-6 md:mb-8">
                                <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Bienvenido, Empleado</h2>
                                <p class="text-gray-700 text-base sm:text-lg font-medium">Accede con tus credenciales internas</p>
                            </div>
                            <form class="space-y-4 sm:space-y-5 md:space-y-6" @submit.prevent="login">
                                <!-- Campo de email -->
                                <div>
                                    <label for="email" class="block text-sm font-bold text-gray-800 mb-3">Correo Electrónico</label>
                                    <div class="relative">
                                        <IconField>
                                            <InputIcon class="pi pi-envelope" />
                                            <InputText id="email" v-model="email" type="email" placeholder="empleado@email.com" class="w-full text-gray-900 font-medium" :class="emailError ? 'p-invalid' : ''" @input="emailError = ''" />
                                        </IconField>
                                    </div>
                                    <small v-if="emailError" class="p-error text-red-700 text-sm mt-2 block font-semibold">
                                        {{ emailError }}
                                    </small>
                                </div>
                                <!-- Campo de contraseña -->
                                <div>
                                    <label for="password" class="block text-sm font-bold text-gray-800 mb-3">Contraseña</label>
                                    <div class="relative">
                                        <IconField>
                                            <InputIcon class="pi pi-lock" />
                                            <InputText
                                                id="password"
                                                v-model="password"
                                                :type="showPassword ? 'text' : 'password'"
                                                placeholder="Tu contraseña"
                                                class="w-full text-gray-900 font-medium"
                                                :class="passwordError ? 'p-invalid' : ''"
                                                @input="passwordError = ''"
                                            />
                                            <i
                                                :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors text-lg"
                                                @click="togglePasswordVisibility"
                                            ></i>
                                        </IconField>
                                    </div>
                                    <small v-if="passwordError" class="p-error text-red-700 text-sm mt-2 block font-semibold">
                                        {{ passwordError }}
                                    </small>
                                </div>
                                <!-- Checkbox recordarme -->
                                <div class="flex items-center justify-between mt-2 mb-1">
                                    <a href="#" class="text-sm text-blue-700 hover:text-blue-800 font-semibold" @click.prevent="openForgotPasswordDialog">¿Olvidaste tu contraseña?</a>
                                </div>
                                <!-- Botón de login -->
                                <Button
                                    type="submit"
                                    label="Iniciar Sesión"
                                    icon="pi pi-sign-in"
                                    class="w-full p-3 text-lg font-bold bg-blue-700 border-blue-700 hover:bg-blue-800 hover:border-blue-800 transition-all duration-300 shadow-lg"
                                    :loading="loading"
                                />
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Toast para notificaciones -->
        <Toast position="top-right" />
    </div>
</template>

<style lang="scss" scoped>
/* Reutiliza los mismos estilos responsivos y de diálogo que Login.vue */
.password-recovery-dialog {
    .success-animation {
        animation: scaleIn 0.5s ease-out;
        margin: 1.5rem 0;
        display: flex;
        justify-content: center;
        align-items: center;

        i {
            font-size: 4rem;
            color: var(--primary-color, #4f46e5);
            animation: pulse 2s infinite;
        }
    }
}

@keyframes scaleIn {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
    }
}

@media (max-width: 400px) {
    .min-h-screen {
        padding: 0.25rem 0.125rem;
    }

    :deep(.p-inputtext) {
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
    }

    :deep(.p-input-icon-left > i:first-of-type) {
        left: 0.875rem;
        font-size: 0.875rem;
    }

    :deep(.p-input-icon-left > .p-inputtext) {
        padding-left: 2.75rem;
    }

    :deep(.p-button) {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        border-radius: 0.5rem;
    }
}

@media (min-width: 401px) and (max-width: 640px) {
    :deep(.p-inputtext) {
        padding: 0.875rem 1rem;
        border-radius: 0.625rem;
        font-size: 0.9375rem;
    }

    :deep(.p-button) {
        padding: 0.875rem 1.25rem;
        font-size: 0.9375rem;
    }
}

:deep(.p-inputtext) {
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    border: 2px solid #d1d5db;
    font-size: 1rem;
    font-weight: 500;
    color: #111827;
    background-color: #ffffff;
    transition: all 0.3s ease;
}

:deep(.p-inputtext:focus) {
    border-color: #1d4ed8;
    box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.15);
    background-color: #ffffff;
}

:deep(.p-inputtext.p-invalid) {
    border-color: #dc2626;
    box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.15);
    background-color: #fef2f2;
}

:deep(.p-input-icon-left > i:first-of-type) {
    left: 1.25rem;
    color: #6b7280;
    font-weight: bold;
}

:deep(.p-input-icon-left > .p-inputtext) {
    padding-left: 3.5rem;
}

:deep(.p-input-icon-right > .p-inputtext) {
    padding-right: 3.5rem;
}

:deep(.p-button) {
    border-radius: 0.75rem;
    font-weight: 700;
    padding: 1rem 1.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    border-width: 2px;
}

:deep(.p-button:not(.p-button-outlined):not(.p-button-text)) {
    background: #1d4ed8;
    border-color: #1d4ed8;
    color: #ffffff;
}

:deep(.p-button:not(.p-button-outlined):not(.p-button-text):hover) {
    background: #1e40af;
    border-color: #1e40af;
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(29, 78, 216, 0.4);
}

:deep(.p-button-outlined) {
    background: transparent;
    border-width: 2px;
}

:deep(.p-checkbox) {
    width: 1.25rem;
    height: 1.25rem;
}

:deep(.p-checkbox .p-checkbox-box) {
    border-width: 2px;
    border-color: #6b7280;
}

:deep(.p-checkbox.p-checkbox-checked .p-checkbox-box) {
    background-color: #1d4ed8;
    border-color: #1d4ed8;
}

:deep(.p-toast .p-toast-message) {
    border-radius: 0.75rem;
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.15),
        0 10px 10px -5px rgba(0, 0, 0, 0.08);
    border-width: 1px;
}

:deep(.p-toast .p-toast-message-success) {
    background-color: #dcfce7;
    border-color: #16a34a;
}

:deep(.p-toast .p-toast-message-error) {
    background-color: #fef2f2;
    border-color: #dc2626;
}

@media (hover: none) and (pointer: coarse) {
    .overflow-y-auto::-webkit-scrollbar {
        width: 0;
    }

    .overflow-y-auto {
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
    }

    :deep(.p-button:hover) {
        transform: none;
        box-shadow: none;
    }
}

.p-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.p-inputtext {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.p-button-outlined:hover) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

:deep(.p-inputtext::placeholder) {
    color: #9ca3af;
    font-weight: 500;
}

:deep(.p-button:hover) {
    font-weight: 700;
}

@media (max-width: 480px) {
    :deep(.p-toast .p-toast-message) {
        margin: 0.25rem;
        padding: 0.5rem;
        width: calc(100vw - 2rem);
        max-width: 100%;
    }

    :deep(.p-toast .p-toast-message-content) {
        padding: 0.5rem;
        align-items: flex-start;
    }
}

:deep(.p-button:focus) {
    box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.2);
}

:deep(.p-checkbox:focus .p-checkbox-box) {
    box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.2);
}
</style>
