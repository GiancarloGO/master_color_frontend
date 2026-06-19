import { auditLogsApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useAuditLogsStore = defineStore('auditLogsStore', {
    state: () => ({
        logs: [],
        currentLog: null,
        loading: false,
        error: null,
        success: false,
        message: '',
        pagination: {
            currentPage: 1,
            lastPage: 1,
            perPage: 50,
            total: 0
        }
    }),

    getters: {
        getLogs: (state) => state.logs,
        isLoading: (state) => state.loading,
        getPagination: (state) => state.pagination
    },

    actions: {
        async fetchLogs(params = {}) {
            this.loading = true;
            this.error = null;
            try {
                const response = await auditLogsApi.getAuditLogs(params);
                const processed = handleProcessSuccess(response, this);
                if (processed.success) {
                    this.logs = processed.data || [];
                    const p = processed.pagination || {};
                    this.pagination = {
                        currentPage: p.current_page || 1,
                        lastPage: p.last_page || 1,
                        perPage: p.per_page || 50,
                        total: p.total || 0
                    };
                }
                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false };
            } finally {
                this.loading = false;
            }
        },

        async fetchLogById(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await auditLogsApi.getAuditLogById(id);
                const processed = handleProcessSuccess(response, this);
                if (processed.success) {
                    this.currentLog = processed.data;
                }
                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                return { success: false };
            } finally {
                this.loading = false;
            }
        }
    }
});
