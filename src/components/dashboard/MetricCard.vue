<script setup>
import { computed } from 'vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    value: {
        type: [String, Number],
        default: 0
    },
    icon: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'number', // number, currency, percentage
        validator: (value) => ['number', 'currency', 'percentage'].includes(value)
    },
    trend: {
        type: Object,
        default: null
        // Expected: { value: 15.5, period: 'vs mes anterior' }
    },
    severity: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'success', 'info', 'warning', 'danger', 'secondary'].includes(value)
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const formattedValue = computed(() => {
    if (!props.value && props.value !== 0) return '—';

    switch (props.type) {
        case 'currency':
            return `S/ ${formatCurrency(props.value)}`;
        case 'percentage':
            return `${parseFloat(props.value).toFixed(1)}%`;
        case 'number':
        default:
            return formatNumber(props.value);
    }
});

const trendText = computed(() => {
    if (!props.trend) return '';
    const sign = props.trend.value > 0 ? '+' : '';
    return `${sign}${props.trend.value.toFixed(1)}% ${props.trend.period || ''}`;
});

const trendSeverity = computed(() => {
    if (!props.trend) return 'secondary';
    return props.trend.value > 0 ? 'success' : props.trend.value < 0 ? 'danger' : 'secondary';
});

const trendIcon = computed(() => {
    if (!props.trend) return '';
    return props.trend.value > 0 ? 'pi pi-arrow-up' : props.trend.value < 0 ? 'pi pi-arrow-down' : 'pi pi-minus';
});

const severityClass = computed(() => `metric-card--${props.severity}`);

const iconClass = computed(() => `metric-card__icon-container--${props.severity}`);

function formatCurrency(amount) {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(amount));
}

function formatNumber(value) {
    if (!value && value !== 0) return '0';
    return new Intl.NumberFormat('es-PE').format(parseInt(value));
}
</script>

<template>
    <Card class="metric-card" :class="[severityClass, { 'metric-card--loading': loading }]">
        <template #content>
            <div class="metric-card__content">
                <div class="metric-card__icon">
                    <div class="metric-card__icon-container" :class="iconClass">
                        <i :class="icon" class="text-2xl"></i>
                    </div>
                </div>

                <div class="metric-card__info">
                    <div class="metric-card__title">{{ title }}</div>
                    <div v-if="!loading" class="metric-card__value">
                        {{ formattedValue }}
                    </div>
                    <Skeleton v-else height="2rem" width="60%"></Skeleton>

                    <div v-if="trend && !loading" class="metric-card__trend">
                        <Tag :value="trendText" :severity="trendSeverity" :icon="trendIcon" size="small" />
                    </div>
                    <Skeleton v-else-if="loading" height="1.5rem" width="40%"></Skeleton>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.metric-card {
    @apply transition-all duration-200 hover:shadow-md;
}

.metric-card--loading {
    @apply opacity-75;
}

.metric-card__content {
    @apply flex items-center gap-4 p-2;
}

.metric-card__icon-container {
    @apply w-16 h-16 rounded-xl flex items-center justify-center;
}

.metric-card__icon-container--primary {
    @apply bg-blue-100 text-blue-600;
}

.metric-card__icon-container--success {
    @apply bg-green-100 text-green-600;
}

.metric-card__icon-container--info {
    @apply bg-cyan-100 text-cyan-600;
}

.metric-card__icon-container--warning {
    @apply bg-yellow-100 text-yellow-600;
}

.metric-card__icon-container--danger {
    @apply bg-red-100 text-red-600;
}

.metric-card__icon-container--secondary {
    @apply bg-gray-100 text-gray-600;
}

.metric-card__info {
    @apply flex-1;
}

.metric-card__title {
    @apply text-sm font-medium text-surface-600 mb-1;
}

.metric-card__value {
    @apply text-2xl font-bold text-surface-900 mb-2;
}

.metric-card__trend {
    @apply flex items-center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .metric-card__content {
        @apply flex-col text-center gap-2;
    }

    .metric-card__value {
        @apply text-xl;
    }

    .metric-card__icon-container {
        @apply w-12 h-12;
    }
}
</style>
