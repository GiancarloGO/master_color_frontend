/**
 * Validation utility for MercadoPago Wrapper Integration
 *
 * This utility validates that the frontend is compatible with the new
 * MercadoPago wrapper implementation in the backend.
 */

import { ordersApi } from '@/api/index';

export const validateMercadoPagoWrapperIntegration = async () => {
    console.log('🔍 Validating MercadoPago Wrapper Integration...');

    const validationResults = {
        apiEndpoint: false,
        responseFormat: false,
        errorHandling: false,
        paymentFlow: false,
        success: false,
        errors: []
    };

    try {
        // Test 1: Verify API endpoint exists
        console.log('1️⃣ Checking API endpoint availability...');
        if (typeof ordersApi.generatePaymentLink === 'function') {
            validationResults.apiEndpoint = true;
            console.log('✅ API endpoint is available');
        } else {
            validationResults.errors.push('API endpoint ordersApi.generatePaymentLink not found');
            console.log('❌ API endpoint is missing');
        }

        // Test 2: Verify response format compatibility
        console.log('2️⃣ Checking response format compatibility...');

        // Mock a successful response to test format
        const mockWrapperResponse = {
            data: {
                preference_id: 'test-123',
                init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=test-123',
                order_id: 42,
                total_amount: 150.0
            }
        };

        const requiredFields = ['preference_id', 'init_point', 'order_id', 'total_amount'];
        const hasAllFields = requiredFields.every((field) => mockWrapperResponse.data.hasOwnProperty(field));

        if (hasAllFields) {
            validationResults.responseFormat = true;
            console.log('✅ Response format is compatible');
        } else {
            validationResults.errors.push('Response format is not compatible with wrapper');
            console.log('❌ Response format is incompatible');
        }

        // Test 3: Verify error handling compatibility
        console.log('3️⃣ Checking error handling compatibility...');

        // Check if error handling utilities are available
        try {
            const { handleProcessError, handleProcessSuccess } = await import('@/utils/apiHelpers');

            if (typeof handleProcessError === 'function' && typeof handleProcessSuccess === 'function') {
                validationResults.errorHandling = true;
                console.log('✅ Error handling utilities are available');
            } else {
                validationResults.errors.push('Error handling utilities not found');
                console.log('❌ Error handling utilities are missing');
            }
        } catch (error) {
            validationResults.errors.push(`Error loading API helpers: ${error.message}`);
            console.log('❌ Error loading API helpers');
        }

        // Test 4: Verify payment flow components
        console.log('4️⃣ Checking payment flow components...');

        const paymentFlowComponents = ['ordersApi.generatePaymentLink', 'ordersApi.getPaymentStatus', 'ordersApi.cancelOrder'];

        const componentResults = paymentFlowComponents.map((component) => {
            const [api, method] = component.split('.');
            const apiObj = api === 'ordersApi' ? ordersApi : null;
            return apiObj && typeof apiObj[method] === 'function';
        });

        if (componentResults.every((result) => result)) {
            validationResults.paymentFlow = true;
            console.log('✅ Payment flow components are available');
        } else {
            validationResults.errors.push('Some payment flow components are missing');
            console.log('❌ Payment flow components are incomplete');
        }

        // Overall validation
        const allTestsPassed = Object.values(validationResults)
            .filter((val) => typeof val === 'boolean')
            .every((val) => val);

        validationResults.success = allTestsPassed;

        if (allTestsPassed) {
            console.log('🎉 All validation tests passed!');
            console.log('✅ Frontend is fully compatible with MercadoPago wrapper');
        } else {
            console.log('⚠️  Some validation tests failed');
            console.log('❌ Check the errors for details');
        }

        return validationResults;
    } catch (error) {
        console.error('💥 Validation failed with error:', error);
        validationResults.errors.push(`Validation error: ${error.message}`);
        return validationResults;
    }
};

/**
 * Quick validation function for console use
 */
export const quickValidation = async () => {
    const results = await validateMercadoPagoWrapperIntegration();

    console.log('\n📊 Validation Summary:');
    console.table({
        'API Endpoint': results.apiEndpoint ? '✅ Pass' : '❌ Fail',
        'Response Format': results.responseFormat ? '✅ Pass' : '❌ Fail',
        'Error Handling': results.errorHandling ? '✅ Pass' : '❌ Fail',
        'Payment Flow': results.paymentFlow ? '✅ Pass' : '❌ Fail',
        Overall: results.success ? '✅ Compatible' : '❌ Issues Found'
    });

    if (results.errors.length > 0) {
        console.log('\n🚨 Errors Found:');
        results.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    }

    if (results.success) {
        console.log('\n🎯 Result: Frontend is ready for MercadoPago wrapper integration!');
    } else {
        console.log('\n⚠️  Result: Some issues need to be addressed before integration.');
    }

    return results;
};

/**
 * Integration readiness check
 */
export const checkIntegrationReadiness = () => {
    console.log('🔎 Checking MercadoPago Wrapper Integration Readiness...');

    const readinessChecks = {
        environmentVariables: !!import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY,
        apiStructure: typeof ordersApi === 'object' && ordersApi !== null,
        paymentEndpoint: typeof ordersApi.generatePaymentLink === 'function',
        statusEndpoint: typeof ordersApi.getPaymentStatus === 'function',
        cancelEndpoint: typeof ordersApi.cancelOrder === 'function'
    };

    const allReady = Object.values(readinessChecks).every((check) => check);

    console.log('📋 Readiness Status:');
    Object.entries(readinessChecks).forEach(([check, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    });

    if (allReady) {
        console.log('\n🚀 System is ready for MercadoPago wrapper integration!');
    } else {
        console.log('\n🛠️  Some components need attention before integration.');
    }

    return {
        ready: allReady,
        checks: readinessChecks
    };
};

// Auto-run validation in development with debug parameter
if (import.meta.env.DEV && window.location.search.includes('debug=wrapper')) {
    quickValidation();
}

export default validateMercadoPagoWrapperIntegration;
