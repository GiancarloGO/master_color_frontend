<script setup>
import { useClientsStore } from '@/stores/clients';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import ClientForm from './ClientForm.vue';
import ClientsTable from './ClientsTable.vue';

const clientsStore = useClientsStore();
const toast = useToast();

const clientDialog = ref(false);
const deleteClientDialog = ref(false);
const selectedClient = ref({});
const dialogMode = ref('create');
const searchQuery = ref('');
const showDeleted = ref(false);

// Filtros adicionales
const clientTypeFilter = ref('');
const documentTypeFilter = ref('');
const verifiedFilter = ref('');

// Opciones para filtros
const clientTypeOptions = [
    { label: 'Todos los tipos', value: '' },
    { label: 'Persona Natural', value: 'individual' },
    { label: 'Empresa', value: 'company' }
];

const documentTypeOptions = [
    { label: 'Todos los documentos', value: '' },
    { label: 'DNI', value: 'DNI' },
    { label: 'RUC', value: 'RUC' },
    { label: 'Carnet de Extranjería', value: 'CE' },
    { label: 'Pasaporte', value: 'PASAPORTE' }
];

const verifiedOptions = [
    { label: 'Todos', value: '' },
    { label: 'Verificados', value: true },
    { label: 'No Verificados', value: false }
];

// Computed properties
const activeClientsCount = computed(() => {
    return clientsStore.clientsList?.length || 0;
});

const verifiedClientsCount = computed(() => {
    return clientsStore.getVerifiedClientsCount;
});

const filteredClients = computed(() => {
    const clients = showDeleted.value ? clientsStore.deletedClientsList : clientsStore.clientsList;
    
    if (!clients) return [];

    return clients.filter((client) => {
        const matchesSearch = !searchQuery.value || 
            client.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
            client.email?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            client.identity_document?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            client.phone?.toLowerCase().includes(searchQuery.value.toLowerCase());

        const matchesClientType = !clientTypeFilter.value || client.client_type === clientTypeFilter.value;
        const matchesDocumentType = !documentTypeFilter.value || client.document_type === documentTypeFilter.value;
        
        let matchesVerified = true;
        if (verifiedFilter.value !== '') {
            matchesVerified = verifiedFilter.value ? !!client.email_verified_at : !client.email_verified_at;
        }

        return matchesSearch && matchesClientType && matchesDocumentType && matchesVerified;
    });
});

const openNew = () => {
    selectedClient.value = {};
    dialogMode.value = 'create';
    clientDialog.value = true;
};

const editClient = (client) => {
    selectedClient.value = { ...client };
    dialogMode.value = 'edit';
    clientDialog.value = true;
};

const viewClient = async (client) => {
    // Cargar datos completos del cliente
    await clientsStore.fetchClientById(client.id);
    selectedClient.value = { ...clientsStore.currentClient };
    dialogMode.value = 'view';
    clientDialog.value = true;
};

const hideDialog = () => {
    clientDialog.value = false;
    selectedClient.value = {};
    clientsStore.clearCurrentClient();
};

const handleSaveClient = async (clientData) => {
    try {
        let result;
        if (dialogMode.value === 'create') {
            result = await clientsStore.createClient(clientData);
            if (result.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Cliente Creado',
                    detail: 'El cliente se ha creado correctamente',
                    life: 4000
                });
            }
        } else if (dialogMode.value === 'edit') {
            result = await clientsStore.updateClient(selectedClient.value.id, clientData);
            if (result.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Cliente Actualizado',
                    detail: 'Los cambios se han guardado correctamente',
                    life: 4000
                });
            }
        }

        if (result && result.success) {
            await loadClients();
            hideDialog();
        } else {
            throw new Error(result?.message || 'Error desconocido');
        }
    } catch (error) {
        if (clientsStore.validationErrors && clientsStore.validationErrors.length > 0) {
            clientsStore.validationErrors.forEach((err) => {
                toast.add({
                    severity: 'error',
                    summary: 'Error de Validación',
                    detail: err,
                    life: 5000
                });
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: clientsStore.message || 'Ha ocurrido un error inesperado',
                life: 5000
            });
        }
    }
};

const confirmDeleteClient = (client) => {
    selectedClient.value = client;
    deleteClientDialog.value = true;
};

const deleteClient = async () => {
    try {
        const result = await clientsStore.deleteClient(selectedClient.value.id);
        
        if (result.success) {
            deleteClientDialog.value = false;
            selectedClient.value = {};

            toast.add({
                severity: 'success',
                summary: 'Cliente Eliminado',
                detail: 'El cliente se ha eliminado correctamente',
                life: 4000
            });

            await loadClients();
        }
    } catch (error) {
        if (clientsStore.validationErrors && clientsStore.validationErrors.length > 0) {
            clientsStore.validationErrors.forEach((err) => {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err,
                    life: 5000
                });
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: clientsStore.message || 'No se pudo eliminar el cliente',
                life: 5000
            });
        }
    }
};

