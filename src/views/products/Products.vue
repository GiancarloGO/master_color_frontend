<script setup>
import { useProductsStore } from '@/stores/products';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import ProductForm from './ProductForm.vue';
import ProductsTable from './ProductsTable.vue';

const productsStore = useProductsStore();
const toast = useToast();

const productDialog = ref(false);
const deleteProductDialog = ref(false);
const selectedProduct = ref({});
const dialogMode = ref('create');
const searchQuery = ref('');

const filteredProducts = computed(() => {
    if (!searchQuery.value) {
        return productsStore.productsList || [];
    }
    return (
        productsStore.productsList?.filter(
            (product) =>
                product.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.sku?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.barcode?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.brand?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.presentation?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.unidad?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
        ) || []
    );
});

function openNew() {
    selectedProduct.value = {
        name: '',
        sku: '',
        image_url: '',
        barcode: '',
        brand: '',
        description: '',
        category: '',
        presentation: '',
        unidad: '',
        user_id: '',
        quantity: 0,
        min_stock: 0,
        max_stock: 0,
        purchase_price: null,
        sale_price: null
    };
    productDialog.value = true;
    dialogMode.value = 'create';
}

function editProduct(product) {
    selectedProduct.value = { ...product };
    dialogMode.value = 'edit';
    productDialog.value = true;
}

function hideDialog() {
    productDialog.value = false;
    selectedProduct.value = {};
}

async function handleSaveProduct(productData) {
    try {
        if (dialogMode.value === 'create') {
            await productsStore.createProduct(productData);

            toast.add({
                severity: 'success',
                summary: 'Producto Creado',
                detail: 'El producto se ha creado correctamente',
                life: 4000
            });
        } else {
            await productsStore.updateProduct(selectedProduct.value.id, productData);
            toast.add({
                severity: 'success',
                summary: 'Producto Actualizado',
                detail: 'Los cambios se han guardado correctamente',
                life: 4000
            });
        }
        await productsStore.fetchProducts();
        hideDialog();
    } catch (error) {
        if (productsStore.validationErrors) {
            for (let i = 0; i < productsStore.validationErrors.length; i++) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: productsStore.validationErrors[i],
                    life: 5000
                });
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: productsStore.message || 'Ha ocurrido un error inesperado',
                life: 5000
            });
        }
    }
}

function confirmDeleteProduct(product) {
    selectedProduct.value = product;
    deleteProductDialog.value = true;
}

async function deleteProduct() {
    try {
        await productsStore.deleteProduct(selectedProduct.value.id);
        deleteProductDialog.value = false;
        selectedProduct.value = {};

        toast.add({
            severity: 'success',
            summary: 'Producto Eliminado',
            detail: 'El producto se ha eliminado correctamente',
            life: 4000
        });
    } catch (error) {
        if (productsStore.validationErrors) {
            for (let i = 0; i < productsStore.validationErrors.length; i++) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: productsStore.validationErrors[i],
                    life: 5000
                });
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: productsStore.message || 'No se pudo eliminar el producto',
                life: 5000
            });
        }
    }
}

onMounted(async () => {
    await productsStore.fetchProducts();
});
</script>

<template>
    <div class="products-management">
        <!-- Header Section with Gradient Background -->
        <div class="header-section">
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-box"></i>
                    </div>
                    <div>
                        <h1 class="main-title">Gestión de Productos</h1>
                        <p class="subtitle">Administra y controla los productos del sistema</p>
                    </div>
                </div>
                <Button label="Nuevo Producto" icon="pi pi-plus" class="create-button" raised @click="openNew" />
            </div>
        </div>

        <!-- Main Content Card -->
        <div class="content-card">
            <div class="table-header">
                <h2 class="table-title">Lista de Productos</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="pi pi-search"></i>
                        <input v-model="searchQuery" type="text" placeholder="Buscar productos..." class="search-input" />
                    </div>
                </div>
            </div>

            <ProductsTable :products="filteredProducts" :loading="productsStore.loading" @edit="editProduct" @delete="confirmDeleteProduct" />
        </div>

        <!-- Enhanced Product Dialog -->
        <Dialog v-model:visible="productDialog" :style="{ width: '750px' }" :header="selectedProduct?.id ? 'Editar Producto' : 'Nuevo Producto'" :modal="true" class="product-dialog">
            <template #header>
                <div class="dialog-header">
                    <div class="dialog-icon">
                        <i :class="selectedProduct?.id ? 'pi pi-box' : 'pi pi-plus'"></i>
                    </div>
                    <div>
                        <h3>{{ selectedProduct?.id ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
                        <p>{{ selectedProduct?.id ? 'Modifica la información del producto' : 'Completa los datos del nuevo producto' }}</p>
                    </div>
                </div>
            </template>

            <ProductForm :product="selectedProduct" :loading="productsStore.loading" @submit="handleSaveProduct" @cancel="hideDialog" />
        </Dialog>

        <!-- Compact Delete Dialog -->
        <Dialog v-model:visible="deleteProductDialog" :style="{ width: '400px' }" header="Confirmar Eliminación" :modal="true" class="delete-dialog-compact">
            <div class="delete-content-compact">
                <div class="warning-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div class="warning-message">
                    <p>
                        ¿Eliminar el producto <strong>{{ selectedProduct?.name || 'seleccionado' }}</strong
                        >?
                    </p>
                    <small>Esta acción no se puede deshacer</small>
                </div>
            </div>

            <template #footer>
                <div class="dialog-actions-compact">
                    <Button label="Cancelar" class="p-button-text" @click="deleteProductDialog = false" />
                    <Button label="Eliminar" icon="pi pi-trash" severity="danger" :loading="productsStore.loading" @click="deleteProduct" />
                </div>
            </template>
        </Dialog>

        <Toast position="top-right" />
    </div>
</template>

<style scoped>
.products-management {
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 18px;
    margin-bottom: 2rem;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
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

.create-button {
    background: linear-gradient(135deg, #10b981, #059669) !important;
    border: none !important;
    padding: 0.875rem 2rem !important;
    font-weight: 600 !important;
    border-radius: 12px !important;
    color: white !important;
    box-shadow: 0 4px 20px var(--shadow-color);
    transition: box-shadow 0.3s;
}

.create-button:hover {
    box-shadow: 0 8px 30px var(--shadow-color-hover);
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
}

.table-title {
    margin: 0;
    font-size: 1.3rem;
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
.product-dialog :deep(.p-dialog-content) {
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

/* Compact Delete Dialog */
.delete-dialog-compact :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.delete-content-compact {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.warning-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--red-100);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.warning-icon i {
    color: var(--red-600);
    font-size: 1.5rem;
}

.warning-message {
    flex: 1;
}

.warning-message p {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: var(--text-color);
    line-height: 1.4;
}

.warning-message small {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.dialog-actions-compact {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
}

/* Dark mode specific styles for compact dialog */
[data-theme='dark'] .warning-icon {
    background: rgba(239, 68, 68, 0.15);
}

[data-theme='dark'] .warning-icon i {
    color: var(--red-400);
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
[data-theme='dark'] .products-management {
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
    .products-management {
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
}
</style>
