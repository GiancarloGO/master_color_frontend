<script setup>
import { useClientsStore } from '@/stores/clients';
import { FilterMatchMode } from '@primevue/core/api';
import { ref, computed } from 'vue';

const clientsStore = useClientsStore();

const props = defineProps({
    clients: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    showDeleted: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'view', 'delete', 'toggle-verification', 'restore', 'force-delete']);

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

const getClientTypeLabel = (type) => {
    return clientsStore.getClientTypeLabel(type);
};

const getDocumentTypeLabel = (type) => {
    return clientsStore.getDocumentTypeLabel(type);
};

const getClientTypeSeverity = (type) => {
    const severityMap = {
        individual: 'info',
        company: 'success'
    };
    return severityMap[type] || 'secondary';
};

const getVerificationStatus = (client) => {
    return client.email_verified_at ? 'Verificado' : 'No Verificado';
};

const getVerificationSeverity = (client) => {
    return client.email_verified_at ? 'success' : 'warning';
};

const getVerificationIcon = (client) => {
    return client.email_verified_at ? 'pi pi-shield' : 'pi pi-exclamation-triangle';
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const hasAddresses = (client) => {
    return client.addresses && Array.isArray(client.addresses) && client.addresses.length > 0;
};

const getMainAddress = (client) => {
    if (!hasAddresses(client)) return 'Sin dirección';
    
    const mainAddress = client.addresses.find(addr => addr.is_main) || client.addresses[0];
    return `${mainAddress.district}, ${mainAddress.province}, ${mainAddress.department}`;
};
</script>

<template>
    <div class="clients-table-container">
        <DataTable
            ref="dt"
            v-model:filters="filters"
            :value="clients"
            :loading="loading"
            paginator
            :rows="15"
            :rows-per-page-options="[10, 15, 25, 50]"
            paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            current-page-report-template="Mostrando {first} a {last} de {totalRecords} clientes"
            responsive-layout="scroll"
            class="clients-table"
            striped-rows
            data-key="id"
            filter-display="menu"
            :global-filter-fields="['name', 'email', 'identity_document', 'phone', 'client_type', 'document_type']"
            :meta-key-selection="false"
            :row-hover="true"
        >
            <template #empty>
                <div class="empty-state">
                    <i class="pi pi-users" style="font-size: 3rem; color: var(--text-color-secondary)"></i>
                    <h3>{{ showDeleted ? 'No hay clientes eliminados' : 'No hay clientes' }}</h3>
                    <p>{{ showDeleted ? 'No se encontraron clientes eliminados en el sistema' : 'No se encontraron clientes en el sistema' }}</p>
                </div>
            </template>

            <template #loading>
                <div class="loading-state">
                    <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
                    <p>Cargando clientes...</p>
                </div>
            </template>

            <template #header>
                <div class="table-header">
                    <div class="header-left">
                        <h4 class="header-title">{{ showDeleted ? 'Clientes Eliminados' : 'Lista de Clientes' }}</h4>
                        <Badge :value="clients.length" severity="info" class="header-badge" />
                    </div>
                    <div class="header-right">
                        <span class="search-wrapper">
                            <i class="pi pi-search search-icon"></i>
                            <InputText 
                                v-model="filters['global'].value" 
                                placeholder="Buscar clientes..." 
                                class="search-input" 
                            />
                        </span>
                        <Button 
                            v-tooltip.top="'Exportar CSV'" 
                            icon="pi pi-download" 
                            class="export-button" 
                            outlined 
                            @click="exportCSV" 
                        />
                    </div>
                </div>
            </template>

            <!-- Avatar y nombre -->
            <Column field="name" header="Cliente" :sortable="true" style="min-width: 250px">
                <template #body="{ data }">
                    <div class="client-info">
                        <div class="client-avatar" :style="{ backgroundColor: getAvatarColor(data.name) }">
                            {{ getInitials(data.name) }}
                        </div>
                        <div class="client-details">
                            <div class="client-name">{{ data.name }}</div>
                            <div class="client-email">{{ data.email }}</div>
                            <div class="client-document">
                                {{ getDocumentTypeLabel(data.document_type) }}: {{ data.identity_document }}
                            </div>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Tipo de cliente -->
            <Column field="client_type" header="Tipo" :sortable="true" style="width: 130px">
                <template #body="{ data }">
                    <Tag 
                        :value="getClientTypeLabel(data.client_type)" 
                        :severity="getClientTypeSeverity(data.client_type)" 
                        :icon="data.client_type === 'company' ? 'pi pi-building' : 'pi pi-user'"
                        class="type-tag" 
                    />
                </template>
            </Column>

            <!-- Teléfono -->
            <Column field="phone" header="Teléfono" :sortable="true" style="width: 120px">
                <template #body="{ data }">
                    <div class="phone-info">
                        <span v-if="data.phone" class="phone-number">
                            <i class="pi pi-phone mr-1"></i>
                            {{ data.phone }}
                        </span>
                        <span v-else class="no-phone">Sin teléfono</span>
                    </div>
                </template>
            </Column>

            <!-- Dirección -->
            <Column field="addresses" header="Dirección" :sortable="false" style="min-width: 200px">
                <template #body="{ data }">
                    <div class="address-info">
                        <i class="pi pi-map-marker mr-1 text-primary-600"></i>
                        <span class="address-text">{{ getMainAddress(data) }}</span>
                    </div>
                </template>
            </Column>

            <!-- Estado de verificación -->
            <Column v-if="!showDeleted" field="email_verified_at" header="Verificación" :sortable="true" style="width: 140px">
                <template #body="{ data }">
                    <Tag 
                        :value="getVerificationStatus(data)" 
                        :severity="getVerificationSeverity(data)" 
                        :icon="getVerificationIcon(data)"
                        class="verification-tag" 
                    />
                </template>
            </Column>

            <!-- Fecha de registro -->
            <Column field="created_at" header="Registro" :sortable="true" style="width: 120px">
                <template #body="{ data }">
                    <div class="date-info">
                        <span class="date-value">{{ formatDate(data.created_at) }}</span>
                    </div>
                </template>
            </Column>

            <!-- Fecha de eliminación (solo para vista de eliminados) -->
            <Column v-if="showDeleted" field="deleted_at" header="Eliminado" :sortable="true" style="width: 150px">
                <template #body="{ data }">
                    <div class="date-info">
                        <span class="date-value">{{ formatDateTime(data.deleted_at) }}</span>
                    </div>
                </template>
            </Column>

            <!-- Acciones -->
            <Column header="Acciones" :exportable="false" style="width: 160px">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button 
                            v-tooltip="'Ver detalles'" 
                            icon="pi pi-eye" 
                            class="p-button-rounded p-button-text p-button-info p-button-sm" 
                            @click="$emit('view', data)" 
                        />
                        
                        <template v-if="!showDeleted">
                            <Button 
                                v-tooltip="'Editar cliente'" 
                                icon="pi pi-pencil" 
                                class="p-button-rounded p-button-text p-button-warning p-button-sm" 
                                @click="$emit('edit', data)" 
                            />
                            <Button 
                                v-tooltip="data.email_verified_at ? 'Desverificar' : 'Verificar'" 
                                :icon="data.email_verified_at ? 'pi pi-shield' : 'pi pi-exclamation-triangle'" 
                                :class="data.email_verified_at ? 'p-button-success' : 'p-button-warning'" 
                                class="p-button-rounded p-button-text p-button-sm" 
                                @click="$emit('toggle-verification', data)" 
                            />
                            <Button 
                                v-tooltip="'Eliminar cliente'" 
                                icon="pi pi-trash" 
                                class="p-button-rounded p-button-text p-button-danger p-button-sm" 
                                @click="$emit('delete', data)" 
                            />
                        </template>
                        
                        <template v-else>
                            <Button 
                                v-tooltip="'Restaurar cliente'" 
                                icon="pi pi-undo" 
                                class="p-button-rounded p-button-text p-button-success p-button-sm" 
                                @click="$emit('restore', data)" 
                            />
                            <Button 
                                v-tooltip="'Eliminar permanentemente'" 
                                icon="pi pi-times" 
                                class="p-button-rounded p-button-text p-button-danger p-button-sm" 
                                @click="$emit('force-delete', data)" 
                            />
                        </template>
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.clients-table-container {
    width: 100%;
}

.clients-table {
    box-shadow: none;
}

.clients-table :deep(.p-datatable-header) {
    background: transparent;
    border: none;
    padding: 0;
}

.clients-table :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-100);
    border: 1px solid var(--surface-200);
    padding: 1rem 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
}

