<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    movements: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['view', 'edit', 'correct']);

// Movement type configuration
const movementTypeConfig = {
    entrada: {
        label: 'Entrada',
        severity: 'success',
        icon: 'pi pi-arrow-down'
    },
    salida: {
        label: 'Salida',
        severity: 'danger',
        icon: 'pi pi-arrow-up'
    },
    ajuste: {
        label: 'Ajuste',
        severity: 'info',
        icon: 'pi pi-cog'
    },
    devolucion: {
        label: 'Devolución',
        severity: 'warning',
        icon: 'pi pi-undo'
    }
};

// Helper methods
const getMovementTypeLabel = (type) => {
    return movementTypeConfig[type]?.label || type;
};

const getMovementTypeSeverity = (type) => {
    return movementTypeConfig[type]?.severity || 'secondary';
};

const getMovementTypeIcon = (type) => {
    return movementTypeConfig[type]?.icon || 'pi pi-circle';
};

const getUserInitials = (name) => {
    if (!name) return 'N/A';
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('es-ES').format(value);
};

const formatCurrency = (value) => {
    if (!value) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const isCancellationMovement = (movement) => {
    // Verificar por el campo canceled_at (forma principal)
    if (movement.canceled_at) {
        return true;
    }

    // Verificar por convención de nombres (fallback)
    return movement.reason?.includes('CANCELACIÓN') || movement.voucher_number?.startsWith('CANCEL-') || movement.reason?.includes('ANULACIÓN') || movement.voucher_number?.startsWith('ANUL-') || movement.reason?.includes('CORRECCIÓN');
};

const canBeCancelled = (movement) => {
    // Solo permitir cancelar: entrada, salida, y devolución
    // Los ajustes no se pueden cancelar
    if (!['entrada', 'salida', 'devolucion'].includes(movement.movement_type)) {
        return false;
    }

    // No permitir cancelar movimientos que ya están cancelados (canceled_at)
    if (movement.canceled_at) {
        return false;
    }

    // No permitir cancelar movimientos que ya son cancelaciones
    if (isCancellationMovement(movement)) {
        return false;
    }

    return true;
};
</script>

<template>
    <div class="stock-movements-table">
        <DataTable
            :value="movements"
            :loading="loading"
            data-key="id"
            :paginator="true"
            :rows="10"
            :rows-per-page-options="[5, 10, 25, 50]"
            paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            current-page-report-template="Mostrando {first} a {last} de {totalRecords} movimientos"
            responsive-layout="scroll"
            :global-filter-fields="['reason', 'voucher_number', 'user.name', 'movement_type']"
            class="custom-table"
            striped-rows
            sort-mode="multiple"
        >
            <template #empty>
                <div class="empty-state">
                    <i class="pi pi-inbox empty-icon"></i>
                    <h3>No hay movimientos</h3>
                    <p>No se encontraron movimientos de stock en el sistema.</p>
                </div>
            </template>

            <template #loading>
                <div class="loading-state">
                    <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
                    <p>Cargando movimientos...</p>
                </div>
            </template>

            <Column field="id" header="ID" sortable class="id-column">
                <template #body="{ data }">
                    <div class="id-cell">
                        <span class="id-badge">#{{ data.id }}</span>
                    </div>
                </template>
            </Column>

            <Column field="movement_type" header="Tipo" sortable class="type-column">
                <template #body="{ data }">
                    <div class="type-cell">
                        <Tag :value="getMovementTypeLabel(data.movement_type)" :severity="getMovementTypeSeverity(data.movement_type)" :icon="getMovementTypeIcon(data.movement_type)" class="movement-type-tag" />
                        <Tag v-if="isCancellationMovement(data)" value="CANCELADO" severity="warning" icon="pi pi-times-circle" class="cancellation-tag" />
                    </div>
                </template>
            </Column>

            <Column field="reason" header="Motivo" sortable class="reason-column">
                <template #body="{ data }">
                    <div class="reason-cell">
                        <span class="reason-text" :title="data.reason">{{ data.reason }}</span>
                        <small v-if="data.voucher_number" class="voucher-number">{{ data.voucher_number }}</small>
                    </div>
                </template>
            </Column>

            <Column field="total_quantity" header="Cantidad Total" sortable class="quantity-column">
                <template #body="{ data }">
                    <div class="quantity-cell">
                        <i class="pi pi-box quantity-icon"></i>
                        <span class="quantity-value">{{ formatNumber(data.total_quantity) }}</span>
                    </div>
                </template>
            </Column>

            <Column field="total_value" header="Valor Total" sortable class="value-column">
                <template #body="{ data }">
                    <div class="value-cell">
                        <i class="pi pi-dollar value-icon"></i>
                        <span class="value-amount">{{ formatCurrency(data.total_value) }}</span>
                    </div>
                </template>
            </Column>

            <Column field="user.name" header="Usuario" sortable class="user-column">
                <template #body="{ data }">
                    <div class="user-cell">
                        <Avatar :label="getUserInitials(data.user?.name)" size="small" shape="circle" class="user-avatar" />
                        <span class="user-name">{{ data.user?.name || 'N/A' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="created_at" header="Fecha" sortable class="date-column">
                <template #body="{ data }">
                    <div class="date-cell">
                        <i class="pi pi-calendar date-icon"></i>
                        <div class="date-info">
                            <span class="date-value">{{ formatDate(data.created_at) }}</span>
                            <small class="time-value">{{ formatTime(data.created_at) }}</small>
                        </div>
                    </div>
                </template>
            </Column>

            <Column header="Acciones" class="actions-column" :exportable="false">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button v-tooltip.top="'Ver detalles'" icon="pi pi-eye" class="action-button view-button" text rounded @click="$emit('view', data)" />
                        <Button v-tooltip.top="'Editar'" icon="pi pi-pencil" class="action-button edit-button" text rounded @click="$emit('edit', data)" />
                        <Button v-if="canBeCancelled(data)" v-tooltip.top="'Cancelar movimiento'" icon="pi pi-times-circle" class="action-button cancel-button" text rounded @click="$emit('correct', data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.stock-movements-table {
    width: 100%;
}

.custom-table {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.empty-state,
.loading-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
}

.empty-icon {
    font-size: 4rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
}

.empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: #374151;
}

.empty-state p {
    margin: 0;
    font-size: 1rem;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

/* Column specific styles */
.id-column {
    width: 80px;
}

.type-column {
    width: 130px;
}

.reason-column {
    min-width: 200px;
}

.quantity-column {
    width: 120px;
}

.value-column {
    width: 120px;
}

.user-column {
    width: 150px;
}

.date-column {
    width: 130px;
}

.actions-column {
    width: 120px;
}

/* Cell styles */
.id-cell {
    display: flex;
    align-items: center;
}

.id-badge {
    background: #f1f5f9;
    color: #475569;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
}

.type-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.movement-type-tag {
    font-size: 0.8rem;
    font-weight: 600;
}

.cancellation-tag {
    font-size: 0.7rem;
    font-weight: 700;
}

.reason-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.reason-text {
    font-weight: 500;
    color: #374151;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
}

.voucher-number {
    color: #6b7280;
    font-size: 0.75rem;
    background: #f9fafb;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    display: inline-block;
}

.quantity-cell,
.value-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-icon,
.value-icon {
    color: #6b7280;
    font-size: 0.9rem;
}

.quantity-value {
    font-weight: 600;
    color: #374151;
}

.value-amount {
    font-weight: 600;
    color: #059669;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.user-avatar {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
}

.user-name {
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
}

.date-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.date-icon {
    color: #6b7280;
    font-size: 0.9rem;
}

.date-info {
    display: flex;
    flex-direction: column;
}

.date-value {
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
}

.time-value {
    color: #6b7280;
    font-size: 0.75rem;
}

.action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
}

.action-button {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.view-button {
    color: #3b82f6;
}

.view-button:hover {
    background: #dbeafe;
    color: #1d4ed8;
}

.edit-button {
    color: #f59e0b;
}

.edit-button:hover {
    background: #fef3c7;
    color: #d97706;
}

.cancel-button {
    color: #f97316;
}

.cancel-button:hover {
    background: #fed7aa;
    color: #ea580c;
}

/* Responsive styles */
@media (max-width: 768px) {
    .reason-text {
        max-width: 120px;
    }

    .user-name {
        display: none;
    }

    .date-info {
        display: none;
    }

    .action-buttons {
        flex-direction: column;
        gap: 0.125rem;
    }

    .action-button {
        width: 1.75rem;
        height: 1.75rem;
    }
}
</style>
