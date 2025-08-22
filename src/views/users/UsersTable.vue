<script setup>
import { useRolesStore } from '@/stores/roles';
import { FilterMatchMode } from '@primevue/core/api';
import { ref } from 'vue';

const rolesStore = useRolesStore();

const props = defineProps({
    users: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'delete', 'view', 'refresh']);

const dt = ref();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const getAvatarColor = (name) => {
    if (!name) return '#6366f1';
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

const getRoleDisplayName = (data) => {
    // Si role_name existe directamente en data, usarlo
    if (data.role_name) {
        return data.role_name;
    }
    // Si role es un objeto, usar su propiedad name
    if (typeof data.role === 'object' && data.role?.name) {
        return data.role.name;
    }
    // Si role es un string, usarlo directamente
    if (typeof data.role === 'string') {
        return data.role;
    }
    return 'Sin rol';
};

const getRoleSeverity = (data) => {
    const roleName = getRoleDisplayName(data);
    return rolesStore.getRoleSeverity(roleName);
};

const getStatusSeverity = (status) => {
    if (typeof status === 'boolean') {
        return status ? 'success' : 'danger';
    }

    switch (status?.toString().toLowerCase()) {
        case 'active':
        case 'activo':
        case '1':
        case 'true':
            return 'success';
        case 'inactive':
        case 'inactivo':
        case '0':
        case 'false':
            return 'danger';
        case 'pending':
        case 'pendiente':
            return 'warning';
        default:
            return 'info';
    }
};

const getStatusLabel = (status) => {
    if (typeof status === 'boolean') {
        return status ? 'Activo' : 'Inactivo';
    }

    switch (status?.toString().toLowerCase()) {
        case 'active':
        case 'activo':
        case '1':
        case 'true':
            return 'Activo';
        case 'inactive':
        case 'inactivo':
        case '0':
        case 'false':
            return 'Inactivo';
        case 'pending':
        case 'pendiente':
            return 'Pendiente';
        default:
            return 'Desconocido';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'Fecha inválida';
    }
};

const viewUser = (user) => {
    emit('view', user);
};

const editUser = (user) => {
    emit('edit', user);
};

const deleteUser = (user) => {
    emit('delete', user);
};

const refreshData = () => {
    emit('refresh');
};

const exportCSV = () => {
    dt.value.exportCSV();
};
</script>

<template>
    <div class="users-table">
        <DataTable
            ref="dt"
            v-model:filters="filters"
            :value="users"
            :paginator="true"
            :rows="10"
            :rows-per-page-options="[5, 10, 25, 50]"
            :loading="loading"
            data-key="id"
            filter-display="menu"
            :global-filter-fields="['name', 'email', 'role_name', 'phone', 'dni']"
            responsive-layout="scroll"
            class="p-datatable-gridlines"
            :meta-key-selection="false"
            :row-hover="true"
        >
            <!-- <template #header>
                <div class="table-header-filters">
                    <div class="flex justify-content-end">
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="filters['global'].value" placeholder="Buscar usuarios..." class="w-full sm:w-auto" />
                        </IconField>
                    </div>
                </div>
            </template> -->
            <template #empty>
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <h3 class="empty-title">No hay usuarios disponibles</h3>
                    <p class="empty-message">Aún no se han registrado usuarios en el sistema. Comienza creando tu primer usuario.</p>
                </div>
            </template>

            <template #loading>
                <div class="text-center py-4">
                    <ProgressSpinner style="width: 50px; height: 50px" stroke-width="8" />
                    <p class="text-500 mt-2">Cargando usuarios...</p>
                </div>
            </template>

            <Column field="id" header="ID" :sortable="true" style="min-width: 4rem">
                <template #body="{ data }">
                    <Badge :value="data.id" class="p-badge-secondary" />
                </template>
            </Column>

            <Column field="name" header="Nombre" :sortable="true" style="min-width: 12rem">
                <template #body="{ data }">
                    <div class="flex flex-column">
                        <span class="font-semibold">{{ data.name || 'Sin nombre' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="email" header="Email" :sortable="true" style="min-width: 14rem">
                <template #body="{ data }">
                    <div class="flex align-items-center">
                        <i class="pi pi-envelope text-400 mr-2"></i>
                        <span>{{ data.email || 'Sin email' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="dni" header="DNI" :sortable="true" style="min-width: 8rem">
                <template #body="{ data }">
                    <div class="flex align-items-center">
                        <i class="pi pi-id-card text-400 mr-2"></i>
                        <span>{{ data.dni || 'Sin DNI' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="phone" header="Teléfono" :sortable="true" style="min-width: 10rem">
                <template #body="{ data }">
                    <div class="flex align-items-center">
                        <i class="pi pi-phone text-400 mr-2"></i>
                        <span>{{ data.phone || 'Sin teléfono' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="role" header="Rol" :sortable="true" style="min-width: 8rem">
                <template #body="{ data }">
                    <Tag :value="getRoleDisplayName(data)" :severity="getRoleSeverity(data)" class="text-sm" />
                </template>
            </Column>

            <Column field="is_active" header="Estado" :sortable="true" style="min-width: 8rem">
                <template #body="{ data }">
                    <Tag :value="getStatusLabel(data.is_active)" :severity="getStatusSeverity(data.is_active)" class="text-sm" />
                </template>
            </Column>

            <Column header="Acciones" style="min-width: 10rem">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button v-tooltip.top="'Editar'" icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-warning" @click="editUser(data)" />
                        <Button v-tooltip.top="'Eliminar'" icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="deleteUser(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.users-table {
    background: var(--surface-card, #fff);
    border-radius: 12px;
    box-shadow: 0 4px 24px 0 rgba(60, 60, 60, 0.07);
    padding: 1.5rem 1rem;
    margin-bottom: 2rem;
    transition: box-shadow 0.25s;
}

:deep(.p-datatable) {
    border-radius: 12px;
    overflow: hidden;
    font-size: 1rem;
    background: transparent;
}

:deep(.p-datatable .p-datatable-header) {
    background: var(--surface-section, #f8f9fa);
    border-bottom: 1px solid var(--surface-border, #e9ecef);
    padding: 1.25rem 1.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 2;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
    transition: background 0.2s;
}
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background: var(--surface-hover, #f1f5f9);
}
:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
    background: var(--surface-striped, #fcfcfd);
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid var(--surface-border, #ececec);
}

:deep(.p-datatable .p-datatable-tbody > tr:last-child > td) {
    border-bottom: none;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    background: var(--surface-section, #f8f9fa);
    font-weight: 600;
    font-size: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: 2px solid var(--surface-border, #e9ecef);
    position: sticky;
    top: 0;
    z-index: 2;
}

:deep(.p-paginator) {
    background: var(--surface-section, #f8f9fa);
    border-top: 1px solid var(--surface-border, #e9ecef);
    padding: 0.75rem 1.25rem;
}

:deep(.p-tag) {
    border-radius: 8px;
    font-size: 0.92rem;
    padding: 0.2rem 0.8rem;
    font-weight: 500;
}

:deep(.p-badge) {
    font-size: 0.95rem;
    padding: 0.25em 0.7em;
    border-radius: 6px;
}

:deep(.p-button) {
    transition:
        box-shadow 0.2s,
        background 0.2s;
}
:deep(.p-button.p-button-text) {
    color: var(--primary-color, #6366f1);
    background: transparent;
}
:deep(.p-button.p-button-text:hover) {
    background: var(--primary-color-hover, #ecebfc);
}
:deep(.p-button.p-button-info) {
    color: #2563eb;
}
:deep(.p-button.p-button-warning) {
    color: #f59e0b;
}
:deep(.p-button.p-button-danger) {
    color: #ef4444;
}

:deep(.p-inputtext) {
    border-radius: 8px;
    font-size: 1rem;
    padding: 0.5rem 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td .pi) {
    font-size: 1.1rem;
    margin-right: 0.5rem;
    vertical-align: middle;
    opacity: 0.7;
}

/* Responsive */
@media (max-width: 900px) {
    .users-table {
        padding: 0.5rem 0.2rem;
    }
    :deep(.p-datatable .p-datatable-thead > tr > th),
    :deep(.p-datatable .p-datatable-tbody > tr > td) {
        padding: 0.6rem 0.4rem;
        font-size: 0.97rem;
    }
    :deep(.p-paginator) {
        padding: 0.5rem 0.4rem;
    }
}

/* Modo oscuro */
:root[data-theme='dark'] .users-table {
    background: #23272f;
    box-shadow: 0 4px 24px 0 rgba(20, 20, 20, 0.25);
}
:root[data-theme='dark'] :deep(.p-datatable .p-datatable-header),
:root[data-theme='dark'] :deep(.p-datatable .p-datatable-thead > tr > th),
:root[data-theme='dark'] :deep(.p-paginator) {
    background: #23272f;
    border-color: #363b45;
    color: #e1e1e1;
}
:root[data-theme='dark'] :deep(.p-datatable .p-datatable-tbody > tr > td) {
    border-color: #363b45;
}
:root[data-theme='dark'] :deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background: #2c313a;
}
:root[data-theme='dark'] :deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
    background: #23272f;
}

/* Empty State Styles */
.empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: var(--text-color-secondary);
}

.empty-icon {
    width: 80px;
    height: 80px;
    background: var(--surface-border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem auto;
}

.empty-icon i {
    font-size: 2rem;
    color: var(--text-color-secondary);
}

.empty-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
}

.empty-message {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    max-width: 400px;
    margin: 0 auto;
}

/* Dark mode support for empty state */
[data-theme='dark'] .empty-icon {
    background: var(--surface-ground);
}

/* Table header filters */
.table-header-filters {
    padding: 1rem;
    background: var(--surface-section);
    border-bottom: 1px solid var(--surface-border);
}

.table-header-filters :deep(.p-inputtext) {
    border-radius: 8px;
    border: 1px solid var(--surface-border);
    background: var(--surface-card);
    padding: 0.75rem 2.5rem 0.75rem 0.75rem;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.table-header-filters :deep(.p-inputtext:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.table-header-filters :deep(.p-icon-field .p-input-icon) {
    right: 0.75rem;
    left: auto;
    color: var(--text-color-secondary);
}
</style>