.clients-table :deep(.p-datatable-tbody > tr > td) {
    padding: 1rem 0.75rem;
    border: 1px solid var(--surface-200);
}

.clients-table :deep(.p-datatable-tbody > tr:hover) {
    background: var(--surface-50);
}

/* Table Header */
.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.header-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
}

.header-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--text-color-secondary);
    z-index: 1;
}

.search-input {
    padding-left: 2.5rem;
    width: 250px;
    border-radius: 8px;
}

.export-button {
    border-radius: 8px;
}

/* Client Info */
.client-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.client-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
}

.client-details {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
}

.client-name {
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.3;
}

.client-email {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    line-height: 1.2;
}

.client-document {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    line-height: 1.2;
}

/* Type Tag */
.type-tag {
    font-size: 0.75rem;
    padding: 0.375rem 0.625rem;
}

/* Phone Info */
.phone-info {
    display: flex;
    align-items: center;
}

.phone-number {
    font-size: 0.875rem;
    color: var(--text-color);
}

.no-phone {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    font-style: italic;
}

/* Address Info */
.address-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.address-text {
    font-size: 0.875rem;
    color: var(--text-color);
    line-height: 1.3;
}

/* Verification Tag */
.verification-tag {
    font-size: 0.75rem;
    padding: 0.375rem 0.625rem;
}

