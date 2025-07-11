<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

// Stores y servicios
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

// Estado reactivo
const loading = ref(true);
const verificationLoading = ref(false);
const twoFactorEnabled = ref(false);
const securityNotifications = ref(true);
const showPasswordDialog = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordLoading = ref(false);
const passwordError = ref('');
const isDarkMode = ref(false);

// Datos computados
const user = computed(() => authStore.currentUser);

// Actividad reciente
const recentActivity = ref([
    { title: 'Perfil actualizado', time: 'Hace 2 días' },
    { title: 'Contraseña cambiada', time: 'Hace 1 semana' },
    { title: 'Inicio de sesión', time: 'Hace 2 semanas' }
]);

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

    // Detectar modo oscuro del sistema
    isDarkMode.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Escuchar cambios en el modo oscuro del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        isDarkMode.value = event.matches;
    });
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

const editProfile = () => {
    toast.add({
        severity: 'info',
        summary: 'Editar Perfil',
        detail: 'Redirigiendo al editor de perfil...',
        life: 3000
    });
};

const editAvatar = () => {
    toast.add({
        severity: 'info',
        summary: 'Cambiar Avatar',
        detail: 'Función de cambio de avatar próximamente',
        life: 3000
    });
};

const changePassword = () => {
    showPasswordDialog.value = true;
};

const configureNotifications = () => {
    toast.add({
        severity: 'info',
        summary: 'Notificaciones',
        detail: 'Abriendo configuración de notificaciones...',
        life: 3000
    });
};

const toggleTwoFactor = () => {
    toast.add({
        severity: twoFactorEnabled.value ? 'success' : 'info',
        summary: '2FA ' + (twoFactorEnabled.value ? 'Activado' : 'Desactivado'),
        detail: twoFactorEnabled.value ? 'La autenticación de dos factores está activa' : 'La autenticación de dos factores ha sido desactivada',
        life: 4000
    });
};

const openSettings = () => {
    toast.add({
        severity: 'info',
        summary: 'Configuración',
        detail: 'Abriendo panel de configuración...',
        life: 3000
    });
};

const shareProfile = () => {
    toast.add({
        severity: 'success',
        summary: 'Enlace copiado',
        detail: 'El enlace de tu perfil ha sido copiado al portapapeles',
        life: 3000
    });
};

const resendVerification = async () => {
    try {
        verificationLoading.value = true;
        const result = await authStore.resendVerificationEmail();
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Email enviado',
                detail: 'Se ha enviado un correo de verificación a tu email',
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo enviar el correo de verificación',
            life: 5000
        });
    } finally {
        verificationLoading.value = false;
    }
};

const goToLogin = () => {
    router.push('/auth/login');
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
        // Aquí iría la llamada a la API para cambiar la contraseña
        // Por ahora simulamos una respuesta exitosa
        await new Promise((resolve) => setTimeout(resolve, 1500));

        toast.add({
            severity: 'success',
            summary: 'Contraseña actualizada',
            detail: 'Tu contraseña ha sido cambiada exitosamente',
            life: 5000
        });

        showPasswordDialog.value = false;
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';

        // Actualizar la actividad reciente
        recentActivity.value = [{ title: 'Contraseña cambiada', time: 'Justo ahora' }, ...recentActivity.value.slice(0, 2)];
    } catch (error) {
        passwordError.value = error.message || 'Error al cambiar la contraseña';
    } finally {
        passwordLoading.value = false;
    }
};
</script>

