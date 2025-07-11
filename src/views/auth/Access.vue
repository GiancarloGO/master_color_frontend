<script setup>
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();

const goHome = () => {
    router.push('/');
};

const goLogin = () => {
    router.push('/login');
    toast.add({
        severity: 'info',
        summary: 'Redirigiendo',
        detail: 'Te estamos llevando a la página de inicio de sesión',
        life: 3000
    });
};
</script>

<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-2">
        <div class="w-full max-w-3xl">
            <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col md:flex-row">
                <!-- Panel izquierdo decorativo -->
                <div class="md:w-1/2 bg-red-700 p-8 text-white flex flex-col items-center justify-center relative">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-red-600 opacity-20 rounded-full -translate-y-16 translate-x-16"></div>
                    <div class="absolute bottom-0 left-0 w-24 h-24 bg-red-900 opacity-20 rounded-full translate-y-12 -translate-x-12"></div>
                    <div class="z-10 flex flex-col items-center">
                        <div class="flex items-center justify-center mb-6">
                            <div class="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                                <img src="/mc.png" alt="Master Color Logo" class="w-12 h-12 object-contain" />
                            </div>
                        </div>
                        <h1
                            class="text-4xl font-bold mb-2 text-white drop-shadow-2xl"
                            style="
                                text-shadow:
                                    0 4px 24px rgba(0, 0, 0, 0.25),
                                    0 1.5px 0 #dc2626;
                            "
                        >
                            403
                        </h1>
                        <p class="text-lg text-red-100 font-light mb-2">Acceso denegado</p>
                        <p class="text-base text-red-50 font-light">No tienes permisos para acceder a este recurso.</p>
                    </div>
                </div>
                <!-- Panel derecho -->
                <div class="md:w-1/2 p-8 flex flex-col justify-center items-center bg-white">
                    <div class="mb-8">
                        <i class="pi pi-lock text-6xl text-red-700 mb-4"></i>
                    </div>
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">¡Acceso restringido!</h2>
                    <p class="text-gray-700 text-lg mb-6 text-center">No tienes los permisos necesarios para ver esta página. Contacta al administrador si crees que esto es un error.</p>
                    <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <Button label="Ir al inicio" icon="pi pi-home" class="p-button-primary font-bold text-lg" @click="goHome" />
                        <Button label="Iniciar sesión" icon="pi pi-sign-in" class="p-button-secondary font-bold text-lg" @click="goLogin" />
                    </div>
                </div>
            </div>
        </div>
        <Toast position="top-right" />
    </div>
</template>

<style lang="scss" scoped>
.min-h-screen {
    min-height: 100vh;
}

.bg-red-700 {
    background: #dc2626;
}

.bg-red-600 {
    background: #ef4444;
}

.bg-red-900 {
    background: #991b1b;
}

.p-button-primary {
    background: #dc2626;
    border-color: #dc2626;
    color: #fff;
    border-radius: 0.75rem;
    font-weight: 700;
    padding: 1rem 1.5rem;
    transition: all 0.3s;
}

.p-button-primary:hover {
    background: #b91c1c;
    border-color: #b91c1c;
}

.p-button-secondary {
    background: #6b7280;
    border-color: #6b7280;
    color: #fff;
    border-radius: 0.75rem;
    font-weight: 700;
    padding: 1rem 1.5rem;
    transition: all 0.3s;
}

.p-button-secondary:hover {
    background: #4b5563;
    border-color: #4b5563;
}

:deep(.p-toast .p-toast-message) {
    border-radius: 0.75rem;
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.15),
        0 10px 10px -5px rgba(0, 0, 0, 0.08);
    border-width: 1px;
}

:deep(.p-toast .p-toast-message-error) {
    background-color: #fef2f2;
    border-color: #dc2626;
}

:deep(.p-toast .p-toast-message-success) {
    background-color: #dcfce7;
    border-color: #16a34a;
}

:deep(.p-toast .p-toast-message-info) {
    background-color: #eff6ff;
    border-color: #2563eb;
}
</style>
