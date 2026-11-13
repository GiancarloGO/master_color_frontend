<script setup>
import { useOrdersStore } from '@/stores/orders';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';

// State
const ordersStore = useOrdersStore();
const purchases = ref([]);
const loading = ref(false);
const toast = useToast();

const statusOptions = [
    { label: 'Pendiente de Pago', value: 'pendiente_pago' },
    { label: 'Pagado - Preparando Envío', value: 'pendiente' },
    { label: 'Confirmado', value: 'confirmado' },
    { label: 'En Preparación', value: 'procesando' },
    { label: 'Enviado', value: 'enviado' },
    { label: 'Entregado', value: 'entregado' },
    { label: 'Pago Fallido', value: 'pago_fallido' },
    { label: 'Cancelado', value: 'cancelado' }
];

// Filtros (en cliente: cada cliente solo ve sus propios registros)
const filters = reactive({
    status: null,
    date_from: null,
    date_to: null,
    search: ''
});

const hasActiveFilters = computed(() => !!(filters.status || filters.date_from || filters.date_to || filters.search));

const clearFilters = () => {
    filters.status = null;
    filters.date_from = null;
    filters.date_to = null;
    filters.search = '';
};

const matchesFilters = (item) => {
    if (filters.status && item.order_status !== filters.status) return false;

    const date = new Date(item.order_created_at);
    if (filters.date_from) {
        const from = new Date(filters.date_from);
        from.setHours(0, 0, 0, 0);
        if (date < from) return false;
    }
    if (filters.date_to) {
        const to = new Date(filters.date_to);
        to.setHours(23, 59, 59, 999);
        if (date > to) return false;
    }
    if (filters.search && !(item.product?.name || '').toLowerCase().includes(filters.search.trim().toLowerCase())) return false;
    return true;
};

const filteredPurchases = computed(() => purchases.value.filter(matchesFilters));

// Map status values to labels and severities
function getStatusLabel(status) {
    return statusOptions.find((o) => o.value === status)?.label || status;
}

function getStatusSeverity(status) {
    const map = { pendiente_pago: 'warning', pendiente: 'info', confirmado: 'success', procesando: 'info', enviado: 'success', entregado: 'success', pago_fallido: 'danger', cancelado: 'danger' };
    return map[status] || 'secondary';
}

async function loadPurchases() {
    loading.value = true;
    try {
        const result = await ordersStore.fetchPurchasedProducts();
        if (result.success) {
            purchases.value = ordersStore.purchasedProducts;
        } else {
            toast.add({ severity: 'warn', summary: 'Aviso', detail: result.message || 'No se pudieron obtener las compras', life: 4000 });
        }
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'Error al cargar compras', life: 5000 });
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadPurchases();
});
</script>

