import { ref } from 'vue';

function getSessionId() {
    let id = sessionStorage.getItem('mc_chat_session');
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem('mc_chat_session', id);
    }
    return id;
}

export function useChatbot() {
    const isLoading = ref(false);

    // El historial lo mantiene el servidor por session_id.
    async function sendMessage(message) {
        isLoading.value = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const base = import.meta.env.VITE_API_URL.replace(/\/?$/, '/');
        const url = `${base}chatbot/message`;
        const payload = { session_id: getSessionId(), message };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!data.success) {
                return { reply: null, error: data.reply };
            }

            return { reply: data.reply, error: null };
        } catch (err) {
            clearTimeout(timeoutId);            if (err.name === 'AbortError') {
                return { reply: null, error: 'La consulta tardó demasiado. Por favor intenta de nuevo.' };
            }
            return { reply: null, error: 'Error de conexión. Por favor intenta de nuevo.' };
        } finally {
            isLoading.value = false;
        }
    }

    return { sendMessage, isLoading };
}
