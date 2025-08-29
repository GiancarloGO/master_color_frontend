<script setup>
import { useEmailValidation, useNameValidation, usePasswordValidation, usePhoneValidation } from '@/composables/useInputValidation';
import { useDocumentLookupStore } from '@/stores/documentLookup';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref, watch } from 'vue';

const documentLookupStore = useDocumentLookupStore();
const toast = useToast();

const props = defineProps({
    client: {
        type: Object,
        default: () => ({})
    },
    loading: {
        type: Boolean,
        default: false
    },
    mode: {
        type: String,
        default: 'create', // 'create', 'edit', 'view'
        validator: (value) => ['create', 'edit', 'view'].includes(value)
    }
});

const emit = defineEmits(['submit', 'cancel']);

const isEdit = computed(() => props.mode === 'edit');
const isView = computed(() => props.mode === 'view');
const isCreate = computed(() => props.mode === 'create');

// Validación de campos
const nameValidation = useNameValidation({ required: true });
const emailValidation = useEmailValidation({ required: true });
const passwordValidation = usePasswordValidation({ required: isCreate.value });
const phoneValidation = usePhoneValidation({ required: false });

// Destructuring para compatibilidad
const { value: name, firstError: nameError, inputClasses: nameClasses } = nameValidation;
const { value: email, firstError: emailError, inputClasses: emailClasses } = emailValidation;
const { value: password, firstError: passwordError, inputClasses: passwordClasses } = passwordValidation;
const { value: phone, firstError: phoneError, inputClasses: phoneClasses } = phoneValidation;

// Datos del formulario
const clientType = ref('individual');
const documentType = ref('DNI');
const identityDocument = ref('');
const showPassword = ref(false);

// Opciones de tipo de cliente
const clientTypeOptions = [
    { label: 'Persona Natural', value: 'individual' },
    { label: 'Empresa', value: 'company' }
];

// Opciones de tipo de documento según el tipo de cliente
const documentTypeOptions = computed(() => {
    if (clientType.value === 'individual') {
        return [
            { label: 'DNI', value: 'DNI' },
            { label: 'Carnet de Extranjería', value: 'CE' },
            { label: 'Pasaporte', value: 'PASAPORTE' }
        ];
    } else {
        return [{ label: 'RUC', value: 'RUC' }];
    }
});

// Errores de validación
const errors = reactive({
    identityDocument: ''
});

// Estados para búsqueda de documentos
const isLookingUpDocument = ref(false);
const lookupButtonDisabled = computed(() => {
    const requiredLength = getDocumentLength();
    return !identityDocument.value || identityDocument.value.length !== requiredLength || isLookingUpDocument.value;
});

// Función para obtener la longitud requerida del documento
const getDocumentLength = () => {
    switch (documentType.value) {
        case 'DNI': return 8;
        case 'RUC': return 11;
        case 'CE': return 9; // Aproximado
        case 'PASAPORTE': return 9; // Aproximado
        default: return 8;
    }
};

// Función para obtener el placeholder del documento
const getDocumentPlaceholder = () => {
    switch (documentType.value) {
        case 'DNI': return '12345678';
        case 'RUC': return '12345678901';
        case 'CE': return 'CE1234567';
        case 'PASAPORTE': return 'A1B2C3D4E';
        default: return 'Número de documento';
    }
};

// Actualizar tipo de documento cuando cambia el tipo de cliente
const onClientTypeChange = () => {
    if (clientType.value === 'individual') {
        documentType.value = 'DNI';
    } else {
        documentType.value = 'RUC';
    }
    identityDocument.value = '';
    errors.identityDocument = '';
    documentLookupStore.clearData();
};

