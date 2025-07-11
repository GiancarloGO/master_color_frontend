<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/auth';
import InputText from 'primevue/inputtext';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const loading = ref(true);
const success = ref(false);
const errorMessage = ref('Ha ocurrido un error al verificar tu correo electrónico. Por favor, intenta nuevamente.');
const resendLoading = ref(false);
const verificationSent = ref(false);
const userEmail = ref('');

const verifyEmail = async () => {
    loading.value = true;

    const token = route.query.token;

    if (!token) {
        errorMessage.value = 'No se encontró el token de verificación en la URL.';
        loading.value = false;
        success.value = false;
        return;
    }

    try {
        const result = await authStore.verifyEmail({ token });

        if (result.success) {
            success.value = true;
            toast.add({
                severity: 'success',
                summary: 'Verificación exitosa',
                detail: 'Tu correo electrónico ha sido verificado correctamente.',
                life: 5000
            });
        } else {
            success.value = false;
            errorMessage.value = result.message || 'Error al verificar el correo electrónico. El token podría ser inválido o haber expirado.';
            toast.add({
                severity: 'error',
                summary: 'Error de verificación',
                detail: errorMessage.value,
                life: 5000
            });
        }
    } catch (error) {
        success.value = false;
        errorMessage.value = 'Ha ocurrido un error al verificar tu correo electrónico. Por favor, intenta nuevamente.';
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage.value,
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const goToDashboard = () => {
    router.push('/dashboard');
};

const goToLogin = () => {
    router.push('/auth/login');
};

// Función para reenviar el correo de verificación
const resendVerificationEmail = async () => {
    if (!userEmail.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Por favor, ingresa tu correo electrónico',
            life: 3000
        });
        return;
    }

    resendLoading.value = true;

    try {
        const result = await authStore.resendVerificationEmail({ email: userEmail.value });

        if (result.success) {
            verificationSent.value = true;
            toast.add({
                severity: 'success',
                summary: 'Correo enviado',
                detail: 'Se ha enviado un nuevo correo de verificación',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'No se pudo enviar el correo de verificación',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo enviar el correo de verificación',
            life: 3000
        });
    } finally {
        resendLoading.value = false;
    }
};

onMounted(() => {
    verifyEmail();

    // Si hay un token en la URL, intentamos extraer el email del token
    const token = route.query.token;
    if (token) {
        try {
            // Intentamos obtener el email del payload del token (si está disponible)
            // Nota: Esto depende de cómo esté estructurado tu token
            const tokenParts = token.split('.');
            if (tokenParts.length > 1) {
                const payload = JSON.parse(atob(tokenParts[1]));
                if (payload && payload.email) {
                    userEmail.value = payload.email;
                }
            }
        } catch (e) {
            // Si hay algún error al procesar el token, simplemente ignoramos
            console.error('Error al procesar el token:', e);
        }
    }
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <div class="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 p-6">
                <div v-if="loading" class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-blue-600 text-4xl mb-4"></i>
                    <h2 class="text-xl font-bold text-gray-800">Verificando tu correo electrónico...</h2>
                    <p class="text-gray-600 mt-2">Por favor espera un momento.</p>
                </div>

                <div v-else-if="success" class="text-center py-8">
                    <div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <i class="pi pi-check text-green-600 text-3xl"></i>
                    </div>
                    <h2 class="text-xl font-bold text-gray-800">¡Email verificado correctamente!</h2>
                    <p class="text-gray-600 mt-2">Tu cuenta ha sido verificada y ya puedes acceder a todas las funcionalidades.</p>
                    <Button label="Ir al Dashboard" icon="pi pi-home" class="mt-6 p-button-primary" @click="goToDashboard" />
                </div>

                <div v-else class="text-center py-8">
                    <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <i class="pi pi-times text-red-600 text-3xl"></i>
                    </div>
                    <h2 class="text-xl font-bold text-gray-800">Error de verificación</h2>
                    <p class="text-gray-600 mt-2">{{ errorMessage }}</p>
                    <div class="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
                        <Button label="Reintentar" icon="pi pi-refresh" class="p-button-outlined p-button-primary" @click="verifyEmail" />
                        <Button label="Ir a Iniciar Sesión" icon="pi pi-sign-in" class="p-button-primary" @click="goToLogin" />
                    </div>

                    <div class="mt-4 border-t border-gray-200 pt-4">
                        <p class="text-sm text-gray-600 mb-3">¿No recibiste el correo de verificación?</p>

                        <div v-if="!verificationSent" class="flex flex-col items-center space-y-3">
                            <InputText v-model="userEmail" placeholder="Ingresa tu correo electrónico" class="w-full max-w-xs" />
                            <Button label="Reenviar correo de verificación" icon="pi pi-envelope" :loading="resendLoading" class="p-button-outlined p-button-secondary" @click="resendVerificationEmail" />
                        </div>

                        <p v-else class="text-sm text-green-600 mt-2"><i class="pi pi-check mr-1"></i> Correo enviado. Si no lo recibes, revisa tu carpeta de spam.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast para notificaciones -->
        <Toast position="top-right" />
    </div>
</template>
