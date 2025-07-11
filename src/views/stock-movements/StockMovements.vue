<script setup>
import { useStockMovementsStore } from '@/stores/stockMovements';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import StockMovementDetail from './StockMovementDetail.vue';
import StockMovementForm from './StockMovementForm.vue';
import StockMovementsTable from './StockMovementsTable.vue';

const stockMovementsStore = useStockMovementsStore();
const toast = useToast();

// Reactive variables
const movementDialog = ref(false);
const detailDialog = ref(false);
const correctionDialog = ref(false);
const selectedMovement = ref({});
const searchQuery = ref('');
const selectedType = ref(null);
const dateRange = ref(null);

// Movement types for filter
const movementTypes = ref([
    { label: 'Entrada', value: 'entrada' },
    { label: 'Salida', value: 'salida' },
    { label: 'Ajuste', value: 'ajuste' },
    { label: 'Devolución', value: 'devolucion' }
]);

// Computed properties
const filteredMovements = computed(() => {
    let filtered = stockMovementsStore.stockMovementsList;

    // Filter by search query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(
            (movement) => movement.reason?.toLowerCase().includes(query) || movement.voucher_number?.toLowerCase().includes(query) || movement.user?.name?.toLowerCase().includes(query) || movement.id?.toString().includes(query)
        );
    }

    // Filter by movement type
    if (selectedType.value) {
        filtered = filtered.filter((movement) => movement.movement_type === selectedType.value);
    }

    // Filter by date range
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
        const startDate = new Date(dateRange.value[0]);
        const endDate = new Date(dateRange.value[1]);
        filtered = filtered.filter((movement) => {
            const movementDate = new Date(movement.created_at);
            return movementDate >= startDate && movementDate <= endDate;
        });
    }

    return filtered;
});

// Methods
const fetchMovements = async () => {
    try {
        await stockMovementsStore.fetchStockMovements();
        if (stockMovementsStore.stockMovementsList.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'Información',
                detail: 'No hay movimientos de stock registrados',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los movimientos de stock',
            life: 5000
        });
    }
};

const openNew = () => {
    selectedMovement.value = {};
    stockMovementsStore.resetState();
    movementDialog.value = true;
};

const viewMovement = (movement) => {
    selectedMovement.value = { ...movement };
    detailDialog.value = true;
};

const editMovement = (movement) => {
    selectedMovement.value = { ...movement };
    stockMovementsStore.resetState();
    movementDialog.value = true;
};

const editFromDetail = () => {
    detailDialog.value = false;
    stockMovementsStore.resetState();
    movementDialog.value = true;
};

const createCorrectionMovement = async (movement) => {
    // Verificar si el movimiento ya está cancelado
    if (isAlreadyCancelled(movement)) {
        toast.add({
            severity: 'warn',
            summary: 'Movimiento ya cancelado',
            detail: 'Este movimiento ya ha sido cancelado y no puede volver a cancelarse',
            life: 4000
        });
        return;
    }

    selectedMovement.value = { ...movement };
    correctionDialog.value = true;
};

const hideDialog = () => {
    movementDialog.value = false;
    selectedMovement.value = {};
    stockMovementsStore.resetState(); // Clear any validation errors when closing dialog
};

const handleSaveMovement = async (movementData) => {
    try {
        // Reset validation errors before attempting save
        stockMovementsStore.resetState();

        if (selectedMovement.value.id) {
            await stockMovementsStore.updateStockMovement(selectedMovement.value.id, movementData);
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: stockMovementsStore.message,
                life: 3000
            });
        } else {
            await stockMovementsStore.createStockMovement(movementData);
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: stockMovementsStore.message,
                life: 3000
            });
        }
        hideDialog();
    } catch (error) {
        // Validation errors are already handled by the store and displayed in the form
        if (stockMovementsStore.validationErrors && stockMovementsStore.validationErrors.length > 0) {
            toast.add({
                severity: 'warn',
                summary: 'Errores de Validación',
                detail: 'Por favor, corrige los errores en el formulario',
                life: 4000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: stockMovementsStore.error?.message || 'Error al guardar el movimiento',
                life: 5000
            });
        }
    }
};

const getInverseMovementType = (movementType) => {
    const inverseMap = {
        entrada: 'salida',
        salida: 'entrada',
        devolucion: 'salida' // Las devoluciones se anulan con salida
    };
    return inverseMap[movementType] || 'ajuste';
};