// Función para consultar documento
const lookupDocument = async () => {
    if (!identityDocument.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Documento requerido',
            detail: 'Por favor ingrese un número de documento',
            life: 3000
        });
        return;
    }

    // Validar formato antes de consultar
    const validation = documentLookupStore.validateDocumentFormat(documentType.value.toLowerCase(), identityDocument.value);
    if (!validation.valid) {
        errors.identityDocument = validation.message;
        toast.add({
            severity: 'error',
            summary: 'Formato inválido',
            detail: validation.message,
            life: 4000
        });
        return;
    }

    isLookingUpDocument.value = true;
    errors.identityDocument = '';

    try {
        const result = await documentLookupStore.lookupDocument(documentType.value.toLowerCase(), identityDocument.value);

        if (result.success) {
            const formattedData = documentLookupStore.getFormattedData();

            if (formattedData.type === 'dni') {
                name.value = formattedData.fullName;

                toast.add({
                    severity: 'success',
                    summary: 'DNI encontrado',
                    detail: `Datos de ${formattedData.fullName} cargados correctamente`,
                    life: 5000
                });
            } else if (formattedData.type === 'ruc') {
                name.value = formattedData.businessName;

                if (formattedData.phones.length > 0) {
                    phone.value = formattedData.phones[0].replace(/[^\\d]/g, '');
                }

                toast.add({
                    severity: 'success',
                    summary: 'RUC encontrado',
                    detail: `Datos de ${formattedData.businessName} cargados correctamente`,
                    life: 5000
                });
            }
        } else {
            errors.identityDocument = result.message;
            toast.add({
                severity: 'error',
                summary: 'Documento no encontrado',
                detail: result.message,
                life: 4000
            });
        }
    } catch (error) {
        console.error('Error en consulta de documento:', error);
        toast.add({
            severity: 'error',
            summary: 'Error de consulta',
            detail: 'No se pudo consultar el documento. Inténtelo nuevamente.',
            life: 4000
        });
    } finally {
        isLookingUpDocument.value = false;
    }
};

// Funciones para limpiar errores
const clearDocumentError = () => {
    errors.identityDocument = '';
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

// Validar formulario
const validateForm = () => {
    let isValid = true;

    // Limpiar errores
    errors.identityDocument = '';

    // Validar usando composables
    const nameValid = nameValidation.validate();
    const emailValid = emailValidation.validate();
    const phoneValid = phoneValidation.validate();
    
    isValid = nameValid && emailValid && phoneValid;

    // Validar contraseña solo si es modo crear
    if (isCreate.value) {
        const passwordValid = passwordValidation.validate();
        isValid = isValid && passwordValid;
    }

    // Validar documento de identidad
    if (!identityDocument.value) {
        errors.identityDocument = 'El documento de identidad es requerido';
        isValid = false;
    } else {
        const doc = identityDocument.value.trim();
        const requiredLength = getDocumentLength();
        
        if (doc.length !== requiredLength || !/^\\d+$/.test(doc)) {
            errors.identityDocument = `El ${documentType.value} debe tener ${requiredLength} dígitos`;
            isValid = false;
        }
    }

    return isValid;
};

// Enviar formulario
const handleSubmit = () => {
    if (isView.value) {
        emit('cancel');
        return;
    }

    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'Por favor corrige los errores en el formulario',
            life: 4000
        });
        return;
    }

    const clientData = {
        name: name.value,
        email: email.value,
        client_type: clientType.value,
        document_type: documentType.value,
        identity_document: identityDocument.value,
        phone: phone.value || null
    };

    // Solo incluir contraseña si es modo crear o si se está actualizando
    if (isCreate.value || password.value) {
        clientData.password = password.value;
    }

    emit('submit', clientData);
};

// Cargar datos del cliente si está en modo edición o vista
watch(
    () => props.client,
    (newClient) => {
        if (newClient && Object.keys(newClient).length > 0) {
            name.value = newClient.name || '';
            email.value = newClient.email || '';
            phone.value = newClient.phone || '';
            clientType.value = newClient.client_type || 'individual';
            documentType.value = newClient.document_type || 'DNI';
            identityDocument.value = newClient.identity_document || '';
        } else {
            // Limpiar formulario
            name.value = '';
            email.value = '';
            phone.value = '';
            password.value = '';
            clientType.value = 'individual';
            documentType.value = 'DNI';
            identityDocument.value = '';
            errors.identityDocument = '';
        }
    },
    { immediate: true }
);
</script>

