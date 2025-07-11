<script setup>
import { useStockStore } from '@/stores/stock';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import StockTable from './StockTable.vue';

const stockStore = useStockStore();
const toast = useToast();

const searchQuery = ref('');
const stockFilter = ref('all');

const filterOptions = [
    { label: 'Todos los productos', value: 'all' },
    { label: 'Stock bajo', value: 'low' },
    { label: 'Sin stock', value: 'out' },
    { label: 'Stock normal', value: 'normal' }
];

const filteredProducts = computed(() => {
    let products = stockStore.stockList || [];

    // Apply search filter
    if (searchQuery.value) {
        products = products.filter(
            (product) =>
                product.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.sku?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.barcode?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.brand?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    }

    // Apply stock filter
    switch (stockFilter.value) {
        case 'low':
            products = products.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= product.min_stock);
            break;
        case 'out':
            products = products.filter((product) => product.stock_quantity === 0);
            break;
        case 'normal':
            products = products.filter((product) => product.stock_quantity > product.min_stock);
            break;
        default:
            // 'all' - no additional filtering
            break;
    }

    return products;
});

const lowStockCount = computed(() => {
    return (stockStore.stockList || []).filter((product) => product.stock_quantity > 0 && product.stock_quantity <= product.min_stock).length;
});

const outOfStockCount = computed(() => {
    return (stockStore.stockList || []).filter((product) => product.stock_quantity === 0).length;
});

const totalProducts = computed(() => {
    return (stockStore.stockList || []).length;
});

const totalStockValue = computed(() => {
    const total = (stockStore.stockList || []).reduce((sum, product) => {
        const value = (product.stock_quantity || 0) * (parseFloat(product.purchase_price) || 0);
        return sum + value;
    }, 0);
    return total.toFixed(2);
});

async function refreshStock() {
    try {
        await stockStore.fetchStock();
        toast.add({
            severity: 'success',
            summary: 'Stock Actualizado',
            detail: 'La información del stock se ha actualizado correctamente',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la información del stock',
            life: 5000
        });
    }
}

onMounted(async () => {
    await stockStore.fetchStock();
});
</script>

<template>
    <div class="stock-management">
        <!-- Header Section with Gradient Background -->
        <div class="header-section">
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-chart-bar"></i>
                    </div>
                    <div>
                        <h1 class="main-title">Control de Stock</h1>
                        <p class="subtitle">Visualiza y controla el inventario actual de productos</p>
                    </div>
                </div>
                <div class="header-actions">
                    <Button label="Actualizar" icon="pi pi-refresh" class="refresh-button" :loading="stockStore.loading" raised @click="refreshStock" />
                </div>
            </div>
        </div>

        <!-- Stock Summary Cards -->
        <div class="stock-summary">
            <div class="summary-card low-stock">
                <div class="card-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div class="card-content">
                    <h3>{{ lowStockCount }}</h3>
                    <p>Stock Bajo</p>
                </div>
            </div>
            <div class="summary-card out-of-stock">
                <div class="card-icon">
                    <i class="pi pi-times-circle"></i>
                </div>
                <div class="card-content">
                    <h3>{{ outOfStockCount }}</h3>
                    <p>Sin Stock</p>
                </div>
            </div>
            <div class="summary-card total-products">
                <div class="card-icon">
                    <i class="pi pi-box"></i>
                </div>
                <div class="card-content">
                    <h3>{{ totalProducts }}</h3>
                    <p>Total Productos</p>
                </div>
            </div>
            <div class="summary-card stock-value">
                <div class="card-icon">
                    <i class="pi pi-dollar"></i>
                </div>
                <div class="card-content">
                    <h3>S/ {{ totalStockValue }}</h3>
                    <p>Valor del Stock</p>
                </div>
            </div>
        </div>

        <!-- Main Content Card -->
        <div class="content-card">
            <div class="table-header">
                <h2 class="table-title">Inventario de Productos</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="pi pi-search"></i>
                        <input v-model="searchQuery" type="text" placeholder="Buscar productos..." class="search-input" />
                    </div>
                    <div class="filter-box">
                        <Select v-model="stockFilter" :options="filterOptions" option-label="label" option-value="value" placeholder="Filtrar por stock" class="filter-select" />
                    </div>
                </div>
            </div>

            <StockTable :products="filteredProducts" :loading="stockStore.loading" />
        </div>

        <Toast position="top-right" />
    </div>
