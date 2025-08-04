<script setup>
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

// Stores y servicios
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

// Estado reactivo
const loading = ref(true);
const showPasswordDialog = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordLoading = ref(false);
const passwordError = ref('');

// Datos computados
const user = computed(() => authStore.currentUser);

// Ciclo de vida
onMounted(async () => {
    if (!authStore.isAuthenticated) {
        try {
            await authStore.me();
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
        }
    }
    loading.value = false;
});

// Métodos
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

const getDaysActive = () => {
    if (!user.value?.created_at) return 0;
    const createdDate = new Date(user.value.created_at);
    const today = new Date();
    const diffTime = Math.abs(today - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const goToLogin = () => {
    router.push('/auth/login');
};

const changePassword = () => {
    showPasswordDialog.value = true;
    passwordError.value = '';
};

const cancelPasswordChange = () => {
    showPasswordDialog.value = false;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    passwordError.value = '';
};

const submitPasswordChange = async () => {
    // Validar campos
    passwordError.value = '';

    if (!currentPassword.value) {
        passwordError.value = 'La contraseña actual es requerida';
        return;
    }

    if (!newPassword.value) {
        passwordError.value = 'La nueva contraseña es requerida';
        return;
    }

    if (newPassword.value.length < 8) {
        passwordError.value = 'La contraseña debe tener al menos 8 caracteres';
        return;
    }

    if (newPassword.value !== confirmPassword.value) {
        passwordError.value = 'Las contraseñas no coinciden';
        return;
    }

    passwordLoading.value = true;

    try {
        const result = await authStore.changePassword({
            current_password: currentPassword.value,
            password: newPassword.value,
            password_confirmation: confirmPassword.value
        });

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Contraseña actualizada',
                detail: 'Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login.',
                life: 5000
            });

            showPasswordDialog.value = false;
            currentPassword.value = '';
            newPassword.value = '';
            confirmPassword.value = '';

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } else {
            passwordError.value = result.message || 'Error al cambiar la contraseña';
        }
    } catch (error) {
        passwordError.value = error.message || 'Error al cambiar la contraseña';
    } finally {
        passwordLoading.value = false;
    }
};
</script>

<template>
    <div class="profile-container">
        <!-- Diálogo de cambio de contraseña -->
        <Dialog v-model:visible="showPasswordDialog" modal header="Cambiar Contraseña" :style="{ width: '450px' }" :closable="!passwordLoading">
            <div class="password-dialog-content">
                <div v-if="passwordError" class="p-4 mb-4 border-round bg-red-50">
                    <div class="flex align-items-center">
                        <i class="pi pi-times-circle text-red-500 mr-3 text-xl"></i>
                        <div class="text-red-700">{{ passwordError }}</div>
                    </div>
                </div>

                <div class="field mb-4">
                    <label for="currentPassword" class="block text-900 font-medium mb-2">Contraseña actual</label>
                    <Password id="currentPassword" v-model="currentPassword" class="w-full" :feedback="false" :toggle-mask="true" placeholder="Ingresa tu contraseña actual" fluid />
                </div>

                <div class="field mb-4">
                    <label for="newPassword" class="block text-900 font-medium mb-2">Nueva contraseña</label>
                    <Password id="newPassword" v-model="newPassword" class="w-full" :feedback="true" :toggle-mask="true" placeholder="Ingresa tu nueva contraseña" fluid />
                </div>

                <div class="field mb-4">
                    <label for="confirmPassword" class="block text-900 font-medium mb-2">Confirmar contraseña</label>
                    <Password id="confirmPassword" v-model="confirmPassword" class="w-full" :feedback="false" :toggle-mask="true" placeholder="Confirma tu nueva contraseña" fluid />
                </div>

                <div class="mt-4">
                    <div class="flex flex-column md:flex-row justify-content-center align-items-center gap-3">
                        <Button label="Cancelar" icon="pi pi-times" class="p-button-outlined p-button-secondary w-full md:w-auto" :disabled="passwordLoading" @click="cancelPasswordChange" />
                        <Button label="Cambiar contraseña" icon="pi pi-check" class="p-button-primary w-full md:w-auto" :loading="passwordLoading" @click="submitPasswordChange" />
                    </div>
                </div>
            </div>
        </Dialog>
        
        <!-- Header del Perfil -->
        <div class="profile-header">
            <div class="banner-section">
                <div class="banner-gradient">
                    <div class="profile-info-header">
                        <div class="user-details">
                            <h1 class="user-name">{{ user?.name || 'Usuario' }}</h1>
                            <p class="user-email">{{ user?.email || 'email@ejemplo.com' }}</p>
                            <div class="status-badges">
                                <Tag
                                    :value="user?.email_verified_at ? 'Verificado' : 'Sin verificar'"
                                    :severity="user?.email_verified_at ? 'success' : 'warning'"
                                    :icon="user?.email_verified_at ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"
                                    class="status-tag"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <ProgressSpinner />
            <p class="loading-text">Cargando información del perfil...</p>
        </div>

        <!-- Main Content -->
        <div v-else-if="user" class="profile-content">
            <div class="grid">
                <!-- Información Personal -->
                <div class="col-12">
                    <div class="info-card">
                        <div class="card-header">
                            <h3><i class="pi pi-user mr-2"></i>Información Personal</h3>
                            <Button icon="pi pi-lock" label="Cambiar Contraseña" class="p-button-outlined p-button-sm" @click="changePassword" />
                        </div>
                        <Divider class="my-3" />

                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">
                                    <i class="pi pi-user"></i>
                                    <span>Nombre completo</span>
                                </div>
                                <div class="info-value">{{ user.name }}</div>
                            </div>

                            <div class="info-item">
                                <div class="info-label">
                                    <i class="pi pi-envelope"></i>
                                    <span>Correo electrónico</span>
                                </div>
                                <div class="info-value">{{ user.email }}</div>
                            </div>

                            <div v-if="user.created_at" class="info-item">
                                <div class="info-label">
                                    <i class="pi pi-calendar"></i>
                                    <span>Miembro desde</span>
                                </div>
                                <div class="info-value">{{ formatDate(user.created_at) }}</div>
                            </div>

                            <div v-if="user.role_name" class="info-item">
                                <div class="info-label">
                                    <i class="pi pi-shield"></i>
                                    <span>Rol</span>
                                </div>
                                <div class="info-value">{{ user.role_name }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Estadísticas Básicas -->
                    <div class="stats-card">
                        <h3><i class="pi pi-chart-line mr-2"></i>Estadísticas</h3>
                        <Divider class="my-3" />
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-number">{{ getDaysActive() }}</div>
                                <div class="stat-label">Días registrado</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">{{ user?.email_verified_at ? 'Sí' : 'No' }}</div>
                                <div class="stat-label">Email verificado</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estado de error -->
        <div v-else class="error-state">
            <div class="error-content">
                <i class="pi pi-user-minus error-icon"></i>
                <h3>No se pudo cargar el perfil</h3>
                <p>Parece que hay un problema con tu sesión. Por favor, inicia sesión nuevamente.</p>
                <Button label="Iniciar Sesión" icon="pi pi-sign-in" class="p-button-primary mt-3" @click="goToLogin" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem;
    background-color: var(--surface-ground);
    min-height: calc(100vh - 6rem);
    color: var(--text-color);
}

