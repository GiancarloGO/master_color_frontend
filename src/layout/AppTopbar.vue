<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/auth';
import cache from '@/utils/cache';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { onBeforeMount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const logoutDialog = ref(false);
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();

const goToProfile = () => {
    router.push({ name: 'profile' });
};

const goToConfig = () => {
    router.push({ name: 'config' });
};

const goToCart = () => {
    router.push('/');
};

const goToRefresh = () => {
    cache.refresh();
    window.location.reload();
};
const confirmLogout = () => {
    logoutDialog.value = true;
};
const logout = async () => {
    logoutDialog.value = false; // Cerrar el diálogo inmediatamente

    try {
        let userType = authStore.getUserType; // Guardar el tipo de usuario antes del logout

        await authStore.logout();

        // Redirigir según el tipo de usuario
        if (userType === 'client') {
            router.push('/'); // Página principal de la tienda
        } else {
            router.push('/auth/employee-login'); // Página de login para empleados
        }
    } catch (error) {
        console.error('Error durante el logout:', error);
        // Aún así redirigir porque el logout local se completó
        router.push('/');
    }
};

onMounted(async () => {
    await authStore.me();
    if (!authStore.isAuthenticated) {
        router.push('/login');
    }
});

onBeforeMount(() => {
    if (cache.getItem('darkMode') === true) {
        document.documentElement.classList.add('app-dark');
    }
});
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <router-link to="/" class="layout-topbar-logo">
                <img width="25px" src="/mc.png" alt="Logo MasterColor" />
                <span>MasterColor</span>
            </router-link>
        </div>

        <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
            <i class="pi pi-bars"></i>
        </button>

        <div class="layout-topbar-actions">
            <!-- Cart icon for clients only -->
            <button v-if="authStore.userRole === 'client'" v-tooltip="'Ir a la tienda'" type="button" class="layout-topbar-action cart-button" @click="goToCart">
                <i class="pi pi-shopping-cart"></i>
            </button>

            <!-- <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div> -->

            <button
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                class="layout-topbar-menu-button layout-topbar-action"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <!-- <button type="button" class="layout-topbar-action" @click="goToRefresh()">
                        <i class="pi pi-refresh"></i>
                        <span>Actualizar</span>
                    </button> -->
                    <button type="button" class="layout-topbar-action" @click="goToProfile()">
                        <i class="pi pi-user"></i>
                        <span>Perfil</span>
                    </button>
                    <button type="button" class="layout-topbar-action" @click="confirmLogout()">
                        <i class="pi pi-sign-out"></i>
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <Dialog v-model:visible="logoutDialog" :style="{ width: '450px' }" header="Cerrar Sesión" :modal="true">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span>
                Deseas cerrar sesión <b>{{ authStore.currentUser?.name || 'Usuario' }}</b
                >?
            </span>
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" text @click="logoutDialog = false" />
            <Button label="Sí" icon="pi pi-check" :loading="authStore.loading" @click="logout" />
        </template>
    </Dialog>
</template>

<style scoped>
.cart-button {
    position: relative;
    transition: all 0.3s ease;
}

.cart-button:hover {
    background: var(--primary-100) !important;
    color: var(--primary-600) !important;
    transform: scale(1.1);
}

.cart-button i {
    font-size: 1.2rem;
}

/* Efecto de pulso para llamar la atención */
.cart-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--primary-200);
    opacity: 0;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: translate(-50%, -50%) scale(0.95);
        opacity: 0.7;
    }
    70% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0;
    }
    100% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0;
    }
}

/* Dark mode support */
[data-theme='dark'] .cart-button:hover {
    background: var(--primary-800) !important;
    color: var(--primary-300) !important;
}

[data-theme='dark'] .cart-button::after {
    background: var(--primary-700);
}
</style>
