const isDev = import.meta.env.MODE === 'development';

/**
 * Filtra mensajes de error que contienen información sensible de base de datos
 * @param {string} message - Mensaje de error original
 * @returns {string} - Mensaje filtrado y amigable
 */
function filterDatabaseError(message) {
    if (!message || typeof message !== 'string') {
        return 'Ha ocurrido un error inesperado';
    }

    const msg = message.toLowerCase();
    
    // Detectar errores de base de datos comunes
    if (msg.includes('sqlstate') || msg.includes('not null violation') || msg.includes('connection: pgsql')) {
        // Extraer información útil sin exponer detalles técnicos
        if (msg.includes('reference') && msg.includes('not null')) {
            return 'La referencia de dirección es requerida';
        }
        if (msg.includes('not null violation')) {
            return 'Faltan campos requeridos en el formulario';
        }
        if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
            return 'Ya existe un registro con esta información';
        }
        if (msg.includes('foreign key constraint')) {
            return 'Error de integridad de datos';
        }
        return 'Error al procesar la información. Por favor intenta nuevamente';
    }
    
    // Detectar errores de validación largos y técnicos
    if (message.length > 200 && (msg.includes('error:') || msg.includes('detail:'))) {
        return 'Error de validación. Por favor revisa los datos ingresados';
    }
    
    return message;
}

export function processResponse(response) {
    let validationErrors = [];

    if (response && response.details) {
        if (Array.isArray(response.details.validationErrors)) {
            validationErrors = response.details.validationErrors;
        } else if (Array.isArray(response.details.errors)) {
            validationErrors = response.details.errors;
        } else if (Array.isArray(response.details)) {
            validationErrors = response.details;
        }
    }
    if (response && response.validationErrors && Array.isArray(response.validationErrors)) {
        console.log(response.validationErrors);
        validationErrors = response.validationErrors.map((err) => (typeof err === 'string' ? err.toUpperCase() : err));
    }

    if (!response || typeof response !== 'object') {
        return {
            success: false,
            message: 'Respuesta inesperada del servidor.',
            data: null,
            status: 500,
            details: null,
            validationErrors: []
        };
    }

    if (isDev && response.details && response.validationErrors) {
        console.error('Detalles técnicos:', response.details);
        console.error('validationErrors', validationErrors);
    }

    return {
        success: response.success,
        message: filterDatabaseError(response.message),
        data: response.data,
        status: response.status,
        details: response.details,
        validationErrors: validationErrors.map(err => filterDatabaseError(err))
    };
}

// Opcional: helpers para usar en stores
export function handleProcessSuccess(res, store) {
    const processed = processResponse(res);
    store.message = processed.message;
    store.success = processed.success;
    store.validationErrors = processed.validationErrors;
    return processed;
}

export function handleProcessError(error, store) {
    const processed = processResponse(error);
    store.message = processed.message;
    store.success = false;
    store.validationErrors = processed.validationErrors;
    return processed;
}
