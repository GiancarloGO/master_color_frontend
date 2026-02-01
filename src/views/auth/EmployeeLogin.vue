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
        const result = await authStore.forgotPassword({ email: forgotPasswordEmail.value }, 'user');

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

    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 py-6">
        <div class="w-full max-w-6xl">
            <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div class="flex flex-col lg:flex-row min-h-[500px]">
                    <!-- Panel lateral izquierdo -->
                    <div class="lg:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 p-8 lg:p-12 text-white relative overflow-hidden hidden lg:block">
                        <!-- Elementos decorativos de fondo -->
                        <div class="absolute top-0 right-0 w-72 h-72 bg-blue-600 opacity-20 rounded-full -translate-y-32 translate-x-32"></div>
                        <div class="absolute bottom-0 left-0 w-56 h-56 bg-blue-950 opacity-20 rounded-full translate-y-24 -translate-x-24"></div>
                        <div class="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500 opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

                        <div class="relative z-10 h-full flex flex-col justify-between py-4">
                            <!-- Logo y título -->
                            <div class="text-left">
                                <div class="flex items-center mb-6">
                                    <div class="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-xl">
                                        <img src="/mc.png" alt="Master Color Logo" class="w-14 h-14 object-contain" />
                                    </div>
                                </div>
                                <h1 class="text-4xl font-bold mb-3 text-white">Acceso Empleados</h1>
                                <p class="text-xl text-blue-100 font-light">Panel administrativo - Solo personal autorizado</p>
                            </div>
                            <!-- Características -->
                            <div class="space-y-5 my-6">
                                <div class="flex items-start space-x-4 group">
                                    <div class="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:bg-white/20 transition-all duration-300">
                                        <i class="pi pi-users text-white text-lg"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-semibold text-lg text-white mb-1">Acceso Interno</h3>
                                        <p class="text-blue-100 text-sm">Solo empleados de Master Color</p>
                                    </div>
                                </div>

                                <div class="flex items-start space-x-4 group">
                                    <div class="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:bg-white/20 transition-all duration-300">
                                        <i class="pi pi-shield text-white text-lg"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-semibold text-lg text-white mb-1">Identificación Segura</h3>
                                        <p class="text-blue-100 text-sm">Tus datos están protegidos</p>
                                    </div>
                                </div>

                                <div class="flex items-start space-x-4 group">
                                    <div class="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:bg-white/20 transition-all duration-300">
                                        <i class="pi pi-chart-line text-white text-lg"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-semibold text-lg text-white mb-1">Panel de Control</h3>
                                        <p class="text-blue-100 text-sm">Herramientas administrativas completas</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Call to action -->
                            <div class="mt-6">
                                <Button
                                    label="Login de Clientes"
                                    icon="pi pi-user"
                                    class="w-full bg-white text-blue-700 border-white font-bold text-base py-3 hover:bg-blue-50 hover:border-blue-50 transition-all duration-300 shadow-lg"
                                    @click="goToClientLogin"
                                />
                            </div>
                        </div>
                    </div>
                    <!-- Panel de login -->
                    <div class="lg:w-1/2 w-full p-6 sm:p-8 lg:p-12 bg-white flex items-center">
                        <div class="w-full max-w-md mx-auto">
                            <!-- Logo móvil -->
                            <div class="lg:hidden text-center mb-8">
                                <div class="inline-flex items-center justify-center mb-4">
                                    <div class="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                                        <img src="/mc.png" alt="Master Color Logo" class="w-12 h-12 object-contain" />
                                    </div>
                                </div>
                                <h1 class="text-2xl font-bold text-gray-900 mb-1">Acceso Empleados</h1>
                                <p class="text-sm text-gray-600">Panel Administrativo</p>
                            </div>

                            <!-- Header del formulario -->
                            <div class="text-center mb-8">
                                <h2 class="text-3xl font-bold text-gray-900 mb-2">Bienvenido, Empleados</h2>
                                <p class="text-gray-600 text-base">Accede con tus credenciales internas</p>
                            </div>

                            <form class="space-y-5" @submit.prevent="login">
                                <!-- Campo de email -->
                                <div>
                                    <label for="email" class="block text-sm font-semibold text-gray-800 mb-2">Correo Electrónico</label>
                                    <div class="relative">
                                        <IconField>
                                            <InputIcon class="pi pi-envelope" />
                                            <InputText id="email" v-model="email" type="email" placeholder="empleado@mastercolor.com" class="w-full" :class="emailError ? 'p-invalid' : ''" @input="emailError = ''" />
                                        </IconField>
                                    </div>
                                    <small v-if="emailError" class="p-error text-red-600 text-xs mt-1 block">
                                        {{ emailError }}
                                    </small>
                                </div>

                                <!-- Campo de contraseña -->
                                <div>
                                    <label for="password" class="block text-sm font-semibold text-gray-800 mb-2">Contraseña</label>
                                    <div class="relative">
                                        <IconField>
                                            <InputIcon class="pi pi-lock" />
                                            <InputText
                                                id="password"
                                                v-model="password"
                                                :type="showPassword ? 'text' : 'password'"
                                                placeholder="Tu contraseña"
                                                class="w-full pr-12"
                                                :class="passwordError ? 'p-invalid' : ''"
                                                @input="passwordError = ''"
                                            />
                                            <i
                                                :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors z-10"
                                                @click="togglePasswordVisibility"
                                            ></i>
                                        </IconField>
                                    </div>
                                    <small v-if="passwordError" class="p-error text-red-600 text-xs mt-1 block">
                                        {{ passwordError }}
                                    </small>
                                </div>

                                <!-- Olvidaste contraseña -->
                                <div class="flex items-center justify-end">
                                    <a href="#" class="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors" @click.prevent="openForgotPasswordDialog">¿Olvidaste tu contraseña?</a>
                                </div>

                                <!-- Botón de login -->
                                <Button
                                    type="submit"
                                    label="Acceder al Sistema"
                                    icon="pi pi-sign-in"
                                    class="w-full py-3 text-base font-semibold bg-blue-700 border-blue-700 hover:bg-blue-800 hover:border-blue-800 transition-all duration-300 shadow-md"
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

