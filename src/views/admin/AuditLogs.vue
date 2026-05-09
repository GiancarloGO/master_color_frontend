<script setup>
import { useAuditLogsStore } from '@/stores/auditLogs';
import { computed, onMounted, ref } from 'vue';

const auditLogsStore = useAuditLogsStore();

const detailDialog = ref(false);
const selectedLog = ref(null);
const lazyFirst = ref(0);
const perPage = ref(50);
const currentPage = ref(1);

const filters = ref({
    action: '',
    actor_type: '',
    actor_id: '',
    entity_type: '',
    date_from: null,
    date_to: null
});

const actorTypeOptions = [
    { label: 'Todos los actores', value: '' },
    { label: 'Staff', value: 'staff' },
    { label: 'Cliente', value: 'client' },
    { label: 'Sistema', value: 'system' }
];

const entityTypeOptions = [
    { label: 'Todas las entidades', value: '' },
    { label: 'Usuario', value: 'User' },
    { label: 'Cliente', value: 'Client' },
    { label: 'Orden', value: 'Order' },
    { label: 'Movimiento de Stock', value: 'StockMovement' },
    { label: 'Pago', value: 'Payment' }
];

const hasActiveFilters = computed(() => {
    return !!(
        filters.value.action ||
        filters.value.actor_type ||
        filters.value.actor_id ||
        filters.value.entity_type ||
        filters.value.date_from ||
        filters.value.date_to
    );
});

onMounted(() => {
    loadData(1);
});

async function loadData(page = currentPage.value) {
    currentPage.value = page;
    const params = { page, per_page: perPage.value };
    if (filters.value.action) params.action = filters.value.action;
    if (filters.value.actor_type) params.actor_type = filters.value.actor_type;
    if (filters.value.actor_id) params.actor_id = filters.value.actor_id;
    if (filters.value.entity_type) params.entity_type = filters.value.entity_type;
    if (filters.value.date_from) params.date_from = formatDateForAPI(filters.value.date_from);
    if (filters.value.date_to) params.date_to = formatDateForAPI(filters.value.date_to);
    await auditLogsStore.fetchLogs(params);
}

async function applyFilters() {
    lazyFirst.value = 0;
    await loadData(1);
}

function clearFilters() {
    filters.value = { action: '', actor_type: '', actor_id: '', entity_type: '', date_from: null, date_to: null };
    lazyFirst.value = 0;
    loadData(1);
}

function onPage(event) {
    lazyFirst.value = event.first;
    perPage.value = event.rows;
    loadData(event.page + 1);
}

function viewLog(log) {
    selectedLog.value = log;
    detailDialog.value = true;
}

