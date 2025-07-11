// src/composables/useUsersCrud.js
import { ref, onMounted, onBeforeMount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import { Positions } from '@/constants/positions';
import { useUsersStore } from '@/stores/usersStore';
import { exportToExcel } from '@/utils/excelUtils';
import { userSchema } from '@/schemas/userSchema';

export function useUsersCrud() {
    const toast = useToast();
    const usersStore = useUsersStore();

    const users = ref([]);
    const filters = ref(null);
    const selectedUser = ref(null);
    const userDialog = ref(false);
    const deleteDialog = ref(false);
    const submitted = ref(false);

    // Inicialización del formulario con vee-validate
    const { handleSubmit, resetForm, setValues, setFieldValue, validate } = useForm({
        validationSchema: userSchema,
        initialValues: {
            id: null,
            name: '',
            dni: '',
            email: '',
            phone: '',
            position: '',
            is_active: true
        },
        validateOnMount: false,
        validateOnChange: true
    });
    const positions = Object.entries(Positions).map(([key, value]) => ({
        label: value,
        value: value
    }));

    function initFilters() {
        filters.value = {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
            dni: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
            email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
            phone: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
            position: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
            is_active: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
        };
    }

    const clearFilter = () => {
        initFilters();
    };

    const openNew = () => {
        resetForm();
        submitted.value = false;
        userDialog.value = true;
    };

    const editUser = (user) => {
        setValues(user);
        userDialog.value = true;
    };

    const confirmDelete = (user) => {
        selectedUser.value = user;
        deleteDialog.value = true;
    };

    const hideDialog = () => {
        userDialog.value = false;
    };

    const hideDeleteDialog = () => {
        deleteDialog.value = false;
    };

    const fetchUsers = async () => {
        try {
            await usersStore.fetchUsers();
            if (usersStore.success) {
                users.value = usersStore.usersList;
                toast.add({ severity: 'success', summary: 'Usuarios cargados', detail: usersStore.message, life: 3000 });
            } else {
                if (usersStore.validationErrors && usersStore.validationErrors.length > 0) {
                    usersStore.validationErrors.forEach((err) => {
                        toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
                    });
                } else {
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: usersStore.message || 'Error al cargar usuarios',
                        life: 3000
                    });
                }
            }
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Error al cargar usuarios',
                life: 3000
            });
        }
    };

    const submitUser = handleSubmit(async (values) => {
        if (values.id) {
            await usersStore.updateUser(values, values.id);
        } else {
            await usersStore.createUser(values);
        }

        if (usersStore.success) {
            users.value = usersStore.usersList;
            toast.add({ severity: 'success', summary: 'Éxito', detail: usersStore.message, life: 3000 });
            userDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: usersStore.message, life: 3000 });
        }
    });

    const deleteUser = async () => {
        if (!selectedUser.value) return;

        await usersStore.removeUser(selectedUser.value.id);

        if (usersStore.success) {
            users.value = usersStore.usersList;
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado correctamente', life: 3000 });
        } else {
            if (usersStore.validationErrors && usersStore.validationErrors.length > 0) {
                usersStore.validationErrors.forEach((err) => {
                    toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
                });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: usersStore.message, life: 3000 });
            }
        }

        deleteDialog.value = false;
    };

    const exportUsers = async () => {
        const columns = [
            { header: 'Nombre', key: 'name', width: 25 },
            { header: 'DNI', key: 'dni', width: 15 },
            { header: 'Teléfono', key: 'phone', width: 15 },
            { header: 'Email', key: 'email', width: 20 },
            { header: 'Cargo', key: 'position', width: 15 },
            { header: 'Activo', key: 'is_active', width: 15 },
            { header: 'Empresa', key: 'company_name', width: 25 }
        ];

        await exportToExcel(columns, users.value, 'Usuarios', 'Usuarios');
    };

    onBeforeMount(() => {
        initFilters();
    });

    onMounted(() => {
        fetchUsers();
    });

    return {
        users,
        filters,
        userDialog,
        deleteDialog,
        userForm,
        selectedUser,
        submitted,
        usersStore,
        positions,

        // Métodos
        openNew,
        editUser,
        confirmDelete,
        hideDialog,
        hideDeleteDialog,
        clearFilter,
        submitUser,
        deleteUser,
        exportUsers
    };
}
