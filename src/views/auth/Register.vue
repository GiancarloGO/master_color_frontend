<script setup>
import { useEmailValidation, useNameValidation, usePasswordValidation, usePhoneValidation } from '@/composables/useInputValidation';
import { useAuthStore } from '@/stores/auth';
import { useDocumentLookupStore } from '@/stores/documentLookup';
import { UbigeoPostal } from '@/utils/ubigeoPostal';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const documentLookupStore = useDocumentLookupStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

// Validación de campos principales
const nameValidation = useNameValidation({ required: true });
const emailValidation = useEmailValidation({ required: true });
const passwordValidation = usePasswordValidation({ required: true });
const phoneValidation = usePhoneValidation({ required: true });

// Destructuring para compatibilidad
const { value: name, firstError: nameError, inputClasses: nameClasses } = nameValidation;
const { value: email, firstError: emailError, inputClasses: emailClasses } = emailValidation;
const { value: password, firstError: passwordError, inputClasses: passwordClasses } = passwordValidation;
const { value: phone, firstError: phoneError, inputClasses: phoneClasses } = phoneValidation;

// Estado
const confirmPassword = ref('');
const clientType = ref('individual'); // persona o empresa
const identityDocument = ref('');
const documentType = ref('dni'); // dni, ce, pasaporte, ruc
const acceptTerms = ref(false);
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Campos de dirección
const addressFull = ref('');
const selectedDepartment = ref(null);
const selectedProvince = ref(null);
const selectedDistrict = ref(null);
const postalCode = ref('');
const reference = ref('');

// Datos de ubigeo
const departments = ref([]);
const provinces = ref([]);
const districts = ref([]);

// Datos filtrados para AutoComplete
const filteredDepartments = ref([]);
const filteredProvinces = ref([]);
const filteredDistricts = ref([]);

// Estado para verificación de email
const registrationComplete = ref(false);
const verificationSent = ref(false);
const resendLoading = ref(false);
const verificationToken = ref('');

// Errores
const confirmPasswordError = ref('');
const identityDocumentError = ref('');
const termsError = ref('');

// Errores de dirección
const addressFullError = ref('');
const departmentError = ref('');
const provinceError = ref('');
const districtError = ref('');
const postalCodeError = ref('');
const referenceError = ref('');

// Opciones de tipo de cliente
const clientTypeOptions = [
    { label: 'Persona Natural', value: 'individual' },
    { label: 'Empresa', value: 'company' }
];

// Opciones de tipo de documento según el tipo de cliente
const documentTypeOptions = computed(() => {
    if (clientType.value === 'individual') {
        return [
            { label: 'DNI', value: 'dni' },
            { label: 'Carnet de Extranjería', value: 'ce' },
            { label: 'Pasaporte', value: 'pasaporte' }
        ];
    } else {
        return [{ label: 'RUC', value: 'ruc' }];
    }
});

// Actualizar tipo de documento cuando cambia el tipo de cliente
const onClientTypeChange = () => {
    if (clientType.value === 'individual') {
        documentType.value = 'dni';
    } else {
        documentType.value = 'ruc';
    }
    identityDocument.value = '';
    identityDocumentError.value = '';
    // Limpiar datos de consulta anterior
    documentLookupStore.clearData();
};

// Estados para búsqueda de documentos
const isLookingUpDocument = ref(false);
const lookupButtonDisabled = computed(() => {
    return !identityDocument.value || identityDocument.value.length < 6 || isLookingUpDocument.value;
});

// Funciones para limpiar errores
const clearDocumentError = () => {
    identityDocumentError.value = '';
};

const clearPasswordError = () => {
    passwordError.value = '';
};

const clearConfirmPasswordError = () => {
    confirmPasswordError.value = '';
};

const clearAddressFullError = () => {
    addressFullError.value = '';
};

const clearPostalCodeError = () => {
    postalCodeError.value = '';
};

const clearReferenceError = () => {
    referenceError.value = '';
};

// Función para prevenir caracteres no numéricos en el teléfono
const onPhoneKeypress = (event) => {
    // Permitir solo números (0-9)
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
        event.preventDefault();
    }
};

