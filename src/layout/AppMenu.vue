<script setup>
import { useAuthStore } from '@/stores/auth';
import { computed, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const authStore = useAuthStore();

// Configuración centralizada de roles
const ROLES = {
    ADMIN: 'admin',
    CLIENT: 'client',
    ALMACEN: 'almacen',
    VENDEDOR: 'vendedor',
    DEVELOPER: 'developer'
};

const GLOBAL_ACCESS_ROLES = [ROLES.DEVELOPER];

// Configuración del menú centralizada y tipada
const menuConfig = ref([
    {
        label: 'Home',
        roles: [ROLES.ADMIN, ROLES.ALMACEN, ROLES.VENDEDOR, ROLES.CLIENT],
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/dashboard',
                roles: [ROLES.ADMIN]
            },
            {
                label: 'Perfil',
                icon: 'pi pi-fw pi-user',
                to: '/profile',
                public: true
            },
            {
                label: 'Direcciones',
                icon: 'pi pi-fw pi-map-marker',
                to: '/addresses',
                roles: [ROLES.CLIENT]
            }
        ]
    },
    {
        label: 'Administración',
        roles: [ROLES.ADMIN, ROLES.ALMACEN],
        items: [
            {
                label: 'Usuarios',
                icon: 'pi pi-fw pi-users',
                to: '/users',
                roles: [ROLES.ADMIN]
            },
            {
                label: 'Productos',
                icon: 'pi pi-fw pi-box',
                to: '/products',
                roles: [ROLES.ADMIN, ROLES.ALMACEN]
            }
        ]
    },
    {
        label: 'Inventario',
        roles: [ROLES.ALMACEN, ROLES.ADMIN, ROLES.VENDEDOR],
        items: [
            {
                label: 'Movimientos de Stock',
                icon: 'pi pi-fw pi-arrows-v',
                to: '/stock-movements',
                roles: [ROLES.ADMIN, ROLES.ALMACEN]
            },
            {
                label: 'Stock',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/stock',
                roles: [ROLES.ADMIN, ROLES.ALMACEN, ROLES.VENDEDOR]
            }
        ]
    },
    {
        label: 'Mis Compras',
        roles: [ROLES.CLIENT],
        items: [
            {
                label: 'Pedidos',
                icon: 'pi pi-fw pi-shopping-cart',
                to: '/orders',
                roles: [ROLES.CLIENT]
            },
            {
                label: 'Mis Productos',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/my-products',
                roles: [ROLES.CLIENT]
            }
        ]
    }
]);

// Computed para el rol actual con validación
const currentUserRole = computed(() => {
    const role = authStore.userRole;
    if (!role) {
        console.warn('Usuario sin rol asignado');
        return null;
    }
    return role.toLowerCase(); // Normalizar a minúsculas
});

// Función auxiliar para verificar acceso
const hasAccess = (requiredRoles, isPublic = false) => {
    // Si es público, siempre tiene acceso
    if (isPublic) return true;

    // Si no hay roles requeridos, es accesible
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const userRole = currentUserRole.value;

    // Si no hay usuario logueado, no tiene acceso
    if (!userRole) return false;

    // Verificar si tiene acceso global o específico
    return GLOBAL_ACCESS_ROLES.includes(userRole) || requiredRoles.includes(userRole);
};

// Función recursiva para filtrar items
const filterMenuItems = (items) => {
    if (!Array.isArray(items)) return [];

    return items
        .filter((item) => hasAccess(item.roles, item.public))
        .map((item) => ({
            ...item,
            items: item.items ? filterMenuItems(item.items) : undefined
        }))
        .filter((item) => !item.items || item.items.length > 0); // Remover secciones vacías
};

// Computed para el menú filtrado
const filteredModel = computed(() => {
    if (!currentUserRole.value && !authStore.isPublicAccess) {
        return []; // Usuario no autenticado
    }

    const filtered = menuConfig.value
        .filter((section) => hasAccess(section.roles, section.public))
        .map((section) => ({
            ...section,
            items: filterMenuItems(section.items)
        }))
        .filter((section) => section.items && section.items.length > 0);

    return filtered;
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in filteredModel" :key="`menu-${i}-${item.label}`">
            <app-menu-item v-if="!item.separator" :item="item" :index="i" />
            <li v-if="item.separator" class="menu-separator" />
        </template>

        <!-- Mensaje si no hay elementos de menú -->
        <li v-if="filteredModel.length === 0" class="menu-empty">
            <span class="menu-empty-text">No hay opciones disponibles</span>
        </li>
    </ul>
</template>

<style lang="scss" scoped>
.layout-menu {
    list-style: none;
    padding: 0;
    margin: 0;
}

.menu-separator {
    height: 1px;
    background: var(--surface-border);
    margin: 0.5rem 0;
}

.menu-empty {
    padding: 1rem;
    text-align: center;

    .menu-empty-text {
        color: var(--text-color-secondary);
        font-style: italic;
    }
}
</style>
