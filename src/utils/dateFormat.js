/**
 * Formatea una fecha ISO del backend en formato corto legible (es-PE).
 */
export function formatRegistrationDate(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';

    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function formatRegistrationTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