<template>
    <!-- Importar estilos de animate.css -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
    <div class="profile-container animate__animated animate__fadeInUp animate__delay-1s">
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
        <!-- Header con banner y avatar -->
        <div class="profile-header">
            <div class="banner-section">
                <div class="banner-gradient">
                    <!-- Avatar eliminado según requerimiento del usuario -->
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
                                <Tag value="Usuario activo" severity="info" icon="pi pi-user" class="status-tag ml-2" />
                            </div>
                        </div>
                        <div class="quick-actions">
                            <Button v-tooltip.left="'Configuración'" icon="pi pi-cog" class="p-button-text p-button-rounded" @click="openSettings" />
                            <Button v-tooltip.left="'Compartir perfil'" icon="pi pi-share-alt" class="p-button-text p-button-rounded" @click="shareProfile" />
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
                <div class="col-12 lg:col-8">
                    <div class="info-card">
                        <div class="card-header">
                            <h3><i class="pi pi-user mr-2"></i>Información Personal</h3>
                            <Button icon="pi pi-pencil" class="p-button-text p-button-sm" label="Editar" @click="editProfile" />
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

                            <div v-if="user.phone" class="info-item">
                                <div class="info-label">
                                    <i class="pi pi-phone"></i>
                                    <span>Teléfono</span>
                                </div>
                                <div class="info-value">{{ user.phone }}</div>
                            </div>

                            <div v-if="user.created_at" class="info-item">
                                <div class="info-label">
                                    <i class="pi pi-calendar"></i>
                                    <span>Miembro desde</span>
                                </div>
                                <div class="info-value">{{ formatDate(user.created_at) }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Estadísticas -->
                    <div class="stats-card">
                        <h3><i class="pi pi-chart-line mr-2"></i>Estadísticas</h3>
                        <Divider class="my-3" />
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-number">{{ Math.floor(Math.random() * 50) + 10 }}</div>
                                <div class="stat-label">Días activo</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">{{ Math.floor(Math.random() * 20) + 5 }}</div>
                                <div class="stat-label">Sesiones</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">{{ Math.floor(Math.random() * 100) + 25 }}</div>
                                <div class="stat-label">Acciones</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel lateral -->
                <div class="col-12 lg:col-4">
                    <!-- Acciones rápidas -->
                    <div class="actions-card">
                        <h3><i class="pi pi-bolt mr-2"></i>Acciones Rápidas</h3>
                        <Divider class="my-3" />
                        <div class="actions-list">
                            <Button label="Editar Perfil" icon="pi pi-user-edit" class="action-btn p-button-outlined" @click="editProfile" />
                            <Button v-if="!user.email_verified_at" label="Verificar Email" icon="pi pi-envelope" class="action-btn p-button-warning" :loading="verificationLoading" @click="resendVerification" />
                            <Button label="Cambiar Contraseña" icon="pi pi-lock" class="action-btn p-button-outlined" @click="changePassword" />
                            <Button label="Configurar Notificaciones" icon="pi pi-bell" class="action-btn p-button-outlined" @click="configureNotifications" />
                        </div>
                    </div>

                    <!-- Seguridad -->
                    <div class="security-card">
                        <h3><i class="pi pi-shield mr-2"></i>Seguridad</h3>
                        <Divider class="my-3" />
                        <div class="security-items">
                            <div class="security-item">
                                <div class="security-info">
                                    <span class="security-title">Autenticación en dos pasos</span>
                                    <small class="security-desc">Protege tu cuenta con 2FA</small>
                                </div>
                                <InputSwitch v-model="twoFactorEnabled" @change="toggleTwoFactor" />
                            </div>
                            <div class="security-item">
                                <div class="security-info">
                                    <span class="security-title">Notificaciones de seguridad</span>
                                    <small class="security-desc">Alertas de inicio de sesión</small>
                                </div>
                                <InputSwitch v-model="securityNotifications" />
                            </div>
                        </div>
                    </div>

                    <!-- Actividad Reciente -->
                    <div class="activity-card">
                        <h3><i class="pi pi-history mr-2"></i>Actividad Reciente</h3>
                        <Divider class="my-3" />
                        <Timeline :value="recentActivity" class="activity-timeline">
                            <template #content="slotProps">
                                <div class="activity-item">
                                    <span class="activity-title">{{ slotProps.item.title }}</span>
                                    <small class="activity-time">{{ slotProps.item.time }}</small>
                                </div>
                            </template>
                        </Timeline>
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
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    background-color: var(--surface-ground);
    min-height: calc(100vh - 6rem);
    color: var(--text-color);
}

/* Header Section */
.profile-header {
    margin-bottom: 1rem;
}

.banner-section {
    position: relative;
    height: 140px;
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
    background-size: 400% 400%;
    animation: gradientAnimation 15s ease infinite;
}