// Función para limpiar y limitar teléfono (por si pegan texto)
const onPhoneInput = () => {
    // Remover cualquier carácter que no sea dígito
    phone.value = phone.value.replace(/\D/g, '');
    // Limitar a 9 dígitos
    if (phone.value.length > 9) {
        phone.value = phone.value.slice(0, 9);
    }
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
    const validation = documentLookupStore.validateDocumentFormat(documentType.value, identityDocument.value);
    if (!validation.valid) {
        identityDocumentError.value = validation.message;
        toast.add({
            severity: 'error',
            summary: 'Formato inválido',
            detail: validation.message,
            life: 4000
        });
        return;
    }

    isLookingUpDocument.value = true;
    identityDocumentError.value = '';

    try {
        const result = await documentLookupStore.lookupDocument(documentType.value, identityDocument.value);

        if (result.success) {
            // Autocompletar campos según el tipo de documento
            const formattedData = documentLookupStore.getFormattedData();

            if (formattedData.type === 'dni') {
                // Para DNI: autocompletar nombre
                name.value = formattedData.fullName;

                toast.add({
                    severity: 'success',
                    summary: 'DNI encontrado',
                    detail: `Datos de ${formattedData.fullName} cargados correctamente`,
                    life: 5000
                });
            } else if (formattedData.type === 'ruc') {
                // Para RUC: autocompletar nombre de la empresa
                name.value = formattedData.businessName;

                // Si hay teléfono, autocompletar
                if (formattedData.phones.length > 0) {
                    phone.value = formattedData.phones[0].replace(/[^\d]/g, '');
                }

                // Autocompletar dirección si está disponible
                if (formattedData.fullAddress) {
                    addressFull.value = formattedData.fullAddress;
                }

                // Si tenemos datos de ubigeo, intentar autocompletar
                if (formattedData.department && formattedData.province && formattedData.district) {
                    try {
                        // Buscar departamento
                        const foundDept = departments.value.find((dept) => dept.label.toLowerCase().includes(formattedData.department.toLowerCase()));
                        if (foundDept) {
                            selectedDepartment.value = foundDept;
                            onDepartmentChange();

                            // Buscar provincia después de un breve delay para que se carguen
                            setTimeout(() => {
                                const foundProv = provinces.value.find((prov) => prov.label.toLowerCase().includes(formattedData.province.toLowerCase()));
                                if (foundProv) {
                                    selectedProvince.value = foundProv;
                                    onProvinceChange();

                                    // Buscar distrito
                                    setTimeout(() => {
                                        const foundDist = districts.value.find((dist) => dist.label.toLowerCase().includes(formattedData.district.toLowerCase()));
                                        if (foundDist) {
                                            selectedDistrict.value = foundDist;
                                            onDistrictChange();
                                        }
                                    }, 300);
                                }
                            }, 300);
                        }
                    } catch (error) {
                        console.warn('Error al autocompletar ubicación:', error);
                    }
                }

                toast.add({
                    severity: 'success',
                    summary: 'RUC encontrado',
                    detail: `Datos de ${formattedData.businessName} cargados correctamente`,
                    life: 5000
                });
            }
        } else {
            identityDocumentError.value = result.message;
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

// Crear instancia de ubigeo con códigos postales
const ubigeo = new UbigeoPostal();

// Funciones para manejar ubigeo
const loadDepartments = () => {
    try {
        departments.value = ubigeo.getDepartments();
        filteredDepartments.value = departments.value;
    } catch (error) {
        console.error('Error loading departments:', error);
        departments.value = [];
        filteredDepartments.value = [];
    }
};

// Funciones de filtrado para AutoComplete
const searchDepartments = (event) => {
    const query = event.query.toLowerCase();
    filteredDepartments.value = departments.value.filter((dept) => dept.label.toLowerCase().includes(query));
};

const searchProvinces = (event) => {
    const query = event.query.toLowerCase();
    filteredProvinces.value = provinces.value.filter((prov) => prov.label.toLowerCase().includes(query));
};

const searchDistricts = (event) => {
    const query = event.query.toLowerCase();
    filteredDistricts.value = districts.value.filter((dist) => dist.label.toLowerCase().includes(query));
};

const onDepartmentChange = () => {
    selectedProvince.value = null;
    selectedDistrict.value = null;
    provinces.value = [];
    districts.value = [];
    filteredProvinces.value = [];
    filteredDistricts.value = [];

    if (selectedDepartment.value) {
        const departmentName = typeof selectedDepartment.value === 'object' ? selectedDepartment.value.value : selectedDepartment.value;

        try {
            provinces.value = ubigeo.getProvincesByDepartment(departmentName);
            filteredProvinces.value = provinces.value;
        } catch (error) {
            console.error('Error loading provinces:', error);
            provinces.value = [];
            filteredProvinces.value = [];
        }
    }

    // Clear errors
    departmentError.value = '';
    provinceError.value = '';
    districtError.value = '';
};

const onProvinceChange = () => {
    selectedDistrict.value = null;
    districts.value = [];
    filteredDistricts.value = [];

    if (selectedProvince.value) {
        const provinceName = typeof selectedProvince.value === 'object' ? selectedProvince.value.value : selectedProvince.value;

        try {
            districts.value = ubigeo.getDistrictsByProvince(provinceName);
            filteredDistricts.value = districts.value;
        } catch (error) {
            console.error('Error loading districts:', error);
            districts.value = [];
            filteredDistricts.value = [];
        }
    }

    // Clear errors
    provinceError.value = '';
    districtError.value = '';
};

const onDistrictChange = () => {
    // Auto-fill postal code if available
    if (selectedDistrict.value && selectedProvince.value) {
        const districtName = typeof selectedDistrict.value === 'object' ? selectedDistrict.value.value : selectedDistrict.value;
        const provinceName = typeof selectedProvince.value === 'object' ? selectedProvince.value.value : selectedProvince.value;

        const primaryPostalCode = ubigeo.getPrimaryPostalCode(districtName, provinceName);
        if (primaryPostalCode) {
            postalCode.value = primaryPostalCode;
        }
    }

    districtError.value = '';
};

// Helper function to get location name by code
const getLocationName = (locations, code) => {
    return ubigeo.getLocationName(locations, code);
};

// Validaciones
const validateForm = () => {
    let isValid = true;

    // Limpiar errores manuales
    confirmPasswordError.value = '';
    identityDocumentError.value = '';
    termsError.value = '';

    // Limpiar errores de dirección
    addressFullError.value = '';
    districtError.value = '';
    provinceError.value = '';
    departmentError.value = '';
    postalCodeError.value = '';
    referenceError.value = '';

    // Validar usando composables
    const nameValid = nameValidation.validate();
    const emailValid = emailValidation.validate();
    const passwordValid = passwordValidation.validate();

    isValid = nameValid && emailValid && passwordValid;

    // Validar confirmación de contraseña
    if (!confirmPassword.value) {
        confirmPasswordError.value = 'Confirme su contraseña';
        isValid = false;
    } else if (password.value !== confirmPassword.value) {
        confirmPasswordError.value = 'Las contraseñas no coinciden';
        isValid = false;
    }

    // Validar documento de identidad
    if (!identityDocument.value) {
        identityDocumentError.value = 'El documento de identidad es requerido';
        isValid = false;
    } else {
        const doc = identityDocument.value.trim();
        if (documentType.value === 'dni' && (doc.length !== 8 || !/^\d+$/.test(doc))) {
            identityDocumentError.value = 'El DNI debe tener 8 dígitos';
            isValid = false;
        } else if (documentType.value === 'ruc' && (doc.length !== 11 || !/^\d+$/.test(doc))) {
            identityDocumentError.value = 'El RUC debe tener 11 dígitos';
            isValid = false;
        } else if (documentType.value === 'ce' && doc.length < 7) {
            identityDocumentError.value = 'Ingrese un carnet de extranjería válido';
            isValid = false;
        } else if (documentType.value === 'pasaporte' && doc.length < 6) {
            identityDocumentError.value = 'Ingrese un número de pasaporte válido';
            isValid = false;
        }
    }

    // Validar teléfono con composable
    const phoneValid = phoneValidation.validate();
    isValid = isValid && phoneValid;

    // Validar términos y condiciones
    if (!acceptTerms.value) {
        termsError.value = 'Debe aceptar los términos y condiciones';
        isValid = false;
    }

    // Validar dirección completa
    if (!addressFull.value.trim()) {
        addressFullError.value = 'La dirección completa es requerida';
        isValid = false;
    } else if (addressFull.value.trim().length < 10) {
        addressFullError.value = 'La dirección debe ser más específica (mínimo 10 caracteres)';
        isValid = false;
    }

    // Validar departamento
    if (!selectedDepartment.value) {
        departmentError.value = 'El departamento es requerido';
        isValid = false;
    }

    // Validar provincia
    if (!selectedProvince.value) {
        provinceError.value = 'La provincia es requerida';
        isValid = false;
    }

    // Validar distrito
    if (!selectedDistrict.value) {
        districtError.value = 'El distrito es requerido';
        isValid = false;
    }

    // Validar código postal (opcional pero si se ingresa debe ser válido)
    if (postalCode.value.trim() && !/^\d{5}$/.test(postalCode.value.trim())) {
        postalCodeError.value = 'El código postal debe tener 5 dígitos';
        isValid = false;
    }

    // Validar referencia (requerida)
    if (!reference.value.trim()) {
        referenceError.value = 'La referencia de dirección es requerida';
        isValid = false;
    }

    return isValid;
};

const register = async () => {
    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'Por favor corrige los errores en el formulario',
            life: 4000
        });
        return;
    }

    loading.value = true;

    let payload = {
        name: name.value,
        email: email.value,
        password: password.value,
        password_confirmation: confirmPassword.value,
        client_type: clientType.value,
        identity_document: identityDocument.value,
        document_type: documentType.value,
        phone: phone.value,

        // Campos de dirección
        address_full: addressFull.value.trim(),
        district: typeof selectedDistrict.value === 'object' ? selectedDistrict.value.value : selectedDistrict.value,
        province: typeof selectedProvince.value === 'object' ? selectedProvince.value.value : selectedProvince.value,
        department: typeof selectedDepartment.value === 'object' ? selectedDepartment.value.value : selectedDepartment.value,
        postal_code: postalCode.value.trim() || null,
        reference: reference.value.trim() || ''
    };

    await authStore.register(payload, 'client');

    if (authStore.success) {
        toast.add({
            severity: 'success',
            summary: 'Registro exitoso',
            detail: 'Cuenta creada correctamente. Por favor verifica tu correo electrónico.',
            life: 5000
        });

        // Save checkout flow flag if applicable
        if (isCheckoutFlow.value) {
            localStorage.setItem('wasCheckoutFlow', 'true');
        }

        // Mostrar pantalla de verificación en lugar de redirigir
        registrationComplete.value = true;
        verificationSent.value = true;
    } else {
        if (authStore.validationErrors && authStore.validationErrors.length > 0) {
            authStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: authStore.message, life: 3000 });
        }
    }

    loading.value = false;
};

