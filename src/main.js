import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Lara from '@primeuix/themes/lara';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import StyleClass from 'primevue/styleclass';
import ToastService from 'primevue/toastservice';

// Importar componentes PrimeVue
import '@/assets/styles.scss';
import registerPrimeVueComponents from './plugins/primevue-components';
const pinia = createPinia();
const app = createApp(App);

app.use(router);
app.use(pinia);
app.use(PrimeVue, {
    theme: {
        preset: {
            ...Lara,
            semantic: {
                ...Lara.semantic,
                semantic: {
                    primary: {
                        50: '{blue.50}',
                        100: '{blue.100}',
                        200: '{blue.200}',
                        300: '{blue.300}',
                        400: '{blue.400}',
                        500: '{blue.500}', // Este es el color principal
                        600: '{blue.600}',
                        700: '{blue.700}',
                        800: '{blue.800}',
                        900: '{blue.900}',
                        950: '{blue.950}'
                    }
                }
            }
        },
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.directive('styleclass', StyleClass);
registerPrimeVueComponents(app);

app.mount('#app');