const getDialogTitle = () => {
    if (!selectedMovement.value?.movement_type) return 'Cancelar Movimiento';

    const titles = {
        entrada: 'Cancelar Movimiento de Entrada',
        salida: 'Cancelar Movimiento de Salida',
        devolucion: 'Cancelar Devolución'
    };

    return titles[selectedMovement.value.movement_type] || 'Cancelar Movimiento';
};

const getDialogSubtitle = () => {
    const inverseType = getInverseMovementType(selectedMovement.value?.movement_type);
    const typeLabels = {
        entrada: 'entrada',
        salida: 'salida',
        devolucion: 'salida'
    };

    return `Se creará un movimiento de ${typeLabels[inverseType]} para reestablecer el stock`;
};

const getInverseTypeLabel = () => {
    const movement = selectedMovement.value;
    if (!movement) return '';

    const inverseType = getInverseMovementType(movement.movement_type);
    const typeLabels = {
        entrada: 'entrada',
        salida: 'salida',
        devolucion: 'salida'
    };

    return typeLabels[inverseType] || 'ajuste';
};

const getCancellationMessage = () => {
    const movement = selectedMovement.value;
    if (!movement) return '';

    const inverseType = getInverseMovementType(movement.movement_type);
    const typeLabels = {
        salida: 'salida de productos',
        entrada: 'entrada de productos'
    };

    const actionText = typeLabels[inverseType] || 'movimiento';

    return `Se va a crear un movimiento de ${actionText} con la finalidad de reestablecer el stock y cancelar el movimiento número ${movement.id}`;
};

const isAlreadyCancelled = (movement) => {
    // Verificar por el campo canceled_at (forma principal)
    if (movement.canceled_at) {
        return true;
    }

    // Verificar por convención de nombres (fallback)
    if (movement.reason?.includes('CANCELACIÓN') || movement.voucher_number?.startsWith('CANCEL-') || movement.reason?.includes('ANULACIÓN') || movement.voucher_number?.startsWith('ANUL-') || movement.reason?.includes('CORRECCIÓN')) {
        return true;
    }

    // Si hay un campo específico para estado (fallback)
    if (movement.status === 'cancelled' || movement.is_cancelled || movement.status === 'annulled' || movement.is_annulled) {
        return true;
    }

    return false;
};

const confirmCancellation = async () => {
    try {
        stockMovementsStore.resetState();

        const movement = selectedMovement.value;

        // Usar el endpoint seguro del backend
        await stockMovementsStore.cancelStockMovement(movement.id);

        // Refrescar la lista de movimientos para mostrar el movimiento correctivo
        await fetchMovements();

        toast.add({
            severity: 'success',
            summary: 'Movimiento cancelado',
            detail: stockMovementsStore.message || `Movimiento #${movement.id} cancelado exitosamente`,
            life: 5000
        });

        correctionDialog.value = false;
        selectedMovement.value = {};
    } catch (error) {
        if (stockMovementsStore.validationErrors && stockMovementsStore.validationErrors.length > 0) {
            toast.add({
                severity: 'warn',
                summary: 'Errores de Validación',
                detail: 'Error en los datos del movimiento de cancelación',
                life: 4000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: stockMovementsStore.error?.message || 'Error al cancelar el movimiento',
                life: 5000
            });
        }
    }
};

// Lifecycle
onMounted(() => {
    fetchMovements();
});
</script>