<template>
    <div class="purchases-page">
        <!-- Header Section with Gradient Background -->
        <section class="header-section">
            <div class="header-content">
                <div class="icon-wrapper">
                    <i class="pi pi-shopping-bag"></i>
                </div>
                <div>
                    <h1 class="title">Historial de Compras</h1>
                    <p class="subtitle">Revisa los pedidos que has realizado</p>
                </div>
            </div>
        </section>

        <!-- Filtros -->
        <div class="bg-surface-50 border border-surface-200 rounded-lg p-4 mb-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-surface-900">Filtros de Compras</h3>
                <Button icon="pi pi-filter-slash" label="Limpiar Filtros" severity="secondary" outlined size="small" :disabled="!hasActiveFilters" @click="clearFilters" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Producto</label>
                    <InputText v-model="filters.search" placeholder="Buscar por nombre" class="w-full" />
                </div>
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Estado de la Orden</label>
                    <Dropdown v-model="filters.status" :options="statusOptions" option-label="label" option-value="value" placeholder="Seleccionar estado" class="w-full" show-clear />
                </div>
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Fecha Desde</label>
                    <Calendar v-model="filters.date_from" placeholder="Seleccionar fecha" date-format="dd/mm/yy" :max-date="filters.date_to || undefined" show-icon show-button-bar class="w-full" />
                </div>
                <div class="flex flex-col">
                    <label class="text-sm font-medium text-surface-700 mb-2">Fecha Hasta</label>
                    <Calendar v-model="filters.date_to" placeholder="Seleccionar fecha" date-format="dd/mm/yy" :min-date="filters.date_from || undefined" show-icon show-button-bar class="w-full" />
                </div>
            </div>
        </div>

        <DataTable
            class="purchases-table"
            :value="filteredPurchases"
            :loading="loading"
            data-key="id"
            :paginator="true"
            :rows="10"
            :rows-per-page-options="[5, 10, 20]"
            paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            current-page-report-template="{first} al {last} de {totalRecords} productos"
            responsive-layout="scroll"
            striped-rows
        >
            <template #empty>
                <div class="empty-state">
                    <i class="pi pi-shopping-bag" style="font-size: 3rem; color: var(--text-color-secondary)" />
                    <template v-if="hasActiveFilters">
                        <h3>Sin resultados</h3>
                        <p>No hay compras que coincidan con los filtros.</p>
                    </template>
                    <template v-else>
                        <h3>No has comprado productos todavía</h3>
                        <p>¡Explora la tienda y realiza tu primera compra!</p>
                    </template>
                </div>
            </template>
            <template #loading>
                <div class="loading-state">
                    <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
                    <p>Cargando historial...</p>
                </div>
            </template>

            <!-- Imagen -->
            <Column header="Imagen" style="width: 5rem">
                <template #body="{ data }">
                    <div class="product-image-container">
                        <img v-if="data.product?.image_url" :src="data.product.image_url" :alt="data.product?.name" class="product-image" @error="$event.target.style.display = 'none'" />
                        <div v-else class="no-image">
                            <i class="pi pi-image" />
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Nombre del producto -->
            <Column field="product.name" header="Producto" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    <span class="product-name">{{ data.product?.name }}</span>
                </template>
            </Column>

            <!--N° de orden-->
            <Column field="order_id" header="N° de orden" sortable style="width: 7rem; text-align: center">
                <template #body="{ data }">
                    {{ data.order_id }}
                </template>
            </Column>

            <!-- Fecha de compra -->
            <Column field="order_created_at" header="Fecha de compra" sortable style="width: 9rem; text-align: center">
                <template #body="{ data }">
                    {{ new Date(data.order_created_at).toLocaleDateString() }}
                </template>
            </Column>

            <!-- Cantidad -->
            <Column field="quantity" header="Cantidad" sortable style="width: 6rem; text-align: center">
                <template #body="{ data }">
                    <Tag :value="data.quantity" severity="info" class="standard-tag" />
                </template>
            </Column>

            <!-- Precio unitario -->
            <Column field="unit_price" header="Precio (S/)" sortable style="width: 8rem; text-align: right">
                <template #body="{ data }">
                    {{ parseFloat(data.unit_price).toFixed(2) }}
                </template>
            </Column>

            <!-- Estado de la orden -->
            <Column field="order_status" header="Estado" sortable style="width: 12rem; text-align: center">
                <template #body="{ data }">
                    <Tag :value="getStatusLabel(data.order_status)" :severity="getStatusSeverity(data.order_status)" class="standard-tag" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.my-products-container {
    padding: 1rem;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

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

.product-name {
    font-weight: 500;
    color: var(--text-color);
}

.status-tag {
    font-size: 0.8rem;
    padding: 0.35rem 0.6rem;
}

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

/* ------------------ Modern Enhancements ------------------ */
.purchases-page {
    padding: 1rem 2rem;
}

.header-section {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
}

/* Decorative blurred circle */
.header-section::after {
    content: '';
    position: absolute;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    top: -50px;
    right: -50px;
    filter: blur(50px);
}

.header-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.icon-wrapper i {
    font-size: 1.75rem;
    color: #ffffff;
}

.title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
}

.subtitle {
    margin: 0.25rem 0 0;
    font-size: 1rem;
    opacity: 0.9;
}

.purchases-table {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
}

/* Dark Mode Support */
[data-theme='dark'] .header-section {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

[data-theme='dark'] .icon-wrapper {
    background: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .title,
[data-theme='dark'] .subtitle {
    color: #ffffff;
}

/* Responsive */
@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        text-align: center;
    }
}
</style>
