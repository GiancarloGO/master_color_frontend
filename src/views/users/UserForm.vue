<script setup>
import { computed, reactive, watch, onMounted } from 'vue';
import { useRolesStore } from '@/stores/roles';

const rolesStore = useRolesStore();

const props = defineProps({
    user: {
        type: Object,
        default: () => ({})
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['submit', 'cancel']);

const isEdit = computed(() => props.user && props.user.id);

// Usar roles dinámicos del store
const roleOptions = computed(() => rolesStore.getRoleOptions);

const formData = reactive({
    name: '',
    email: '',
    dni: '',
    phone: '',
    password: '',
    role_id: '',
    role_name: '',
    is_active: true
});

const errors = reactive({
    name: '',
    email: '',
    dni: '',
    password: '',
    role_name: ''
});

// Cargar roles al montar el componente
onMounted(async () => {
    if (rolesStore.rolesList.length === 0) {
        await rolesStore.fetchRoles();
    }
});

const clearErrors = () => {
    Object.keys(errors).forEach((key) => {
        errors[key] = '';
    });
};

const formatDNI = (event) => {
    formData.dni = event.target.value.replace(/\D/g, '');
};

// Función helper para obtener el rol por defecto
const getDefaultRoleName = () => {
    if (roleOptions.value.length > 0) {
        const defaultRole = roleOptions.value.find((role) => role.value.toLowerCase() === 'usuario') || roleOptions.value[0];
        return defaultRole.value;
    }
    return 'Usuario';
};

const getDefaultRoleId = () => {
    if (roleOptions.value.length > 0) {
        const defaultRole = roleOptions.value.find((role) => role.value.toLowerCase() === 'usuario') || roleOptions.value[0];
        return defaultRole.id;
    }
    return null;
};

const findRoleIdByName = (roleName) => {
    const role = roleOptions.value.find((r) => r.value.toLowerCase() === roleName.toLowerCase());
    return role ? role.id : null;
};

const onRoleChange = (event) => {
    const selectedRole = roleOptions.value.find((role) => role.id === event.value);
    if (selectedRole) {
        formData.role_name = selectedRole.value;
    }
};

// Watch for user prop changes
watch(
    () => props.user,
    (newUser) => {
        if (newUser && newUser.id) {
            formData.name = newUser.name || '';
            formData.email = newUser.email || '';
            formData.dni = newUser.dni || '';
            formData.phone = newUser.phone || '';

            // Para editar: buscar el role_id basado en role_name
            if (newUser.role_name) {
                formData.role_name = newUser.role_name;
                formData.role_id = findRoleIdByName(newUser.role_name) || newUser.role_id;
            } else {
                formData.role_name = getDefaultRoleName();
                formData.role_id = getDefaultRoleId();
            }

            formData.is_active = newUser.is_active !== undefined ? newUser.is_active : true;
            formData.password = '';
        } else {
            // Para crear: usar valores por defecto
            formData.name = '';
            formData.email = '';
            formData.dni = '';
            formData.phone = '';
            formData.password = '';
            formData.role_name = getDefaultRoleName();
            formData.role_id = getDefaultRoleId();
            formData.is_active = true;
        }
        clearErrors();
    },
    { immediate: true }
);

const validateForm = () => {
    clearErrors();
    let isValid = true;

    if (!formData.name.trim()) {
        errors.name = 'El nombre es requerido';
        isValid = false;
    }

    if (!formData.email.trim()) {
        errors.email = 'El email es requerido';
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'El formato del email no es válido';
        isValid = false;
    }

    if (!formData.dni.trim()) {
        errors.dni = 'El DNI es requerido';
        isValid = false;
    } else if (!/^\d{8}$/.test(formData.dni)) {
        errors.dni = 'El DNI debe tener 8 dígitos';
        isValid = false;
    }

    if (!isEdit.value && !formData.password.trim()) {
        errors.password = 'La contraseña es requerida';
        isValid = false;
    } else if (!isEdit.value && formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
        isValid = false;
    }

    if (!formData.role_id) {
        errors.role_name = 'El rol es requerido';
        isValid = false;
    }

    return isValid;
};

const handleSubmit = () => {
    if (validateForm()) {
        const submitData = { ...formData };

        if (isEdit.value) {
            delete submitData.password;
        }

        emit('submit', submitData);
    }
};
</script>

<template>
    <div class="compact-form">
        <form @submit.prevent="handleSubmit">
            <div class="form-grid">
                <!-- Fila 1: Nombre y Email -->
                <div class="form-row">
                    <div class="form-field">
                        <label for="name" class="field-label">Nombre *</label>
                        <InputText id="name" v-model="formData.name" :class="{ 'p-invalid': errors.name }" placeholder="Nombre completo" class="compact-input" />
                        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                    </div>
                    <div class="form-field">
                        <label for="email" class="field-label">Email *</label>
                        <InputText id="email" v-model="formData.email" :class="{ 'p-invalid': errors.email }" placeholder="correo@ejemplo.com" type="email" class="compact-input" />
                        <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
                    </div>
                </div>

                <!-- Fila 2: DNI y Teléfono -->
                <div class="form-row">
                    <div class="form-field">
                        <label for="dni" class="field-label">DNI *</label>
                        <InputText id="dni" v-model="formData.dni" :class="{ 'p-invalid': errors.dni }" placeholder="12345678" maxlength="8" class="compact-input" @input="formatDNI" />
                        <small v-if="errors.dni" class="p-error">{{ errors.dni }}</small>
                    </div>
                    <div class="form-field">
                        <label for="phone" class="field-label">Teléfono</label>
                        <InputText id="phone" v-model="formData.phone" placeholder="912345678" class="compact-input" />
                    </div>
                </div>

                <!-- Fila 3: Contraseña (solo crear) y Rol -->
                <div class="form-row">
                    <div v-if="!isEdit" class="form-field">
                        <label for="password" class="field-label">Contraseña *</label>
                        <Password id="password" v-model="formData.password" :class="{ 'p-invalid': errors.password }" placeholder="Mínimo 6 caracteres" toggle-mask :feedback="false" class="compact-input" fluid />
                        <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
                    </div>
                    <div class="form-field">
                        <label for="role" class="field-label">Rol *</label>
                        <Select
                            id="role"
                            v-model="formData.role_id"
                            :options="roleOptions"
                            option-label="value"
                            option-value="id"
                            :class="{ 'p-invalid': errors.role_name }"
                            placeholder="Seleccionar rol"
                            class="compact-input"
                            @change="onRoleChange"
                        />
                        <small v-if="errors.role_name" class="p-error">{{ errors.role_name }}</small>
                    </div>
                </div>

                <!-- Fila 4: Estado -->
                <div class="form-row">
                    <div class="form-field status-field">
                        <label class="field-label">Estado</label>
                        <div class="status-toggle">
                            <Checkbox id="is_active" v-model="formData.is_active" :binary="true" class="mr-2" />
                            <label for="is_active" class="status-label">
                                {{ formData.is_active ? 'Usuario activo' : 'Usuario inactivo' }}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Botones de acción -->
            <div class="form-actions">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" type="button" @click="$emit('cancel')" />
                <Button :label="isEdit ? 'Actualizar' : 'Crear'" :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'" type="submit" :loading="loading" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.compact-form {
    padding: 1rem;
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.status-field {
    grid-column: 1 / -1;
}

.field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 0.25rem;
}

.compact-input {
    height: 2.5rem;
}

.compact-input :deep(.p-inputtext) {
    height: 2.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.compact-input :deep(.p-password-input) {
    height: 2.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.compact-input :deep(.p-dropdown) {
    height: 2.5rem;
}

.compact-input :deep(.p-dropdown-label) {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.status-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
}

.status-label {
    font-size: 0.875rem;
    color: var(--text-color);
    cursor: pointer;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
}

.p-error {
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }

    .compact-form {
        padding: 0.75rem;
    }
}
</style>
