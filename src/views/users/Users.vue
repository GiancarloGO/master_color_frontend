<script setup>
import { useRolesStore } from '@/stores/roles';
import { useUsersStore } from '@/stores/users';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import UserForm from './UserForm.vue';
import UsersTable from './UsersTable.vue';

const usersStore = useUsersStore();
const rolesStore = useRolesStore();
const toast = useToast();

const userDialog = ref(false);
const deleteUserDialog = ref(false);
const selectedUser = ref({});
const dialogMode = ref('create');
const searchQuery = ref('');

// Computed properties
const activeUsersCount = computed(() => {
    return usersStore.usersList?.filter((user) => user.active !== false).length || 0;
});

const filteredUsers = computed(() => {
    if (!searchQuery.value) {
        return usersStore.usersList || [];
    }

    return usersStore.usersList?.filter((user) => 
        user.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.dni?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.role_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    ) || [];
});

const openNew = () => {
    selectedUser.value = {};
    dialogMode.value = 'create';
    userDialog.value = true;
};

const editUser = (user) => {
    selectedUser.value = { ...user };
    dialogMode.value = 'edit';
    userDialog.value = true;
};

const hideDialog = () => {
    userDialog.value = false;
    selectedUser.value = {};
};

const handleSaveUser = async (userData) => {
    try {
        if (dialogMode.value === 'create') {
            await usersStore.createUser(userData);
            toast.add({
                severity: 'success',
                summary: 'Usuario Creado',
                detail: 'El usuario se ha creado correctamente',
                life: 4000
            });
        } else {
            await usersStore.updateUser(selectedUser.value.id, userData);
            toast.add({
                severity: 'success',
                summary: 'Usuario Actualizado',
                detail: 'Los cambios se han guardado correctamente',
                life: 4000
            });
        }

        await usersStore.fetchUsers();
        hideDialog();
    } catch (error) {
        if (usersStore.validationErrors) {
            for (let i = 0; i < usersStore.validationErrors.length; i++) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: usersStore.validationErrors[i],
                    life: 5000
                });
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: usersStore.message || 'Ha ocurrido un error inesperado',
                life: 5000
            });
        }
    }
};

const confirmDeleteUser = (user) => {
    selectedUser.value = user;
    deleteUserDialog.value = true;
};

const deleteUser = async () => {
    try {
        await usersStore.deleteUser(selectedUser.value.id);
        deleteUserDialog.value = false;
        selectedUser.value = {};

        toast.add({
            severity: 'success',
            summary: 'Usuario Eliminado',
            detail: 'El usuario se ha eliminado correctamente',
            life: 4000
        });

        await usersStore.fetchUsers();
    } catch (error) {
        if (usersStore.validationErrors) {
            for (let i = 0; i < usersStore.validationErrors.length; i++) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: usersStore.validationErrors[i],
                    life: 5000
                });
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: usersStore.message || 'No se pudo eliminar el usuario',
                life: 5000
            });
        }
    }
};

onMounted(async () => {
    await usersStore.fetchUsers();
    await rolesStore.fetchRoles();
});
</script>

<template>
    <div class="users-management">
        <!-- Header Section with Gradient Background -->
        <div class="header-section">
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-users"></i>
                    </div>
                    <div>
                        <h1 class="main-title">Gestión de Usuarios</h1>
                        <p class="subtitle">Administra y controla los usuarios del sistema</p>
                    </div>
                </div>
                <Button label="Nuevo Usuario" icon="pi pi-plus" class="create-button" raised @click="openNew" />
            </div>
        </div>

        <!-- Main Content Card -->
        <div class="content-card">
            <div class="table-header">
                <h2 class="table-title">Lista de Usuarios</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="pi pi-search"></i>
                        <input v-model="searchQuery" type="text" placeholder="Buscar usuarios..." class="search-input" />
                    </div>
                </div>
            </div>

            <UsersTable :users="filteredUsers" :loading="usersStore.loading" @edit="editUser" @delete="confirmDeleteUser" />
        </div>

        <!-- Enhanced User Dialog -->
        <Dialog v-model:visible="userDialog" :style="{ width: '650px' }" :header="selectedUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'" :modal="true" class="user-dialog">
            <template #header>
                <div class="dialog-header">
                    <div class="dialog-icon">
                        <i :class="selectedUser?.id ? 'pi pi-user-edit' : 'pi pi-user-plus'"></i>
                    </div>
                    <div>
                        <h3>{{ selectedUser?.id ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
                        <p>{{ selectedUser?.id ? 'Modifica la información del usuario' : 'Completa los datos del nuevo usuario' }}</p>
                    </div>
                </div>
            </template>

            <UserForm :user="selectedUser" :loading="usersStore.loading" @submit="handleSaveUser" @cancel="hideDialog" />
        </Dialog>

        <!-- Enhanced Delete Dialog -->
        <Dialog v-model:visible="deleteUserDialog" :style="{ width: '480px' }" header="Confirmar Eliminación" :modal="true" class="delete-dialog">
            <template #header>
                <div class="dialog-header danger">
                    <div class="dialog-icon danger">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div>
                        <h3>Confirmar Eliminación</h3>
                        <p>Esta acción no se puede deshacer</p>
                    </div>
                </div>
            </template>

            <div class="delete-content">
                <div class="warning-box">
                    <i class="pi pi-info-circle"></i>
                    <div>
                        <p class="warning-text">
                            ¿Estás seguro de que quieres eliminar a
                            <strong>{{ selectedUser.name }}</strong
                            >?
                        </p>
                        <p class="warning-subtext">Se perderán todos los datos asociados al usuario.</p>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-actions">
                    <Button label="Cancelar" icon="pi pi-times" class="cancel-button" outlined @click="deleteUserDialog = false" />
                    <Button label="Eliminar" icon="pi pi-trash" class="delete-button" :loading="usersStore.loading" @click="deleteUser" />
                </div>
            </template>
        </Dialog>

        <Toast position="top-right" />
    </div>
</template>

<style scoped>
.users-management {
    min-height: 100vh;
}

/* Header Section */
.header-section {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    padding: 1rem;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.title-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.icon-wrapper {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.main-title {
    margin: 0;
    font-size: 2.2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.subtitle {
    margin: 0.5rem 0 0 0;
    color: var(--text-color-secondary);
    font-size: 1rem;
}

.create-button {
    background: linear-gradient(135deg, #10b981, #059669) !important;
    border: none !important;
    padding: 0.875rem 2rem !important;
    font-weight: 600 !important;
    border-radius: 12px !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3) !important;
}

.create-button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4) !important;
}

/* Content Card */
.content-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 20px;
    padding: 2rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px var(--shadow-color);
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--surface-border);
}

.table-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
}

