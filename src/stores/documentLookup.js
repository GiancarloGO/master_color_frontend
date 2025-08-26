import { documentLookupApi } from '@/api';
import { defineStore } from 'pinia';

export const useDocumentLookupStore = defineStore('documentLookup', {
    state: () => ({
        loading: false,
        documentData: null,
        error: null,
        lastLookupType: null,
        lastLookupDocument: null
    }),

    actions: {
        async lookupDocument(type, document) {
            this.loading = true;
            this.error = null;
            this.documentData = null;

            try {
                const payload = {
                    type: type.toLowerCase(),
                    document: document.trim()
                };

                const response = await documentLookupApi.lookupDocument(payload);

                console.log('Response from document lookup API:', response);

                // Basándose en los logs, response ya es la respuesta completa
                // y response.data son los datos del documento
                console.log('Response.data (document data):', response.data);

                if (response && response.success) {
                    // Verificar si los datos están vacíos o son un array vacío
                    const hasValidData = response.data && 
                        (typeof response.data === 'object' && !Array.isArray(response.data) && Object.keys(response.data).length > 0) ||
                        (Array.isArray(response.data) && response.data.length > 0);

                    if (hasValidData) {
                        this.documentData = response.data;
                        this.lastLookupType = type;
                        this.lastLookupDocument = document;

                        console.log('Document data set in store:', this.documentData);
                        return {
                            success: true,
                            data: response.data,
                            message: response.message
                        };
                    } else {
                        // Datos vacíos - DNI/RUC no encontrado
                        const documentTypeLabel = type.toUpperCase();
                        const notFoundMessage = `${documentTypeLabel} no encontrado en los registros oficiales`;
                        this.error = notFoundMessage;
                        return {
                            success: false,
                            message: notFoundMessage,
                            errors: {}
                        };
                    }
                } else {
                    this.error = response?.message || 'Error al consultar el documento';
                    return {
                        success: false,
                        message: response?.message || 'Error al consultar el documento',
                        errors: {}
                    };
                }
            } catch (error) {
                let errorMessage = 'Error interno del servidor al consultar el documento';

                if (error.response) {
                    // Manejo específico para diferentes códigos de estado HTTP
                    switch (error.response.status) {
                        case 404:
                            // Si es 404, verificar si hay datos en la respuesta
                            if (error.response.data && error.response.data.success) {
                                const documentTypeLabel = type.toUpperCase();
                                errorMessage = `${documentTypeLabel} no encontrado en los registros oficiales`;
                            } else {
                                errorMessage = error.response.data?.message || `${type.toUpperCase()} no encontrado`;
                            }
                            break;
                        case 400:
                            errorMessage = error.response.data?.message || `Formato de ${type.toUpperCase()} inválido`;
                            break;
                        case 422:
                            errorMessage = error.response.data?.message || `Datos de ${type.toUpperCase()} inválidos`;
                            break;
                        case 429:
                            errorMessage = 'Demasiadas consultas. Por favor intenta nuevamente en unos momentos';
                            break;
                        case 500:
                        case 502:
                        case 503:
                        case 504:
                            errorMessage = 'Servicio de consulta temporalmente no disponible. Intenta nuevamente';
                            break;
                        default:
                            errorMessage = error.response.data?.message || errorMessage;
                    }
                    this.error = errorMessage;
                } else if (error.request) {
                    // Error de red/conectividad
                    errorMessage = 'No se pudo conectar con el servicio de consulta. Verifica tu conexión';
                    this.error = errorMessage;
                } else {
                    this.error = errorMessage;
                }

                console.error('Error en consulta de documento:', {
                    type,
                    document,
                    status: error.response?.status,
                    error: error.response?.data || error.message
                });

                return {
                    success: false,
                    message: errorMessage,
                    errors: {}
                };
            } finally {
                this.loading = false;
            }
        },

        // Helper para obtener datos formateados según el tipo de documento
        getFormattedData() {
            if (!this.documentData) return null;

            if (this.lastLookupType === 'dni') {
                return {
                    type: 'dni',
                    document: this.documentData.dni,
                    fullName: this.documentData.nombre_completo,
                    firstName: this.documentData.nombres,
                    paternalSurname: this.documentData.apellido_paterno,
                    maternalSurname: this.documentData.apellido_materno,
                    verificationCode: this.documentData.codigo_verifica
                };
            } else if (this.lastLookupType === 'ruc') {
                return {
                    type: 'ruc',
                    document: this.documentData.ruc,
                    businessName: this.documentData.razon_social,
                    tradeName: this.documentData.nombre_comercial,
                    phones: this.documentData.telefonos || [],
                    status: this.documentData.estado,
                    condition: this.documentData.condicion,
                    address: this.documentData.direccion,
                    department: this.documentData.departamento,
                    province: this.documentData.provincia,
                    district: this.documentData.distrito,
                    ubigeo: this.documentData.ubigeo,
                    capital: this.documentData.capital,
                    fullAddress: this.documentData.direccion_completa
                };
            }

            return null;
        },

        // Validar formato de documento antes de consultar
        validateDocumentFormat(type, document) {
            const cleanDocument = document.trim();

            if (type === 'dni') {
                if (!/^\d{8}$/.test(cleanDocument)) {
                    return {
                        valid: false,
                        message: 'El DNI debe tener exactamente 8 dígitos'
                    };
                }
            } else if (type === 'ruc') {
                if (!/^\d{11}$/.test(cleanDocument)) {
                    return {
                        valid: false,
                        message: 'El RUC debe tener exactamente 11 dígitos'
                    };
                }
            } else {
                return {
                    valid: false,
                    message: 'Tipo de documento no válido'
                };
            }

            return { valid: true };
        },

        // Limpiar datos del store
        clearData() {
            this.documentData = null;
            this.error = null;
            this.lastLookupType = null;
            this.lastLookupDocument = null;
        },

        // Reset loading state
        resetLoading() {
            this.loading = false;
        }
    },

    getters: {
        // Verificar si hay datos disponibles
        hasData: (state) => state.documentData !== null,

        // Verificar si la última consulta fue exitosa
        isLastLookupSuccessful: (state) => state.documentData !== null && state.error === null,

        // Obtener el nombre completo según el tipo de documento
        getDisplayName: (state) => {
            if (!state.documentData) return '';

            if (state.lastLookupType === 'dni') {
                return state.documentData.nombre_completo || '';
            } else if (state.lastLookupType === 'ruc') {
                return state.documentData.razon_social || '';
            }

            return '';
        },

        // Obtener teléfono principal (útil para RUC)
        getPrimaryPhone: (state) => {
            if (state.lastLookupType === 'ruc' && state.documentData?.telefonos?.length > 0) {
                return state.documentData.telefonos[0];
            }
            return '';
        }
    }
});
