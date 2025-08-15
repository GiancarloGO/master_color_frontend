/**
 * Utilidades para sanitización y validación de inputs
 * Previene inyecciones XSS, SQL y limita caracteres
 */

/**
 * Sanitiza una cadena de texto removiendo caracteres potencialmente peligrosos
 * @param {string} input - Texto a sanitizar
 * @param {Object} options - Opciones de configuración
 * @param {number} options.maxLength - Longitud máxima permitida (default: 100 para inputs, 500 para textareas)
 * @param {boolean} options.isTextarea - Si es un textarea (permite más caracteres)
 * @param {boolean} options.allowBasicHtml - Si permite algunos tags HTML básicos como <br>
 * @returns {string} Texto sanitizado
 */
export function sanitizeInput(input, options = {}) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    const {
        maxLength = options.isTextarea ? 500 : 100,
        isTextarea = false,
        allowBasicHtml = false
    } = options;

    let sanitized = input;

    // Remover caracteres de control y no imprimibles (excepto espacios, tabs y saltos de línea)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remover caracteres peligrosos para prevenir XSS y SQL injection
    const dangerousChars = /[<>'"&`${}()[\]\\;|*?~^]/g;
    
    if (!allowBasicHtml) {
        sanitized = sanitized.replace(dangerousChars, '');
    } else {
        // Si permite HTML básico, solo remover los más peligrosos
        sanitized = sanitized.replace(/[<>'"&`${}()[\]\\;|*?~^]/g, (match) => {
            // Permitir algunos caracteres en contextos específicos
            if (match === '<' || match === '>') {
                return ''; // Remover completamente para evitar tags
            }
            return '';
        });
    }

    // Remover múltiples espacios consecutivos
    sanitized = sanitized.replace(/\s{3,}/g, '  ');

    // Remover espacios al inicio y final
    sanitized = sanitized.trim();

    // Aplicar límite de longitud
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Sanitiza input para búsquedas (más permisivo)
 * @param {string} input - Texto de búsqueda
 * @param {number} maxLength - Longitud máxima (default: 50)
 * @returns {string} Texto sanitizado
 */
export function sanitizeSearchInput(input, maxLength = 50) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input;

    // Para búsquedas, ser más permisivo pero aún seguro
    // Remover solo los caracteres más peligrosos
    sanitized = sanitized.replace(/[<>'"&`${}[\]\\;|*?~^]/g, '');
    
    // Permitir guiones, puntos y algunos caracteres especiales comunes en productos
    // Solo remover caracteres de control
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remover múltiples espacios
    sanitized = sanitized.replace(/\s{3,}/g, '  ');

    // Trim y aplicar límite
    sanitized = sanitized.trim();
    
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Sanitiza input para nombres (usuarios, productos, etc.)
 * @param {string} input - Nombre a sanitizar
 * @param {number} maxLength - Longitud máxima (default: 100)
 * @returns {string} Nombre sanitizado
 */
export function sanitizeName(input, maxLength = 100) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input;

    // Para nombres, permitir letras, números, espacios, guiones y algunos acentos
    sanitized = sanitized.replace(/[^a-zA-Z0-9\sáéíóúüñÁÉÍÓÚÜÑ.-]/g, '');
    
    // Remover múltiples espacios
    sanitized = sanitized.replace(/\s{2,}/g, ' ');
    
    // Remover múltiples guiones
    sanitized = sanitized.replace(/-{2,}/g, '-');

    // Trim y aplicar límite
    sanitized = sanitized.trim();
    
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Sanitiza input para emails
 * @param {string} input - Email a sanitizar
 * @returns {string} Email sanitizado
 */
export function sanitizeEmail(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input;

    // Para emails, solo permitir caracteres válidos de email
    sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, '');
    
    // Trim y límite de 254 caracteres (RFC estándar)
    sanitized = sanitized.trim();
    
    if (sanitized.length > 254) {
        sanitized = sanitized.substring(0, 254);
    }

    return sanitized;
}

/**
 * Sanitiza input para números/precios
 * @param {string} input - Número a sanitizar
 * @param {boolean} allowDecimals - Si permite decimales (default: true)
 * @returns {string} Número sanitizado
 */
export function sanitizeNumber(input, allowDecimals = true) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input;

    if (allowDecimals) {
        // Permitir solo números, punto decimal y guión para negativos
        sanitized = sanitized.replace(/[^0-9.-]/g, '');
    } else {
        // Solo números enteros
        sanitized = sanitized.replace(/[^0-9-]/g, '');
    }

    // Trim
    sanitized = sanitized.trim();

    return sanitized;
}

/**
 * Sanitiza contenido de textarea (más permisivo en longitud)
 * @param {string} input - Contenido del textarea
 * @param {number} maxLength - Longitud máxima (default: 1000)
 * @returns {string} Contenido sanitizado
 */
export function sanitizeTextarea(input, maxLength = 1000) {
    return sanitizeInput(input, {
        maxLength,
        isTextarea: true,
        allowBasicHtml: false
    });
}

/**
 * Valida que un input no contenga patrones sospechosos
 * @param {string} input - Texto a validar
 * @returns {Object} Resultado de validación {isValid: boolean, errors: string[]}
 */
export function validateInput(input) {
    const errors = [];
    
    if (!input || typeof input !== 'string') {
        return { isValid: true, errors: [] };
    }

    // Detectar patrones de SQL injection
    const sqlPatterns = [
        /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b)/i,
        /(\bor\b|\band\b)\s*['"]?\s*[\w\s]*['"]?\s*=\s*['"]?\s*[\w\s]*['"]?/i,
        /['"];\s*(\bdrop\b|\bdelete\b|\binsert\b)/i,
        /--|\#|\/\*/
    ];

    // Detectar patrones de XSS
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe\b/i,
        /<object\b/i,
        /<embed\b/i,
        /<form\b/i
    ];

    // Verificar SQL injection
    for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
            errors.push('Contiene patrones sospechosos de SQL injection');
            break;
        }
    }

    // Verificar XSS
    for (const pattern of xssPatterns) {
        if (pattern.test(input)) {
            errors.push('Contiene patrones sospechosos de XSS');
            break;
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}