.search-box i {
    position: absolute;
    left: 1rem;
    color: var(--text-color-secondary);
    z-index: 1;
}

.search-input {
    padding: 0.75rem 1rem 0.75rem 3rem;
    border: 2px solid var(--surface-border);
    border-radius: 12px;
    background: var(--surface-ground);
    color: var(--text-color);
    font-size: 0.9rem;
    transition: all 0.3s ease;
    width: 300px;
}

.search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
    color: var(--text-color-secondary);
}

/* Dialog Enhancements */
.user-dialog :deep(.p-dialog-content) {
    padding: 0;
}

.delete-dialog :deep(.p-dialog-content) {
    padding: 0;
}

.dialog-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: var(--surface-section);
    margin: -1.5rem -2rem 0.2rem -1.2rem;
    border-radius: 12px 12px 0 0;
    border-bottom: 1px solid var(--surface-border);
}

.dialog-header.danger {
    background: var(--red-50);
    border-bottom: 1px solid var(--red-200);
}

/* Dark mode specific styles for danger dialog */
[data-theme='dark'] .dialog-header.danger {
    background: rgba(239, 68, 68, 0.1);
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
}

.dialog-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}

.dialog-icon.danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

.dialog-header h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-color);
}

.dialog-header p {
    margin: 0.25rem 0 0 0;
    color: var(--text-color-secondary);
    font-size: 0.85rem;
}

.delete-content {
    padding: 0 2rem 1.5rem 2rem;
}

.warning-box {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--yellow-50);
    border: 1px solid var(--yellow-200);
    border-radius: 12px;
}

.warning-box i {
    color: var(--yellow-600);
    font-size: 1.2rem;
    margin-top: 0.2rem;
}

.warning-text {
    margin: 0 0 0.5rem 0;
    font-weight: 500;
    color: var(--yellow-800);
}

.warning-subtext {
    margin: 0;
    font-size: 0.85rem;
    color: var(--yellow-700);
}

/* Dark mode specific styles for warning box */
[data-theme='dark'] .warning-box {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
}

[data-theme='dark'] .warning-box i {
    color: var(--yellow-400);
}

[data-theme='dark'] .warning-text {
    color: var(--yellow-200);
}

[data-theme='dark'] .warning-subtext {
    color: var(--yellow-300);
}

.dialog-actions {
    display: flex;
    gap: 0.75rem;
    padding: 1.5rem 2rem;
    background: var(--surface-section);
    margin: 1.5rem -2rem -1.5rem -2rem;
    border-radius: 0 0 12px 12px;
    justify-content: flex-end;
    border-top: 1px solid var(--surface-border);
}

.cancel-button {
    background: transparent !important;
    color: var(--text-color-secondary) !important;
    border: 2px solid var(--surface-border) !important;
}

.delete-button {
    background: linear-gradient(135deg, #ef4444, #dc2626) !important;
    border: none !important;
    color: white !important;
}

/* CSS Variables for Dark Mode Support */
:root {
    --shadow-color: rgba(0, 0, 0, 0.1);
    --shadow-color-hover: rgba(0, 0, 0, 0.15);
}

[data-theme='dark'] {
    --shadow-color: rgba(0, 0, 0, 0.3);
    --shadow-color-hover: rgba(0, 0, 0, 0.4);
}

/* Additional dark mode enhancements */
[data-theme='dark'] .users-management {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

[data-theme='dark'] .icon-wrapper {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
}

[data-theme='dark'] .create-button {
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2) !important;
}

[data-theme='dark'] .create-button:hover {
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.3) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
    .users-management {
        padding: 1rem;
    }

    .header-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
    }

    .table-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .search-input {
        width: 100%;
    }

    .stats-section {
        grid-template-columns: 1fr;
    }
}
</style>
