<script setup>
import { computed } from 'vue';

const props = defineProps({
    movement: {
        type: Object,
        default: null
    }
});

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

// Computed properties
const hasUnitPrices = computed(() => {
    return props.movement?.details?.some((detail) => detail.unit_price && detail.unit_price > 0);
});

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

const getStockChangeText = (detail) => {
    const change = detail.new_stock - detail.previous_stock;
    if (change > 0) return `+${formatNumber(change)}`;
    if (change < 0) return formatNumber(change);
    return '0';
};

const getStockChangeSeverity = (detail) => {
    const change = detail.new_stock - detail.previous_stock;
    if (change > 0) return 'success';
    if (change < 0) return 'danger';
    return 'secondary';
};

const getStockChangeIcon = (detail) => {
    const change = detail.new_stock - detail.previous_stock;
    if (change > 0) return 'pi pi-arrow-up';
    if (change < 0) return 'pi pi-arrow-down';
    return 'pi pi-minus';
};
</script>

<template>
    <div class="stock-movement-detail">
        <div v-if="!movement" class="loading-state">
            <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
            <p>Cargando detalles del movimiento...</p>
        </div>

        <div v-else class="detail-container">
            <!-- Header Information -->
            <div class="detail-header">
                <div class="header-info">
                    <div class="movement-id">
                        <span class="id-label">Movimiento</span>
                        <span class="id-value">#{{ movement.id }}</span>
                    </div>
                    <Tag :value="getMovementTypeLabel(movement.movement_type)" :severity="getMovementTypeSeverity(movement.movement_type)" :icon="getMovementTypeIcon(movement.movement_type)" class="movement-type-tag" />
                </div>
                <div class="movement-date">
                    <i class="pi pi-calendar date-icon"></i>
                    <div class="date-info">
                        <span class="date-value">{{ formatDate(movement.created_at) }}</span>
                        <small class="time-value">{{ formatTime(movement.created_at) }}</small>
                    </div>
                </div>
            </div>

            <!-- Basic Information Card -->
            <Card class="info-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-info-circle"></i>
                        Información General
                    </div>
                </template>
                <template #content>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Motivo:</span>
                            <span class="info-value">{{ movement.reason }}</span>
                        </div>
                        <div v-if="movement.voucher_number" class="info-item">
                            <span class="info-label">Número de Comprobante:</span>
                            <span class="info-value voucher">{{ movement.voucher_number }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Usuario:</span>
                            <div class="user-info">
                                <Avatar :label="getUserInitials(movement.user?.name)" size="small" shape="circle" class="user-avatar" />
                                <span class="user-name">{{ movement.user?.name || 'N/A' }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Summary Statistics -->
            <div class="summary-cards">
                <Card class="summary-card">
                    <template #content>
                        <div class="summary-content">
                            <div class="summary-icon products-icon">
                                <i class="pi pi-box"></i>
                            </div>
                            <div class="summary-info">
                                <span class="summary-value">{{ movement.details?.length || 0 }}</span>
                                <span class="summary-label">Productos</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card class="summary-card">
                    <template #content>
                        <div class="summary-content">
                            <div class="summary-icon quantity-icon">
                                <i class="pi pi-hashtag"></i>
                            </div>
                            <div class="summary-info">
                                <span class="summary-value">{{ formatNumber(movement.total_quantity) }}</span>
                                <span class="summary-label">Cantidad Total</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card v-if="movement.total_value" class="summary-card">
                    <template #content>
                        <div class="summary-content">
                            <div class="summary-icon value-icon">
                                <i class="pi pi-dollar"></i>
                            </div>
                            <div class="summary-info">
                                <span class="summary-value">{{ formatCurrency(movement.total_value) }}</span>
                                <span class="summary-label">Valor Total</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card v-if="movement.average_price" class="summary-card">
                    <template #content>
                        <div class="summary-content">
                            <div class="summary-icon average-icon">
                                <i class="pi pi-chart-line"></i>
                            </div>
                            <div class="summary-info">
                                <span class="summary-value">{{ formatCurrency(movement.average_price) }}</span>
                                <span class="summary-label">Precio Promedio</span>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Products Details -->
            <Card class="products-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-list"></i>
                        Detalle de Productos
                    </div>
                </template>
                <template #content>
                    <div v-if="!movement.details || movement.details.length === 0" class="empty-details">
                        <i class="pi pi-inbox empty-icon"></i>
                        <p>No hay detalles de productos disponibles</p>
                    </div>

                    <DataTable v-else :value="movement.details" responsive-layout="scroll" class="details-table" striped-rows>
                        <Column field="stock.product.name" header="Producto" class="product-column">
                            <template #body="{ data }">
                                <div class="product-cell">
                                    <div class="product-info">
                                        <span class="product-name">{{ data.stock.product.name }}</span>
                                        <small class="product-sku">SKU: {{ data.stock.product.sku }}</small>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column field="quantity" header="Cantidad" class="quantity-column">
                            <template #body="{ data }">
                                <div class="quantity-cell">
                                    <span class="quantity-value">{{ formatNumber(data.quantity) }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column v-if="hasUnitPrices" field="unit_price" header="Precio Unit." class="price-column">
                            <template #body="{ data }">
                                <div class="price-cell">
                                    <span v-if="data.unit_price" class="price-value">{{ formatCurrency(data.unit_price) }}</span>
                                    <span v-else class="no-price">N/A</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="previous_stock" header="Stock Anterior" class="stock-column">
                            <template #body="{ data }">
                                <div class="stock-cell">
                                    <span class="stock-value previous">{{ formatNumber(data.previous_stock) }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="new_stock" header="Stock Nuevo" class="stock-column">
                            <template #body="{ data }">
                                <div class="stock-cell">
                                    <span class="stock-value new">{{ formatNumber(data.new_stock) }}</span>
                                    <div class="stock-change">
                                        <Tag :value="getStockChangeText(data)" :severity="getStockChangeSeverity(data)" :icon="getStockChangeIcon(data)" class="change-tag" />
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column v-if="hasUnitPrices" header="Subtotal" class="subtotal-column">
                            <template #body="{ data }">
                                <div class="subtotal-cell">
                                    <span v-if="data.unit_price" class="subtotal-value">
                                        {{ formatCurrency(data.quantity * data.unit_price) }}
                                    </span>
                                    <span v-else class="no-subtotal">N/A</span>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.stock-movement-detail {
    max-width: 100%;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
    color: #64748b;
}

.detail-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.header-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.movement-id {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.id-label {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
}

.id-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
}

.movement-type-tag {
    font-size: 0.9rem;
    font-weight: 600;
}

.movement-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.date-icon {
    color: #64748b;
    font-size: 1.1rem;
}

.date-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.date-value {
    font-weight: 600;
    color: #374151;
}

.time-value {
    color: #64748b;
    font-size: 0.8rem;
}

.info-card,
.products-card {
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
}

.card-title i {
    color: #667eea;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.info-label {
    font-weight: 500;
    color: #64748b;
    font-size: 0.9rem;
}

.info-value {
    font-weight: 600;
    color: #374151;
    font-size: 1rem;
}

.info-value.voucher {
    background: #f0f9ff;
    color: #0369a1;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    display: inline-block;
    font-family: monospace;
}

.user-info {
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
    font-weight: 600;
    color: #374151;
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.summary-card {
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.summary-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
}

.summary-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
}

.products-icon {
    background: linear-gradient(135deg, #667eea, #764ba2);
}

.quantity-icon {
    background: linear-gradient(135deg, #10b981, #059669);
}

.value-icon {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.average-icon {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.summary-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.summary-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
}

.summary-label {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
}

.empty-details {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
}

.empty-icon {
    font-size: 3rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
}

.details-table {
    border-radius: 8px;
    overflow: hidden;
}

.product-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.product-name {
    font-weight: 600;
    color: #374151;
}

.product-sku {
    color: #64748b;
    font-size: 0.8rem;
}

.quantity-cell {
    text-align: center;
}

.quantity-value {
    font-weight: 600;
    color: #374151;
    background: #f0f9ff;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    display: inline-block;
}

.price-cell,
.subtotal-cell {
    text-align: right;
}

.price-value,
.subtotal-value {
    font-weight: 600;
    color: #059669;
}

.no-price,
.no-subtotal {
    color: #94a3b8;
    font-style: italic;
}

.stock-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.stock-value {
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    display: inline-block;
}

.stock-value.previous {
    background: #fef3c7;
    color: #92400e;
}

.stock-value.new {
    background: #ecfdf5;
    color: #065f46;
}

.stock-change {
    width: 100%;
}

.change-tag {
    font-size: 0.7rem;
    font-weight: 600;
}

@media (max-width: 768px) {
    .detail-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .header-info {
        justify-content: space-between;
    }

    .movement-date {
        align-self: flex-end;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }

    .summary-cards {
        grid-template-columns: repeat(2, 1fr);
    }

    .summary-content {
        flex-direction: column;
        text-align: center;
    }

    .summary-icon {
        width: 40px;
        height: 40px;
        font-size: 1rem;
    }

    .summary-value {
        font-size: 1.2rem;
    }
}

@media (max-width: 480px) {
    .summary-cards {
        grid-template-columns: 1fr;
    }
}
</style>
