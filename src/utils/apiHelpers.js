import { processResponse } from '@/composables/useApiResponse';

/**
 * Maneja errores del servidor y actualiza el estado de la store.
 * @param {any} error - La respuesta de error del servidor.
 * @param {object} store - La instancia del store actual.
 */
export function handleProcessError(error, store) {
    const processed = processResponse(error);
    store.message = processed.message || 'Ha ocurrido un error.';
    store.validationErrors = processed.validationErrors || [];
    store.success = false;
}

/**
 * Procesa una respuesta exitosa o parcialmente exitosa del servidor.
 * Actualiza el estado del store con los datos comunes.
 * @param {any} response - La respuesta del servidor.
 * @param {object} store - La instancia del store actual.
 * @returns {object} processed - La respuesta procesada.
 */
export function handleProcessSuccess(response, store) {
    const processed = processResponse(response);
    store.message = processed.message || '';
    store.success = processed.success;
    store.validationErrors = processed.validationErrors || [];
    return processed;
}