function formatDateForAPI(date) {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDateShort(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getActorTypeSeverity(type) {
    const map = { staff: 'info', client: 'success', system: 'secondary' };
    return map[type] || 'secondary';
}

function getActorTypeLabel(type) {
    const map = { staff: 'Staff', client: 'Cliente', system: 'Sistema' };
    return map[type] || type;
}

function getActionSeverity(action) {
    if (!action) return 'secondary';
    if (action.startsWith('client.auth.')) return 'success';
    if (action.startsWith('auth.')) return 'info';
    if (action.startsWith('order.')) return 'warning';
    if (action.startsWith('stock.')) return 'contrast';
    if (action.startsWith('payment.')) return 'success';
    return 'secondary';
}

function formatJson(value) {
    if (!value) return '';
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}
</script>

<template>
    <div class="card">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-surface-900">Auditoría del Sistema</h1>
                <p class="text-surface-600 mt-1">Registro de actividad y cambios en el sistema</p>
            </div>
            <Button icon="pi pi-refresh" label="Actualizar" :loading="auditLogsStore.isLoading" @click="loadData(currentPage)" />
        </div>

        <!-- Filtros -->
        <div class="bg-surface-50 border border-surface-200 rounded-lg p-4 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-surface-900">Filtros</h3>
                <div class="flex gap-2">
                    <Button icon="pi pi-filter-slash" label="Limpiar" severity="secondary" outlined size="small" @click="clearFilters" />
                    <Button icon="pi pi-search" label="Buscar" size="small" @click="applyFilters" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Acción</label>
                    <InputText v-model="filters.action" placeholder="Ej: auth.login, order.created" @keyup.enter="applyFilters" />
                </div>

                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Tipo de Actor</label>
                    <Dropdown
                        v-model="filters.actor_type"
                        :options="actorTypeOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Seleccionar tipo"
                        show-clear
                        @change="applyFilters"
                    />
                </div>

                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Tipo de Entidad</label>
                    <Dropdown
                        v-model="filters.entity_type"
                        :options="entityTypeOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Seleccionar entidad"
                        show-clear
                        @change="applyFilters"
                    />
                </div>

                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">ID del Actor</label>
                    <InputText v-model="filters.actor_id" placeholder="ID del usuario o cliente" @keyup.enter="applyFilters" />
                </div>

                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Fecha Desde</label>
                    <Calendar v-model="filters.date_from" placeholder="Seleccionar fecha" date-format="dd/mm/yy" show-icon show-button-bar @date-select="applyFilters" />
                </div>

                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Fecha Hasta</label>
                    <Calendar v-model="filters.date_to" placeholder="Seleccionar fecha" date-format="dd/mm/yy" show-icon show-button-bar @date-select="applyFilters" />
                </div>
            </div>

            <!-- Filtros activos -->
            <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-surface-200">
                <span class="text-sm font-medium text-surface-700 mb-2 block">Filtros aplicados:</span>
                <div class="flex flex-wrap gap-2">
                    <Tag v-if="filters.action" severity="info" icon="pi pi-filter" removable @remove="filters.action = ''; applyFilters()">
                        Acción: {{ filters.action }}
                    </Tag>
                    <Tag v-if="filters.actor_type" severity="info" icon="pi pi-filter" removable @remove="filters.actor_type = ''; applyFilters()">
                        Actor: {{ getActorTypeLabel(filters.actor_type) }}
                    </Tag>
                    <Tag v-if="filters.entity_type" severity="info" icon="pi pi-filter" removable @remove="filters.entity_type = ''; applyFilters()">
                        Entidad: {{ filters.entity_type }}
                    </Tag>
                    <Tag v-if="filters.actor_id" severity="info" icon="pi pi-filter" removable @remove="filters.actor_id = ''; applyFilters()">
                        Actor ID: {{ filters.actor_id }}
                    </Tag>
                    <Tag v-if="filters.date_from" severity="success" icon="pi pi-calendar" removable @remove="filters.date_from = null; applyFilters()">
                        Desde: {{ formatDateShort(filters.date_from) }}
                    </Tag>
                    <Tag v-if="filters.date_to" severity="success" icon="pi pi-calendar" removable @remove="filters.date_to = null; applyFilters()">
                        Hasta: {{ formatDateShort(filters.date_to) }}
                    </Tag>
                </div>
            </div>
        </div>

        <!-- Tabla -->
        <DataTable
            :value="auditLogsStore.getLogs"
            :loading="auditLogsStore.isLoading"
            lazy
            paginator
            :first="lazyFirst"
            :rows="perPage"
            :total-records="auditLogsStore.getPagination.total"
            :rows-per-page-options="[25, 50, 100, 200]"
            paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            current-page-report-template="Mostrando {first} a {last} de {totalRecords} registros"
            responsive-layout="scroll"
            striped-rows
            data-key="id"
            :row-hover="true"
            @page="onPage"
        >
            <template #empty>
                <div class="text-center py-12 text-surface-500">
                    <i class="pi pi-shield" style="font-size: 3rem"></i>
                    <p class="mt-4">No se encontraron registros de auditoría</p>
                </div>
            </template>

            <template #loading>
                <div class="text-center py-12 flex flex-col items-center gap-4">
                    <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
                    <p class="text-surface-500">Cargando registros...</p>
                </div>
            </template>

            <Column field="id" header="ID" style="width: 70px">
                <template #body="{ data }">
                    <span class="font-semibold" style="color: var(--primary-color)">#{{ data.id }}</span>
                </template>
            </Column>

            <Column field="created_at" header="Fecha" style="min-width: 130px">
                <template #body="{ data }">
                    <div class="audit-date">
                        <span>{{ formatDateShort(data.created_at) }}</span>
                        <span class="text-xs text-surface-500">{{ formatTime(data.created_at) }}</span>
                    </div>
                </template>
            </Column>

            <Column field="actor_name" header="Actor" style="min-width: 160px">
                <template #body="{ data }">
                    <div class="audit-actor">
                        <span class="font-medium text-sm">{{ data.actor_name || 'Sistema' }}</span>
                        <div class="flex items-center gap-1">
                            <Tag :value="getActorTypeLabel(data.actor_type)" :severity="getActorTypeSeverity(data.actor_type)" class="text-xs" />
                            <span v-if="data.actor_id" class="text-xs text-surface-500">ID: {{ data.actor_id }}</span>
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="action" header="Acción" style="min-width: 200px">
                <template #body="{ data }">
                    <Tag :value="data.action" :severity="getActionSeverity(data.action)" class="action-tag" />
                </template>
            </Column>

            <Column field="entity_type" header="Entidad" style="min-width: 130px">
                <template #body="{ data }">
                    <div v-if="data.entity_type" class="audit-entity">
                        <span class="font-medium text-sm">{{ data.entity_type }}</span>
                        <span v-if="data.entity_id" class="text-xs text-surface-500">#{{ data.entity_id }}</span>
                    </div>
                    <span v-else class="text-surface-400">—</span>
                </template>
            </Column>

            <Column field="ip_address" header="IP" style="width: 130px">
                <template #body="{ data }">
                    <span class="font-mono text-xs text-surface-600">{{ data.ip_address || '—' }}</span>
                </template>
            </Column>

            <Column header="Cambios" style="width: 80px; text-align: center">
                <template #body="{ data }">
                    <i v-if="data.old_values || data.new_values" v-tooltip.top="'Tiene cambios registrados'" class="pi pi-pencil" style="color: var(--primary-color)"></i>
                    <span v-else class="text-surface-400">—</span>
                </template>
            </Column>

            <Column header="Ver" style="width: 60px">
                <template #body="{ data }">
                    <Button v-tooltip="'Ver detalle'" icon="pi pi-eye" class="p-button-rounded p-button-text p-button-info p-button-sm" @click="viewLog(data)" />
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de detalle -->
        <Dialog v-model:visible="detailDialog" header="Detalle del Registro de Auditoría" :style="{ width: '700px' }" :modal="true" :closable="true">
            <div v-if="selectedLog" class="audit-detail">
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>ID</label>
                        <p class="font-semibold">#{{ selectedLog.id }}</p>
                    </div>
                    <div class="detail-field">
                        <label>Fecha y Hora</label>
                        <p>{{ formatDateTime(selectedLog.created_at) }}</p>
                    </div>
                    <div class="detail-field">
                        <label>Actor</label>
                        <div class="flex items-center gap-2 mt-1">
                            <Tag :value="getActorTypeLabel(selectedLog.actor_type)" :severity="getActorTypeSeverity(selectedLog.actor_type)" />
                            <span class="font-medium">{{ selectedLog.actor_name || 'Sistema' }}</span>
                            <span v-if="selectedLog.actor_id" class="text-surface-500 text-sm">(ID: {{ selectedLog.actor_id }})</span>
                        </div>
                    </div>
                    <div class="detail-field">
                        <label>Acción</label>
                        <div class="mt-1">
                            <Tag :value="selectedLog.action" :severity="getActionSeverity(selectedLog.action)" class="font-mono" />
                        </div>
                    </div>
                    <div class="detail-field">
                        <label>Entidad</label>
                        <p>
                            <span v-if="selectedLog.entity_type">
                                {{ selectedLog.entity_type }}
                                <span v-if="selectedLog.entity_id" class="text-surface-500"> #{{ selectedLog.entity_id }}</span>
                            </span>
                            <span v-else class="text-surface-400">—</span>
                        </p>
                    </div>
                    <div class="detail-field">
                        <label>Dirección IP</label>
                        <p class="font-mono">{{ selectedLog.ip_address || '—' }}</p>
                    </div>
                </div>

                <div v-if="selectedLog.user_agent" class="detail-field mt-4">
                    <label>User Agent</label>
                    <p class="font-mono text-xs bg-surface-100 rounded p-2 mt-1 break-all">{{ selectedLog.user_agent }}</p>
                </div>

                <div v-if="selectedLog.old_values" class="detail-field mt-4">
                    <label>Valores Anteriores</label>
                    <pre class="json-block json-old">{{ formatJson(selectedLog.old_values) }}</pre>
                </div>

                <div v-if="selectedLog.new_values" class="detail-field mt-4">
                    <label>Valores Nuevos</label>
                    <pre class="json-block json-new">{{ formatJson(selectedLog.new_values) }}</pre>
                </div>

                <div v-if="selectedLog.metadata" class="detail-field mt-4">
                    <label>Metadata</label>
                    <pre class="json-block json-meta">{{ formatJson(selectedLog.metadata) }}</pre>
                </div>
            </div>

            <template #footer>
                <Button label="Cerrar" icon="pi pi-times" severity="secondary" @click="detailDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.audit-date {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.8rem;
}

.audit-actor {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.audit-entity {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.action-tag {
    font-size: 0.75rem;
    font-family: monospace;
}

.audit-detail {
    display: flex;
    flex-direction: column;
}

.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.detail-field label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-color-secondary);
}

.detail-field p {
    margin-top: 4px;
    color: var(--text-color);
}

.json-block {
    margin-top: 6px;
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-family: monospace;
    overflow: auto;
    max-height: 160px;
    white-space: pre-wrap;
    word-break: break-word;
}

.json-old {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}

.json-new {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
}

.json-meta {
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
}

@media (max-width: 640px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }
}
</style>
