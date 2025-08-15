import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/dashboard',
            component: AppLayout,
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { roles: ['admin'] }
                },
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import('@/views/auth/Profile.vue'),
                    meta: { public: true }
                },
                {
                    path: '/products',
                    name: 'products',
                    component: () => import('@/views/products/Products.vue'),
                    meta: { roles: ['admin', 'almacen'] }
                },
                {
                    path: '/users',
                    name: 'users',
                    component: () => import('@/views/users/Users.vue'),
                    meta: { roles: ['admin'] }
                },
                {
                    path: '/stock-movements',
                    name: 'stock-movements',
                    component: () => import('@/views/stock-movements/StockMovements.vue'),
                    meta: { roles: ['admin', 'almacen'] }
                },
                {
                    path: '/stock',
                    name: 'stock',
                    component: () => import('@/views/stock/Stock.vue'),
                    meta: { roles: ['admin', 'almacen'] }
                },
                {
                    path: '/staff-orders',
                    name: 'staff-orders',
                    component: () => import('@/views/staff-orders/StaffOrders.vue'),
                    meta: { roles: ['admin', 'almacen'] }
                },
                {
                    path: '/reports',
                    name: 'reports',
                    component: () => import('@/views/admin/Reports.vue'),
                    meta: { roles: ['admin'] }
                },
                {
                    path: '/orders',
                    name: 'orders',
                    component: () => import('@/views/orders/Orders.vue'),
                    meta: { roles: ['client'] }
                },
                {
                    path: '/my-products',
                    name: 'my-products',
                    component: () => import('@/views/productsClient/MyProducts.vue'),
                    meta: { roles: ['client'] }
                },
                {
                    path: '/addresses',
                    name: 'client-addresses',
                    component: () => import('@/views/addresses/AddressManager.vue'),
                    meta: { roles: ['client'] }
                }
            ]
        },
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/store/Home.vue'),
            meta: { public: true } // Ruta pública
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/auth/Login.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/auth/employee-login',
            name: 'loginEmployee',
            component: () => import('@/views/auth/EmployeeLogin.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/auth/register',
            name: 'register',
            component: () => import('@/views/auth/Register.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/verify-email',
            name: 'verifyEmail',
            component: () => import('@/views/auth/VerifyEmail.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/forgot-password',
            name: 'forgotPassword',
            component: () => import('@/views/auth/ForgotPassword.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/reset-password',
            name: 'resetPassword',
            component: () => import('@/views/auth/ResetPassword.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/orders',
            name: 'client-orders',
            component: () => import('@/views/orders/Orders.vue'),
            meta: { roles: ['client'] }
        },
        {
            path: '/payment-return/:status',
            name: 'payment-return',
            component: () => import('@/views/payment/PaymentReturn.vue'),
            meta: { public: true } // Pública para manejar redirecciones de MercadoPago
        },
        // MercadoPago back_urls routes
        {
            path: '/payment/success',
            name: 'payment-success',
            component: () => import('@/views/payment/PaymentReturn.vue'),
            meta: { public: true }
        },
        {
            path: '/payment/failure',
            name: 'payment-failure',
            component: () => import('@/views/payment/PaymentReturn.vue'),
            meta: { public: true }
        },
        {
            path: '/payment/pending',
            name: 'payment-pending',
            component: () => import('@/views/payment/PaymentReturn.vue'),
            meta: { public: true }
        },
        {
            path: '/accessdenied',
            name: 'accessDenied',
            component: () => import('@/views/auth/Access.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/error',
            name: 'error',
            component: () => import('@/views/auth/Error.vue'),
            meta: { public: true } // Ruta pública
        },
        {
            path: '/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue'),
            meta: { public: true } // Ruta públicaW
        },
        {
            path: '/:catchAll(.*)',
            redirect: '/notfound',
            meta: { public: true } // Ruta pública
        }
    ]
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    // Si la ruta es pública, permite acceso
    if (to.meta.public) {
        return next();
    }

    // Verificar autenticación
    if (!authStore.currentUser) {
        return next({ name: 'login' });
    }

    // Verificar usuario activo
    if (!authStore.currentUser?.is_active && authStore.getUserType !== 'client') {
        return next({ name: 'login' });
    }

    // Verificar permisos por rol
    const userRole = authStore.userRole?.toLowerCase();
    const allowedRoles = to.meta.roles || [];

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return next({ name: 'accessDenied' });
    }

    next();
});

export default router;
