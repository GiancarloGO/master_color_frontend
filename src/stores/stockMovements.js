import { stockMovementsApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useStockMovementsStore = defineStore('stockMovementsStore', {
    state: () => ({
        stockMovementsList: cache.getItem('stockMovementsList') || [],
        stockMovement: cache.getItem('stockMovement') || null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: []
    }),

    getters: {
        getStockMovementsCount: (state) => state.stockMovementsList.length,
        getMovementsByType: (state) => (type) => state.stockMovementsList.filter((movement) => movement.movement_type === type),
        findStockMovementById: (state) => (id) => state.stockMovementsList.find((movement) => movement.id === id),
        getTotalValue: (state) => state.stockMovementsList.reduce((total, movement) => total + (movement.total_value || 0), 0),
        getRecentMovements:
            (state) =>
            (limit = 5) =>
                state.stockMovementsList.slice(0, limit)
    },

    actions: {
        async fetchStockMovements() {
            this.loading = true;
            this.error = null;
            try {
                const response = await stockMovementsApi.getStockMovements();
                const processed = handleProcessSuccess(response, this);
                this.stockMovementsList = processed.data.stock_movements || processed.data || [];
                cache.setItem('stockMovementsList', this.stockMovementsList);
                this.success = true;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async getStockMovementById(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await stockMovementsApi.getStockMovementById(id);
                const processed = handleProcessSuccess(response, this);
                this.stockMovement = processed.data.stock_movement || processed.data;
                cache.setItem('stockMovement', this.stockMovement);
                this.success = true;
                return this.stockMovement;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async createStockMovement(payload) {
            this.loading = true;
            this.error = null;
            this.validationErrors = [];
            try {
                const response = await stockMovementsApi.createStockMovement(payload);
                const processed = handleProcessSuccess(response, this);
                const newStockMovement = processed.data.stock_movement || processed.data;

                // Add the new stock movement to the list
                this.stockMovementsList.unshift(newStockMovement);
                this.stockMovement = newStockMovement;

                cache.setItem('stockMovementsList', this.stockMovementsList);
                cache.setItem('stockMovement', this.stockMovement);
                this.success = true;
                this.message = 'Movimiento de stock creado exitosamente';

                return newStockMovement;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateStockMovement(id, payload) {
            this.loading = true;
            this.error = null;
            this.validationErrors = [];
            try {
                const response = await stockMovementsApi.updateStockMovement(id, payload);
                const processed = handleProcessSuccess(response, this);
                const updatedStockMovement = processed.data.stock_movement || processed.data;

                // Update the stock movement in the list
                const index = this.stockMovementsList.findIndex((movement) => movement.id == id);
                if (index !== -1) {
                    this.stockMovementsList[index] = updatedStockMovement;
                }

                this.stockMovement = updatedStockMovement;

                cache.setItem('stockMovementsList', this.stockMovementsList);
                cache.setItem('stockMovement', this.stockMovement);
                this.success = true;
                this.message = 'Movimiento de stock actualizado exitosamente';

                return updatedStockMovement;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteStockMovement(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await stockMovementsApi.deleteStockMovement(id);
                const processed = handleProcessSuccess(response, this);

                // Remove the stock movement from the list
                this.stockMovementsList = this.stockMovementsList.filter((movement) => movement.id != id);

                // Clear current stock movement if it was the deleted one
                if (this.stockMovement && this.stockMovement.id == id) {
                    this.stockMovement = null;
                    cache.removeItem('stockMovement');
                }

                cache.setItem('stockMovementsList', this.stockMovementsList);
                this.success = true;
                this.message = 'Movimiento de stock eliminado exitosamente';

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async cancelStockMovement(id) {
            this.loading = true;
            this.error = null;
            this.validationErrors = [];
            try {
                const response = await stockMovementsApi.cancelStockMovement(id);
                const processed = handleProcessSuccess(response, this);

                // El backend devuelve tanto el movimiento original cancelado como el nuevo movimiento de anulación
                const result = processed.data;

                // Actualizar el movimiento original en la lista (marcado como cancelado)
                const originalIndex = this.stockMovementsList.findIndex((movement) => movement.id == id);
                if (originalIndex !== -1 && result.original_movement) {
                    this.stockMovementsList[originalIndex] = result.original_movement;
                }

                // Agregar el nuevo movimiento de anulación al inicio de la lista
                if (result.cancellation_movement) {
                    this.stockMovementsList.unshift(result.cancellation_movement);
                }

                cache.setItem('stockMovementsList', this.stockMovementsList);
                this.success = true;
                this.message = result.message || 'Movimiento cancelado exitosamente';

                return result;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        resetState() {
            this.error = null;
            this.success = false;
            this.message = '';
            this.validationErrors = [];
        },

        clearStockMovement() {
            this.stockMovement = null;
            cache.removeItem('stockMovement');
        }
    }
});
