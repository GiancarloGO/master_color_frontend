// Test script para verificar la integración de MercadoPago
import mercadoPagoService from '@/services/mercadopagoService';

export const testMercadoPagoIntegration = async () => {
    console.log('🧪 Testing MercadoPago Integration...');

    try {
        // Test 1: Validar configuración
        console.log('1️⃣ Testing configuration...');
        mercadoPagoService.validateConfig();
        console.log('✅ Configuration valid');

        // Test 2: Cargar script
        console.log('2️⃣ Testing script loading...');
        await mercadoPagoService.loadMercadoPagoScript();
        console.log('✅ Script loaded successfully');

        // Test 3: Inicializar servicio
        console.log('3️⃣ Testing service initialization...');
        const mp = await mercadoPagoService.initialize();
        console.log('✅ Service initialized:', mp);

        // Test 4: Verificar métodos disponibles
        console.log('4️⃣ Testing available methods...');
        const methods = await mercadoPagoService.getPaymentMethods();
        console.log('✅ Payment methods available:', methods?.length || 0);

        return {
            success: true,
            message: 'All tests passed! ✅',
            details: {
                configValid: true,
                scriptLoaded: true,
                serviceInitialized: !!mp,
                paymentMethodsCount: methods?.length || 0
            }
        };
    } catch (error) {
        console.error('❌ Test failed:', error);

        return {
            success: false,
            message: `Test failed: ${error.message}`,
            error: error.message,
            details: {
                configValid: error.message.includes('public key') ? false : true,
                scriptLoaded: error.message.includes('script') ? false : true,
                serviceInitialized: false,
                paymentMethodsCount: 0
            }
        };
    }
};

// Función para test rápido desde la consola del navegador
export const quickTest = async () => {
    const result = await testMercadoPagoIntegration();

    if (result.success) {
        console.log('🎉 MercadoPago integration is working!');
        console.table(result.details);
    } else {
        console.error('💥 MercadoPago integration has issues:');
        console.error(result.message);
        console.table(result.details);
    }

    return result;
};

// Función para probar la integración con el wrapper
export const testWrapperIntegration = async () => {
    console.log('🔧 Testing MercadoPago Wrapper Integration...');

    try {
        // Importar utilidades de validación
        const { validateMercadoPagoWrapperIntegration } = await import('./validateMercadoPagoWrapper');

        // Ejecutar validación del wrapper
        const wrapperResults = await validateMercadoPagoWrapperIntegration();

        // Ejecutar test básico de MercadoPago
        const basicResults = await testMercadoPagoIntegration();

        const combinedResults = {
            success: wrapperResults.success && basicResults.success,
            wrapperCompatible: wrapperResults.success,
            mercadoPagoReady: basicResults.success,
            details: {
                wrapper: wrapperResults,
                mercadoPago: basicResults.details
            }
        };

        if (combinedResults.success) {
            console.log('🎉 MercadoPago with Wrapper integration is fully ready!');
        } else {
            console.log('⚠️  Integration has some issues that need attention.');
        }

        return combinedResults;
    } catch (error) {
        console.error('❌ Error testing wrapper integration:', error);
        return {
            success: false,
            error: error.message,
            wrapperCompatible: false,
            mercadoPagoReady: false
        };
    }
};

// Auto-ejecutar en desarrollo si hay parámetro de debug
if (import.meta.env.DEV && window.location.search.includes('debug=mp')) {
    quickTest();
}

// Auto-ejecutar test de wrapper si hay parámetro específico
if (import.meta.env.DEV && window.location.search.includes('debug=wrapper')) {
    testWrapperIntegration();
}

export default testMercadoPagoIntegration;
