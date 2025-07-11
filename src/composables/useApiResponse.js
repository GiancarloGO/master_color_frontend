const isDev = import.meta.env.MODE === 'development';

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
        message: response.message,
        data: response.data,
        status: response.status,
        details: response.details,
        validationErrors
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
