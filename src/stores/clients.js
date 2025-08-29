import { defineStore } from 'pinia';
import { clientsApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';

export const useClientsStore = defineStore('clientsStore', {
    state: () => ({
        clients: [],
        deletedClients: [],
        currentClient: null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: [],
        pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0,
            from: 1,
            to: 15
        },
        filters: {
            search: '',
            client_type: '',
            document_type: '',
            verified: undefined,
            per_page: 15
        }
    }),

    getters: {
        clientsList: (state) => state.clients,
        deletedClientsList: (state) => state.deletedClients,
        getCurrentClient: (state) => state.currentClient,
        getClientById: (state) => (id) => state.clients.find(client => client.id === id),
        isLoading: (state) => state.loading,
        hasClients: (state) => state.clients.length > 0,
        hasDeletedClients: (state) => state.deletedClients.length > 0,
        getError: (state) => state.error,
        getMessage: (state) => state.message,
        getPagination: (state) => state.pagination,
        getFilters: (state) => state.filters,
        
        // Filtros específicos
        getIndividualClients: (state) => state.clients.filter(client => client.client_type === 'individual'),
        getCompanyClients: (state) => state.clients.filter(client => client.client_type === 'company'),
        getVerifiedClients: (state) => state.clients.filter(client => client.email_verified_at),
        getUnverifiedClients: (state) => state.clients.filter(client => !client.email_verified_at),
        
        // Estadísticas
        getTotalClientsCount: (state) => state.pagination.total,
        getIndividualClientsCount: (state) => state.clients.filter(client => client.client_type === 'individual').length,
        getCompanyClientsCount: (state) => state.clients.filter(client => client.client_type === 'company').length,
        getVerifiedClientsCount: (state) => state.clients.filter(client => client.email_verified_at).length
    },

    actions: {
        // Obtener todos los clientes con filtros
        async fetchClients(params = {}) {
            this.resetState();
            try {
                const queryParams = { ...this.filters, ...params };
                const response = await clientsApi.getClients(queryParams);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    if (processed.data.clients) {
                        this.clients = processed.data.clients;
                        if (processed.data.pagination) {
                            this.pagination = processed.data.pagination;
                        }
                    } else {
                        this.clients = processed.data || [];
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar los clientes' };
            } finally {
                this.loading = false;
            }
        },

        // Obtener un cliente específico
        async fetchClientById(id) {
            this.resetState();
            try {
                const response = await clientsApi.getClientById(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.currentClient = processed.data;
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar el cliente' };
            } finally {
                this.loading = false;
            }
        },

        // Crear un nuevo cliente
        async createClient(clientData) {
            this.resetState();
            try {
                const response = await clientsApi.createClient(clientData);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Agregar el nuevo cliente a la lista
                    this.clients.unshift(processed.data);
                    this.pagination.total += 1;
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al crear el cliente' };
            } finally {
                this.loading = false;
            }
        },

        // Actualizar un cliente existente
        async updateClient(id, clientData) {
            this.resetState();
            try {
                const response = await clientsApi.updateClient(id, clientData);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Actualizar el cliente en la lista
                    const index = this.clients.findIndex(client => client.id === id);
                    if (index !== -1) {
                        this.clients[index] = { ...this.clients[index], ...processed.data };
                    }
                    
                    // Actualizar cliente actual si coincide
                    if (this.currentClient && this.currentClient.id === id) {
                        this.currentClient = { ...this.currentClient, ...processed.data };
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al actualizar el cliente' };
            } finally {
                this.loading = false;
            }
        },

        // Eliminar un cliente (soft delete)
        async deleteClient(id) {
            this.resetState();
            try {
                const response = await clientsApi.deleteClient(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Remover el cliente de la lista
                    this.clients = this.clients.filter(client => client.id !== id);
                    this.pagination.total -= 1;
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al eliminar el cliente' };
            } finally {
                this.loading = false;
            }
        },

        // Obtener clientes eliminados
        async fetchDeletedClients(params = {}) {
            this.resetState();
            try {
                const response = await clientsApi.getDeletedClients(params);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    if (processed.data.clients) {
                        this.deletedClients = processed.data.clients;
                        if (processed.data.pagination) {
                            this.pagination = processed.data.pagination;
                        }
                    } else {
                        this.deletedClients = processed.data || [];
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar clientes eliminados' };
            } finally {
                this.loading = false;
            }
        },

        // Restaurar un cliente eliminado
        async restoreClient(id) {
            this.resetState();
            try {
                const response = await clientsApi.restoreClient(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Remover de la lista de eliminados si está presente
                    this.deletedClients = this.deletedClients.filter(client => client.id !== id);
                    // Agregar a la lista principal
                    if (processed.data) {
                        this.clients.unshift(processed.data);
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al restaurar el cliente' };
            } finally {
                this.loading = false;
            }
        },

        // Eliminar permanentemente un cliente
        async forceDeleteClient(id) {
            this.resetState();
            try {
                const response = await clientsApi.forceDeleteClient(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Remover de todas las listas
                    this.deletedClients = this.deletedClients.filter(client => client.id !== id);
                    this.clients = this.clients.filter(client => client.id !== id);
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al eliminar permanentemente el cliente' };
            } finally {
                this.loading = false;
            }
        },

        // Cambiar estado de verificación
        async toggleClientVerification(id) {
            this.resetState();
            try {
                const response = await clientsApi.toggleVerification(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Actualizar el cliente en la lista
                    const index = this.clients.findIndex(client => client.id === id);
                    if (index !== -1) {
                        this.clients[index] = { ...this.clients[index], ...processed.data };
                    }
                    
                    // Actualizar cliente actual si coincide
                    if (this.currentClient && this.currentClient.id === id) {
                        this.currentClient = { ...this.currentClient, ...processed.data };
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cambiar verificación del cliente' };
            } finally {
                this.loading = false;
            }
        },

        // Actualizar filtros
        updateFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
        },

        // Limpiar filtros
        clearFilters() {
            this.filters = {
                search: '',
                client_type: '',
                document_type: '',
                verified: undefined,
                per_page: 15
            };
        },

        // Limpiar cliente actual
        clearCurrentClient() {
            this.currentClient = null;
        },

        // Reiniciar estado
        resetState() {
            this.loading = true;
            this.error = null;
            this.success = false;
            this.message = '';
            this.validationErrors = [];
        },

        // Limpiar errores
        clearErrors() {
            this.error = null;
            this.validationErrors = [];
        },

        // Utilidades para tipos de cliente
        getClientTypeLabel(type) {
            const typeMap = {
                individual: 'Persona Natural',
                company: 'Empresa'
            };
            return typeMap[type] || type;
        },

        getDocumentTypeLabel(type) {
            const typeMap = {
                DNI: 'DNI',
                RUC: 'RUC',
                CE: 'Carnet de Extranjería',
                PASAPORTE: 'Pasaporte'
            };
            return typeMap[type] || type;
        },

        // Utilidad para formatear fecha de verificación
        formatVerificationDate(date) {
            if (!date) return null;
            return new Date(date).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
});