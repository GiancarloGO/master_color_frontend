<script setup>
import { ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';

const props = defineProps({
    products: { type: Array, required: true },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['edit', 'delete', 'view', 'refresh']);

const dt = ref();

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const exportCSV = () => {
    dt.value.exportCSV();
};

const refreshData = () => {
    emit('refresh');
};

const viewProduct = (product) => {
    emit('view', product);
};

const editProduct = (product) => {
    emit('edit', product);
};

const deleteProduct = (product) => {
    emit('delete', product);
};
</script>

<template>
    <DataTable :value="products" :loading="loading" class="products-table" responsive-layout="scroll">
        <Column field="image_url" header="Imagen" style="width: 80px">
            <template #body="{ data }">
                <img v-if="data.image_url" :src="data.image_url" alt="Imagen" style="width: 48px; height: 48px; object-fit: contain; background-color: #f9fafb; border-radius: 6px" />
                <span v-else class="no-image">-</span>
            </template>
        </Column>
        <Column field="name" header="Nombre" sortable />
        <Column field="sku" header="SKU" sortable />
        <Column field="barcode" header="Cód. barras" sortable />
        <Column field="brand" header="Marca" sortable />
        <Column field="description" header="Descripción" />
        <Column field="category" header="Categoría" sortable />
        <Column field="presentation" header="Presentación" />
        <Column field="unidad" header="Unidad" />
        <Column field="user_name" header="Usuario" />
        <Column header="Acciones" style="width: 120px">
            <template #body="{ data }">
                <Button icon="pi pi-pencil" class="p-button-text p-button-sm edit-btn" @click="$emit('edit', data)" />
                <Button icon="pi pi-trash" class="p-button-text p-button-sm delete-btn" @click="$emit('delete', data)" />
            </template>
        </Column>

        <template #empty>
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="pi pi-box"></i>
                </div>
                <h3 class="empty-title">No hay productos disponibles</h3>
                <p class="empty-message">Aún no se han agregado productos al sistema. Comienza creando tu primer producto.</p>
            </div>
        </template>
    </DataTable>
</template>

<style scoped>
.products-table {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
}
.edit-btn {
    color: var(--primary-color);
}
.delete-btn {
    color: var(--red-600);
}
.no-image {
    display: inline-block;
    width: 48px;
    height: 48px;
    background: #f3f4f6;
    border-radius: 6px;
    text-align: center;
    line-height: 48px;
    color: #b0b0b0;
    font-size: 1.2rem;
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
</style>