const goToLogin = () => {
    router.push('/auth/login');
};

const goToStore = () => {
    router.push('/');
};

// Función para reenviar el correo de verificación
const resendVerificationEmail = async () => {
    if (!email.value) return;

    resendLoading.value = true;

    try {
        const result = await authStore.resendVerificationEmail({ email: email.value });

        if (result.success) {
            verificationSent.value = true;
            toast.add({
                severity: 'success',
                summary: 'Correo enviado',
                detail: 'Se ha enviado un nuevo correo de verificación',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'No se pudo enviar el correo de verificación',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo enviar el correo de verificación',
            life: 3000
        });
    } finally {
        resendLoading.value = false;
    }
};

// Función para verificar el email con el token
const verifyEmail = async () => {
    // Obtener token de la URL si existe
    const token = route.query.token;

    if (!token) return;

    verificationToken.value = token;
    loading.value = true;

    try {
        const result = await authStore.verifyEmail({ token });

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Email verificado',
                detail: 'Tu correo electrónico ha sido verificado correctamente',
                life: 3000
            });

            // Check if this was from checkout flow
            const wasCheckoutFlow = localStorage.getItem('wasCheckoutFlow') === 'true';

            setTimeout(() => {
                if (wasCheckoutFlow) {
                    // Clear the checkout flow flag
                    localStorage.removeItem('wasCheckoutFlow');

                    // Redirect to store with cart restoration
                    toast.add({
                        severity: 'info',
                        summary: 'Registro Completado',
                        detail: 'Ahora puedes continuar con tu compra. Tu carrito se restaurará.',
                        life: 4000
                    });
                    router.push('/');
                } else {
                    // Normal flow - redirect to dashboard
                    router.push('/dashboard');
                }
            }, 1500);
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error de verificación',
                detail: result.message || 'No se pudo verificar el correo electrónico',
                life: 4000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo verificar el correo electrónico',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};

// Función para calcular la fortaleza de la contraseña
const getPasswordStrength = () => {
    let score = 0;
    const pass = password.value;

    if (pass.length >= 10) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) score++;

    return score;
};

