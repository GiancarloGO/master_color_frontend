<script setup>
import { useCategoriesStore } from '@/stores/categories';
import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue';

const categoriesStore = useCategoriesStore();

const props = defineProps({
    product: {
        type: Object,
        default: () => ({})
    },
    loading: {
        type: Boolean,
        default: false
    },
    // Errores por campo devueltos por el backend (422), p. ej. SKU o nombre duplicado
    serverErrors: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['submit', 'cancel']);

const isEdit = computed(() => !!(props.product && props.product.id));

const unidadOptions = [
    { label: 'Unidad', value: 'unidad' },
    { label: 'Kilogramo (kg)', value: 'kg' },
    { label: 'Gramo (g)', value: 'g' },
    { label: 'Libra (lb)', value: 'lb' },
    { label: 'Onza (oz)', value: 'oz' },
    { label: 'Litro (l)', value: 'l' },
    { label: 'Mililitro (ml)', value: 'ml' },
    { label: 'Metro (m)', value: 'm' },
    { label: 'Centímetro (cm)', value: 'cm' },
    { label: 'Milímetro (mm)', value: 'mm' },
    { label: 'Pieza (pza)', value: 'pza' },
    { label: 'Caja', value: 'caja' },
    { label: 'Paquete', value: 'paquete' },
    { label: 'Docena', value: 'docena' },
    { label: 'Otro', value: 'otro' }
];

// Categorías cargadas dinámicamente desde el backend (entidad Category).
// Se mapean a { label: nombre, value: slug } para mantener compatibilidad con
// el campo string `category` que espera la API.
const categoriesOptions = computed(() =>
    (categoriesStore.getActiveCategories || []).map((c) => ({ label: c.name, value: c.slug }))
);

onMounted(async () => {
    if (!categoriesStore.categoriesList || categoriesStore.categoriesList.length === 0) {
        try {
            await categoriesStore.fetchCategories();
        } catch (e) {
            // Silencioso: el formulario sigue usable; el select quedará vacío si falla.
        }
    }
});

const formData = reactive({
    name: '',
    sku: '',
    barcode: '',
    brand: '',
    category: '',
    presentation: '',
    unidad: '',
    description: '',
    image: null,
    quantity: 0,
    min_stock: 0,
    max_stock: 0,
    purchase_price: null,
    sale_price: null,
    default_warranty_months: 0
});

const errors = reactive({
    name: '',
    sku: '',
    barcode: '',
    brand: '',
    category: '',
    presentation: '',
    unidad: '',
    description: '',
    image: '',
    purchase_price: '',
    sale_price: '',
    quantity: '',
    min_stock: '',
    max_stock: '',
    stock_coherence: '',
    default_warranty_months: ''
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const selectedImage = ref(null);
const imagePreview = ref(null);
// NUEVO: Variable para rastrear si hay una nueva imagen seleccionada
const hasNewImage = ref(false);

const clearErrors = () => {
    Object.keys(errors).forEach((key) => {
        errors[key] = '';
    });
};

const validateImageFile = (file) => {
    if (!file) return '';
    const name = (file.name || '').toLowerCase();
    const validExt = ALLOWED_IMAGE_EXTS.some((ext) => name.endsWith(ext));
    const validMime = !file.type || ALLOWED_IMAGE_TYPES.includes(file.type);
    if (!validExt || !validMime) {
        return 'Elige una imagen en formato JPG, PNG o WEBP.';
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return 'La imagen es muy pesada. Debe pesar máximo 2 MB.';
    }
    return '';
};

// MODIFICADO: Función onImageSelect actualizada
const onImageSelect = (event) => {
    const file = event.files[0];
    if (file) {
        const imgError = validateImageFile(file);
        if (imgError) {
            errors.image = imgError;
            selectedImage.value = null;
            formData.image = null;
            hasNewImage.value = false;
            return;
        }
        errors.image = '';
        selectedImage.value = file;
        formData.image = file;
        hasNewImage.value = true; // Marcar que hay nueva imagen

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// MODIFICADO: Función onImageClear actualizada
const onImageClear = () => {
    selectedImage.value = null;
    formData.image = null;
    imagePreview.value = null;
    hasNewImage.value = false; // Marcar que no hay nueva imagen
    errors.image = '';
};

const removeImage = () => {
    onImageClear();
};

// MODIFICADO: Watcher actualizado para manejar la nueva lógica
watch(
    () => props.product,
    (newProduct) => {
        if (newProduct && newProduct.id) {
            // Editando producto existente
            formData.name = newProduct.name || '';
            formData.sku = newProduct.sku || '';
            formData.barcode = newProduct.barcode || '';
            formData.brand = newProduct.brand || '';
            formData.category = newProduct.category || '';
            formData.presentation = newProduct.presentation || '';
            formData.unidad = newProduct.unidad || '';
            formData.description = newProduct.description || '';
            formData.quantity = newProduct.stock_quantity || 0;
            formData.min_stock = newProduct.min_stock || 0;
            formData.max_stock = newProduct.max_stock || 0;
            formData.purchase_price = newProduct.purchase_price ? parseFloat(newProduct.purchase_price) : null;
            formData.sale_price = newProduct.sale_price ? parseFloat(newProduct.sale_price) : null;
            formData.default_warranty_months = Number.isFinite(Number(newProduct.default_warranty_months)) ? Number(newProduct.default_warranty_months) : 0;

            // Solo resetear imagen si no hay una nueva imagen seleccionada
            if (!hasNewImage.value) {
                selectedImage.value = null;
                formData.image = null;

                // Si el producto tiene una imagen URL, mostrarla como preview
                if (newProduct.image_url) {
                    imagePreview.value = newProduct.image_url;
                } else {
                    imagePreview.value = null;
                }
            }
        } else {
            // Creando nuevo producto
            formData.name = '';
            formData.sku = '';
            formData.barcode = '';
            formData.brand = '';
            formData.category = '';
            formData.presentation = '';
            formData.unidad = '';
            formData.description = '';
            formData.image = null;
            formData.quantity = 0;
            formData.min_stock = 0;
            formData.max_stock = 0;
            formData.purchase_price = null;
            formData.sale_price = null;
            formData.default_warranty_months = 0;

            selectedImage.value = null;
            imagePreview.value = null;
            hasNewImage.value = false; // Resetear bandera para nuevo producto
        }
        clearErrors();
    },
    { immediate: true }
);

watch(
    () => props.serverErrors,
    (serverErrors) => {
        clearErrors();
        Object.entries(serverErrors || {}).forEach(([field, message]) => {
            if (field in errors) errors[field] = Array.isArray(message) ? message[0] : message;
        });
    }
);

const fieldValidators = {
    name: () => {
        const val = (formData.name || '').trim();
        if (!val) return 'El nombre es requerido';
        if (val.length > 255) return 'El nombre no puede exceder 255 caracteres';
        return '';
    },
    sku: () => {
        const val = (formData.sku || '').trim();
        if (!val) return 'El SKU es requerido';
        if (val.length > 255) return 'El SKU no puede exceder 255 caracteres';
        return '';
    },
    barcode: () => {
        const val = (formData.barcode || '').trim();
        if (val.length > 255) return 'El código de barras no puede exceder 255 caracteres';
        return '';
    },
    brand: () => {
        const val = (formData.brand || '').trim();
        if (val.length > 255) return 'La marca no puede exceder 255 caracteres';
        return '';
    },
    category: () => {
        if (!formData.category) return 'La categoría es requerida';
        return '';
    },
    presentation: () => {
        const val = (formData.presentation || '').trim();
        if (val.length > 255) return 'La presentación no puede exceder 255 caracteres';
        return '';
    },
    unidad: () => {
        if (!formData.unidad) return 'La unidad es requerida';
        return '';
    },
    description: () => {
        const val = (formData.description || '').trim();
        if (val.length > 2000) return 'La descripción no puede exceder 2000 caracteres';
        return '';
    },
    image: () => validateImageFile(formData.image),
    purchase_price: () => {
        if (formData.purchase_price === null || formData.purchase_price === '' || formData.purchase_price <= 0) {
            return 'El precio de compra es requerido y debe ser mayor a 0';
        }
        if (formData.purchase_price > 1000000) return 'El precio de compra no puede exceder S/ 1,000,000';
        if (formData.purchase_price < 0.01) return 'El precio de compra debe ser al menos S/ 0.01';
        return '';
    },
    sale_price: () => {
        if (formData.sale_price === null || formData.sale_price === '' || formData.sale_price <= 0) {
            return 'El precio de venta es requerido y debe ser mayor a 0';
        }
        if (formData.sale_price > 1000000) return 'El precio de venta no puede exceder S/ 1,000,000';
        if (formData.sale_price < 0.01) return 'El precio de venta debe ser al menos S/ 0.01';
        if (formData.purchase_price && formData.sale_price <= formData.purchase_price) {
            return 'El precio de venta debe ser mayor al precio de compra';
        }
        return '';
    },
    quantity: () => {
        if (formData.quantity < 0) return 'La cantidad inicial no puede ser negativa';
        if (formData.quantity > 1000000) return 'La cantidad inicial no puede exceder 1,000,000 unidades';
        if (!isEdit.value) {
            if (formData.quantity < (formData.min_stock ?? 0)) {
                return 'La cantidad inicial debe ser al menos igual al stock mínimo';
            }
            if ((formData.max_stock ?? 0) > 0 && formData.quantity > formData.max_stock) {
                return 'La cantidad inicial no puede exceder el stock máximo';
            }
        }
        return '';
    },
    min_stock: () => {
        if (formData.min_stock < 0) return 'El stock mínimo no puede ser negativo';
        if (formData.min_stock > 100000) return 'El stock mínimo no puede exceder 100,000 unidades';
        return '';
    },
    max_stock: () => {
        if (formData.max_stock < 0) return 'El stock máximo no puede ser negativo';
        if (formData.max_stock > 1000000) return 'El stock máximo no puede exceder 1,000,000 unidades';
        return '';
    },
    stock_coherence: () => {
        const min = formData.min_stock ?? 0;
        const max = formData.max_stock ?? 0;
        if (min >= 0 && max > 0 && max <= min) {
            return 'El stock máximo debe ser mayor al stock mínimo';
        }
        return '';
    },
    default_warranty_months: () => {
        const warranty = formData.default_warranty_months;
        if (warranty !== null && warranty !== undefined && warranty !== '') {
            if (!Number.isInteger(warranty) || warranty < 0) {
                return 'La garantía debe ser un número entero igual o mayor a 0';
            }
            if (warranty > 120) return 'La garantía no puede exceder 120 meses';
        }
        return '';
    }
};

// Re-valida reactivamente cada campo que ya muestre error cuando el usuario lo edita
Object.keys(fieldValidators).forEach((field) => {
    if (field === 'stock_coherence' || !(field in formData)) return;
    watch(
        () => formData[field],
        () => {
            if (errors[field]) {
                errors[field] = fieldValidators[field]();
            }
        }
    );
});

const validateForm = () => {
    clearErrors();
    let isValid = true;

    Object.entries(fieldValidators).forEach(([field, validator]) => {
        const msg = validator();
        if (msg) {
            errors[field] = msg;
            isValid = false;
        }
    });

    if (formData.purchase_price && formData.sale_price && formData.sale_price > formData.purchase_price) {
        const margin = ((formData.sale_price - formData.purchase_price) / formData.purchase_price) * 100;
        if (margin < 10 && margin > 0) {
            console.warn(`Margen de ganancia bajo: ${margin.toFixed(2)}%`);
        }
    }

    return isValid;
};

// Validación en tiempo real para coherencia de precios y stock
watchEffect(() => {
    if (formData.purchase_price && formData.sale_price && formData.sale_price > 0 && formData.purchase_price > 0) {
        if (formData.sale_price <= formData.purchase_price) {
            errors.sale_price = 'El precio de venta debe ser mayor al precio de compra';
        } else if (errors.sale_price === 'El precio de venta debe ser mayor al precio de compra') {
            errors.sale_price = '';
        }
    }
});

watchEffect(() => {
    const min = formData.min_stock ?? 0;
    const max = formData.max_stock ?? 0;
    if (min >= 0 && max > 0 && max <= min) {
        errors.stock_coherence = 'El stock máximo debe ser mayor al stock mínimo';
    } else {
        errors.stock_coherence = '';
    }
    if (!isEdit.value && errors.quantity) {
        errors.quantity = fieldValidators.quantity();
    }
});

// Computados para mostrar indicadores de ayuda
const priceMargin = computed(() => {
    if (formData.purchase_price && formData.sale_price && formData.purchase_price > 0 && formData.sale_price > formData.purchase_price) {
        return ((formData.sale_price - formData.purchase_price) / formData.purchase_price) * 100;
    }
    return 0;
});

const marginColor = computed(() => {
    const margin = priceMargin.value;
    if (margin === 0) return '';
    if (margin < 10) return 'text-orange-600';
    if (margin < 25) return 'text-yellow-600';
    return 'text-green-600';
});

const marginIcon = computed(() => {
    const margin = priceMargin.value;
    if (margin === 0) return '';
    if (margin < 10) return 'pi pi-exclamation-triangle';
    if (margin < 25) return 'pi pi-info-circle';
    return 'pi pi-check-circle';
});

// Proporciones de la barra de ayuda: zona amarilla = hasta el mínimo, verde = hasta el máximo.
const stockScale = computed(() => {
    const min = Math.max(Number(formData.min_stock) || 0, 1);
    const max = Math.max(Number(formData.max_stock) || 0, min + 1);
    return { warning: min, success: max - min };
});

const stockCoherenceStatus = computed(() => {
    if (formData.min_stock >= 0 && formData.max_stock > 0) {
        if (formData.max_stock > formData.min_stock) {
            const range = formData.max_stock - formData.min_stock;
            return {
                valid: true,
                message: `Rango de stock: ${range} unidades`,
                icon: 'pi pi-check-circle',
                class: 'text-green-600'
            };
        }
    }
    return { valid: false, message: '', icon: '', class: '' };
});

const handleSubmit = () => {
    if (validateForm()) {
        const submitData = {
            ...formData,
            name: (formData.name || '').trim(),
            sku: (formData.sku || '').trim(),
            barcode: (formData.barcode || '').trim(),
            brand: (formData.brand || '').trim(),
            presentation: (formData.presentation || '').trim(),
            description: (formData.description || '').trim(),
            default_warranty_months: formData.default_warranty_months ?? 0,
            quantity: formData.quantity ?? 0,
            min_stock: formData.min_stock ?? 0,
            max_stock: formData.max_stock ?? 0
        };

        // No enviar `image` si no se seleccionó archivo (evita serializar "null" en multipart/form-data)
        if (!submitData.image) {
            delete submitData.image;
        }

        emit('submit', submitData);
    }
};
</script>

<template>
    <div class="compact-form">
        <form @submit.prevent="handleSubmit">
            <!-- Información Básica -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-info-circle"></i>
                        Información Básica
                    </h3>
                </div>

                <div class="form-grid">
                    <!-- Fila 1: Nombre y SKU -->
                    <div class="form-row">
                        <div class="form-field">
                            <label for="name" class="field-label">Nombre *</label>
                            <InputText id="name" v-model="formData.name" :class="{ 'p-invalid': errors.name }" placeholder="Nombre del producto" class="compact-input" />
                            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
                        </div>
                        <div class="form-field">
                            <label for="sku" class="field-label">SKU *</label>
                            <InputText id="sku" v-model="formData.sku" :class="{ 'p-invalid': errors.sku }" placeholder="SKU único" class="compact-input" />
                            <small v-if="errors.sku" class="p-error">{{ errors.sku }}</small>
                        </div>
                    </div>

                    <!-- Fila 2: Código de barras y Marca -->
                    <div class="form-row">
                        <div class="form-field">
                            <label for="barcode" class="field-label">Código de barras</label>
                            <InputText id="barcode" v-model="formData.barcode" :class="{ 'p-invalid': errors.barcode }" placeholder="Código de barras (opcional)" class="compact-input" />
                            <small v-if="errors.barcode" class="p-error">{{ errors.barcode }}</small>
                        </div>
                        <div class="form-field">
                            <label for="brand" class="field-label">Marca</label>
                            <InputText id="brand" v-model="formData.brand" :class="{ 'p-invalid': errors.brand }" placeholder="Marca del producto (opcional)" class="compact-input" />
                            <small v-if="errors.brand" class="p-error">{{ errors.brand }}</small>
                        </div>
                    </div>

                    <!-- Fila 3: Categoría y Presentación -->
                    <div class="form-row">
                        <div class="form-field">
                            <label for="category" class="field-label">Categoría *</label>
                            <Select id="category" v-model="formData.category" :options="categoriesOptions" option-label="label" option-value="value" :class="{ 'p-invalid': errors.category }" placeholder="Selecciona categoría" class="compact-input" />
                            <small v-if="errors.category" class="p-error">{{ errors.category }}</small>
                        </div>
                        <div class="form-field">
                            <label for="presentation" class="field-label">Presentación</label>
                            <InputText id="presentation" v-model="formData.presentation" :class="{ 'p-invalid': errors.presentation }" placeholder="Presentación (opcional)" class="compact-input" />
                            <small v-if="errors.presentation" class="p-error">{{ errors.presentation }}</small>
                        </div>
                    </div>

                    <!-- Fila 4: Unidad y Descripción -->
                    <div class="form-row">
                        <div class="form-field">
                            <label for="unidad" class="field-label">Unidad *</label>
                            <Select id="unidad" v-model="formData.unidad" :options="unidadOptions" option-label="label" option-value="value" :class="{ 'p-invalid': errors.unidad }" placeholder="Selecciona unidad" class="compact-input" />
                            <small v-if="errors.unidad" class="p-error">{{ errors.unidad }}</small>
                        </div>
                        <div class="form-field">
                            <label for="description" class="field-label">Descripción</label>
                            <InputText id="description" v-model="formData.description" :class="{ 'p-invalid': errors.description }" placeholder="Descripción (opcional)" class="compact-input" />
                            <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
                        </div>
                    </div>

                    <!-- Fila 5: Garantía -->
                    <div class="form-row">
                        <div class="form-field">
                            <label for="default_warranty_months" class="field-label">Meses de garantía</label>
                            <InputNumber
                                id="default_warranty_months"
                                v-model="formData.default_warranty_months"
                                :class="{ 'p-invalid': errors.default_warranty_months }"
                                placeholder="0"
                                :min="0"
                                :max="120"
                                :max-fraction-digits="0"
                                class="compact-input"
                            />
                            <small v-if="errors.default_warranty_months" class="p-error">{{ errors.default_warranty_months }}</small>
                            <small v-else class="upload-hint">0 = sin garantía. Aplica solo a ventas futuras.</small>
                        </div>
                        <div class="form-field"></div>
                    </div>
                </div>
            </div>

            <!-- Imagen del Producto -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-image"></i>
                        Imagen del Producto
                    </h3>
                </div>

                <div class="form-grid">
                    <div class="form-row image-upload-row">
                        <div class="form-field image-field">
                            <label class="field-label">Seleccionar Imagen</label>
                            <FileUpload mode="basic" :choose-label="selectedImage ? 'Cambiar imagen' : 'Seleccionar imagen'" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" class="compact-upload" @select="onImageSelect" @clear="onImageClear" />
                            <small v-if="errors.image" class="p-error">{{ errors.image }}</small>
                            <small v-else class="upload-hint">Formatos: JPG, PNG, WEBP. Máximo 2MB (opcional)</small>
                        </div>
                        <div v-if="imagePreview" class="form-field image-preview-field">
                            <label class="field-label">Vista previa</label>
                            <div class="image-preview">
                                <img :src="imagePreview" alt="Vista previa" class="preview-image" />
                                <Button v-tooltip="'Eliminar imagen'" icon="pi pi-times" class="p-button-rounded p-button-danger p-button-sm remove-image-btn" type="button" @click="removeImage" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Precios -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-dollar"></i>
                        Gestión de Precios
                    </h3>
                </div>

                <div class="form-grid">
                    <div class="form-row">
                        <div class="form-field">
                            <label for="purchase_price" class="field-label">Precio de Compra *</label>
                            <InputNumber
                                id="purchase_price"
                                v-model="formData.purchase_price"
                                :class="{ 'p-invalid': errors.purchase_price }"
                                placeholder="0.00"
                                mode="currency"
                                currency="PEN"
                                locale="es-PE"
                                :min="0.01"
                                :max="1000000"
                                :max-fraction-digits="2"
                                class="compact-input"
                            />
                            <small v-if="errors.purchase_price" class="p-error">{{ errors.purchase_price }}</small>
                        </div>
                        <div class="form-field">
                            <label for="sale_price" class="field-label">Precio de Venta *</label>
                            <InputNumber
                                id="sale_price"
                                v-model="formData.sale_price"
                                :class="{ 'p-invalid': errors.sale_price }"
                                placeholder="0.00"
                                mode="currency"
                                currency="PEN"
                                locale="es-PE"
                                :min="0.01"
                                :max="1000000"
                                :max-fraction-digits="2"
                                class="compact-input"
                            />
                            <small v-if="errors.sale_price" class="p-error">{{ errors.sale_price }}</small>
                            <div v-else-if="priceMargin > 0" class="margin-indicator">
                                <small :class="['margin-text', marginColor]">
                                    <i :class="marginIcon"></i>
                                    Margen: {{ priceMargin.toFixed(1) }}%
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gestión de Stock -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-box"></i>
                        Gestión de Stock
                    </h3>
                </div>

                <div class="form-grid">
                    <!-- Fila única con 3 columnas -->
                    <div class="form-row stock-row">
                        <div class="form-field">
                            <label for="quantity" class="field-label">Cantidad Inicial</label>
                            <InputNumber 
                                id="quantity" 
                                v-model="formData.quantity" 
                                :class="{ 'p-invalid': errors.quantity }"
                                placeholder="0" 
                                :min="0" 
                                :max="1000000"
                                :max-fraction-digits="0" 
                                class="compact-input" 
                                :disabled="isEdit" 
                            />
                            <small v-if="errors.quantity" class="p-error">{{ errors.quantity }}</small>
                            <small v-else-if="isEdit" class="edit-note">Solo editable al crear el producto</small>
                        </div>
                        <div class="form-field">
                            <label for="min_stock" class="field-label">Stock Mínimo</label>
                            <InputNumber 
                                id="min_stock" 
                                v-model="formData.min_stock" 
                                :class="{ 'p-invalid': errors.min_stock || errors.stock_coherence }"
                                placeholder="0" 
                                :min="0" 
                                :max="100000"
                                :max-fraction-digits="0" 
                                class="compact-input" 
                            />
                            <small v-if="errors.min_stock" class="p-error">{{ errors.min_stock }}</small>
                        </div>
                        <div class="form-field">
                            <label for="max_stock" class="field-label">Stock Máximo</label>
                            <InputNumber 
                                id="max_stock" 
                                v-model="formData.max_stock" 
                                :class="{ 'p-invalid': errors.max_stock || errors.stock_coherence }"
                                placeholder="0" 
                                :min="0" 
                                :max="1000000"
                                :max-fraction-digits="0" 
                                class="compact-input" 
                            />
                            <small v-if="errors.max_stock" class="p-error">{{ errors.max_stock }}</small>
                            <small v-else-if="errors.stock_coherence" class="p-error">{{ errors.stock_coherence }}</small>
                            <div v-else-if="stockCoherenceStatus.valid" class="stock-indicator">
                                <small :class="['stock-text', stockCoherenceStatus.class]">
                                    <i :class="stockCoherenceStatus.icon"></i>
                                    {{ stockCoherenceStatus.message }}
                                </small>
                            </div>
                        </div>
                    </div>

                    <!-- Ayuda visual: cómo funcionan las alertas de stock -->
                    <div class="stock-help">
                        <div class="stock-help-title">
                            <i class="pi pi-info-circle"></i>
                            Cómo funcionan las alertas de stock
                        </div>
                        <div class="stock-scale" aria-hidden="true">
                            <div class="stock-zone zone-danger" style="flex: 0 0 8%"></div>
                            <div class="stock-zone zone-warning" :style="{ flex: stockScale.warning }"></div>
                            <div class="stock-zone zone-success" :style="{ flex: stockScale.success }"></div>
                        </div>
                        <div class="stock-scale-labels">
                            <span>0</span>
                            <span>Mín: {{ formData.min_stock ?? 0 }}</span>
                            <span>Máx: {{ formData.max_stock ?? 0 }}</span>
                        </div>
                        <ul class="stock-legend">
                            <li><span class="dot zone-danger"></span><strong>Sin stock:</strong> 0 unidades. Alerta roja.</li>
                            <li><span class="dot zone-warning"></span><strong>Stock bajo:</strong> hasta {{ formData.min_stock ?? 0 }} unidades (el mínimo). Alerta amarilla: toca reponer.</li>
                            <li><span class="dot zone-success"></span><strong>Disponible:</strong> más de {{ formData.min_stock ?? 0 }} unidades. Sin alerta.</li>
                            <li><span class="dot zone-info"></span><strong>Máximo:</strong> {{ formData.max_stock ?? 0 }} unidades es lo recomendado a tener; sirve de referencia para cuánto reponer.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Botones de acción -->
            <div class="form-actions">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" type="button" @click="$emit('cancel')" />
                <Button :label="isEdit ? 'Actualizar' : 'Crear'" :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'" type="submit" :loading="loading" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.compact-form {
    padding: 0.1rem;
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.image-upload-row {
    grid-template-columns: 1fr;
    gap: 1rem;
}

.image-upload-row .image-field {
    grid-column: 1;
}

.image-upload-row .image-preview-field {
    grid-column: 1;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.status-field {
    grid-column: 1 / -1;
}

.field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 0.25rem;
}

.compact-input {
    height: 2.5rem;
}

.compact-input :deep(.p-inputtext) {
    height: 2.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.compact-input :deep(.p-dropdown) {
    height: 2.5rem;
}

.compact-input :deep(.p-dropdown-label) {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.compact-upload {
    width: 100%;
}

.compact-upload :deep(.p-fileupload-choose) {
    height: 2.5rem;
    font-size: 0.875rem;
}

.upload-hint {
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

.image-preview {
    position: relative;
    display: inline-block;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--surface-ground);
}

.preview-image {
    max-width: 200px;
    max-height: 200px;
    width: auto;
    height: auto;
    display: block;
}

.remove-image-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 2rem;
    height: 2rem;
}

.status-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
}

.status-label {
    font-size: 0.875rem;
    color: var(--text-color);
    cursor: pointer;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
}

.p-error {
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

.edit-note {
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    font-style: italic;
    margin-top: 0.25rem;
}

/* Form Sections */
.form-section {
    margin-bottom: 2rem;
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    background: var(--surface-card);
    overflow: hidden;
}

.section-header {
    background: var(--surface-50);
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.section-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.section-title i {
    color: var(--primary-500);
    font-size: 1.1rem;
}

.form-grid {
    padding: 1.5rem;
}

/* Stock row with 3 columns */
.stock-row {
    grid-template-columns: 1fr 1fr 1fr;
}

.compact-input :deep(.p-inputnumber-input) {
    height: 2.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
    .form-row,
    .stock-row {
        grid-template-columns: 1fr;
    }

    .compact-form {
        padding: 0.75rem;
    }

    .section-header {
        padding: 0.75rem 1rem;
    }

    .form-grid {
        padding: 1rem;
    }

    .section-title {
        font-size: 0.9rem;
    }

    .preview-image {
        max-width: 150px;
        max-height: 150px;
    }
}

/* Indicadores de ayuda */
.margin-indicator,
.stock-indicator {
    margin-top: 0.25rem;
}

.margin-text,
.stock-text {
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 500;
}

.margin-text i,
.stock-text i {
    font-size: 0.7rem;
}

/* Colores para indicadores de margen */
.text-orange-600 {
    color: #ea580c;
}

.text-yellow-600 {
    color: #ca8a04;
}

.text-green-600 {
    color: #16a34a;
}

/* Estilos para campos con errores de coherencia */
.p-invalid {
    border-color: #ef4444 !important;
}

/* Mejoras visuales para indicadores */
.margin-indicator {
    padding: 0.375rem 0.5rem;
    background: rgba(var(--primary-50), 0.3);
    border-radius: 4px;
    border-left: 3px solid;
}

.margin-indicator .text-orange-600 {
    border-left-color: #ea580c;
    background: rgba(234, 88, 12, 0.1);
}

.margin-indicator .text-yellow-600 {
    border-left-color: #ca8a04;
    background: rgba(202, 138, 4, 0.1);
}

.margin-indicator .text-green-600 {
    border-left-color: #16a34a;
    background: rgba(22, 163, 74, 0.1);
}

.stock-indicator {
    padding: 0.375rem 0.5rem;
    background: rgba(22, 163, 74, 0.1);
    border-radius: 4px;
    border-left: 3px solid #16a34a;
}

/* Animaciones sutiles */
.margin-indicator,
.stock-indicator {
    transition: all 0.2s ease-in-out;
}

.margin-indicator:hover,
.stock-indicator:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Iconos de información */
.field-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-icon {
    color: var(--primary-500);
    cursor: help;
    font-size: 0.75rem;
}

.info-icon:hover {
    color: var(--primary-700);
}

/* Responsive para tablets */
@media (max-width: 1024px) and (min-width: 769px) {
    .stock-row {
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .stock-row .form-field:last-child {
        grid-column: 1 / -1;
        max-width: 50%;
    }
}

/* Ayuda visual de alertas de stock */
.stock-help {
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    border: 1px dashed var(--surface-border, #d1d5db);
    border-radius: 8px;
    background: var(--surface-ground, #f8fafc);
}
.stock-help-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.6rem;
}
.stock-scale {
    display: flex;
    height: 10px;
    border-radius: 6px;
    overflow: hidden;
}
.stock-scale-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    color: #6b7280;
    margin-top: 0.25rem;
}
.zone-danger { background: #ef4444; }
.zone-warning { background: #f59e0b; }
.zone-success { background: #22c55e; }
.zone-info { background: #3b82f6; }
.stock-legend {
    list-style: none;
    margin: 0.6rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.78rem;
    color: #4b5563;
}
.stock-legend .dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 0.4rem;
}
</style>
