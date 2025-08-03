<script setup>
import { useStaffOrdersStore } from '@/stores/staffOrders';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    order: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'status-updated']);

const staffOrdersStore = useStaffOrdersStore();
const toast = useToast();

const loading = ref(false);
const errors = ref({});

const formData = reactive({
    status: '',
    observations: ''
});

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const availableStatuses = computed(() => {
    if (!props.order) return [];

    const validTransitions = staffOrdersStore.getValidStatusTransitions(props.order.status);

    return validTransitions.map((status) => ({
        label: getStatusLabel(status),
        value: status,
        description: getStatusDescription(status)
    }));
});

const showWarnings = computed(() => {
    return ['cancelado', 'entregado', 'enviado'].includes(formData.status);
});

// Watchers
watch(
    () => props.visible,
    (newValue) => {
        if (newValue) {
            resetForm();
        }
    }
);

watch(
    () => props.order,
    () => {
        resetForm();
    }
);

function resetForm() {
    formData.status = '';
    formData.observations = '';
    errors.value = {};
}

function validateForm() {
    errors.value = {};

    if (!formData.status) {
        errors.value.status = 'Debe seleccionar un nuevo estado';
        return false;
    }

    if (formData.status === props.order?.status) {
        errors.value.status = 'Debe seleccionar un estado diferente al actual';
        return false;
    }

    const validTransitions = staffOrdersStore.getValidStatusTransitions(props.order.status);
    if (!validTransitions.includes(formData.status)) {
        errors.value.status = 'Transición de estado no válida';
        return false;
    }

    return true;
}

async function updateStatus() {
    if (!validateForm()) return;

    loading.value = true;

    try {
        const payload = {
            status: formData.status,
            observations: formData.observations || undefined
        };

        const result = await staffOrdersStore.updateOrderStatus(props.order.id, payload);

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Estado Actualizado',
                detail: `El estado de la orden se cambió a "${getStatusLabel(formData.status)}"`,
                life: 3000
            });

            emit('status-updated');
            closeDialog();
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al actualizar el estado',
                life: 5000
            });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error inesperado al actualizar el estado',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
}

function closeDialog() {
    emit('update:visible', false);
    resetForm();
}

function getStatusLabel(status) {
    return staffOrdersStore.getOrderStatusLabel(status);
}

function getStatusIcon(status) {
    return staffOrdersStore.getOrderStatusIcon(status);
}

function getStatusDescription(status) {
    const descriptions = {
        pendiente_pago: 'La orden está esperando el pago del cliente',
        pendiente: 'Pago recibido, orden lista para ser confirmada',
        confirmado: 'Orden confirmada y lista para procesar',
        procesando: 'Orden siendo preparada en almacén',
        enviado: 'Orden enviada y en camino al cliente',
        entregado: 'Orden entregada exitosamente al cliente',
        cancelado: 'Orden cancelada',
        pago_fallido: 'El pago no pudo ser procesado'
    };
    return descriptions[status] || 'Estado de la orden';
}
</script>

<template>
    <Dialog v-model:visible="dialogVisible" modal :header="`Actualizar Estado - Orden #${order?.id || ''}`" :style="{ width: '500px' }" class="status-update-modal">
        <div v-if="order" class="status-update-content">
            <!-- Estado actual -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold mb-3">Estado Actual</h4>
                <div class="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                    <i :class="getStatusIcon(order.status)" class="text-2xl"></i>
                    <div>
                        <div class="font-semibold">{{ getStatusLabel(order.status) }}</div>
                        <div class="text-sm text-surface-500">{{ getStatusDescription(order.status) }}</div>
                    </div>
                </div>
            </div>

            <!-- Formulario de actualización -->
            <form @submit.prevent="updateStatus">
                <div class="mb-4">
                    <label for="newStatus" class="block text-sm font-medium text-surface-700 mb-2"> Nuevo Estado * </label>
                    <Dropdown id="newStatus" v-model="formData.status" :options="availableStatuses" option-label="label" option-value="value" placeholder="Selecciona un nuevo estado" class="w-full" :class="{ 'p-invalid': errors.status }">
                        <template #option="{ option }">
                            <div class="flex items-center gap-2">
                                <i :class="getStatusIcon(option.value)"></i>
                                <span>{{ option.label }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
                </div>

                <div class="mb-4">
                    <label for="observations" class="block text-sm font-medium text-surface-700 mb-2"> Observaciones </label>
                    <Textarea id="observations" v-model="formData.observations" rows="4" placeholder="Observaciones adicionales sobre el cambio de estado..." class="w-full" :maxlength="500" />
                    <small class="text-surface-500">Máximo 500 caracteres</small>
                </div>

                <!-- Preview del nuevo estado -->
                <div v-if="formData.status" class="mb-6">
                    <h4 class="text-sm font-medium text-surface-700 mb-2">Nuevo Estado</h4>
                    <div class="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <i :class="getStatusIcon(formData.status)" class="text-2xl text-green-600"></i>
                        <div>
                            <div class="font-semibold text-green-800">{{ getStatusLabel(formData.status) }}</div>
                            <div class="text-sm text-green-600">{{ getStatusDescription(formData.status) }}</div>
                        </div>
                    </div>
                </div>

                <!-- Advertencias -->
                <div v-if="showWarnings" class="mb-4">
                    <Message severity="warn" :closable="false">
                        <template #icon>
                            <i class="pi pi-exclamation-triangle"></i>
                        </template>
                        <div>
                            <strong>Importante:</strong>
                            <ul class="mt-2 ml-4 list-disc">
                                <li v-if="formData.status === 'cancelado'">Esta acción cancelará la orden y no se podrá revertir.</li>
                                <li v-if="formData.status === 'entregado'">Marca la orden como completada. Asegúrate de que fue entregada.</li>
                                <li v-if="formData.status === 'enviado'">El cliente será notificado que su orden está en camino.</li>
                            </ul>
                        </div>
                    </Message>
                </div>
            </form>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancelar" severity="secondary" :disabled="loading" @click="closeDialog" />
                <Button label="Actualizar Estado" icon="pi pi-check" :loading="loading" :disabled="!formData.status || formData.status === order?.status" @click="updateStatus" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.status-update-modal :deep(.p-dialog-content) {
    padding-bottom: 0;
}
</style>