@keyframes gradientAnimation {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

.banner-gradient::before {
    pointer-events: none;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
}

/* Sección de avatar eliminada */

.profile-info-header {
    display: flex;
    justify-content: space-between;
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
    letter-spacing: -0.5px;
    position: relative;
    display: inline-block;
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

.quick-actions {
    display: flex;
    gap: 0.5rem;
}

.quick-actions .p-button {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
}

.quick-actions .p-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
    color: white;
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
    animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: -10px;
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
.stats-card,
.actions-card,
.security-card,
.activity-card {
    backdrop-filter: blur(10px);
    background: var(--surface-card);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--surface-border);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    color: var(--text-color);
}

.info-card::before,
.stats-card::before,
.actions-card::before,
.security-card::before,
.activity-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.info-card:hover,
.stats-card:hover,
.actions-card:hover,
.security-card:hover,
.activity-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.info-card:hover::before,
.stats-card:hover::before,
.actions-card:hover::before,
.security-card:hover::before,
.activity-card:hover::before {
    opacity: 1;
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
    background: linear-gradient(135deg, var(--primary-color, #4f46e5), #3730a3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.4rem;
}

/* Info Grid */
.info-grid {
    display: grid;
    gap: 1.5rem;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: var(--surface-hover);
    border-radius: 12px;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;
}

.info-item:hover {
    background: var(--surface-card);
    border-left: 3px solid var(--primary-color, #4f46e5);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transform: translateX(5px);
}

.info-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-color-secondary);
    font-weight: 500;
}

.info-label i {
    background: linear-gradient(135deg, var(--primary-color, #4f46e5), #3730a3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.2rem;
}

.info-value {
    font-weight: 600;
    color: var(--text-color);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
}

.stat-item {
    text-align: center;
    padding: 1.75rem 1.5rem;
    background: linear-gradient(135deg, var(--primary-color, #4f46e5) 0%, #3730a3 100%);
    border-radius: 14px;
    color: white;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.stat-item::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    opacity: 0;
    transition: opacity 0.3s ease;
}

.stat-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 25px rgba(79, 70, 229, 0.4);
}

.stat-item:hover::after {
    opacity: 1;
}

.stat-number {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

/* Actions */
.actions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.action-btn {
    width: 100%;
    justify-content: flex-start;
    padding: 0.9rem 1.25rem;
    border-radius: 10px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.action-btn:hover {
    box-shadow: 0 6px 15px rgba(79, 70, 229, 0.2);
    transform: translateX(5px);
}

.action-btn .p-button-label {
    font-weight: 600;
}

.action-btn .p-button-icon {
    margin-right: 0.75rem;
    font-size: 1.1rem;
}

/* Security */
.security-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Password Dialog */
.password-dialog-content {
    padding: 1rem 0;
}

.security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: var(--surface-hover);
    border-radius: 12px;
    transition: all 0.3s ease;
    margin-bottom: 1rem;
}

.security-item:hover {
    background: var(--surface-card);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.security-info {
    display: flex;
    flex-direction: column;
}

.security-title {
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.25rem;
}

.security-desc {
    color: var(--text-color-secondary);
    font-size: 0.85rem;
}

/* Activity Timeline */
.activity-timeline {
    margin-top: 1rem;
}

.activity-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.activity-item:hover {
    background: var(--surface-hover);
}

.activity-title {
    font-weight: 500;
    color: var(--text-color);
}

.activity-time {
    color: var(--text-color-secondary);
    font-size: 0.85rem;
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
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.05);
        opacity: 0.8;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
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
    .profile-info-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .user-name {
        font-size: 1.5rem;
    }

    .stats-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .stat-item {
        padding: 1rem;
    }

    .stat-number {
        font-size: 1.5rem;
    }

    .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .security-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}

@media (max-width: 480px) {
    .profile-container {
        padding: 0 0.5rem;
    }

    .avatar-section {
        left: 1rem;
    }

    .profile-info-header {
        padding: 0 1rem;
    }

    .banner-section {
        height: 150px;
        margin-bottom: 50px;
    }
}
</style>