</template>

<style scoped>
.stock-management {
    min-height: 100vh;
}

/* Header Section */
.header-section {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 18px;
    margin-bottom: 2rem;
    box-shadow: 0 8px 32px rgba(79, 70, 229, 0.2);
}

.title-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.icon-wrapper {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.icon-wrapper i {
    font-size: 1.8rem;
    color: white;
}

.main-title {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffffff, #f8fafc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.subtitle {
    margin: 0.5rem 0 0 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
}

.refresh-button {
    background: linear-gradient(135deg, #059669, #047857) !important;
    border: none !important;
    padding: 0.875rem 2rem !important;
    font-weight: 600 !important;
    border-radius: 12px !important;
    color: white !important;
    box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3);
    transition: box-shadow 0.3s;
}

.refresh-button:hover {
    box-shadow: 0 8px 30px rgba(5, 150, 105, 0.4);
}

/* Stock Summary Cards */
.stock-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.summary-card {
    background: var(--surface-card);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px var(--shadow-color);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition:
        transform 0.3s,
        box-shadow 0.3s;
}

.summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow-color);
}

.card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.low-stock .card-icon {
    background: var(--orange-100);
}

.low-stock .card-icon i {
    color: var(--orange-600);
    font-size: 1.5rem;
}

.out-of-stock .card-icon {
    background: var(--red-100);
}

.out-of-stock .card-icon i {
    color: var(--red-600);
    font-size: 1.5rem;
}

.total-products .card-icon {
    background: var(--blue-100);
}

.total-products .card-icon i {
    color: var(--blue-600);
    font-size: 1.5rem;
}

.stock-value .card-icon {
    background: var(--green-100);
}

.stock-value .card-icon i {
    color: var(--green-600);
    font-size: 1.5rem;
}

.card-content h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
}

.card-content p {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

/* Content Card */
.content-card {
    background: var(--surface-card);
    border-radius: 18px;
    box-shadow: 0 2px 8px var(--shadow-color);
    padding: 2rem;
    margin-bottom: 2rem;
}

.table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.table-title {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--text-color);
}

.table-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
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
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.search-input::placeholder {
    color: var(--text-color-secondary);
}

.filter-select {
    width: 200px;
}

.filter-select :deep(.p-dropdown) {
    border-radius: 12px;
    border: 2px solid var(--surface-border);
}

/* Dark mode enhancements */
[data-theme='dark'] .low-stock .card-icon {
    background: rgba(251, 146, 60, 0.15);
}

[data-theme='dark'] .low-stock .card-icon i {
    color: var(--orange-400);
}

[data-theme='dark'] .out-of-stock .card-icon {
    background: rgba(239, 68, 68, 0.15);
}

[data-theme='dark'] .out-of-stock .card-icon i {
    color: var(--red-400);
}

[data-theme='dark'] .total-products .card-icon {
    background: rgba(59, 130, 246, 0.15);
}

[data-theme='dark'] .total-products .card-icon i {
    color: var(--blue-400);
}

[data-theme='dark'] .stock-value .card-icon {
    background: rgba(34, 197, 94, 0.15);
}

[data-theme='dark'] .stock-value .card-icon i {
    color: var(--green-400);
}

/* Responsive Design */
@media (max-width: 768px) {
    .stock-management {
        padding: 1rem;
    }

    .header-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
    }

    .table-header {
        flex-direction: column;
        align-items: stretch;
    }

    .table-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .search-input {
        width: 100%;
    }

    .filter-select {
        width: 100%;
    }

    .stock-summary {
        grid-template-columns: 1fr;
    }
}
</style>
