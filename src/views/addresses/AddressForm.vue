<script setup>
import { useAddressesStore } from '@/stores/addresses';
import { UbigeoPostal } from '@/utils/ubigeoPostal';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

// Props
const props = defineProps({
    address: {
        type: Object,
        default: null
    }
});

// Emits
const emit = defineEmits(['saved', 'cancelled']);

const addressesStore = useAddressesStore();
const toast = useToast();

// Estado del formulario
const addressFull = ref('');
const selectedDepartment = ref(null);
const selectedProvince = ref(null);
const selectedDistrict = ref(null);
const postalCode = ref('');
const reference = ref('');
const isMain = ref(false);
const loading = ref(false);

// Datos de ubigeo
const departments = ref([]);
const provinces = ref([]);
const districts = ref([]);

// Datos filtrados para AutoComplete
const filteredDepartments = ref([]);
const filteredProvinces = ref([]);
const filteredDistricts = ref([]);

// Errores de validación
const errors = ref({});

// Instancia de ubigeo
const ubigeo = new UbigeoPostal();

// Computed
const isEditing = computed(() => !!props.address);
const hasMainAddress = computed(() => !!addressesStore.getMainAddress);

// Métodos de filtrado para AutoComplete
const filterDepartments = (event) => {
    const query = event.query.toLowerCase();
    filteredDepartments.value = departments.value.filter((dept) => dept.label.toLowerCase().includes(query));
};

const filterProvinces = (event) => {
    const query = event.query.toLowerCase();
    filteredProvinces.value = provinces.value.filter((prov) => prov.label.toLowerCase().includes(query));
};

const filterDistricts = (event) => {
    const query = event.query.toLowerCase();
    filteredDistricts.value = districts.value.filter((dist) => dist.label.toLowerCase().includes(query));
};

const isLoadingFormData = ref(false);
const skipDepartmentWatch = ref(false);
const skipProvinceWatch = ref(false);
const skipDistrictWatch = ref(false);

watch(selectedDepartment, (newDepartment) => {
    if (isLoadingFormData.value || skipDepartmentWatch.value) {
        return;
    }

    if (newDepartment && newDepartment.name) {
        provinces.value = ubigeo.getProvincesByDepartment(newDepartment.name);
        selectedProvince.value = null;
        selectedDistrict.value = null;
        districts.value = [];
        postalCode.value = '';
    } else {
        provinces.value = [];
        districts.value = [];
        selectedProvince.value = null;
        selectedDistrict.value = null;
        postalCode.value = '';
    }
});

watch(selectedProvince, (newProvince) => {
    if (isLoadingFormData.value || skipProvinceWatch.value) {
        return;
    }

    if (newProvince && newProvince.name) {
        districts.value = ubigeo.getDistrictsByProvince(newProvince.name);
        selectedDistrict.value = null;
        postalCode.value = '';
    } else {
        districts.value = [];
        selectedDistrict.value = null;
        postalCode.value = '';
    }
});

watch(selectedDistrict, (newDistrict) => {
    if (isLoadingFormData.value || skipDistrictWatch.value) {
        return;
    }

    if (newDistrict && newDistrict.postalCode) {
        postalCode.value = newDistrict.postalCode;
    }
});

// Validación
const validateForm = () => {
    errors.value = {};
    let isValid = true;

    if (!addressFull.value.trim()) {
        errors.value.address_full = 'La dirección completa es requerida';
        isValid = false;
    } else if (addressFull.value.length > 255) {
        errors.value.address_full = 'La dirección no puede exceder 255 caracteres';
        isValid = false;
    }

    if (!selectedDepartment.value) {
        errors.value.department = 'El departamento es requerido';
        isValid = false;
    }

    if (!selectedProvince.value) {
        errors.value.province = 'La provincia es requerida';
        isValid = false;
    }

    if (!selectedDistrict.value) {
        errors.value.district = 'El distrito es requerido';
        isValid = false;
    }

    if (!postalCode.value.trim()) {
        errors.value.postal_code = 'El código postal es requerido';
        isValid = false;
    } else if (!/^\d{5}$/.test(postalCode.value)) {
        errors.value.postal_code = 'El código postal debe tener 5 dígitos';
        isValid = false;
    }

    if (reference.value && reference.value.length > 255) {
        errors.value.reference = 'La referencia no puede exceder 255 caracteres';
        isValid = false;
    }

    return isValid;
};

