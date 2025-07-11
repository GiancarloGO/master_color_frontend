<script setup>
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
const router = useRouter();
const toast = useToast();
const goHome = () => {
    router.push('/');
};
</script>

<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-2">
        <div class="w-full max-w-3xl">
            <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col md:flex-row">
                <!-- Panel izquierdo decorativo -->
                <div class="md:w-1/2 bg-blue-700 p-8 text-white flex flex-col items-center justify-center relative">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-600 opacity-20 rounded-full -translate-y-16 translate-x-16"></div>
                    <div class="absolute bottom-0 left-0 w-24 h-24 bg-blue-900 opacity-20 rounded-full translate-y-12 -translate-x-12"></div>
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
                                    0 1.5px 0 #2563eb;
                            "
                        >
                            404
                        </h1>
                        <p class="text-lg text-blue-100 font-light mb-2">Página no encontrada</p>
                        <p class="text-base text-blue-50 font-light">La página que buscas no existe o fue movida.</p>
                    </div>
                </div>
                <!-- Panel derecho -->
                <div class="md:w-1/2 p-8 flex flex-col justify-center items-center bg-white">
                    <div class="mb-8">
                        <i class="pi pi-exclamation-triangle text-6xl text-blue-700 mb-4"></i>
                    </div>
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">¡Oops! No pudimos encontrar esa página</h2>
                    <p class="text-gray-700 text-lg mb-6 text-center">Verifica la URL o regresa al inicio para continuar navegando.</p>
                    <Button label="Ir al inicio" icon="pi pi-home" class="p-button-primary w-full md:w-auto font-bold text-lg" @click="goHome" />
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
.bg-blue-700 {
    background: #1d4ed8;
}
.bg-blue-600 {
    background: #2563eb;
}
.bg-blue-900 {
    background: #1e3a8a;
}
.p-button-primary {
    background: #1d4ed8;
    border-color: #1d4ed8;
    color: #fff;
    border-radius: 0.75rem;
    font-weight: 700;
    padding: 1rem 1.5rem;
    transition: all 0.3s;
}
.p-button-primary:hover {
    background: #1e40af;
    border-color: #1e40af;
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
</style>