// Función para obtener el color de la barra de fortaleza
const getPasswordStrengthColor = (index) => {
    const strength = getPasswordStrength();

    if (index > strength) {
        return 'bg-gray-200';
    }

    switch (strength) {
        case 1:
        case 2:
            return 'bg-red-500';
        case 3:
            return 'bg-yellow-500';
        case 4:
            return 'bg-blue-500';
        case 5:
            return 'bg-green-500';
        default:
            return 'bg-gray-200';
    }
};

// Función para obtener el texto de fortaleza
const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();

    switch (strength) {
        case 0:
        case 1:
            return 'Muy débil';
        case 2:
            return 'Débil';
        case 3:
            return 'Regular';
        case 4:
            return 'Fuerte';
        case 5:
            return 'Muy fuerte';
        default:
            return 'Muy débil';
    }
};

// Función para obtener el color del texto de fortaleza
const getPasswordStrengthTextColor = () => {
    const strength = getPasswordStrength();

    switch (strength) {
        case 0:
        case 1:
            return 'text-red-600';
        case 2:
            return 'text-red-500';
        case 3:
            return 'text-yellow-600';
        case 4:
            return 'text-blue-600';
        case 5:
            return 'text-green-600';
        default:
            return 'text-red-600';
    }
};

// Computed para validar caracteres especiales
const hasSpecialChar = computed(() => {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password.value);
});

// Check if coming from checkout flow
const isCheckoutFlow = computed(() => {
    return route.query.checkout === 'true';
});

// Verificar si hay un token de verificación en la URL al cargar la página
onMounted(() => {
    const token = route.query.token;
    if (token) {
        verificationToken.value = token;
        // Intentar verificar el email automáticamente
        verifyEmail();
    }

    // Load departments on component mount
    loadDepartments();

    // Show checkout flow message if applicable
    if (isCheckoutFlow.value) {
        toast.add({
            severity: 'info',
            summary: 'Finalizar Compra',
            detail: 'Completa tu registro para continuar con la compra. Tu carrito se mantendrá guardado.',
            life: 6000
        });
    }
});
</script>

