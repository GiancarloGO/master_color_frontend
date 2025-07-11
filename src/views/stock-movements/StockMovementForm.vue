<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useProductsStore } from '@/stores/products';

const props = defineProps({
    movement: {
        type: Object,
        default: () => ({})
    },
    loading: {
        type: Boolean,
        default: false
    },
    apiErrors: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['submit', 'cancel']);

const productsStore = useProductsStore();

// Reactive data
const formData = reactive({
    movement_type: '',
    reason: '',
    voucher_number: '',
    stocks: []
});

const errors = ref({});
const filteredProducts = ref([]);
const loadingProducts = ref(false);

// Movement types
const movementTypes = ref([
    { label: 'Entrada', value: 'entrada' },
    { label: 'Salida', value: 'salida' },
    { label: 'Ajuste', value: 'ajuste' },
    { label: 'Devolución', value: 'devolucion' }
]);

// Computed properties
const hasValidationErrors = computed(() => Object.keys(errors.value).length > 0);

// Methods
const initializeForm = () => {
    if (props.movement?.id) {
        // Edit mode
        formData.movement_type = props.movement.movement_type || '';
        formData.reason = props.movement.reason || '';
        formData.voucher_number = props.movement.voucher_number || '';

        // Initialize stocks from movement details
        if (props.movement.details && props.movement.details.length > 0) {
            formData.stocks = props.movement.details.map((detail) => ({
                stock_id: detail.stock.id,
                quantity: detail.quantity,
                unit_price: parseFloat(detail.unit_price) || 0,
                selectedProduct: {
                    id: detail.stock.product.id,
                    name: detail.stock.product.name,
                    sku: detail.stock.product.sku,
                    stock: {
                        id: detail.stock.id,
                        quantity: detail.stock.quantity
                    }
                }
            }));
        }
    } else {
        // Create mode
        resetForm();
    }
};

const resetForm = () => {
    formData.movement_type = '';
    formData.reason = '';
    formData.voucher_number = '';
    formData.stocks = [];
    errors.value = {};
};

const addStockItem = () => {
    formData.stocks.push({
        stock_id: null,
        quantity: 1,
        unit_price: 0,
        selectedProduct: null
    });
};

const removeStockItem = (index) => {
    // Validación básica
    if (index < 0 || index >= formData.stocks.length) {
        return;
    }

    const productName = formData.stocks[index].selectedProduct?.name || 'producto';

    // Confirmación simple (opcional)
    if (formData.stocks.length > 1) {
        const confirmed = confirm(`¿Estás seguro de que quieres eliminar "${productName}" del movimiento?`);
        if (!confirmed) {
            return;
        }
    }

    // Remover el item del array
    formData.stocks.splice(index, 1);

    // Limpiar todos los errores relacionados con stocks para reindexar correctamente
    const stockErrors = Object.keys(errors.value).filter((key) => key.startsWith('stocks.'));
    stockErrors.forEach((key) => {
        delete errors.value[key];
    });

    // Prevenir eliminar el último producto (opcional)
    if (formData.stocks.length === 0) {
        addStockItem();
    }
};

const searchProducts = async (event) => {
    if (!event.query.trim()) {
        filteredProducts.value = [];
        return;
    }

    loadingProducts.value = true;
    try {
        await productsStore.fetchProducts();

        const query = event.query.toLowerCase();
        filteredProducts.value = productsStore.productsList.filter(
            (product) =>
                product.name?.toLowerCase().includes(query) ||
                product.sku?.toLowerCase().includes(query) ||
                product.barcode?.toLowerCase().includes(query) ||
                product.brand?.toLowerCase().includes(query) ||
                product.category?.toLowerCase().includes(query) ||
                product.presentation?.toLowerCase().includes(query) ||
                product.description?.toLowerCase().includes(query)
        );
    } catch (error) {
        console.error('Error fetching products:', error);
        filteredProducts.value = [];
    } finally {
        loadingProducts.value = false;
    }
};

const onProductSelect = (event, index) => {
    const product = event.value;

    // Usar el stock_id del producto (ya viene del backend)
    if (product.stock_id) {
        formData.stocks[index].stock_id = product.stock_id;
    } else {
        // Fallback si por alguna razón no viene el stock_id
        formData.stocks[index].stock_id = product.id;
    }

    // Guardar la información completa para mostrar en la UI
    formData.stocks[index].selectedProduct = {
        ...product,
        stock: {
            id: product.stock_id || product.id,
            quantity: product.stock_quantity || 0
        }
    };

    // Clear related errors
    delete errors.value[`stocks.${index}.stock_id`];
};

const getMaxQuantity = (stock, index) => {
    const stockQuantity = getStockQuantity(stock.selectedProduct);

    if (!stockQuantity) return 999999;

    // For 'salida' movements, limit to current stock
    if (formData.movement_type === 'salida') {
        return stockQuantity;
    }

    return 999999;
};

const getTotalQuantity = () => {
    return formData.stocks.reduce((total, stock) => total + (stock.quantity || 0), 0);
};

const getTotalValue = () => {
    return formData.stocks.reduce((total, stock) => {
        return total + (stock.quantity || 0) * (stock.unit_price || 0);
    }, 0);
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(value || 0);
};

const getProductDisplayText = (product) => {
    if (!product) return '';

    let displayText = product.name || '';

    // Agregar información adicional entre paréntesis
    const additionalInfo = [];

    if (product.brand) {
        additionalInfo.push(product.brand);
    }

    if (product.sku) {
        additionalInfo.push(`SKU: ${product.sku}`);
    }

    if (product.category) {
        additionalInfo.push(product.category);
    }

    if (additionalInfo.length > 0) {
        displayText += ` (${additionalInfo.join(' • ')})`;
    }

    return displayText;
};

const getStockBadgeClass = (quantity) => {
    if (quantity === 0) return 'stock-empty';
    if (quantity < 10) return 'stock-low';
    if (quantity < 50) return 'stock-medium';
    return 'stock-good';
};

const getStockQuantity = (product) => {
    if (!product) return 0;

    // Prioridad: stock.quantity > stock_quantity > 0
    if (product.stock && typeof product.stock.quantity === 'number') {
        return product.stock.quantity;
    }

    if (typeof product.stock_quantity === 'number') {
        return product.stock_quantity;
    }

    return 0;
};

const validateForm = () => {
    errors.value = {};

    // Validate basic fields
    if (!formData.movement_type) {
        errors.value.movement_type = 'El tipo de movimiento es requerido';
    }

    if (!formData.reason || formData.reason.trim().length === 0) {
        errors.value.reason = 'El motivo es requerido';
    } else if (formData.reason.length > 500) {
        errors.value.reason = 'El motivo no puede exceder 500 caracteres';
    }

    // Validate stocks
    if (formData.stocks.length === 0) {
        errors.value.stocks = 'Debe agregar al menos un producto';
    } else {
        formData.stocks.forEach((stock, index) => {
            if (!stock.stock_id) {
                errors.value[`stocks.${index}.stock_id`] = 'Selecciona un producto';
            } else if (!stock.selectedProduct) {
                errors.value[`stocks.${index}.stock_id`] = 'Producto no válido';
            }

            if (!stock.quantity || stock.quantity <= 0) {
                errors.value[`stocks.${index}.quantity`] = 'La cantidad debe ser mayor a 0';
            } else if (formData.movement_type === 'salida' && stock.selectedProduct) {
                const stockQuantity = getStockQuantity(stock.selectedProduct);
                if (stock.quantity > stockQuantity) {
                    errors.value[`stocks.${index}.quantity`] = `Cantidad excede el stock disponible (${stockQuantity})`;
                }
            }

            if (stock.unit_price !== null && stock.unit_price < 0) {
                errors.value[`stocks.${index}.unit_price`] = 'El precio no puede ser negativo';
            }
        });
    }

    return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
    if (!validateForm()) return;

    const payload = {
        movement_type: formData.movement_type,
        reason: formData.reason.trim(),
        voucher_number: formData.voucher_number?.trim() || null,
        stocks: formData.stocks.map((stock) => ({
            stock_id: stock.stock_id,
            quantity: stock.quantity,
            unit_price: stock.unit_price || null
        }))
    };

    emit('submit', payload);
};

// Watch for movement prop changes
watch(
    () => props.movement,
    () => {
        initializeForm();
    },
    { deep: true }
);

// Lifecycle
onMounted(() => {
    initializeForm();
    productsStore.fetchProducts();
});
</script>

<template>
    <div class="stock-movement-form">
        <form class="form-container" @submit.prevent="handleSubmit">
            <!-- Basic Information Section -->
            <div class="form-section">
                <h3 class="section-title">
                    <i class="pi pi-info-circle"></i>
                    Información Básica
                </h3>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="movement_type" class="form-label required">Tipo de Movimiento</label>
                        <Select
                            id="movement_type"
                            v-model="formData.movement_type"
                            :options="movementTypes"
                            option-label="label"
                            option-value="value"
                            placeholder="Selecciona el tipo de movimiento"
                            :class="{ 'p-invalid': errors.movement_type }"
                            class="form-select"
                        />
                        <small v-if="errors.movement_type" class="p-error">{{ errors.movement_type }}</small>
                    </div>

                    <div class="form-group">
                        <label for="voucher_number" class="form-label">Número de Comprobante</label>
                        <InputText id="voucher_number" v-model="formData.voucher_number" placeholder="Ej: FC-2024-001" :class="{ 'p-invalid': errors.voucher_number }" class="form-input" />
                        <small v-if="errors.voucher_number" class="p-error">{{ errors.voucher_number }}</small>
                    </div>
                </div>

                <div class="form-group">
                    <label for="reason" class="form-label required">Motivo</label>
                    <Textarea id="reason" v-model="formData.reason" placeholder="Describe el motivo del movimiento..." rows="3" :maxlength="500" :class="{ 'p-invalid': errors.reason }" class="form-textarea" />
                    <div class="textarea-footer">
                        <small v-if="errors.reason" class="p-error">{{ errors.reason }}</small>
                        <small class="char-counter">{{ formData.reason?.length || 0 }}/500</small>
                    </div>
                </div>
            </div>

            <!-- Stock Items Section -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-box"></i>
                        Productos del Movimiento
                    </h3>
                    <Button type="button" label="Agregar Producto" icon="pi pi-plus" class="add-button" outlined size="small" @click="addStockItem" />
                </div>

                <div v-if="formData.stocks.length === 0" class="empty-stocks">
                    <i class="pi pi-inbox empty-icon"></i>
                    <p>No hay productos agregados</p>
                    <Button type="button" label="Agregar Primer Producto" icon="pi pi-plus" class="add-first-button" @click="addStockItem" />
                </div>

                <div v-else class="stocks-container">
                    <div v-for="(stock, index) in formData.stocks" :key="index" class="stock-item">
                        <div class="stock-item-header">
                            <span class="stock-item-number">#{{ index + 1 }}</span>
                            <Button type="button" v-tooltip.top="'Eliminar producto'" icon="pi pi-trash" class="remove-button" text severity="danger" size="small" @click="removeStockItem(index)" />
                        </div>

                        <div class="stock-item-form">
                            <div class="form-group">
                                <label :for="`stock_id_${index}`" class="form-label required">Producto</label>
                                <AutoComplete
                                    :id="`stock_id_${index}`"
                                    v-model="stock.selectedProduct"
                                    :suggestions="filteredProducts"
                                    :option-label="getProductDisplayText"
                                    placeholder="Buscar por nombre, SKU, código de barras o marca..."
                                    :class="{ 'p-invalid': errors[`stocks.${index}.stock_id`] }"
                                    class="form-autocomplete"
                                    :loading="loadingProducts"
                                    force-selection
                                    @complete="searchProducts"
                                    @item-select="(event) => onProductSelect(event, index)"
                                >
                                    <template #item="{ item }">
                                        <div class="product-item-enhanced">
                                            <div class="product-main-info">
                                                <div class="product-header">
                                                    <span class="product-name">{{ item.name }}</span>
                                                    <div class="product-badges">
                                                        <span v-if="item.brand" class="badge brand-badge">{{ item.brand }}</span>
                                                        <span class="badge stock-badge" :class="getStockBadgeClass(getStockQuantity(item))"> Stock: {{ getStockQuantity(item) }} </span>
                                                    </div>
                                                </div>
                                                <div class="product-details">
                                                    <div class="product-codes">
                                                        <small class="product-sku">SKU: {{ item.sku }}</small>
                                                        <small v-if="item.barcode" class="product-barcode">Código: {{ item.barcode }}</small>
                                                    </div>
                                                    <div class="product-meta">
                                                        <small v-if="item.category" class="product-category">{{ item.category }}</small>
                                                        <small v-if="item.presentation" class="product-presentation">{{ item.presentation }}</small>
                                                        <small v-if="item.unidad" class="product-unit">{{ item.unidad }}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </AutoComplete>
                                <small v-if="errors[`stocks.${index}.stock_id`]" class="p-error">
                                    {{ errors[`stocks.${index}.stock_id`] }}
                                </small>
                            </div>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label :for="`quantity_${index}`" class="form-label required">Cantidad</label>
                                    <InputNumber
                                        :id="`quantity_${index}`"
                                        v-model="stock.quantity"
                                        :min="1"
                                        :max="getMaxQuantity(stock, index)"
                                        :class="{ 'p-invalid': errors[`stocks.${index}.quantity`] }"
                                        class="form-input"
                                        mode="decimal"
                                        :use-grouping="false"
                                    />
                                    <small v-if="errors[`stocks.${index}.quantity`]" class="p-error">
                                        {{ errors[`stocks.${index}.quantity`] }}
                                    </small>
                                </div>

                                <div class="form-group">
                                    <label :for="`unit_price_${index}`" class="form-label">Precio Unitario</label>
                                    <InputNumber
                                        :id="`unit_price_${index}`"
                                        v-model="stock.unit_price"
                                        :min="0"
                                        :min-fraction-digits="2"
                                        :max-fraction-digits="2"
                                        :class="{ 'p-invalid': errors[`stocks.${index}.unit_price`] }"
                                        class="form-input"
                                        mode="currency"
                                        currency="PEN"
                                        locale="es-PE"
                                    />
                                    <small v-if="errors[`stocks.${index}.unit_price`]" class="p-error">
                                        {{ errors[`stocks.${index}.unit_price`] }}
                                    </small>
                                </div>
                            </div>

                            <div v-if="stock.selectedProduct" class="stock-info">
                                <div class="info-item">
                                    <span class="info-label">Stock Actual:</span>
                                    <span class="info-value">{{ getStockQuantity(stock.selectedProduct) }}</span>
                                </div>
                                <div v-if="stock.quantity && stock.unit_price" class="info-item">
                                    <span class="info-label">Subtotal:</span>
                                    <span class="info-value highlight">{{ formatCurrency(stock.quantity * stock.unit_price) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="formData.stocks.length > 0" class="stocks-summary">
                    <div class="summary-item">
                        <span class="summary-label">Total de Productos:</span>
                        <span class="summary-value">{{ formData.stocks.length }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Cantidad Total:</span>
                        <span class="summary-value">{{ getTotalQuantity() }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Valor Total:</span>
                        <span class="summary-value highlight">{{ formatCurrency(getTotalValue()) }}</span>
                    </div>
                </div>
            </div>

            <!-- Validation Messages -->
            <div v-if="hasValidationErrors" class="validation-messages">
                <Message severity="error" :closable="false">
                    <template #messageicon>
                        <i class="pi pi-exclamation-triangle"></i>
                    </template>
                    <div class="validation-content">
                        <p><strong>Por favor, corrige los siguientes errores:</strong></p>
                        <ul>
                            <li v-for="error in Object.values(errors)" :key="error">{{ error }}</li>
                        </ul>
                    </div>
                </Message>
            </div>

            <!-- API Validation Errors -->
            <div v-if="props.apiErrors && props.apiErrors.length > 0" class="validation-messages">
                <Message severity="error" :closable="false">
                    <template #messageicon>
                        <i class="pi pi-exclamation-triangle"></i>
                    </template>
                    <div class="validation-content">
                        <p><strong>Errores del servidor:</strong></p>
                        <ul>
                            <li v-for="error in props.apiErrors" :key="error">{{ error }}</li>
                        </ul>
                    </div>
                </Message>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
                <Button label="Cancelar" icon="pi pi-times" class="cancel-button" outlined type="button" @click="$emit('cancel')" />
                <Button :label="movement?.id ? 'Actualizar Movimiento' : 'Crear Movimiento'" :icon="movement?.id ? 'pi pi-check' : 'pi pi-plus'" type="submit" class="submit-button" :loading="loading" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.stock-movement-form {
    max-width: 100%;
}

.form-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.form-section {
    background: #f8fafc;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1.5rem 0;
}

.section-title i {
    color: #667eea;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
}

.form-label.required::after {
    content: ' *';
    color: #ef4444;
}

.form-input,
.form-select,
.form-textarea,
.form-autocomplete {
    width: 100%;
}

.textarea-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.char-counter {
    color: #6b7280;
    font-size: 0.75rem;
}

.add-button {
    background: transparent;
    border: 2px solid #667eea;
    color: #667eea;
}

.add-button:hover {
    background: #667eea;
    color: white;
}

.empty-stocks {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
}

.empty-icon {
    font-size: 3rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
}

.add-first-button {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    color: white;
    margin-top: 1rem;
}

.stocks-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.stock-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
}

.stock-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.stock-item-number {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
}

.remove-button {
    color: #ef4444;
}

.stock-item-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Enhanced Product Item Styles */
.product-item-enhanced {
    padding: 0.75rem;
    border-radius: 6px;
    transition: background-color 0.2s ease;
}

.product-item-enhanced:hover {
    background-color: #f8fafc;
}

.product-main-info {
    width: 100%;
}

.product-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.product-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.95rem;
    line-height: 1.3;
    max-width: 60%;
}

.product-badges {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}

.badge {
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
}

.brand-badge {
    background: #e0e7ff;
    color: #3730a3;
    border: 1px solid #c7d2fe;
}

.stock-badge {
    font-weight: 600;
    border: 1px solid;
}

.stock-badge.stock-empty {
    background: #fee2e2;
    color: #991b1b;
    border-color: #fca5a5;
}

.stock-badge.stock-low {
    background: #fef3c7;
    color: #92400e;
    border-color: #fcd34d;
}

.stock-badge.stock-medium {
    background: #e0f2fe;
    color: #0369a1;
    border-color: #7dd3fc;
}

.stock-badge.stock-good {
    background: #dcfce7;
    color: #166534;
    border-color: #86efac;
}

.product-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.product-codes {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.product-sku,
.product-barcode {
    color: #6b7280;
    font-size: 0.8rem;
    background: #f3f4f6;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
}

.product-meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.product-category,
.product-presentation,
.product-unit {
    color: #9ca3af;
    font-size: 0.75rem;
    background: #f9fafb;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    border: 1px solid #e5e7eb;
}

/* Legacy styles for backward compatibility */
.product-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    width: 100%;
}

.product-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.product-stock {
    text-align: right;
}

.stock-quantity {
    background: #f0f9ff;
    color: #0369a1;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
}

.stock-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.9rem;
}

.info-value {
    font-weight: 600;
    color: #374151;
}

.info-value.highlight {
    color: #059669;
    background: #ecfdf5;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.stocks-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
}

.summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.summary-label {
    font-size: 0.8rem;
    color: #0369a1;
    font-weight: 500;
}

.summary-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
}

.summary-value.highlight {
    color: #059669;
    font-size: 1.2rem;
}

.validation-messages {
    margin: 1rem 0;
}

.validation-content ul {
    margin: 0.5rem 0 0 1rem;
    padding: 0;
}

.validation-content li {
    margin-bottom: 0.25rem;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

.cancel-button {
    background: transparent;
    color: #64748b;
    border: 2px solid #e2e8f0;
}

.cancel-button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}

.submit-button {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
}

.submit-button:hover {
    background: linear-gradient(135deg, #059669, #047857);
}

@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }

    .stocks-summary {
        flex-direction: column;
        gap: 1rem;
    }

    .form-actions {
        flex-direction: column;
    }
}
</style>