/* Estilos responsivos para móviles */
@media (max-width: 640px) {
    :deep(.p-inputtext) {
        padding: 0.75rem 0.875rem;
        font-size: 0.875rem;
    }

    :deep(.p-input-icon-left > i:first-of-type) {
        left: 0.875rem;
        font-size: 0.875rem;
    }

    :deep(.p-input-icon-left > .p-inputtext) {
        padding-left: 2.5rem;
    }

    :deep(.p-button) {
        font-size: 0.875rem;
    }
}

:deep(.p-inputtext) {
    padding: 0.875rem 1rem;
    border-radius: 0.625rem;
    border: 1.5px solid #e5e7eb;
    font-size: 0.9375rem;
    font-weight: 400;
    color: #111827;
    background-color: #ffffff;
    transition: all 0.2s ease;
}

:deep(.p-inputtext:focus) {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    background-color: #ffffff;
    outline: none;
}

:deep(.p-inputtext.p-invalid) {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    background-color: #fef2f2;
}

:deep(.p-input-icon-left > i:first-of-type) {
    left: 1rem;
    color: #9ca3af;
    font-size: 0.9rem;
}

:deep(.p-input-icon-left > .p-inputtext) {
    padding-left: 2.75rem;
}

:deep(.p-input-icon-right > .p-inputtext) {
    padding-right: 3rem;
}

:deep(.p-button) {
    border-radius: 0.625rem;
    font-weight: 600;
    transition: all 0.2s ease;
    border-width: 1.5px;
}

:deep(.p-button:not(.p-button-outlined):not(.p-button-text)) {
    background: #1d4ed8;
    border-color: #1d4ed8;
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

:deep(.p-button:not(.p-button-outlined):not(.p-button-text):hover) {
    background: #1e3a8a;
    border-color: #1e3a8a;
    box-shadow: 0 4px 12px rgba(29, 78, 216, 0.3);
}

:deep(.p-button-outlined) {
    background: transparent;
    border-width: 1.5px;
}

:deep(.p-button-outlined:hover) {
    background: rgba(29, 78, 216, 0.05);
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
    border-radius: 0.625rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

:deep(.p-inputtext::placeholder) {
    color: #9ca3af;
    font-weight: 400;
}

/* Toast responsivo */
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

/* Estados de focus mejorados */
:deep(.p-button:focus) {
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
    outline: none;
}
</style>
