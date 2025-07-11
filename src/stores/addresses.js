import { clientAddressesApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useAddressesStore = defineStore('addressesStore', {
    state: () => ({
        addresses: [],
        currentAddress: null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: []
    }),

    getters: {
        getAddresses: (state) => state.addresses,
        getMainAddress: (state) => state.addresses.find((address) => address.is_main),
        getAddressById: (state) => (id) => state.addresses.find((address) => address.id === id),
        isLoading: (state) => state.loading,
        hasAddresses: (state) => state.addresses.length > 0,
        getError: (state) => state.error,
        getMessage: (state) => state.message
    },

    actions: {
        // Obtener todas las direcciones del cliente
        async fetchAddresses() {
            this.resetState();
            try {
                const response = await clientAddressesApi.getAddresses();
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.addresses = processed.data.addresses || processed.data || [];
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar las direcciones' };
            } finally {
                this.loading = false;
            }
        },

        // Obtener una dirección específica
        async fetchAddressById(id) {
            this.resetState();
            try {
                const response = await clientAddressesApi.getAddressById(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.currentAddress = processed.data.address || processed.data;
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al cargar la dirección' };
            } finally {
                this.loading = false;
            }
        },

        // Crear una nueva dirección
        async createAddress(addressData) {
            this.resetState();
            try {
                const response = await clientAddressesApi.createAddress(addressData);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    const newAddress = processed.data.address || processed.data;
                    this.addresses.push(newAddress);

                    // Si es la primera dirección o se marcó como principal, actualizar el estado
                    if (newAddress.is_main) {
                        this.addresses.forEach((addr) => {
                            addr.is_main = addr.id === newAddress.id;
                        });
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al crear la dirección' };
            } finally {
                this.loading = false;
            }
        },

        // Actualizar una dirección existente
        async updateAddress(id, addressData) {
            this.resetState();
            try {
                const response = await clientAddressesApi.updateAddress(id, addressData);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    const updatedAddress = processed.data.address || processed.data;
                    const index = this.addresses.findIndex((addr) => addr.id === id);

                    if (index !== -1) {
                        this.addresses[index] = updatedAddress;

                        // Si se marcó como principal, actualizar el estado de las demás
                        if (updatedAddress.is_main) {
                            this.addresses.forEach((addr) => {
                                addr.is_main = addr.id === updatedAddress.id;
                            });
                        }
                    }
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al actualizar la dirección' };
            } finally {
                this.loading = false;
            }
        },

        // Eliminar una dirección
        async deleteAddress(id) {
            this.resetState();
            try {
                const response = await clientAddressesApi.deleteAddress(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.addresses = this.addresses.filter((addr) => addr.id !== id);
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al eliminar la dirección' };
            } finally {
                this.loading = false;
            }
        },

        // Establecer una dirección como principal
        async setMainAddress(id) {
            this.resetState();
            try {
                const response = await clientAddressesApi.setMainAddress(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Actualizar el estado de todas las direcciones
                    this.addresses.forEach((addr) => {
                        addr.is_main = addr.id === id;
                    });
                }

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false, message: error.message || 'Error al establecer dirección principal' };
            } finally {
                this.loading = false;
            }
        },

        // Limpiar datos de dirección actual
        clearCurrentAddress() {
            this.currentAddress = null;
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
        }
    }
});
