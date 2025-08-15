import { ref, watch, computed } from 'vue';
import { 
    sanitizeInput, 
    sanitizeEmail, 
    sanitizeName, 
    sanitizeNumber, 
    sanitizeTextarea,
    validateInput 
} from '@/utils/inputSanitizer';

/**
 * Composable para manejo de validación y sanitización de inputs
 * @param {string} inputType - Tipo de input: 'text', 'email', 'name', 'number', 'textarea', 'search'
 * @param {Object} options - Opciones de configuración
 */
export function useInputValidation(inputType = 'text', options = {}) {
    const {
        maxLength = getDefaultMaxLength(inputType),
        required = false,
        customValidation = null,
        realTimeValidation = true
    } = options;

    const value = ref('');
    const errors = ref([]);
    const isValid = ref(true);
    const isDirty = ref(false);

    // Función para obtener longitud máxima por defecto según el tipo
    function getDefaultMaxLength(type) {
        const defaults = {
            email: 254,
            name: 100,
            text: 100,
            number: 20,
            textarea: 1000,
            search: 50,
            phone: 15,
            dni: 8,
            address: 255,
            password: 128
        };
        return defaults[type] || 100;
    }

    // Función para sanitizar según el tipo de input
    function sanitizeByType(inputValue, type) {
        switch (type) {
            case 'email':
                return sanitizeEmail(inputValue);
            case 'name':
                return sanitizeName(inputValue, maxLength);
            case 'number':
                return sanitizeNumber(inputValue);
            case 'textarea':
                return sanitizeTextarea(inputValue, maxLength);
            case 'search':
                return sanitizeInput(inputValue, { maxLength, isTextarea: false });
            case 'phone':
                return sanitizeNumber(inputValue, false); // Solo números enteros
            case 'dni':
                return sanitizeNumber(inputValue, false).substring(0, 8);
            case 'address':
                return sanitizeInput(inputValue, { maxLength: 255, allowBasicHtml: false });
            default:
                return sanitizeInput(inputValue, { maxLength });
        }
    }

    // Validación específica por tipo
    function validateByType(inputValue, type) {
        const validationErrors = [];

        if (required && !inputValue.trim()) {
            validationErrors.push('Este campo es requerido');
            return validationErrors;
        }

        if (!inputValue.trim()) {
            return validationErrors; // Si no es requerido y está vacío, es válido
        }

        switch (type) {
            case 'email':
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(inputValue)) {
                    validationErrors.push('Ingresa un email válido');
                }
                // Verificar dominios comunes mal escritos
                const commonDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
                const domain = inputValue.split('@')[1];
                if (domain) {
                    const suggestions = getSimilarDomains(domain, commonDomains);
                    if (suggestions.length > 0) {
                        validationErrors.push(`¿Quisiste decir @${suggestions[0]}?`);
                    }
                }
                break;

            case 'name':
                if (inputValue.length < 2) {
                    validationErrors.push('El nombre debe tener al menos 2 caracteres');
                }
                if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s.-]+$/.test(inputValue)) {
                    validationErrors.push('El nombre solo puede contener letras, espacios, puntos y guiones');
                }
                break;

            case 'phone':
                if (inputValue.length < 9) {
                    validationErrors.push('El teléfono debe tener al menos 9 dígitos');
                }
                if (!/^[0-9]+$/.test(inputValue)) {
                    validationErrors.push('El teléfono solo puede contener números');
                }
                break;

            case 'dni':
                if (inputValue.length !== 8) {
                    validationErrors.push('El DNI debe tener exactamente 8 dígitos');
                }
                if (!/^[0-9]{8}$/.test(inputValue)) {
                    validationErrors.push('El DNI solo puede contener números');
                }
                break;

            case 'number':
                if (!/^-?[0-9]+(\.[0-9]+)?$/.test(inputValue)) {
                    validationErrors.push('Ingresa un número válido');
                }
                break;

            case 'password':
                if (inputValue.length < 6) {
                    validationErrors.push('La contraseña debe tener al menos 6 caracteres');
                }
                break;
        }

        // Validación general de seguridad
        const securityValidation = validateInput(inputValue);
        if (!securityValidation.isValid) {
            validationErrors.push(...securityValidation.errors);
        }

        // Validación personalizada si se proporciona
        if (customValidation && typeof customValidation === 'function') {
            const customResult = customValidation(inputValue);
            if (customResult && !customResult.isValid) {
                validationErrors.push(...(customResult.errors || ['Error de validación personalizada']));
            }
        }

        return validationErrors;
    }

    // Función para sugerir dominios similares
    function getSimilarDomains(domain, validDomains) {
        const suggestions = [];
        const lowerDomain = domain.toLowerCase();
        
        for (const validDomain of validDomains) {
            if (getLevenshteinDistance(lowerDomain, validDomain) <= 2) {
                suggestions.push(validDomain);
            }
        }
        
        return suggestions;
    }

    // Algoritmo de distancia de Levenshtein simplificado
    function getLevenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Watcher para sanitización y validación en tiempo real
    watch(value, (newValue) => {
        isDirty.value = true;
        
        // Sanitizar el valor
        const sanitized = sanitizeByType(newValue, inputType);
        
        // Solo actualizar si el valor cambió después de sanitizar
        if (sanitized !== newValue) {
            value.value = sanitized;
            return; // El watcher se ejecutará nuevamente con el valor sanitizado
        }

        // Validar si está habilitada la validación en tiempo real
        if (realTimeValidation) {
            const validationErrors = validateByType(sanitized, inputType);
            errors.value = validationErrors;
            isValid.value = validationErrors.length === 0;
        }
    });

    // Función para validar manualmente (útil para validación al submit)
    function validate() {
        isDirty.value = true;
        const validationErrors = validateByType(value.value, inputType);
        errors.value = validationErrors;
        isValid.value = validationErrors.length === 0;
        return isValid.value;
    }

    // Función para limpiar errores
    function clearErrors() {
        errors.value = [];
        isValid.value = true;
        isDirty.value = false;
    }

    // Función para resetear el campo
    function reset() {
        value.value = '';
        clearErrors();
    }

    // Computed para el primer error (útil para mostrar en UI)
    const firstError = computed(() => errors.value[0] || '');

    // Computed para clases CSS
    const inputClasses = computed(() => ({
        'p-invalid': isDirty.value && !isValid.value,
        'p-valid': isDirty.value && isValid.value
    }));

    return {
        value,
        errors,
        isValid,
        isDirty,
        firstError,
        inputClasses,
        validate,
        clearErrors,
        reset
    };
}

/**
 * Composable específico para emails con validación avanzada
 */
export function useEmailValidation(options = {}) {
    return useInputValidation('email', {
        required: true,
        realTimeValidation: true,
        ...options
    });
}

/**
 * Composable específico para nombres
 */
export function useNameValidation(options = {}) {
    return useInputValidation('name', {
        required: true,
        maxLength: 100,
        ...options
    });
}

/**
 * Composable específico para teléfonos
 */
export function usePhoneValidation(options = {}) {
    return useInputValidation('phone', {
        required: false,
        maxLength: 15,
        ...options
    });
}

/**
 * Composable específico para DNI
 */
export function useDniValidation(options = {}) {
    return useInputValidation('dni', {
        required: true,
        maxLength: 8,
        ...options
    });
}

/**
 * Composable específico para contraseñas
 */
export function usePasswordValidation(options = {}) {
    return useInputValidation('password', {
        required: true,
        maxLength: 128,
        realTimeValidation: false, // Solo validar al submit para contraseñas
        ...options
    });
}