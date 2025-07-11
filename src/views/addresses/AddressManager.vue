<script setup>
import { useAddressesStore } from '@/stores/addresses';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import AddressForm from './AddressForm.vue';

const addressesStore = useAddressesStore();
const toast = useToast();

// Estado
const showAddressForm = ref(false);
const editingAddress = ref(null);
const loading = ref(false);
const deleteConfirmDialog = ref(false);
const addressToDelete = ref(null);

// Computed
const addresses = computed(() => addressesStore.getAddresses);
const mainAddress = computed(() => addressesStore.getMainAddress);
const isLoading = computed(() => addressesStore.isLoading || loading.value);

// Métodos
const loadAddresses = async () => {
    loading.value = true;
    try {
        const result = await addressesStore.fetchAddresses();
        if (!result.success) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al cargar las direcciones',
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar las direcciones',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const openAddressForm = (address = null) => {
    editingAddress.value = address;
    showAddressForm.value = true;
};

const closeAddressForm = () => {
    editingAddress.value = null;
    showAddressForm.value = false;
};

const handleAddressSaved = async () => {
    closeAddressForm();
    await loadAddresses();

    toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: editingAddress.value ? 'Dirección actualizada correctamente' : 'Dirección creada correctamente',
        life: 3000
    });
};

const confirmDeleteAddress = (address) => {
    addressToDelete.value = address;
    deleteConfirmDialog.value = true;
};

const deleteAddress = async () => {
    if (!addressToDelete.value) return;

    loading.value = true;
    try {
        const result = await addressesStore.deleteAddress(addressToDelete.value.id);

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Dirección eliminada correctamente',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al eliminar la dirección',
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar la dirección',
            life: 5000
        });
    } finally {
        loading.value = false;
        deleteConfirmDialog.value = false;
        addressToDelete.value = null;
    }
};

const setMainAddress = async (addressId) => {
    loading.value = true;
    try {
        const result = await addressesStore.setMainAddress(addressId);

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Dirección principal establecida correctamente',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al establecer dirección principal',
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al establecer dirección principal',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const getFullAddress = (address) => {
    return `${address.address_full}, ${address.district}, ${address.province}, ${address.department}`;
};

// Lifecycle
onMounted(() => {
    loadAddresses();
});
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Mis Direcciones</h2>
                <p class="text-gray-600">Gestiona tus direcciones de entrega</p>
            </div>
            <Button label="Agregar Dirección" icon="pi pi-plus" class="bg-blue-600 border-blue-600 hover:bg-blue-700" @click="openAddressForm()" />
        </div>

        <!-- Estado de carga -->
        <div v-if="isLoading && addresses.length === 0" class="text-center py-12">
            <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
            <p class="text-gray-500">Cargando direcciones...</p>
        </div>

        <!-- Sin direcciones -->
        <div v-else-if="!isLoading && addresses.length === 0" class="text-center py-12">
            <i class="pi pi-map-marker text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl text-gray-500 mb-2">No tienes direcciones registradas</h3>
            <p class="text-gray-400 mb-6">Agrega tu primera dirección para realizar pedidos</p>
            <Button label="Agregar Primera Dirección" icon="pi pi-plus" class="bg-blue-600 border-blue-600 hover:bg-blue-700" @click="openAddressForm()" />
        </div>

        <!-- Lista de direcciones -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
                v-for="address in addresses"
                :key="address.id"
                class="border rounded-lg p-4 hover:shadow-md transition-shadow"
                :class="{
                    'ring-2 ring-blue-500 bg-blue-50': address.is_main,
                    'border-gray-200': !address.is_main
                }"
            >
                <!-- Badge de dirección principal -->
                <div v-if="address.is_main" class="flex items-center mb-3">
                    <span class="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                        <i class="pi pi-star mr-1"></i>
                        Dirección Principal
                    </span>
                </div>

                <!-- Información de la dirección -->
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800 mb-2">
                        {{ address.address_full }}
                    </h4>
                    <div class="text-sm text-gray-600 space-y-1">
                        <div class="flex items-center">
                            <i class="pi pi-map-marker mr-2 text-gray-400"></i>
                            <span>{{ address.district }}, {{ address.province }}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="pi pi-building mr-2 text-gray-400"></i>
                            <span>{{ address.department }}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="pi pi-envelope mr-2 text-gray-400"></i>
                            <span>{{ address.postal_code }}</span>
                        </div>
                        <div v-if="address.reference" class="flex items-center">
                            <i class="pi pi-info-circle mr-2 text-gray-400"></i>
                            <span>{{ address.reference }}</span>
                        </div>
                    </div>
                </div>

                <!-- Acciones -->
                <div class="flex justify-between items-center pt-3 border-t border-gray-200">
                    <div class="flex space-x-2">
                        <Button v-tooltip="'Editar dirección'" icon="pi pi-pencil" size="small" class="p-button-outlined p-button-sm" @click="openAddressForm(address)" />
                        <Button v-tooltip="'Eliminar dirección'" icon="pi pi-trash" size="small" class="p-button-outlined p-button-danger p-button-sm" :disabled="addresses.length === 1" @click="confirmDeleteAddress(address)" />
                    </div>

                    <Button v-if="!address.is_main" label="Hacer Principal" size="small" class="p-button-text p-button-sm text-blue-600" :loading="isLoading" @click="setMainAddress(address.id)" />
                </div>
            </div>
        </div>

        <!-- Modal de formulario de dirección -->
        <Dialog v-model:visible="showAddressForm" modal :header="editingAddress ? 'Editar Dirección' : 'Agregar Dirección'" :style="{ width: '90vw', maxWidth: '600px' }" class="address-dialog">
            <AddressForm :address="editingAddress" @saved="handleAddressSaved" @cancelled="closeAddressForm" />
        </Dialog>

        <!-- Diálogo de confirmación de eliminación -->
        <Dialog v-model:visible="deleteConfirmDialog" modal header="Confirmar Eliminación" :style="{ width: '90vw', maxWidth: '400px' }">
            <div class="text-center py-4">
                <i class="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4"></i>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">¿Estás seguro?</h3>
                <p class="text-gray-600 mb-4">Esta acción eliminará permanentemente la dirección:</p>
                <div v-if="addressToDelete" class="bg-gray-50 p-3 rounded-lg mb-4">
                    <p class="font-medium text-gray-800">{{ addressToDelete.address_full }}</p>
                    <p class="text-sm text-gray-600">{{ addressToDelete.district }}, {{ addressToDelete.province }}, {{ addressToDelete.department }}</p>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end space-x-2">
                    <Button label="Cancelar" class="p-button-outlined" @click="deleteConfirmDialog = false" />
                    <Button label="Eliminar" class="p-button-danger" :loading="isLoading" @click="deleteAddress" />
                </div>
            </template>
        </Dialog>

        <!-- Toast para notificaciones -->
        <Toast />
    </div>
</template>

<style scoped>
.card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.address-dialog .p-dialog-header) {
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

:deep(.address-dialog .p-dialog-content) {
    padding: 1.5rem;
}

.grid > div {
    min-height: 200px;
}
</style>