<template>
    <div>
        <!-- Header Section with Gradient Background -->
        <div class="header-section">
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-arrows-v"></i>
                    </div>
                    <div>
                        <h1 class="main-title">Gestión de Movimientos de Stock</h1>
                        <p class="subtitle">Administra y controla los movimientos de inventario</p>
                    </div>
                </div>
                <Button label="Nuevo Movimiento" icon="pi pi-plus" class="create-button" raised @click="openNew" />
            </div>
        </div>

        <!-- Main Content Card -->
        <div class="content-card">
            <div class="table-header">
                <h2 class="table-title">Lista de Movimientos</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="pi pi-search"></i>
                        <input v-model="searchQuery" type="text" placeholder="Buscar movimientos..." class="search-input" />
                    </div>
                    <div class="filter-section">
                        <Select v-model="selectedType" :options="movementTypes" option-label="label" option-value="value" placeholder="Tipo de movimiento" show-clear class="type-filter" />
                        <DatePicker v-model="dateRange" selection-mode="range" placeholder="Rango de fechas" date-format="dd/mm/yy" show-clear class="date-filter" />
                    </div>
                </div>
            </div>

            <StockMovementsTable :movements="filteredMovements" :loading="stockMovementsStore.loading" @view="viewMovement" @edit="editMovement" @correct="createCorrectionMovement" />
        </div>

        <!-- Enhanced Movement Dialog -->
        <Dialog v-model:visible="movementDialog" :style="{ width: '900px' }" :header="selectedMovement?.id ? 'Editar Movimiento' : 'Nuevo Movimiento'" :modal="true" class="movement-dialog">
            <template #header>
                <div class="dialog-header">
                    <div class="dialog-icon">
                        <i :class="selectedMovement?.id ? 'pi pi-arrows-v' : 'pi pi-plus'"></i>
                    </div>
                    <div>
                        <h3>{{ selectedMovement?.id ? 'Editar Movimiento' : 'Nuevo Movimiento' }}</h3>
                        <p>{{ selectedMovement?.id ? 'Modifica la información del movimiento' : 'Completa los datos del nuevo movimiento' }}</p>
                    </div>
                </div>
            </template>

            <StockMovementForm :movement="selectedMovement" :loading="stockMovementsStore.loading" :api-errors="stockMovementsStore.validationErrors" @submit="handleSaveMovement" @cancel="hideDialog" />
        </Dialog>

        <!-- Movement Detail Dialog -->
        <Dialog v-model:visible="detailDialog" :style="{ width: '800px' }" header="Detalle del Movimiento" :modal="true" class="detail-dialog">
            <StockMovementDetail :movement="selectedMovement" />

            <template #footer>
                <div class="dialog-actions">
                    <Button label="Cerrar" icon="pi pi-times" outlined @click="detailDialog = false" />
                    <Button label="Editar" icon="pi pi-pencil" @click="editFromDetail" />
                </div>
            </template>
        </Dialog>

        <!-- Cancel Movement Dialog -->
        <Dialog v-model:visible="correctionDialog" :style="{ width: '800px' }" :header="getDialogTitle()" :modal="true" class="cancel-dialog">
            <template #header>
                <div class="dialog-header cancel">
                    <div class="dialog-icon cancel">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div>
                        <h3>{{ getDialogTitle() }}</h3>
                        <p>{{ getDialogSubtitle() }}</p>
                    </div>
                </div>
            </template>

            <div class="cancel-content">
                <div class="warning-box">
                    <i class="pi pi-exclamation-triangle"></i>
                    <div>
                        <p class="warning-text">
                            <strong>{{ getCancellationMessage() }}</strong>
                        </p>
                        <p class="warning-subtext">El backend se encargará automáticamente de crear el movimiento inverso y actualizar el inventario.</p>
                    </div>
                </div>

                <!-- Readonly products list -->
                <div class="products-readonly">
                    <h4 class="products-title">Productos que serán reestablecidos automáticamente:</h4>
                    <div class="products-list">
                        <div v-for="(detail, index) in selectedMovement?.details || []" :key="index" class="product-item-readonly">
                            <div class="product-info">
                                <span class="product-name">{{ detail.stock?.product?.name || 'Producto' }}</span>
                                <span class="product-sku">SKU: {{ detail.stock?.product?.sku || 'N/A' }}</span>
                            </div>
                            <div class="product-quantity">
                                <span class="quantity-label">Cantidad:</span>
                                <span class="quantity-value">{{ detail.quantity }}</span>
                            </div>
                            <div v-if="detail.unit_price" class="product-price">
                                <span class="price-label">Precio:</span>
                                <span class="price-value">S/ {{ parseFloat(detail.unit_price).toFixed(2) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info about backend process -->
                <div class="info-box">
                    <i class="pi pi-info-circle"></i>
                    <div>
                        <p><strong>Proceso automático del sistema:</strong></p>
                        <ul>
                            <li>✅ El movimiento original será marcado como cancelado</li>
                            <li>✅ Se creará automáticamente un movimiento de {{ getInverseTypeLabel() }}</li>
                            <li>✅ El inventario se actualizará en una transacción atómica</li>
                            <li>✅ Se mantendrá la trazabilidad completa</li>
                        </ul>
                    </div>
                </div>

                <!-- Final confirmation -->
                <div class="confirmation-box">
                    <p><strong>¿Confirmas que deseas cancelar este movimiento?</strong></p>
                    <p>Esta acción no se puede deshacer, pero mantendrá la trazabilidad completa.</p>
                </div>
            </div>

            <template #footer>
                <div class="dialog-actions">
                    <Button label="No, mantener movimiento" icon="pi pi-times" outlined @click="correctionDialog = false" />
                    <Button label="Sí, cancelar movimiento" icon="pi pi-check" :loading="stockMovementsStore.loading" severity="danger" @click="confirmCancellation" />
                </div>
            </template>
        </Dialog>

        <Toast position="top-right" />
    </div>
</template>

<style scoped>
.header-section {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
}

.title-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.icon-wrapper {
    width: 70px;
    height: 70px;
    border-radius: 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2rem;
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.main-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2c3e50;
    margin: 0;
    background: linear-gradient(135deg, #667eea, #764ba2);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    color: #64748b;
    font-size: 1.1rem;
    margin: 0.5rem 0 0 0;
}

.create-button {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 12px;
    padding: 0.75rem 2rem;
    font-weight: 600;
    font-size: 1rem;
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
    transition: all 0.3s ease;
}

.create-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(16, 185, 129, 0.4);
}

.content-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.table-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
}

.table-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
}