const toggleClientVerification = async (client) => {
    try {
        const result = await clientsStore.toggleClientVerification(client.id);
        
        if (result.success) {
            const status = result.data.email_verified_at ? 'verificado' : 'desverificado';
            toast.add({
                severity: 'success',
                summary: 'Estado Actualizado',
                detail: `Cliente ${status} exitosamente`,
                life: 4000
            });
            
            await loadClients();
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: clientsStore.message || 'No se pudo cambiar el estado de verificación',
            life: 5000
        });
    }
};

const restoreClient = async (client) => {
    try {
        const result = await clientsStore.restoreClient(client.id);
        
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Cliente Restaurado',
                detail: 'El cliente se ha restaurado correctamente',
                life: 4000
            });
            
            await loadClients();
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: clientsStore.message || 'No se pudo restaurar el cliente',
            life: 5000
        });
    }
};

const toggleDeletedView = async () => {
    showDeleted.value = !showDeleted.value;
    await loadClients();
};

const loadClients = async () => {
    if (showDeleted.value) {
        await clientsStore.fetchDeletedClients();
    } else {
        await clientsStore.fetchClients();
    }
};

const applyFilters = async () => {
    const filters = {
        search: searchQuery.value,
        client_type: clientTypeFilter.value,
        document_type: documentTypeFilter.value,
        verified: verifiedFilter.value !== '' ? verifiedFilter.value : undefined
    };
    
    clientsStore.updateFilters(filters);
    await loadClients();
};

const clearAllFilters = async () => {
    searchQuery.value = '';
    clientTypeFilter.value = '';
    documentTypeFilter.value = '';
    verifiedFilter.value = '';
    
    clientsStore.clearFilters();
    await loadClients();
};

// Funciones para el diálogo
const getDialogTitle = () => {
    switch (dialogMode.value) {
        case 'create': return 'Nuevo Cliente';
        case 'edit': return 'Editar Cliente';
        case 'view': return 'Detalles del Cliente';
        default: return 'Cliente';
    }
};

const getDialogIcon = () => {
    switch (dialogMode.value) {
        case 'create': return 'pi pi-user-plus';
        case 'edit': return 'pi pi-user-edit';
        case 'view': return 'pi pi-eye';
        default: return 'pi pi-user';
    }
};

const getDialogSubtitle = () => {
    switch (dialogMode.value) {
        case 'create': return 'Completa los datos del nuevo cliente';
        case 'edit': return 'Modifica la información del cliente';
        case 'view': return 'Información detallada del cliente';
        default: return '';
    }
};

onMounted(async () => {
    await loadClients();
});
</script>

