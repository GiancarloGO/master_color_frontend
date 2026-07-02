<script setup>
import { useCategoriesStore } from '@/stores/categories';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';

const categoriesStore = useCategoriesStore();
const toast = useToast();

const categoryDialog = ref(false);
const deleteCategoryDialog = ref(false);
const dialogMode = ref('create');
const selectedCategory = ref({});
const searchQuery = ref('');

const formData = reactive({
    name: '',
    active: true
});

const filteredCategories = computed(() => {
    const list = categoriesStore.categoriesList || [];
    if (!searchQuery.value) return list;
    const q = searchQuery.value.toLowerCase();
    return list.filter((c) => c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q));
});

function openNew() {
    dialogMode.value = 'create';
    formData.name = '';
    formData.active = true;
    selectedCategory.value = {};
    categoryDialog.value = true;
}

function editCategory(category) {
    dialogMode.value = 'edit';
    selectedCategory.value = { ...category };
    formData.name = category.name;
    formData.active = category.active;
    categoryDialog.value = true;
}

function hideDialog() {
    categoryDialog.value = false;
    selectedCategory.value = {};
}

async function saveCategory() {
    if (!formData.name || !formData.name.trim()) {
        toast.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre de la categoría es obligatorio', life: 4000 });
        return;
    }

    try {
        const payload = { name: formData.name.trim(), active: formData.active };
        if (dialogMode.value === 'create') {
            await categoriesStore.createCategory(payload);
            toast.add({ severity: 'success', summary: 'Categoría creada', detail: 'La categoría se ha creado correctamente', life: 4000 });
        } else {
            await categoriesStore.updateCategory(selectedCategory.value.id, payload);
            toast.add({ severity: 'success', summary: 'Categoría actualizada', detail: 'Los cambios se han guardado correctamente', life: 4000 });
        }
        hideDialog();
    } catch (error) {
        showErrors('No se pudo guardar la categoría');
    }
}

function confirmDeleteCategory(category) {
    selectedCategory.value = category;
    deleteCategoryDialog.value = true;
}

async function deleteCategory() {
    try {
        await categoriesStore.deleteCategory(selectedCategory.value.id);
        deleteCategoryDialog.value = false;
        selectedCategory.value = {};
        toast.add({ severity: 'success', summary: 'Categoría eliminada', detail: 'La categoría se ha eliminado correctamente', life: 4000 });
    } catch (error) {
        deleteCategoryDialog.value = false;
        showErrors('No se pudo eliminar la categoría');
    }
}

function showErrors(fallback) {
    if (categoriesStore.validationErrors && categoriesStore.validationErrors.length) {
        categoriesStore.validationErrors.forEach((detail) => toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 }));
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: categoriesStore.message || fallback, life: 5000 });
    }
}

onMounted(async () => {
    await categoriesStore.fetchCategories();
});
</script>

<template>
    <div class="categories-management">
        <div class="header-section">
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-tags"></i>
                    </div>
                    <div>
                        <h1 class="main-title">Gestión de Categorías</h1>
                        <p class="subtitle">Administra las categorías de los productos</p>
                    </div>
                </div>
                <Button label="Nueva Categoría" icon="pi pi-plus" class="create-button" raised @click="openNew" />
            </div>
        </div>

        <div class="content-card">
            <div class="table-header">
                <h2 class="table-title">Lista de Categorías</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="pi pi-search"></i>
                        <input v-model="searchQuery" type="text" placeholder="Buscar categorías..." class="search-input" />
                    </div>
                </div>
            </div>

            <DataTable :value="filteredCategories" :loading="categoriesStore.loading" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" responsiveLayout="scroll">
                <template #empty>No hay categorías registradas.</template>
                <Column field="name" header="Nombre" sortable />
                <Column field="slug" header="Slug" sortable />
                <Column field="products_count" header="Productos" sortable>
                    <template #body="{ data }">
                        <Tag :value="data.products_count ?? 0" severity="info" />
                    </template>
                </Column>
                <Column field="active" header="Estado" sortable>
                    <template #body="{ data }">
                        <Tag :value="data.active ? 'Activa' : 'Inactiva'" :severity="data.active ? 'success' : 'secondary'" />
                    </template>
                </Column>
                <Column header="Acciones" :exportable="false" style="width: 8rem">
                    <template #body="{ data }">
                        <Button icon="pi pi-pencil" text rounded severity="secondary" @click="editCategory(data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteCategory(data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="categoryDialog" :style="{ width: '480px' }" :modal="true" class="category-dialog">
            <template #header>
                <div class="dialog-header">
                    <div class="dialog-icon">
                        <i :class="dialogMode === 'edit' ? 'pi pi-tags' : 'pi pi-plus'"></i>
                    </div>
                    <div>
                        <h3>{{ dialogMode === 'edit' ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>
                        <p>{{ dialogMode === 'edit' ? 'Modifica la información de la categoría' : 'Completa los datos de la nueva categoría' }}</p>
                    </div>
                </div>
            </template>

            <div class="form-body">
                <div class="field">
                    <label for="name" class="field-label">Nombre</label>
                    <InputText id="name" v-model="formData.name" placeholder="Ej: Escáneres" autofocus class="w-full" @keyup.enter="saveCategory" />
                </div>
                <div class="field field-inline">
                    <label for="active" class="field-label">Activa</label>
                    <ToggleSwitch id="active" v-model="formData.active" />
                </div>
            </div>

            <template #footer>
                <div class="dialog-actions">
                    <Button label="Cancelar" class="p-button-text" @click="hideDialog" />
                    <Button :label="dialogMode === 'edit' ? 'Guardar cambios' : 'Crear categoría'" icon="pi pi-check" :loading="categoriesStore.loading" @click="saveCategory" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCategoryDialog" :style="{ width: '400px' }" header="Confirmar Eliminación" :modal="true" class="delete-dialog-compact">
            <div class="delete-content-compact">
                <div class="warning-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div class="warning-message">
                    <p>
                        ¿Eliminar la categoría <strong>{{ selectedCategory?.name || 'seleccionada' }}</strong>?
                    </p>
                    <small>No podrás eliminarla si tiene productos asociados.</small>
                </div>
            </div>
            <template #footer>
                <div class="dialog-actions">
                    <Button label="Cancelar" class="p-button-text" @click="deleteCategoryDialog = false" />
                    <Button label="Eliminar" icon="pi pi-trash" severity="danger" :loading="categoriesStore.loading" @click="deleteCategory" />
                </div>
            </template>
        </Dialog>

        <Toast position="top-right" />
    </div>
</template>

<style scoped>
.categories-management {
    min-height: 100vh;
}

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
    color: #ffffff;
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
}

.content-card {
    background: var(--surface-card);
    border-radius: 18px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.dialog-header {
    display: flex;
    align-items: center;
    gap: 1rem;
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

.form-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 0.5rem 0;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-inline {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.field-label {
    font-weight: 600;
    color: var(--text-color);
    font-size: 0.9rem;
}

.dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
}

.delete-content-compact {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
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

.warning-message p {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: var(--text-color);
}

.warning-message small {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}
</style>
