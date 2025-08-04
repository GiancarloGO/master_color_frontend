<script setup>
import { computed } from 'vue';

const props = defineProps({
    alerts: {
        type: Array,
        default: () => []
        // Expected format:
        // {
        //   id: 1,
        //   type: 'low_stock', // low_stock, pending_orders, payment_failed, system
        //   title: 'Stock Bajo',
        //   message: '5 productos tienen stock crítico',
        //   created_at: '2024-01-01T10:00:00Z',
        //   action: { label: 'Ver productos', route: '/products', severity: 'warning' }
        // }
    },
    loading: {
        type: Boolean,
        default: false
    },
    maxVisible: {
        type: Number,
        default: 5
    }
});

const emit = defineEmits(['view-all', 'alert-action']);

const alertCount = computed(() => props.alerts?.length || 0);

const visibleAlerts = computed(() => {
    if (!props.alerts) return [];
    return props.alerts.slice(0, props.maxVisible);
});

function getAlertClass(type) {
    const classes = {
        low_stock: 'alert-panel__item--warning',
        pending_orders: 'alert-panel__item--info',
        payment_failed: 'alert-panel__item--danger',
        system: 'alert-panel__item--secondary'
    };
    return classes[type] || 'alert-panel__item--secondary';
}

function getAlertIcon(type) {
    const icons = {
        low_stock: 'pi pi-exclamation-triangle',
        pending_orders: 'pi pi-clock',
        payment_failed: 'pi pi-times-circle',
        system: 'pi pi-info-circle'
    };
    return icons[type] || 'pi pi-info-circle';
}

function getAlertSeverity(type) {
    const severities = {
        low_stock: 'warning',
        pending_orders: 'info',
        payment_failed: 'danger',
        system: 'secondary'
    };
    return severities[type] || 'secondary';
}

function getAlertTypeLabel(type) {
    const labels = {
        low_stock: 'Stock',
        pending_orders: 'Órdenes',
        payment_failed: 'Pagos',
        system: 'Sistema'
    };
    return labels[type] || 'General';
}

function formatTime(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-PE');
}

function handleAlertAction(alert) {
    emit('alert-action', alert);
}
</script>

<template>
    <Card class="alert-panel">
        <template #title>
            <div class="alert-panel__header">
                <div class="flex items-center gap-2">
                    <i class="pi pi-bell text-lg text-primary-600"></i>
                    <h3 class="text-lg font-semibold m-0">Alertas</h3>
                </div>

                <Tag v-if="alertCount > 0" :value="alertCount" severity="warning" rounded />
            </div>
        </template>

        <template #content>
            <div class="alert-panel__content">
                <div v-if="loading" class="alert-panel__loading">
                    <div v-for="i in 3" :key="i" class="mb-4">
                        <Skeleton height="3rem"></Skeleton>
                    </div>
                </div>

                <div v-else-if="!alerts || alerts.length === 0" class="alert-panel__empty">
                    <div class="text-center py-8">
                        <i class="pi pi-check-circle text-4xl text-green-400 mb-4"></i>
                        <p class="text-surface-600">No hay alertas pendientes</p>
                        <p class="text-sm text-surface-500">Todo funciona correctamente</p>
                    </div>
                </div>

                <div v-else class="alert-panel__list">
                    <div v-for="alert in alerts" :key="alert.id" class="alert-panel__item" :class="getAlertClass(alert.type)">
                        <div class="alert-panel__item-icon">
                            <i :class="getAlertIcon(alert.type)"></i>
                        </div>

                        <div class="alert-panel__item-content">
                            <div class="alert-panel__item-title">{{ alert.title }}</div>
                            <div class="alert-panel__item-message">{{ alert.message }}</div>
                            <div class="alert-panel__item-meta">
                                <span class="alert-panel__item-time">{{ formatTime(alert.created_at) }}</span>
                                <Tag :value="getAlertTypeLabel(alert.type)" :severity="getAlertSeverity(alert.type)" size="small" />
                            </div>
                        </div>

                        <div v-if="alert.action" class="alert-panel__item-actions">
                            <Button :label="alert.action.label" :severity="alert.action.severity || 'secondary'" size="small" @click="handleAlertAction(alert)" />
                        </div>
                    </div>
                </div>

                <div v-if="alerts && alerts.length > maxVisible" class="alert-panel__footer">
                    <Button label="Ver todas las alertas" severity="secondary" text size="small" @click="$emit('view-all')" />
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.alert-panel__header {
    @apply flex items-center justify-between;
}

.alert-panel__content {
    @apply space-y-4;
}

.alert-panel__list {
    @apply space-y-3;
}

.alert-panel__item {
    @apply flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm;
}

.alert-panel__item--warning {
    @apply bg-yellow-50 border-yellow-200;
}

.alert-panel__item--info {
    @apply bg-blue-50 border-blue-200;
}

.alert-panel__item--danger {
    @apply bg-red-50 border-red-200;
}

.alert-panel__item--secondary {
    @apply bg-gray-50 border-gray-200;
}

.alert-panel__item-icon {
    @apply flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm;
}

.alert-panel__item--warning .alert-panel__item-icon {
    @apply bg-yellow-100 text-yellow-600;
}

.alert-panel__item--info .alert-panel__item-icon {
    @apply bg-blue-100 text-blue-600;
}

.alert-panel__item--danger .alert-panel__item-icon {
    @apply bg-red-100 text-red-600;
}

.alert-panel__item--secondary .alert-panel__item-icon {
    @apply bg-gray-100 text-gray-600;
}

.alert-panel__item-content {
    @apply flex-1 min-w-0;
}

.alert-panel__item-title {
    @apply font-medium text-surface-900 text-sm;
}

.alert-panel__item-message {
    @apply text-sm text-surface-600 mt-1;
}

.alert-panel__item-meta {
    @apply flex items-center gap-2 mt-2;
}

.alert-panel__item-time {
    @apply text-xs text-surface-500;
}

.alert-panel__item-actions {
    @apply flex-shrink-0;
}

.alert-panel__footer {
    @apply text-center pt-4 border-t border-surface-200;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .alert-panel__item {
        @apply flex-col gap-2;
    }

    .alert-panel__item-actions {
        @apply w-full;
    }
}
</style>
