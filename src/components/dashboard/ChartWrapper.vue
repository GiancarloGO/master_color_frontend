<script setup>
import { ref, onBeforeUnmount, watch, nextTick } from 'vue';
import Chart from 'primevue/chart';

const props = defineProps({
    type: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        default: () => ({})
    },
    options: {
        type: Object,
        default: () => ({})
    },
    class: {
        type: String,
        default: ''
    }
});

const chartRef = ref();
const chartKey = ref(0);

// Watch for data changes and force chart recreation
watch(() => [props.data, props.type], async () => {
    if (chartRef.value?.chart) {
        try {
            chartRef.value.chart.destroy();
        } catch (error) {
            // Chart might already be destroyed
        }
    }
    await nextTick();
    chartKey.value++;
}, { deep: true });

onBeforeUnmount(() => {
    if (chartRef.value?.chart) {
        try {
            chartRef.value.chart.destroy();
        } catch (error) {
            // Chart already destroyed
        }
    }
});
</script>

<template>
    <Chart
        :key="chartKey"
        ref="chartRef"
        :type="type"
        :data="data"
        :options="options"
        :class="class"
    />
</template>