<template>
    <div class="client-form">
        <form class="form-container" @submit.prevent="handleSubmit">
            <!-- Información básica -->
            <div class="form-section">
                <h4 class="section-title">
                    <i class="pi pi-user"></i>
                    Información Personal
                </h4>
                
                <div class="form-grid">
                    <!-- Nombre completo -->
                    <div class="form-field">
                        <label for="name" class="field-label">Nombre Completo *</label>
                        <IconField>
                            <InputIcon class="pi pi-user" />
                            <InputText
                                id="name"
                                v-model="name"
                                type="text"
                                placeholder="Nombre completo del cliente"
                                class="form-input"
                                :class="nameClasses"
                                :disabled="isView"
                                maxlength="255"
                            />
                        </IconField>
                        <small v-if="nameError" class="field-error">{{ nameError }}</small>
                    </div>

                    <!-- Email -->
                    <div class="form-field">
                        <label for="email" class="field-label">Correo Electrónico *</label>
                        <IconField>
                            <InputIcon class="pi pi-envelope" />
                            <InputText
                                id="email"
                                v-model="email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                class="form-input"
                                :class="emailClasses"
                                :disabled="isView"
                                maxlength="254"
                            />
                        </IconField>
                        <small v-if="emailError" class="field-error">{{ emailError }}</small>
                    </div>

                    <!-- Teléfono -->
                    <div class="form-field">
                        <label for="phone" class="field-label">Teléfono</label>
                        <IconField>
                            <InputIcon class="pi pi-phone" />
                            <InputText
                                id="phone"
                                v-model="phone"
                                type="tel"
                                placeholder="987654321"
                                class="form-input"
                                :class="phoneClasses"
                                :disabled="isView"
                                maxlength="9"
                            />
                        </IconField>
                        <small v-if="phoneError" class="field-error">{{ phoneError }}</small>
                    </div>
                </div>
            </div>

            <!-- Información de documento -->
            <div class="form-section">
                <h4 class="section-title">
                    <i class="pi pi-id-card"></i>
                    Información de Documento
                </h4>
                
                <div class="form-grid">
                    <!-- Tipo de cliente -->
                    <div class="form-field">
                        <label for="clientType" class="field-label">Tipo de Cliente *</label>
                        <Select
                            id="clientType"
                            v-model="clientType"
                            :options="clientTypeOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Selecciona el tipo"
                            class="form-select"
                            :disabled="isView"
                            @change="onClientTypeChange"
                        />
                    </div>

                    <!-- Tipo de documento -->
                    <div class="form-field">
                        <label for="documentType" class="field-label">Tipo de Documento *</label>
                        <Select
                            id="documentType"
                            v-model="documentType"
                            :options="documentTypeOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Tipo de documento"
                            class="form-select"
                            :disabled="isView"
                        />
                    </div>

                    <!-- Número de documento -->
                    <div class="form-field">
                        <label for="identityDocument" class="field-label">Número de Documento *</label>
                        <div class="document-input-group">
                            <InputText
                                id="identityDocument"
                                v-model="identityDocument"
                                type="text"
                                :placeholder="getDocumentPlaceholder()"
                                class="form-input document-input"
                                :class="{ 'p-invalid': errors.identityDocument }"
                                :disabled="isView"
                                @input="clearDocumentError"
                                @keyup.enter="lookupDocument"
                            />
                            <Button
                                v-if="!isView"
                                v-tooltip.top="'Buscar datos del documento'"
                                icon="pi pi-search"
                                class="lookup-button"
                                :loading="isLookingUpDocument"
                                :disabled="lookupButtonDisabled"
                                @click="lookupDocument"
                            />
                        </div>
                        <small v-if="errors.identityDocument" class="field-error">{{ errors.identityDocument }}</small>
                    </div>
                </div>
            </div>

            <!-- Contraseña (solo para crear o editar) -->
            <div v-if="!isView" class="form-section">
                <h4 class="section-title">
                    <i class="pi pi-lock"></i>
                    {{ isEdit ? 'Cambiar Contraseña (Opcional)' : 'Contraseña *' }}
                </h4>
                
                <div class="form-field">
                    <label for="password" class="field-label">
                        {{ isEdit ? 'Nueva Contraseña' : 'Contraseña *' }}
                    </label>
                    <div class="password-field">
                        <IconField>
                            <InputIcon class="pi pi-lock" />
                            <InputText
                                id="password"
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                :placeholder="isEdit ? 'Dejar vacío para mantener actual' : 'Contraseña del cliente'"
                                class="form-input password-input"
                                :class="passwordClasses"
                            />
                            <i
                                :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                class="password-toggle"
                                @click="togglePasswordVisibility"
                            ></i>
                        </IconField>
                    </div>
                    <small v-if="passwordError" class="field-error">{{ passwordError }}</small>
                    <div v-if="isCreate" class="password-help">
                        <small class="text-muted">
                            La contraseña debe tener al menos 8 caracteres
                        </small>
                    </div>
                </div>
            </div>

            <!-- Información adicional (solo en modo vista) -->
            <div v-if="isView && client.addresses" class="form-section">
                <h4 class="section-title">
                    <i class="pi pi-map-marker"></i>
                    Direcciones
                </h4>
                
                <div v-for="address in client.addresses" :key="address.id" class="address-card">
                    <div class="address-header">
                        <Tag v-if="address.is_main" value="Principal" severity="success" />
                        <span v-else class="address-type">Dirección</span>
                    </div>
                    <div class="address-details">
                        <p class="address-full">{{ address.address_full }}</p>
                        <p class="address-location">
                            {{ address.district }}, {{ address.province }}, {{ address.department }}
                        </p>
                        <div v-if="address.postal_code || address.reference" class="address-extra">
                            <span v-if="address.postal_code" class="postal-code">
                                <i class="pi pi-hashtag"></i> {{ address.postal_code }}
                            </span>
                            <span v-if="address.reference" class="reference">
                                <i class="pi pi-info-circle"></i> {{ address.reference }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Información de verificación (solo en modo vista) -->
            <div v-if="isView && client.email_verified_at" class="form-section">
                <h4 class="section-title">
                    <i class="pi pi-shield"></i>
                    Estado de Verificación
                </h4>
                
                <div class="verification-info">
                    <Tag value="Verificado" severity="success" icon="pi pi-shield" />
                    <span class="verification-date">
                        Verificado el {{ new Date(client.email_verified_at).toLocaleDateString('es-PE') }}
                    </span>
                </div>
            </div>
        </form>

        <!-- Acciones del formulario -->
        <div class="form-actions">
            <Button
                label="Cancelar"
                icon="pi pi-times"
                class="cancel-button"
                outlined
                @click="$emit('cancel')"
            />
            <Button
                v-if="!isView"
                type="submit"
                :label="isEdit ? 'Actualizar Cliente' : 'Crear Cliente'"
                :icon="isEdit ? 'pi pi-check' : 'pi pi-plus'"
                class="submit-button"
                :loading="loading"
                @click="handleSubmit"
            />
        </div>
    </div>
</template>

<style scoped>
.client-form {
    max-height: 70vh;
    overflow-y: auto;
    padding: 1.5rem;
}

.form-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-section {
    background: var(--surface-section);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: 1.5rem;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
}

.section-title i {
    color: var(--primary-color);
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    font-weight: 600;
    color: var(--text-color);
    font-size: 0.875rem;
}

.form-input,
.form-select {
    width: 100%;
}

.form-input :deep(.p-inputtext) {
    border-radius: 8px;
    border: 1px solid var(--surface-border);
    padding: 0.75rem 1rem;
}

.form-input :deep(.p-inputtext:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.form-select :deep(.p-select) {
    border-radius: 8px;
    border: 1px solid var(--surface-border);
}

.form-select :deep(.p-select:not(.p-disabled).p-focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.document-input-group {
    display: flex;
    gap: 0.5rem;
}

.document-input {
    flex: 1;
}

.lookup-button {
    flex-shrink: 0;
    border-radius: 8px;
}

.password-field {
    position: relative;
}

.password-input {
    padding-right: 3rem !important;
}

.password-toggle {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: var(--text-color-secondary);
    z-index: 10;
}

.password-toggle:hover {
    color: var(--text-color);
}

.password-help {
    margin-top: 0.25rem;
}

.field-error {
    color: var(--red-500);
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

/* Address Cards (for view mode) */
.address-card {
    background: var(--surface-ground);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.address-card:last-child {
    margin-bottom: 0;
}

.address-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
}

.address-type {
    font-weight: 600;
    color: var(--text-color);
}

.address-details p {
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
}

.address-full {
    font-weight: 500;
    color: var(--text-color);
}

.address-location {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.address-extra {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
}

.postal-code,
.reference {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
}

/* Verification Info */
.verification-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.verification-date {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

/* Form Actions */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem 2rem;
    background: var(--surface-section);
    margin: 1.5rem -1.5rem -1.5rem -1.5rem;
    border-radius: 0 0 12px 12px;
    border-top: 1px solid var(--surface-border);
}

.cancel-button {
    background: transparent !important;
    color: var(--text-color-secondary) !important;
    border: 1px solid var(--surface-border) !important;
}

.submit-button {
    background: var(--primary-color) !important;
    border: 1px solid var(--primary-color) !important;
    color: white !important;
}

/* Responsive */
@media (max-width: 768px) {
    .client-form {
        padding: 1rem;
        max-height: none;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column-reverse;
        gap: 0.5rem;
    }

    .form-actions .p-button {
        width: 100%;
    }
}

/* Dark Mode */
[data-theme='dark'] .form-section {
    background: var(--surface-800);
}

[data-theme='dark'] .address-card {
    background: var(--surface-700);
}
</style>