<template>
    <div class="clients-management">
        <!-- Header Section with Gradient Background -->
        <div class="header-section">
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-users"></i>
                    </div>
                    <div>
                        <h1 class="main-title">Gestión de Clientes</h1>
                        <p class="subtitle">Administra y controla los clientes del sistema</p>
                    </div>
                </div>
                <div class="header-actions">
                    <Button 
                        :label="showDeleted ? 'Ver Activos' : 'Ver Eliminados'" 
                        :icon="showDeleted ? 'pi pi-eye' : 'pi pi-trash'" 
                        class="toggle-button" 
                        outlined
                        @click="toggleDeletedView" 
                    />
                    <Button 
                        v-if="!showDeleted"
                        label="Nuevo Cliente" 
                        icon="pi pi-plus" 
                        class="create-button" 
                        raised 
                        @click="openNew" 
                    />
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-section">
            <div class="stats-card">
                <div class="stat-icon primary">
                    <i class="pi pi-users"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number">{{ activeClientsCount }}</div>
                    <div class="stat-label">Total Clientes</div>
                </div>
            </div>
            
            <div class="stats-card">
                <div class="stat-icon success">
                    <i class="pi pi-shield"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number">{{ verifiedClientsCount }}</div>
                    <div class="stat-label">Verificados</div>
                </div>
            </div>
            
            <div class="stats-card">
                <div class="stat-icon info">
                    <i class="pi pi-building"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number">{{ clientsStore.getCompanyClientsCount }}</div>
                    <div class="stat-label">Empresas</div>
                </div>
            </div>
            
            <div class="stats-card">
                <div class="stat-icon warning">
                    <i class="pi pi-user"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number">{{ clientsStore.getIndividualClientsCount }}</div>
                    <div class="stat-label">Personas</div>
                </div>
            </div>
        </div>

        <!-- Main Content Card -->
        <div class="content-card">
            <div class="table-header">
                <h2 class="table-title">{{ showDeleted ? 'Clientes Eliminados' : 'Lista de Clientes' }}</h2>
                <div class="table-actions">
                    <div class="filters-row">
                        <div class="search-box">
                            <i class="pi pi-search"></i>
                            <input 
                                v-model="searchQuery" 
                                type="text" 
                                placeholder="Buscar clientes..." 
                                class="search-input"
                                @input="applyFilters"
                            />
                        </div>
                        
                        <Select 
                            v-model="clientTypeFilter" 
                            :options="clientTypeOptions" 
                            option-label="label" 
                            option-value="value"
                            placeholder="Tipo de Cliente"
                            class="filter-select"
                            @change="applyFilters"
                        />
                        
                        <Select 
                            v-model="documentTypeFilter" 
                            :options="documentTypeOptions" 
                            option-label="label" 
                            option-value="value"
                            placeholder="Tipo de Documento"
                            class="filter-select"
                            @change="applyFilters"
                        />
                        
                        <Select 
                            v-if="!showDeleted"
                            v-model="verifiedFilter" 
                            :options="verifiedOptions" 
                            option-label="label" 
                            option-value="value"
                            placeholder="Estado"
                            class="filter-select"
                            @change="applyFilters"
                        />
                        
                        <Button 
                            label="Limpiar" 
                            icon="pi pi-times" 
                            class="clear-filters-btn"
                            text
                            @click="clearAllFilters" 
                        />
                    </div>
                </div>
            </div>

            <ClientsTable 
                :clients="filteredClients" 
                :loading="clientsStore.loading"
                :show-deleted="showDeleted"
                @edit="editClient" 
                @view="viewClient"
                @delete="confirmDeleteClient"
                @toggle-verification="toggleClientVerification"
                @restore="restoreClient"
            />
        </div>

        <!-- Enhanced Client Dialog -->
        <Dialog 
            v-model:visible="clientDialog" 
            :style="{ width: '800px' }" 
            :header="getDialogTitle()"
            :modal="true" 
            class="client-dialog"
        >
            <template #header>
                <div class="dialog-header">
                    <div class="dialog-icon">
                        <i :class="getDialogIcon()"></i>
                    </div>
                    <div>
                        <h3>{{ getDialogTitle() }}</h3>
                        <p>{{ getDialogSubtitle() }}</p>
                    </div>
                </div>
            </template>

            <ClientForm 
                :client="selectedClient" 
                :loading="clientsStore.loading"
                :mode="dialogMode"
                @submit="handleSaveClient" 
                @cancel="hideDialog" 
            />
        </Dialog>

        <!-- Enhanced Delete Dialog -->
        <Dialog 
            v-model:visible="deleteClientDialog" 
            :style="{ width: '480px' }" 
            header="Confirmar Eliminación" 
            :modal="true" 
            class="delete-dialog"
        >
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
                            <strong>{{ selectedClient.name }}</strong>?
                        </p>
                        <p class="warning-subtext">Se perderán todos los datos asociados al cliente.</p>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-actions">
                    <Button 
                        label="Cancelar" 
                        icon="pi pi-times" 
                        class="cancel-button" 
                        outlined 
                        @click="deleteClientDialog = false" 
                    />
                    <Button 
                        label="Eliminar" 
                        icon="pi pi-trash" 
                        class="delete-button" 
                        :loading="clientsStore.loading" 
                        @click="deleteClient" 
                    />
                </div>
            </template>
        </Dialog>

        <Toast position="top-right" />
    </div>
</template>

<style scoped>
.clients-management {
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

.header-actions {
    display: flex;
    gap: 1rem;
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

.toggle-button {
    padding: 0.875rem 1.5rem !important;
    font-weight: 600 !important;
    border-radius: 12px !important;
}

/* Stats Section */
.stats-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stats-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px var(--shadow-color);
}

.stats-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px var(--shadow-color-hover);
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: white;
}

.stat-icon.primary { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.success { background: linear-gradient(135deg, #10b981, #059669); }
.stat-icon.info { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
.stat-icon.warning { background: linear-gradient(135deg, #f59e0b, #d97706); }

.stat-number {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1;
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
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
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--surface-border);
}

.table-title {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.filters-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 250px;
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
    width: 100%;
}

.search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-select {
    min-width: 180px;
}

.clear-filters-btn {
    color: var(--red-500) !important;
}

/* Dialog Enhancements */
.client-dialog :deep(.p-dialog-content) {
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
    margin: -1.5rem -2rem 1.5rem -2rem;
    border-radius: 12px 12px 0 0;
    border-bottom: 1px solid var(--surface-border);
}

.dialog-header.danger {
    background: var(--red-50);
    border-bottom: 1px solid var(--red-200);
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

/* Dark Mode Support */
:root {
    --shadow-color: rgba(0, 0, 0, 0.1);
    --shadow-color-hover: rgba(0, 0, 0, 0.15);
}

[data-theme='dark'] {
    --shadow-color: rgba(0, 0, 0, 0.3);
    --shadow-color-hover: rgba(0, 0, 0, 0.4);
}

[data-theme='dark'] .dialog-header.danger {
    background: rgba(239, 68, 68, 0.1);
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
}

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

/* Responsive Design */
@media (max-width: 768px) {
    .clients-management {
        padding: 1rem;
    }

    .header-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
    }

    .filters-row {
        flex-direction: column;
        align-items: stretch;
    }

    .search-box {
        min-width: auto;
    }

    .filter-select {
        min-width: auto;
    }

    .stats-section {
        grid-template-columns: 1fr;
    }
}
</style>