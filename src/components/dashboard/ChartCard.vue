<script setup>
import { computed, ref, onBeforeUnmount } from 'vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: ''
    },
    loading: {
        type: Boolean,
        default: false
    },
    refreshing: {
        type: Boolean,
        default: false
    },
    refreshable: {
        type: Boolean,
        default: true
    },
    error: {
        type: String,
        default: ''
    },
    hasData: {
        type: Boolean,
        default: true
    },
    emptyMessage: {
        type: String,
        default: ''
    },
    periods: {
        type: Array,
        default: () => []
        // Expected: [{ label: '30 días', value: 30 }, { label: '90 días', value: 90 }]
    },
    defaultPeriod: {
        type: [String, Number],
        default: null
    },
    summary: {
        type: Array,
        default: () => []
        // Expected: [{ label: 'Total', value: '1,234' }]
    }
});

const emit = defineEmits(['refresh', 'retry', 'period-change']);

const selectedPeriod = ref(props.defaultPeriod || (props.periods.length > 0 ? props.periods[0].value : null));

// Chart instance ref to properly destroy it
const chartInstance = ref(null);

// Destroy chart instance on component unmount
onBeforeUnmount(() => {
    if (chartInstance.value) {
        chartInstance.value.destroy();
        chartInstance.value = null;
    }
});
</script>

<template>
    <Card class="chart-card" :class="{ 'chart-card--loading': loading }">
        <template #title>
            <div class="chart-card__header">
                <div class="chart-card__title-section">
                    <i v-if="icon" :class="icon" class="chart-card__icon"></i>
                    <h3 class="chart-card__title">{{ title }}</h3>
                </div>

                <div v-if="!loading" class="chart-card__actions">
                    <Button v-if="refreshable" v-tooltip.top="'Actualizar'" icon="pi pi-refresh" severity="secondary" text size="small" :loading="refreshing" @click="$emit('refresh')" />

                    <Select v-if="periods && periods.length > 1" v-model="selectedPeriod" :options="periods" option-label="label" option-value="value" size="small" @change="$emit('period-change', $event.value)" />
                </div>
            </div>
        </template>

        <template v-if="subtitle" #subtitle>
            <p class="chart-card__subtitle">{{ subtitle }}</p>
        </template>

        <template #content>
            <div class="chart-card__content">
                <div v-if="loading" class="chart-card__loading">
                    <div class="chart-card__skeleton">
                        <Skeleton height="300px"></Skeleton>
                    </div>
                </div>

                <div v-else-if="error" class="chart-card__error">
                    <div class="text-center py-8">
                        <i class="pi pi-exclamation-triangle text-4xl text-orange-400 mb-4"></i>
                        <p class="text-surface-600">{{ error }}</p>
                        <Button label="Reintentar" severity="secondary" size="small" class="mt-3" @click="$emit('retry')" />
                    </div>
                </div>

                <div v-else-if="!hasData" class="chart-card__empty">
                    <div class="text-center py-8">
                        <i class="pi pi-chart-line text-4xl text-surface-400 mb-4"></i>
                        <p class="text-surface-500">{{ emptyMessage || 'No hay datos disponibles' }}</p>
                    </div>
                </div>

                <div v-else ref="chartContainer" class="chart-card__chart">
                    <slot name="chart" :chart-instance="chartInstance"></slot>
                </div>

                <!-- Información adicional -->
                <div v-if="summary && !loading" class="chart-card__summary">
                    <Divider />
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div v-for="(item, index) in summary" :key="index" class="chart-card__summary-item">
                            <div class="text-sm text-surface-600">{{ item.label }}</div>
                            <div class="text-lg font-semibold text-surface-900">{{ item.value }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.chart-card {
    @apply h-full;
}

.chart-card--loading {
    @apply opacity-75;
}

.chart-card__header {
    @apply flex items-center justify-between;
}

.chart-card__title-section {
    @apply flex items-center gap-2;
}

.chart-card__icon {
    @apply text-lg text-primary-600;
}

.chart-card__title {
    @apply text-lg font-semibold text-surface-900 m-0;
}

.chart-card__subtitle {
    @apply text-sm text-surface-600 mt-1 mb-0;
}

.chart-card__actions {
    @apply flex items-center gap-2;
}

.chart-card__content {
    @apply h-full;
}

.chart-card__loading,
.chart-card__error,
.chart-card__empty {
    @apply min-h-80;
}

.chart-card__skeleton {
    @apply p-4;
}

.chart-card__chart {
    @apply min-h-80;
}

.chart-card__summary {
    @apply mt-4;
}

.chart-card__summary-item {
    @apply p-2;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .chart-card__header {
        @apply flex-col items-start gap-3;
    }

    .chart-card__actions {
        @apply w-full justify-between;
    }

    .chart-card__chart {
        @apply min-h-60;
    }
}
</style>