.search-box i {
    position: absolute;
    left: 1rem;
    color: #64748b;
    z-index: 1;
}

.search-input {
    padding: 0.75rem 1rem 0.75rem 3rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.9rem;
    width: 300px;
    transition: all 0.3s ease;
}

.search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-section {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.type-filter,
.date-filter {
    min-width: 200px;
}

.dialog-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0;
}

.dialog-header.danger {
    color: #dc2626;
}

.dialog-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
}

.dialog-icon.danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

.dialog-icon.cancel {
    background: linear-gradient(135deg, #f97316, #ea580c);
}

.dialog-header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
}

.dialog-header p {
    margin: 0.25rem 0 0 0;
    color: #64748b;
    font-size: 0.9rem;
}

.cancel-content {
    padding: 0;
}

.warning-box {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 12px;
    align-items: flex-start;
    margin-bottom: 1.5rem;
}

.warning-box i {
    color: #f59e0b;
    font-size: 1.5rem;
    margin-top: 0.25rem;
}

.warning-text {
    font-weight: 500;
    color: #92400e;
    margin: 0 0 0.5rem 0;
}

.warning-subtext {
    color: #b45309;
    font-size: 0.9rem;
    margin: 0;
}

.products-readonly {
    margin-bottom: 1.5rem;
}

.products-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
}

.products-list {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    max-height: 300px;
    overflow-y: auto;
}

.product-item-readonly {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    gap: 1rem;
}

.product-item-readonly:last-child {
    border-bottom: none;
}

.product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.product-name {
    font-weight: 600;
    color: #374151;
}

.product-sku {
    font-size: 0.8rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    display: inline-block;
    width: fit-content;
}

.product-quantity,
.product-price {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.quantity-label,
.price-label {
    font-size: 0.8rem;
    color: #6b7280;
}

.quantity-value {
    font-weight: 600;
    color: #059669;
    background: #ecfdf5;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.price-value {
    font-weight: 600;
    color: #0369a1;
    background: #f0f9ff;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.confirmation-box {
    background: #f0f9ff;
    border: 1px solid #3b82f6;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
}

.confirmation-box p {
    margin: 0 0 0.5rem 0;
    color: #1e40af;
}

.confirmation-box p:last-child {
    margin: 0;
    font-size: 0.9rem;
    color: #3730a3;
}

.dialog-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.cancel-button {
    background: transparent;
    color: #64748b;
    border: 2px solid #e2e8f0;
}

.delete-button {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: none;
    color: white;
}

@media (max-width: 768px) {
    .stock-movements-management {
        padding: 1rem;
    }

    .header-content {
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem;
    }

    .main-title {
        font-size: 2rem;
    }

    .table-header {
        flex-direction: column;
        align-items: stretch;
    }

    .table-actions {
        justify-content: stretch;
        flex-direction: column;
    }

    .search-input {
        width: 100%;
    }

    .filter-section {
        flex-direction: column;
    }

    .type-filter,
    .date-filter {
        width: 100%;
        min-width: auto;
    }
}
</style>