/* Header Section */
.profile-header {
    margin-bottom: 2rem;
}

.banner-section {
    position: relative;
    height: 120px;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.banner-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--primary-color, #4f46e5) 0%, #3730a3 100%);
}

.profile-info-header {
    display: flex;
    align-items: center;
    padding: 0 2rem;
    height: 100%;
}

.user-name {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0 0 0.25rem 0;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.user-email {
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.status-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.status-tag {
    font-weight: 600;
    font-size: 0.85rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Loading State */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
}

.loading-text {
    margin-top: 1rem;
    color: var(--text-color-secondary);
}

/* Content Cards */
.profile-content {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(15px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.info-card,
.stats-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--surface-border);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;
}

.card-header h3 {
    margin: 0;
    color: var(--text-color);
    font-weight: 700;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
}

.card-header h3 i {
    color: var(--primary-color);
    font-size: 1.4rem;
}

/* Info Grid */
.info-grid {
    display: grid;
    gap: 1rem;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--surface-hover);
    border-radius: 8px;
    transition: all 0.2s ease;
}

.info-item:hover {
    background: var(--surface-card);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-color-secondary);
    font-weight: 500;
}

.info-label i {
    color: var(--primary-color);
    font-size: 1.1rem;
}

.info-value {
    font-weight: 600;
    color: var(--text-color);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
}

.stat-item {
    text-align: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, var(--primary-color, #4f46e5) 0%, #3730a3 100%);
    border-radius: 12px;
    color: white;
    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.2);
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

/* Password Dialog */
.password-dialog-content {
    padding: 1rem 0;
}

.password-dialog-content .field {
    margin-bottom: 1rem;
}

.password-dialog-content label {
    color: var(--text-color);
    font-weight: 600;
}

/* Error State */
.error-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    padding: 2rem;
}

.error-content {
    text-align: center;
    max-width: 400px;
}

.error-icon {
    font-size: 4rem;
    color: #dc3545;
    margin-bottom: 1.5rem;
}

.error-content h3 {
    color: var(--text-color);
    margin-bottom: 1rem;
}

.error-content p {
    color: var(--text-color-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
    .profile-container {
        padding: 1rem;
    }
    
    .profile-info-header {
        padding: 0 1rem;
    }

    .user-name {
        font-size: 1.5rem;
    }

    .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
</style>