<template>
    <div class="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-2">
        <div class="w-full max-w-6xl h-[calc(100vh-1rem)]">
            <div class="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 h-full">
                <div class="flex flex-col xl:flex-row h-full">
                    <!-- Panel lateral izquierdo - Más compacto -->
                    <div class="xl:w-1/3 bg-gradient-to-br from-blue-700 to-blue-800 p-3 xl:p-4 text-white relative overflow-hidden xl:min-h-0 hidden xl:block">
                        <!-- Elementos decorativos de fondo -->
                        <div class="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-600 opacity-20 rounded-full -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32"></div>
                        <div class="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-blue-900 opacity-20 rounded-full translate-y-12 sm:translate-y-24 -translate-x-12 sm:-translate-x-24"></div>

                        <div class="relative z-10 h-full flex flex-col justify-between">
                            <!-- Logo y título -->
                            <div class="text-left">
                                <div class="flex items-center mb-1">
                                    <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                        <img src="/mc.png" alt="Master Color Logo" class="w-8 h-8 object-contain" />
                                    </div>
                                </div>
                                <h1 class="text-xl font-bold mb-1 text-white">Master Color</h1>
                                <p class="text-blue-50 font-light text-sm">Únete a nuestra comunidad</p>
                            </div>

                            <!-- Beneficios de registrarse - Más compacto -->
                            <div class="space-y-2 my-3">
                                <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0">
                                        <i class="pi pi-shopping-cart text-blue-700 text-xs"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-xs text-white">Compras Rápidas</h3>
                                        <p class="text-blue-100 text-xs">Acceso exclusivo</p>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0">
                                        <i class="pi pi-tags text-blue-700 text-xs"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-xs text-white">Ofertas Especiales</h3>
                                        <p class="text-blue-100 text-xs">Descuentos exclusivos</p>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0">
                                        <i class="pi pi-truck text-blue-700 text-xs"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-xs text-white">Seguimiento</h3>
                                        <p class="text-blue-100 text-xs">Rastrea compras</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Call to action -->
                            <div class="mt-2">
                                <Button
                                    label="Explorar Tienda"
                                    icon="pi pi-shopping-cart"
                                    class="w-full bg-yellow-500 border-yellow-500 text-blue-900 font-semibold text-sm py-2 hover:bg-yellow-400 hover:border-yellow-400 transition-all duration-300"
                                    @click="goToStore"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Panel de registro - Más amplio -->
                    <div class="xl:w-2/3 w-full p-3 xl:p-5 bg-white h-full overflow-y-auto">
                        <!-- Pantalla de verificación de email después del registro -->
                        <div v-if="registrationComplete" class="h-full flex flex-col justify-center items-center px-4 py-8 text-center space-y-6">
                            <div class="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center">
                                <i class="pi pi-envelope text-blue-600 text-3xl sm:text-4xl"></i>
                            </div>

                            <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">¡Verifica tu correo electrónico!</h2>

                            <p class="text-gray-600 max-w-md">
                                Hemos enviado un correo de verificación a <span class="font-semibold">{{ email }}</span
                                >. Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación.
                            </p>

                            <div class="flex flex-col sm:flex-row gap-4 mt-4">
                                <Button label="Reenviar correo" icon="pi pi-refresh" :loading="resendLoading" :disabled="verificationSent" class="p-button-outlined p-button-primary" @click="resendVerificationEmail" />

                                <Button label="Ir a iniciar sesión" icon="pi pi-sign-in" class="p-button-primary" @click="goToLogin" />
                            </div>

                            <p v-if="verificationSent" class="text-sm text-green-600 mt-2"><i class="pi pi-check mr-1"></i> Correo enviado. Si no lo recibes, revisa tu carpeta de spam.</p>
                        </div>

                        <!-- Formulario de registro -->
                        <div v-else class="h-full flex flex-col">
                            <!-- Header del formulario -->
                            <div class="text-center mb-2 xl:hidden">
                                <div class="flex items-center justify-center mb-1">
                                    <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <img src="/mc.png" alt="Master Color Logo" class="w-6 h-6 object-contain" />
                                    </div>
                                </div>
                                <h2 class="text-lg font-bold text-gray-900 mb-1">Crear Cuenta</h2>
                                <p class="text-gray-600 text-xs">Regístrate en Master Color</p>
                            </div>

                            <div class="hidden xl:block text-center mb-2">
                                <h2 class="text-xl font-bold text-gray-900 mb-1">Crear Cuenta</h2>
                                <p class="text-gray-600 text-sm">Regístrate y únete a nosotros</p>
                            </div>

                            <div class="flex-1 overflow-y-auto">
                                <form class="space-y-2" @submit.prevent="register">
                                    <!-- Información personal en 3 columnas -->
                                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
                                        <div>
                                            <label for="name" class="block text-sm font-semibold text-gray-800 mb-1">Nombre Completo</label>
                                            <IconField>
                                                <InputIcon class="pi pi-user" />
                                                <InputText id="name" v-model="name" type="text" placeholder="Tu nombre completo" class="w-full compact-input" :class="nameClasses" maxlength="100" />
                                            </IconField>
                                            <small v-if="nameError" class="p-error text-red-600 text-xs mt-1 block">{{ nameError }}</small>
                                        </div>

                                        <div>
                                            <label for="email" class="block text-sm font-semibold text-gray-800 mb-1">Correo Electrónico</label>
                                            <IconField>
                                                <InputIcon class="pi pi-envelope" />
                                                <InputText id="email" v-model="email" type="email" placeholder="tu@email.com" class="w-full compact-input" :class="emailClasses" maxlength="254" />
                                            </IconField>
                                            <small v-if="emailError" class="p-error text-red-600 text-xs mt-1 block">{{ emailError }}</small>
                                        </div>

                                        <div>
                                            <label for="phone" class="block text-sm font-semibold text-gray-800 mb-1">Teléfono *</label>
                                            <IconField>
                                                <InputIcon class="pi pi-phone" />
                                                <InputText id="phone" v-model="phone" type="tel" placeholder="987654321" class="w-full compact-input" :class="phoneClasses" maxlength="9" @keypress="onPhoneKeypress" @input="onPhoneInput" />
                                            </IconField>
                                            <small v-if="phoneError" class="p-error text-red-600 text-xs mt-1 block">{{ phoneError }}</small>
                                        </div>
                                    </div>

                                    <!-- Documento y tipo de cliente en 3 columnas -->
                                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
                                        <div>
                                            <label for="clientType" class="block text-sm font-semibold text-gray-800 mb-1">Tipo de Cliente</label>
                                            <Select v-model="clientType" :options="clientTypeOptions" option-label="label" option-value="value" placeholder="Selecciona el tipo" class="w-full compact-select" @change="onClientTypeChange" />
                                        </div>

                                        <div>
                                            <label for="documentType" class="block text-sm font-semibold text-gray-800 mb-1">Tipo de Documento</label>
                                            <Select v-model="documentType" :options="documentTypeOptions" option-label="label" option-value="value" placeholder="Tipo de documento" class="w-full compact-select" />
                                        </div>

                                        <div>
                                            <label for="identityDocument" class="block text-sm font-semibold text-gray-800 mb-1">Número de Documento</label>
                                            <div class="flex gap-2">
                                                <InputText
                                                    id="identityDocument"
                                                    v-model="identityDocument"
                                                    type="text"
                                                    :placeholder="documentType === 'dni' ? '12345678' : documentType === 'ruc' ? '12345678901' : 'Número de documento'"
                                                    class="flex-1 compact-input"
                                                    :class="identityDocumentError ? 'p-invalid' : ''"
                                                    @input="clearDocumentError"
                                                    @keyup.enter="lookupDocument"
                                                />
                                                <Button v-tooltip.top="'Buscar datos del documento'" icon="pi pi-search" class="p-button-outlined p-button-sm" :loading="isLookingUpDocument" :disabled="lookupButtonDisabled" @click="lookupDocument" />
                                            </div>
                                            <small v-if="identityDocumentError" class="p-error text-red-600 text-xs mt-1 block">{{ identityDocumentError }}</small>
                                        </div>
                                    </div>

                                    <!-- Contraseñas en 2 columnas -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div>
                                            <label for="password" class="block text-sm font-semibold text-gray-800 mb-1">Contraseña</label>
                                            <div class="relative">
                                                <IconField>
                                                    <InputIcon class="pi pi-lock" />
                                                    <InputText
                                                        id="password"
                                                        v-model="password"
                                                        :type="showPassword ? 'text' : 'password'"
                                                        placeholder="Tu contraseña"
                                                        class="w-full compact-input pr-12"
                                                        :class="passwordError ? 'p-invalid' : ''"
                                                        @input="clearPasswordError"
                                                    />
                                                    <i
                                                        :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                                        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700 z-10"
                                                        @click="togglePasswordVisibility"
                                                    ></i>
                                                </IconField>
                                            </div>
                                            <small v-if="passwordError" class="p-error text-red-600 text-xs mt-1 block">{{ passwordError }}</small>
                                            <!-- Indicador de fortaleza de contraseña -->
                                            <div v-if="password" class="mt-2 bg-gray-50 p-3 rounded-lg border">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="text-xs font-medium text-gray-700">Fortaleza de la contraseña</span>
                                                    <span class="text-xs font-semibold" :class="getPasswordStrengthTextColor()">{{ getPasswordStrengthText() }}</span>
                                                </div>
                                                <div class="flex space-x-1 mb-3">
                                                    <div v-for="i in 4" :key="i" class="h-2 flex-1 rounded-full transition-colors duration-300" :class="getPasswordStrengthColor(i)"></div>
                                                </div>
                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                    <div class="flex items-center text-xs transition-colors duration-200" :class="password.length >= 10 ? 'text-green-600' : 'text-gray-500'">
                                                        <i :class="password.length >= 10 ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1.5 text-sm"></i>
                                                        <span>Mínimo 10 caracteres</span>
                                                    </div>
                                                    <div class="flex items-center text-xs transition-colors duration-200" :class="/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'">
                                                        <i :class="/[a-z]/.test(password) ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1.5 text-sm"></i>
                                                        <span>Una letra minúscula</span>
                                                    </div>
                                                    <div class="flex items-center text-xs transition-colors duration-200" :class="/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'">
                                                        <i :class="/[A-Z]/.test(password) ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1.5 text-sm"></i>
                                                        <span>Una letra mayúscula</span>
                                                    </div>
                                                    <div class="flex items-center text-xs transition-colors duration-200" :class="/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'">
                                                        <i :class="/[0-9]/.test(password) ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1.5 text-sm"></i>
                                                        <span>Un número</span>
                                                    </div>
                                                    <div class="flex items-center text-xs transition-colors duration-200 sm:col-span-2" :class="hasSpecialChar ? 'text-green-600' : 'text-gray-500'">
                                                        <i :class="hasSpecialChar ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="mr-1.5 text-sm"></i>
                                                        <span>Un carácter especial (!@#$%^&*)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label for="confirmPassword" class="block text-sm font-semibold text-gray-800 mb-1">Confirmar Contraseña</label>
                                            <div class="relative">
                                                <IconField>
                                                    <InputIcon class="pi pi-lock" />
                                                    <InputText
                                                        id="confirmPassword"
                                                        v-model="confirmPassword"
                                                        :type="showConfirmPassword ? 'text' : 'password'"
                                                        placeholder="Confirma tu contraseña"
                                                        class="w-full compact-input pr-12"
                                                        :class="confirmPasswordError ? 'p-invalid' : ''"
                                                        @input="clearConfirmPasswordError"
                                                    />
                                                    <i
                                                        :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                                        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700 z-10"
                                                        @click="toggleConfirmPasswordVisibility"
                                                    ></i>
                                                </IconField>
                                            </div>
                                            <small v-if="confirmPasswordError" class="p-error text-red-600 text-xs mt-1 block">{{ confirmPasswordError }}</small>
                                        </div>
                                    </div>

                                    <!-- Sección de Dirección -->
                                    <div class="bg-gray-50 p-2 rounded-lg border">
                                        <h3 class="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                                            <i class="pi pi-map-marker mr-2 text-blue-600"></i>
                                            Dirección de Entrega
                                        </h3>

                                        <!-- Dirección completa -->
                                        <div class="mb-2">
                                            <label for="addressFull" class="block text-sm font-semibold text-gray-800 mb-1">Dirección Completa *</label>
                                            <IconField>
                                                <InputIcon class="pi pi-home" />
                                                <InputText
                                                    id="addressFull"
                                                    v-model="addressFull"
                                                    type="text"
                                                    placeholder="Ej: Av. Los Olivos 123, Mz A Lt 5"
                                                    class="w-full compact-input"
                                                    :class="addressFullError ? 'p-invalid' : ''"
                                                    fluid
                                                    @input="clearAddressFullError"
                                                />
                                            </IconField>
                                            <small v-if="addressFullError" class="p-error text-red-600 text-xs mt-1 block">{{ addressFullError }}</small>
                                        </div>

                                        <!-- Ubicación en 3 columnas -->
                                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
                                            <div>
                                                <label for="department" class="block text-sm font-semibold text-gray-800 mb-1">Departamento *</label>
                                                <AutoComplete
                                                    id="department"
                                                    v-model="selectedDepartment"
                                                    :suggestions="filteredDepartments"
                                                    option-label="label"
                                                    placeholder="Busca departamento"
                                                    class="w-full compact-autocomplete"
                                                    :class="departmentError ? 'p-invalid' : ''"
                                                    force-selection
                                                    fluid
                                                    @complete="searchDepartments"
                                                    @change="onDepartmentChange"
                                                />
                                                <small v-if="departmentError" class="p-error text-red-600 text-xs mt-1 block">{{ departmentError }}</small>
                                            </div>

                                            <div>
                                                <label for="province" class="block text-sm font-semibold text-gray-800 mb-1">Provincia *</label>
                                                <AutoComplete
                                                    id="province"
                                                    v-model="selectedProvince"
                                                    :suggestions="filteredProvinces"
                                                    option-label="label"
                                                    placeholder="Busca provincia"
                                                    class="w-full compact-autocomplete"
                                                    :class="provinceError ? 'p-invalid' : ''"
                                                    :disabled="!selectedDepartment || provinces.length === 0"
                                                    force-selection
                                                    fluid
                                                    @complete="searchProvinces"
                                                    @change="onProvinceChange"
                                                />
                                                <small v-if="provinceError" class="p-error text-red-600 text-xs mt-1 block">{{ provinceError }}</small>
                                            </div>

                                            <div>
                                                <label for="district" class="block text-sm font-semibold text-gray-800 mb-1">Distrito *</label>
                                                <AutoComplete
                                                    id="district"
                                                    v-model="selectedDistrict"
                                                    :suggestions="filteredDistricts"
                                                    option-label="label"
                                                    placeholder="Busca distrito"
                                                    class="w-full compact-autocomplete"
                                                    :class="districtError ? 'p-invalid' : ''"
                                                    :disabled="!selectedProvince || districts.length === 0"
                                                    force-selection
                                                    fluid
                                                    @complete="searchDistricts"
                                                    @change="onDistrictChange"
                                                />
                                                <small v-if="districtError" class="p-error text-red-600 text-xs mt-1 block">{{ districtError }}</small>
                                            </div>
                                        </div>

                                        <!-- Código postal y referencia en 2 columnas -->
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <label for="postalCode" class="block text-sm font-semibold text-gray-800 mb-1">Código Postal</label>
                                                <IconField>
                                                    <InputIcon class="pi pi-hashtag" />
                                                    <InputText id="postalCode" v-model="postalCode" type="text" placeholder="Ej: 15434" class="w-full compact-input" :class="postalCodeError ? 'p-invalid' : ''" fluid @input="clearPostalCodeError" />
                                                </IconField>
                                                <small v-if="postalCodeError" class="p-error text-red-600 text-xs mt-1 block">{{ postalCodeError }}</small>
                                            </div>

                                            <div>
                                                <label for="reference" class="block text-sm font-semibold text-gray-800 mb-1">Referencia *</label>
                                                <IconField>
                                                    <InputIcon class="pi pi-info-circle" />
                                                    <InputText
                                                        id="reference"
                                                        v-model="reference"
                                                        type="text"
                                                        placeholder="Ej: Frente al parque, casa verde"
                                                        class="w-full compact-input"
                                                        :class="referenceError ? 'p-invalid' : ''"
                                                        fluid
                                                        @input="clearReferenceError"
                                                    />
                                                </IconField>
                                                <small v-if="referenceError" class="p-error text-red-600 text-xs mt-1 block">{{ referenceError }}</small>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Términos y condiciones -->
                                    <div class="flex items-start space-x-2">
                                        <Checkbox id="acceptTerms" v-model="acceptTerms" :binary="true" class="mt-1" />
                                        <label for="acceptTerms" class="text-sm text-gray-700 cursor-pointer">
                                            Acepto los
                                            <a href="#" class="text-blue-600 hover:text-blue-800 underline">términos y condiciones</a>
                                            y la
                                            <a href="#" class="text-blue-600 hover:text-blue-800 underline">política de privacidad</a>
                                        </label>
                                    </div>
                                    <small v-if="termsError" class="p-error text-red-600 text-xs block">{{ termsError }}</small>
                                </form>
                            </div>

                            <!-- Botones fijos en la parte inferior -->
                            <div class="border-t pt-2 mt-2 space-y-1">
                                <Button type="submit" label="Crear Cuenta" icon="pi pi-user-plus" class="w-full compact-button bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700" :loading="loading" @click="register" />

                                <div class="text-center">
                                    <span class="text-sm text-gray-600">¿Ya tienes una cuenta? </span>
                                    <Button type="button" label="Iniciar Sesión" class="p-button-link text-blue-600 hover:text-blue-800 p-0 h-auto text-sm" @click="goToLogin" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast para notificaciones -->
        <Toast position="top-right" class="toast-responsive" />
    </div>
</template>

<style scoped>
/* Ajustes para pantallas muy pequeñas */
@media (max-width: 400px) {
    .min-h-screen {
        padding: 0.25rem 0.125rem;
    }

    .compact-input :deep(.p-inputtext),
    .compact-select :deep(.p-select .p-select-label),
    .compact-autocomplete :deep(.p-autocomplete .p-autocomplete-input) {
        padding: 0.375rem 0.625rem;
        font-size: 0.6875rem;
    }

    :deep(.p-input-icon-left > i:first-of-type) {
        left: 0.625rem;
        font-size: 0.6875rem;
    }

    :deep(.p-input-icon-left > .p-inputtext) {
        padding-left: 2rem;
    }
}
/* Estilos compactos para mejor uso del espacio */
.compact-input :deep(.p-inputtext) {
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
    border: 1.5px solid #d1d5db;
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.compact-input :deep(.p-inputtext:focus) {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.compact-input :deep(.p-inputtext.p-invalid) {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.compact-select :deep(.p-select) {
    border-radius: 0.5rem;
    border: 1.5px solid #d1d5db;
    transition: all 0.2s ease;
}

.compact-select :deep(.p-select:not(.p-disabled).p-focus) {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.compact-select :deep(.p-select .p-select-label) {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
}

.compact-autocomplete :deep(.p-autocomplete) {
    border-radius: 0.5rem;
    border: 1.5px solid #d1d5db;
    transition: all 0.2s ease;
}

.compact-autocomplete :deep(.p-autocomplete:not(.p-disabled).p-focus) {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.compact-autocomplete :deep(.p-autocomplete.p-invalid) {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.compact-autocomplete :deep(.p-autocomplete .p-autocomplete-input) {
    padding: 0.625rem 0.875rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: transparent;
}

.compact-autocomplete :deep(.p-autocomplete .p-autocomplete-input:focus) {
    outline: none;
    box-shadow: none;
}

.compact-button :deep(.p-button) {
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

:deep(.p-input-icon-left > i:first-of-type) {
    left: 0.875rem;
    color: #6b7280;
    font-size: 0.875rem;
}

:deep(.p-input-icon-left > .p-inputtext) {
    padding-left: 2.5rem;
}

:deep(.p-checkbox) {
    width: 1rem;
    height: 1rem;
}

:deep(.p-checkbox .p-checkbox-box) {
    border-width: 1.5px;
    border-color: #6b7280;
    border-radius: 0.25rem;
}

:deep(.p-checkbox.p-checkbox-checked .p-checkbox-box) {
    background-color: #2563eb;
    border-color: #2563eb;
}

/* Responsive adjustments */
@media (min-width: 401px) and (max-width: 768px) {
    .compact-input :deep(.p-inputtext) {
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
    }

    .compact-select :deep(.p-select .p-select-label) {
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
    }

    .compact-autocomplete :deep(.p-autocomplete .p-autocomplete-input) {
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
    }

    .compact-button :deep(.p-button) {
        padding: 0.625rem 1rem;
        font-size: 0.8125rem;
    }
}

/* Ajustes para dispositivos táctiles */
@media (hover: none) and (pointer: coarse) {
    .overflow-y-auto::-webkit-scrollbar {
        width: 0;
    }

    .overflow-y-auto {
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
    }
}

/* Scrollbar personalizado para el panel de registro */
.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Ajustes para Toast en móviles */
@media (max-width: 480px) {
    :deep(.toast-responsive .p-toast-message) {
        margin: 0.25rem;
        padding: 0.5rem;
        width: calc(100vw - 2rem);
        max-width: 100%;
    }

    :deep(.toast-responsive .p-toast-message-content) {
        padding: 0.5rem;
        align-items: flex-start;
    }

    :deep(.toast-responsive .p-toast-message-text) {
        margin-left: 0.5rem;
    }

    :deep(.toast-responsive .p-toast-detail) {
        margin-top: 0.25rem;
        font-size: 0.75rem;
    }
}
</style>