const loadFormData = async () => {
    if (props.address) {
        isLoadingFormData.value = true;

        try {
            addressFull.value = props.address.address_full || '';
            reference.value = props.address.reference || '';
            isMain.value = props.address.is_main || false;
            postalCode.value = props.address.postal_code || '';

            const departmentOption = departments.value.find((dept) => dept.name === props.address.department);

            if (departmentOption) {
                provinces.value = ubigeo.getProvincesByDepartment(departmentOption.name);

                const provinceOption = provinces.value.find((prov) => prov.name === props.address.province);

                if (provinceOption) {
                    districts.value = ubigeo.getDistrictsByProvince(provinceOption.name);

                    const districtOption = districts.value.find((dist) => dist.name === props.address.district);

                    skipDepartmentWatch.value = true;
                    skipProvinceWatch.value = true;
                    skipDistrictWatch.value = true;

                    await nextTick(() => {
                        selectedDepartment.value = departmentOption;
                        selectedProvince.value = provinceOption;
                        if (districtOption) {
                            selectedDistrict.value = districtOption;
                        }
                    });

                    await nextTick(() => {
                        skipDepartmentWatch.value = false;
                        skipProvinceWatch.value = false;
                        skipDistrictWatch.value = false;
                    });
                }
            }
        } finally {
            await nextTick(() => {
                isLoadingFormData.value = false;
            });
        }
    } else {
        resetForm();
        if (!hasMainAddress.value) {
            isMain.value = true;
        }
    }
};

const resetForm = () => {
    addressFull.value = '';
    selectedDepartment.value = null;
    selectedProvince.value = null;
    selectedDistrict.value = null;
    postalCode.value = '';
    reference.value = '';
    isMain.value = false;
    errors.value = {};
    provinces.value = [];
    districts.value = [];
};

