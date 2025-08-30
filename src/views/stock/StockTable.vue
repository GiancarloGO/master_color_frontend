<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
    products: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const router = useRouter();

function getStockSeverity(product) {
    const quantity = product.stock_quantity || 0;
    const minStock = product.min_stock || 0;

    if (quantity === 0) return 'danger'; // Rojo - Sin stock
    if (quantity <= minStock) return 'warning'; // Amarillo - Stock bajo
    return 'success'; // Verde - Stock normal
}

function getStockCssClass(product) {
    const quantity = product.stock_quantity || 0;
    const minStock = product.min_stock || 0;

    if (quantity === 0) return 'stock-danger'; // Rojo - Sin stock
    if (quantity <= minStock) return 'stock-warning'; // Amarillo - Stock bajo
    return 'stock-success'; // Verde - Stock normal
}

function getStockStatus(product) {
    const quantity = product.stock_quantity || 0;
    const minStock = product.min_stock || 0;

    if (quantity === 0) return 'Sin Stock';
    if (quantity <= minStock) return 'Stock Bajo';
    return 'Disponible';
}

function getStockStatusSeverity(product) {
    const quantity = product.stock_quantity || 0;
    const minStock = product.min_stock || 0;

    if (quantity === 0) return 'danger'; // Rojo - Sin stock
    if (quantity <= minStock) return 'warning'; // Amarillo - Stock bajo
    return 'success'; // Verde - Stock normal
}

function formatPrice(price) {
    if (!price) return '0.00';
    return parseFloat(price).toFixed(2);
}

function calculateStockValue(product) {
    const quantity = product.stock_quantity || 0;
    const purchasePrice = parseFloat(product.purchase_price) || 0;
    return (quantity * purchasePrice).toFixed(2);
}

function handleImageError(event) {
    event.target.style.display = 'none';
    event.target.nextElementSibling?.classList.add('show');
}

function viewMovements(product) {
    router.push(`/stock-movements?product_id=${product.id}`);
}
</script>

<template>
    <div class="stock-table-container">
        <DataTable
            :value="products"
            :loading="loading"
            data-key="id"
            :paginator="true"
            :rows="10"
            :rows-per-page-options="[5, 10, 20, 50]"
            paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            current-page-report-template="{first} al {last} de {totalRecords} productos"
            responsive-layout="scroll"
            class="stock-table"
            striped-rows
            :global-filter-fields="['name', 'sku', 'barcode', 'brand', 'category']"
        >
            <template #empty>
                <div class="empty-state">
                    <i class="pi pi-box" style="font-size: 3rem; color: var(--text-color-secondary)"></i>
                    <h3>No hay productos</h3>
                    <p>No se encontraron productos en el inventario</p>
                </div>
            </template>

            <template #loading>
                <div class="loading-state">
                    <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
                    <p>Cargando inventario...</p>
                </div>
            </template>

            <!-- Imagen del producto -->
            <Column field="image_url" header="Imagen" :sortable="false" style="width: 80px">
                <template #body="{ data }">
                    <div class="product-image-container">
                        <img v-if="data.image_url" :src="data.image_url" :alt="data.name" class="product-image" @error="handleImageError" />
                        <div v-else class="no-image">
                            <i class="pi pi-image"></i>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Información del producto -->
            <Column field="name" header="Producto" :sortable="true" style="min-width: 200px">
                <template #body="{ data }">
                    <div class="product-info">
                        <div class="product-name">{{ data.name }}</div>
                        <div class="product-details">
                            <span class="sku">SKU: {{ data.sku }}</span>
                            <span v-if="data.brand" class="brand">| {{ data.brand }}</span>
                        </div>
                        <div v-if="data.category" class="product-category">
                            <Tag :value="data.category" severity="info" class="standard-tag" />
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Stock actual -->
            <Column field="stock_quantity" header="Stock Actual" :sortable="true" style="width: 120px">
                <template #body="{ data }">
                    <div class="stock-quantity">
                        <span :class="['custom-stock-tag', getStockCssClass(data)]">{{ data.stock_quantity || 0 }}</span>
                    </div>
                </template>
            </Column>

            <!-- Stock mínimo -->
            <Column field="min_stock" header="Mín." :sortable="true" style="width: 80px">
                <template #body="{ data }">
                    <span class="min-stock">{{ data.min_stock || 0 }}</span>
                </template>
            </Column>

            <!-- Stock máximo -->
            <Column field="max_stock" header="Máx." :sortable="true" style="width: 80px">
                <template #body="{ data }">
                    <span class="max-stock">{{ data.max_stock || 0 }}</span>
                </template>
            </Column>

            <!-- Precios -->
            <Column header="Precios" :sortable="false" style="width: 150px">
                <template #body="{ data }">
                    <div class="price-info">
                        <div class="purchase-price">
                            <small>Compra:</small>
                            <span>S/ {{ formatPrice(data.purchase_price) }}</span>
                        </div>
                        <div class="sale-price">
                            <small>Venta:</small>
                            <span>S/ {{ formatPrice(data.sale_price) }}</span>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Valor del stock -->
            <Column header="Valor Stock" :sortable="false" style="width: 120px">
                <template #body="{ data }">
                    <div class="stock-value">
                        <span class="value-amount"> S/ {{ calculateStockValue(data) }} </span>
                        <small class="value-label">Total</small>
                    </div>
                </template>
            </Column>

            <!-- Estado del stock -->
            <Column header="Estado" :sortable="false" style="width: 100px">
                <template #body="{ data }">
                    <div class="stock-status">
                        <span :class="['custom-status-tag', getStockCssClass(data)]">{{ getStockStatus(data) }}</span>
                    </div>
                </template>
            </Column>

            <!-- Acciones -->
            <Column header="Acciones" :sortable="false" style="width: 120px">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button v-tooltip="'Ver movimientos'" icon="pi pi-chart-line" class="p-button-rounded p-button-text p-button-sm" @click="viewMovements(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.stock-table-container {
    width: 100%;
}

