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

    async function sendMessage(message, history) {
        isLoading.value = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);

        const url = `${import.meta.env.VITE_API_URL}chatbot/message`;
        const payload = { session_id: getSessionId(), message, history };

        console.log('[Chatbot] URL:', url);
        console.log('[Chatbot] Payload:', JSON.stringify(payload, null, 2));
        const startTime = Date.now();
        console.log('[Chatbot] Sending request at', new Date().toISOString());

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[Chatbot] Response received after ${elapsed}s — status:`, response.status, response.statusText);

            const data = await response.json();
            console.log('[Chatbot] Response data:', data);

            if (!data.success) {
                console.warn('[Chatbot] success=false, reply:', data.reply);
                return { reply: null, error: data.reply };
            }

            return { reply: data.reply, error: null };
        } catch (err) {
            clearTimeout(timeoutId);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.error(`[Chatbot] Error after ${elapsed}s — name: ${err.name} | message: ${err.message}`);
            if (err.name === 'AbortError') {
                console.error(`[Chatbot] Timeout hit after ${elapsed}s (limit: 180s)`);
                return { reply: null, error: 'La consulta tardó demasiado. Por favor intenta de nuevo.' };
            }
            console.error('[Chatbot] Non-abort error:', err);
            return { reply: null, error: 'Error de conexión. Por favor intenta de nuevo.' };
        } finally {
            isLoading.value = false;
        }
    }

    return { sendMessage, isLoading };
}