const saveAddress = async () => {
    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'Por favor corrige los errores en el formulario',
            life: 4000
        });
        return;
    }

    loading.value = true;

    const addressData = {
        address_full: addressFull.value.trim(),
        department: selectedDepartment.value.name,
        province: selectedProvince.value.name,
        district: selectedDistrict.value.name,
        postal_code: postalCode.value.trim(),
        reference: reference.value.trim() || null,
        is_main: isMain.value
    };

    try {
        let result;
        if (isEditing.value) {
            result = await addressesStore.updateAddress(props.address.id, addressData);
        } else {
            result = await addressesStore.createAddress(addressData);
        }

        if (result.success) {
            emit('saved');
        } else {
            if (result.errors && typeof result.errors === 'object') {
                Object.keys(result.errors).forEach((field) => {
                    if (Array.isArray(result.errors[field])) {
                        errors.value[field] = result.errors[field][0];
                    }
                });
            }

            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al guardar la dirección',
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al guardar la dirección',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const cancel = () => {
    emit('cancelled');
};

onMounted(async () => {
    departments.value = ubigeo.getDepartments();
    await loadFormData();
});

watch(
    () => props.address,
    async () => {
        await loadFormData();
    },
    { immediate: false }
);
</script>

<template>
    <form class="space-y-4" @submit.prevent="saveAddress">
        <!-- Dirección completa -->
        <div>
            <label for="address_full" class="block text-sm font-medium text-gray-700 mb-2"> Dirección Completa * </label>
            <InputText id="address_full" v-model="addressFull" placeholder="Ej: Av. Principal 123, Dpto. 4B" class="w-full" :class="{ 'p-invalid': errors.address_full }" maxlength="255" />
            <small v-if="errors.address_full" class="text-red-500">{{ errors.address_full }}</small>
        </div>

        <!-- Ubicación en grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Departamento -->
            <div>
                <label for="department" class="block text-sm font-medium text-gray-700 mb-2"> Departamento * </label>
                <AutoComplete
                    id="department"
                    v-model="selectedDepartment"
                    :suggestions="filteredDepartments"
                    option-label="label"
                    placeholder="Seleccionar departamento"
                    force-selection
                    class="w-full"
                    :class="{ 'p-invalid': errors.department }"
                    dropdown
                    @complete="filterDepartments"
                />
                <small v-if="errors.department" class="text-red-500">{{ errors.department }}</small>
            </div>

            <!-- Provincia -->
            <div>
                <label for="province" class="block text-sm font-medium text-gray-700 mb-2"> Provincia * </label>
                <AutoComplete
                    id="province"
                    v-model="selectedProvince"
                    :suggestions="filteredProvinces"
                    option-label="label"
                    placeholder="Seleccionar provincia"
                    force-selection
                    :disabled="!selectedDepartment"
                    class="w-full"
                    :class="{ 'p-invalid': errors.province }"
                    dropdown
                    @complete="filterProvinces"
                />
                <small v-if="errors.province" class="text-red-500">{{ errors.province }}</small>
            </div>

            <!-- Distrito -->
            <div>
                <label for="district" class="block text-sm font-medium text-gray-700 mb-2"> Distrito * </label>
                <AutoComplete
                    id="district"
                    v-model="selectedDistrict"
                    :suggestions="filteredDistricts"
                    option-label="label"
                    placeholder="Seleccionar distrito"
                    force-selection
                    :disabled="!selectedProvince"
                    class="w-full"
                    :class="{ 'p-invalid': errors.district }"
                    dropdown
                    @complete="filterDistricts"
                />
                <small v-if="errors.district" class="text-red-500">{{ errors.district }}</small>
            </div>
        </div>

        <!-- Código postal y referencia -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Código postal -->
            <div>
                <label for="postal_code" class="block text-sm font-medium text-gray-700 mb-2"> Código Postal * </label>
                <InputText id="postal_code" v-model="postalCode" placeholder="Ej: 15074" class="w-full" :class="{ 'p-invalid': errors.postal_code }" maxlength="20" readonly />
                <small v-if="errors.postal_code" class="text-red-500">{{ errors.postal_code }}</small>
                <small v-else class="text-gray-500">Se completa automáticamente al seleccionar el distrito</small>
            </div>

            <!-- Referencia -->
            <div>
                <label for="reference" class="block text-sm font-medium text-gray-700 mb-2"> Referencia </label>
                <InputText id="reference" v-model="reference" placeholder="Ej: Frente al parque, Casa amarilla" class="w-full" :class="{ 'p-invalid': errors.reference }" maxlength="255" />
                <small v-if="errors.reference" class="text-red-500">{{ errors.reference }}</small>
                <small v-else class="text-gray-500">Opcional - Ayuda a ubicar tu dirección</small>
            </div>
        </div>

        <!-- Dirección principal -->
        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox id="is_main" v-model="isMain" binary :disabled="(isEditing && props.address?.is_main) || (!isEditing && !hasMainAddress)" />
            <label for="is_main" class="text-sm font-medium text-gray-700"> Establecer como dirección principal </label>
            <div class="ml-auto">
                <small v-if="isEditing && props.address?.is_main" class="text-blue-600"> Esta es tu dirección principal actual </small>
                <small v-else-if="!isEditing && !hasMainAddress" class="text-green-600"> Se establecerá como principal (primera dirección) </small>
                <small v-else class="text-gray-500"> Solo puedes tener una dirección principal </small>
            </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button label="Cancelar" class="p-button-outlined" :disabled="loading" @click="cancel" />
            <Button type="submit" :label="isEditing ? 'Actualizar' : 'Crear Dirección'" :loading="loading" class="bg-blue-600 border-blue-600 hover:bg-blue-700" />
        </div>
    </form>
</template>

<style scoped>
:deep(.p-autocomplete.p-invalid .p-autocomplete-input) {
    border-color: #f56565;
}

:deep(.p-inputtext.p-invalid) {
    border-color: #f56565;
}

:deep(.p-checkbox.p-invalid .p-checkbox-box) {
    border-color: #f56565;
}
</style>