.stock-table {
    box-shadow: none;
}

.stock-table :deep(.p-datatable-header) {
    background: transparent;
    border: none;
    padding: 0;
}

.stock-table :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-100);
    border: 1px solid var(--surface-200);
    padding: 1rem 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
}

.stock-table :deep(.p-datatable-tbody > tr > td) {
    padding: 1rem 0.75rem;
    border: 1px solid var(--surface-200);
}

.stock-table :deep(.p-datatable-tbody > tr:hover) {
    background: var(--surface-50);
}

/* Product Image */
.product-image-container {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface-100);
    display: flex;
    align-items: center;
    justify-content: center;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary);
    font-size: 1.5rem;
}

/* Product Info */
.product-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.product-name {
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.3;
}

.product-details {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.product-category {
    margin-top: 0.25rem;
}

.category-tag {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
}

/* Stock Quantity */
.stock-quantity {
    display: flex;
    justify-content: center;
}

.stock-tag {
    font-weight: 600;
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
}

/* Min/Max Stock */
.min-stock,
.max-stock {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    text-align: center;
    display: block;
}

/* Price Info */
.price-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.purchase-price,
.sale-price {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
}

.purchase-price small,
.sale-price small {
    color: var(--text-color-secondary);
}

.purchase-price span,
.sale-price span {
    font-weight: 600;
    color: var(--text-color);
}

/* Stock Value */
.stock-value {
    text-align: center;
}

.value-amount {
    display: block;
    font-weight: 600;
    color: var(--green-600);
    font-size: 0.875rem;
}

.value-label {
    display: block;
    color: var(--text-color-secondary);
    font-size: 0.7rem;
    margin-top: 0.25rem;
}

/* Stock Status */
.stock-status {
    display: flex;
    justify-content: center;
}

.status-tag {
    font-size: 0.7rem;
    padding: 0.375rem 0.625rem;
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

/* Standard tag styling to match StockMovements */
.standard-tag {
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    border-radius: 6px !important;
    padding: 0.25rem 0.5rem !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.375rem !important;
    transition: all 0.2s ease !important;
}

/* Custom stock tags with proper colors */
.custom-stock-tag,
.custom-status-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
    text-align: center;
    min-width: 60px;
    border: 1px solid transparent;
}

.custom-status-tag {
    font-size: 0.7rem;
    padding: 0.375rem 0.625rem;
    min-width: 80px;
}

/* Rojo - Sin stock (Lara theme danger colors) */
.stock-danger {
    background-color: #ef4444;
    color: #ffffff;
    border-color: #dc2626;
}

/* Amarillo - Stock bajo (Amarillo más puro) */
.stock-warning {
    background-color: #eab308;
    color: #ffffff;
    border-color: #ca8a04;
}

/* Verde - Stock normal (Lara theme success colors) */
.stock-success {
    background-color: #10b981;
    color: #ffffff;
    border-color: #059669;
}

/* Dark mode styles (Lara dark theme) */
[data-theme='dark'] .stock-danger {
    background-color: #dc2626;
    color: #ffffff;
    border-color: #b91c1c;
}

[data-theme='dark'] .stock-warning {
    background-color: #ca8a04;
    color: #ffffff;
    border-color: #a16207;
}

[data-theme='dark'] .stock-success {
    background-color: #059669;
    color: #ffffff;
    border-color: #047857;
}

/* Dark mode enhancements */
[data-theme='dark'] .value-amount {
    color: var(--green-400);
}

[data-theme='dark'] .stock-table :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-800);
    border-color: var(--surface-700);
}

[data-theme='dark'] .stock-table :deep(.p-datatable-tbody > tr > td) {
    border-color: var(--surface-700);
}

[data-theme='dark'] .stock-table :deep(.p-datatable-tbody > tr:hover) {
    background: var(--surface-800);
}

[data-theme='dark'] .product-image-container {
    background: var(--surface-800);
}

/* Responsive */
@media (max-width: 768px) {
    .stock-table :deep(.p-datatable-thead > tr > th),
    .stock-table :deep(.p-datatable-tbody > tr > td) {
        padding: 0.5rem 0.375rem;
        font-size: 0.8rem;
    }

    .product-image-container {
        width: 40px;
        height: 40px;
    }

    .product-name {
        font-size: 0.875rem;
    }

    .price-info {
        font-size: 0.7rem;
    }

    .action-buttons .p-button {
        width: 1.75rem;
        height: 1.75rem;
    }
}
</style>