/* Date Info */
.date-info {
    text-align: center;
}

.date-value {
    font-size: 0.875rem;
    color: var(--text-color);
    line-height: 1.3;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
}

.action-buttons .p-button {
    width: 2rem;
    height: 2rem;
}

/* Empty and Loading States */
.empty-state,
.loading-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-color-secondary);
}

.empty-state h3 {
    margin: 1rem 0 0.5rem 0;
    color: var(--text-color);
}

.empty-state p,
.loading-state p {
    margin: 0;
    font-size: 0.875rem;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

/* Dark mode styles */
[data-theme='dark'] .clients-table :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-800);
    border-color: var(--surface-700);
}

[data-theme='dark'] .clients-table :deep(.p-datatable-tbody > tr > td) {
    border-color: var(--surface-700);
}

[data-theme='dark'] .clients-table :deep(.p-datatable-tbody > tr:hover) {
    background: var(--surface-800);
}

/* Responsive */
@media (max-width: 768px) {
    .clients-table :deep(.p-datatable-thead > tr > th),
    .clients-table :deep(.p-datatable-tbody > tr > td) {
        padding: 0.5rem 0.375rem;
        font-size: 0.8rem;
    }

    .table-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .header-right {
        justify-content: space-between;
    }

    .search-input {
        width: 100%;
        max-width: 200px;
    }

    .client-info {
        gap: 0.5rem;
    }

    .client-avatar {
        width: 32px;
        height: 32px;
        font-size: 0.75rem;
    }

    .client-name {
        font-size: 0.875rem;
    }

    .action-buttons .p-button {
        width: 1.75rem;
        height: 1.75rem;
    }
}
</style>