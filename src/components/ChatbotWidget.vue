<script setup>
import { useChatbot } from '@/composables/useChatbot';
import { computed, nextTick, ref } from 'vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.use({ breaks: true, gfm: true });

function renderMd(text) {
    return DOMPurify.sanitize(marked.parse(text));
}

const props = defineProps({
    storeName: { type: String, default: 'Master Color' },
    primaryColor: { type: String, default: '#1D9E75' }
});

const AGENT_NAME = 'Mastercito';

const { sendMessage, isLoading } = useChatbot();

const isOpen = ref(false);
const inputText = ref('');
const messages = ref([]);
const messagesContainer = ref(null);
const textarea = ref(null);

const QUICK_SUGGESTIONS = ['¿Qué impresoras tienen?', 'Ver precios', '¿Qué es seminuevo?', '¿Cuál me recomiendas?'];

const showSuggestions = computed(() => messages.value.filter((m) => m.role === 'user').length === 0);

function toggle() {
    isOpen.value = !isOpen.value;
    if (isOpen.value && messages.value.length === 0) {
        messages.value.push({
            role: 'assistant',
            content: `¡Hola! Soy ${AGENT_NAME}, el asistente de ${props.storeName} 🖨️. ¿En qué puedo ayudarte hoy?`,
            timestamp: new Date()
        });
        nextTick(() => textarea.value?.focus());
    }
}

async function submit() {
    const text = inputText.value.trim();
    if (!text || isLoading.value) return;

    inputText.value = '';

    // Last 10 valid messages before this one
    const history = messages.value
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

    messages.value.push({ role: 'user', content: text, timestamp: new Date() });
    await scrollBottom();

    const { reply, error } = await sendMessage(text, history);

    if (reply) {
        messages.value.push({ role: 'assistant', content: reply, timestamp: new Date() });
    } else {
        messages.value.push({ role: 'error', content: error, timestamp: new Date() });
    }

    await scrollBottom();
    nextTick(() => textarea.value?.focus());
}

async function useSuggestion(text) {
    inputText.value = text;
    await submit();
}

function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
    }
}

async function scrollBottom() {
    await nextTick();
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
    <div class="chatbot-root" :style="{ '--chat-primary': primaryColor }">
        <!-- Panel -->
        <Transition name="chat-panel">
            <div v-if="isOpen" class="chat-panel">
                <!-- Header -->
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-avatar">
                            <!-- Robot face -->
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1H4a1 1 0 0 1-1-1v-1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-3 3.5a.5.5 0 0 0-.5.5v.5h1V17a.5.5 0 0 0-.5-.5z"/>
                            </svg>
                        </div>
                        <div>
                            <p class="chat-title">Mastercito</p>
                            <div class="chat-status">
                                <span class="status-dot"></span>
                                <span class="status-text">Asistente de {{ storeName }}</span>
                            </div>
                        </div>
                    </div>
                    <button class="chat-close-btn" aria-label="Cerrar chat" @click="toggle">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <!-- Messages -->
                <div ref="messagesContainer" class="chat-messages">
                    <div v-for="(msg, i) in messages" :key="i" class="message-row" :class="msg.role">
                        <!-- Assistant / Error bubble -->
                        <div v-if="msg.role !== 'user'" class="bubble-wrap bubble-left">
                            <div
                                class="bubble"
                                :class="msg.role === 'error' ? 'bubble-error' : 'bubble-assistant'"
                                v-html="msg.role === 'error' ? msg.content : renderMd(msg.content)"
                            ></div>
                            <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                        </div>

                        <!-- User bubble -->
                        <div v-else class="bubble-wrap bubble-right">
                            <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                            <div class="bubble bubble-user">{{ msg.content }}</div>
                        </div>
                    </div>

                    <!-- Typing indicator -->
                    <div v-if="isLoading" class="message-row assistant">
                        <div class="bubble-wrap bubble-left">
                            <div class="bubble bubble-assistant typing-bubble">
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                            </div>
                            <span class="typing-label">Mastercito está consultando el catálogo...</span>
                        </div>
                    </div>
                </div>

                <!-- Quick suggestions -->
                <div v-if="showSuggestions && !isLoading" class="suggestions-bar">
                    <button
                        v-for="s in QUICK_SUGGESTIONS"
                        :key="s"
                        class="suggestion-chip"
                        @click="useSuggestion(s)"
                    >
                        {{ s }}
                    </button>
                </div>

                <!-- Input -->
                <div class="chat-footer">
                    <textarea
                        ref="textarea"
                        v-model="inputText"
                        class="chat-input"
                        :disabled="isLoading"
                        placeholder="Pregúntale a Mastercito..."
                        rows="1"
                        maxlength="500"
                        @keydown="onKeydown"
                    ></textarea>
                    <button
                        class="chat-send-btn"
                        :disabled="isLoading || !inputText.trim()"
                        aria-label="Enviar"
                        @click="submit"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </Transition>

        <!-- Toggle button -->
        <button class="chat-toggle-btn" :class="{ open: isOpen }" aria-label="Abrir chat" @click="toggle">
            <Transition name="icon-swap" mode="out-in">
                <svg v-if="!isOpen" key="chat" width="26" height="26" viewBox="0 0 24 24" fill="white">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
                <svg v-else key="close" width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
            </Transition>
        </button>
    </div>
</template>

<style scoped>
/* Root */
.chatbot-root {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Toggle button */
.chat-toggle-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--chat-primary);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    flex-shrink: 0;
}

.chat-toggle-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Panel */
.chat-panel {
    width: 380px;
    height: 520px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Header */
.chat-header {
    background: var(--chat-primary);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.chat-header-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.chat-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.chat-title {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.2;
}

.chat-status {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 2px;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #86efac;
    animation: pulse-dot 2s infinite;
}

.status-text {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.85);
}

.chat-close-btn {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    border-radius: 8px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    transition: background 0.15s;
    flex-shrink: 0;
}

.chat-close-btn:hover {
    background: rgba(255, 255, 255, 0.25);
}

/* Messages area */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
    width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
    background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 4px;
}

.message-row {
    display: flex;
}

.message-row.user {
    justify-content: flex-end;
}

.message-row.assistant,
.message-row.error {
    justify-content: flex-start;
}

.bubble-wrap {
    display: flex;
    flex-direction: column;
    max-width: 78%;
    gap: 3px;
}

.bubble-left {
    align-items: flex-start;
}

.bubble-right {
    align-items: flex-end;
}

.bubble {
    padding: 10px 13px;
    border-radius: 14px;
    font-size: 0.875rem;
    line-height: 1.5;
    word-break: break-word;
    white-space: normal;
}

/* Markdown rendered inside assistant bubbles */
.bubble-assistant :deep(p) { margin: 0 0 6px; }
.bubble-assistant :deep(p:last-child) { margin-bottom: 0; }
.bubble-assistant :deep(strong) { font-weight: 600; color: #111827; }
.bubble-assistant :deep(ul),
.bubble-assistant :deep(ol) { margin: 4px 0 6px 16px; padding: 0; }
.bubble-assistant :deep(li) { margin-bottom: 2px; }
.bubble-assistant :deep(li:last-child) { margin-bottom: 0; }
.bubble-assistant :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 8px 0; }

.bubble-user {
    background: var(--chat-primary);
    color: #ffffff;
    border-bottom-right-radius: 4px;
}

.bubble-assistant {
    background: #f3f4f6;
    color: #111827;
    border-bottom-left-radius: 4px;
}

.bubble-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
    border-bottom-left-radius: 4px;
    font-size: 0.82rem;
}

.msg-time {
    font-size: 0.68rem;
    color: #9ca3af;
}

/* Typing indicator */
.typing-bubble {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 12px 16px;
}

.typing-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9ca3af;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}

.typing-label {
    font-size: 0.68rem;
    color: #9ca3af;
    margin-top: 2px;
    line-height: 1.3;
}

/* Suggestions */
.suggestions-bar {
    padding: 6px 12px 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top: 1px solid #f3f4f6;
    flex-shrink: 0;
}

.suggestion-chip {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #374151;
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
}

.suggestion-chip:hover {
    background: #e5e7eb;
    border-color: var(--chat-primary);
    color: var(--chat-primary);
}

/* Footer / Input */
.chat-footer {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 10px 12px 14px;
    border-top: 1px solid #f3f4f6;
    background: #ffffff;
    flex-shrink: 0;
}

.chat-input {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 0.875rem;
    font-family: inherit;
    color: #111827;
    background: #f9fafb;
    resize: none;
    outline: none;
    transition: border-color 0.15s;
    line-height: 1.4;
    max-height: 96px;
    overflow-y: auto;
}

.chat-input:focus {
    border-color: var(--chat-primary);
    background: #ffffff;
}

.chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.chat-send-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--chat-primary);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    transition: opacity 0.15s, transform 0.1s;
    flex-shrink: 0;
}

.chat-send-btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: scale(1.05);
}

.chat-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* Animations */
.chat-panel-enter-active {
    animation: panel-in 0.25s ease-out;
}

.chat-panel-leave-active {
    animation: panel-out 0.2s ease-in;
}

@keyframes panel-in {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.96);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes panel-out {
    from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateY(12px) scale(0.96);
    }
}

.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity 0.15s, transform 0.15s;
}

.icon-swap-enter-from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.7);
}

.icon-swap-leave-to {
    opacity: 0;
    transform: rotate(90deg) scale(0.7);
}

@keyframes typing {
    0%, 60%, 100% {
        opacity: 0.3;
        transform: translateY(0);
    }
    30% {
        opacity: 1;
        transform: translateY(-4px);
    }
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Mobile */
@media (max-width: 440px) {
    .chatbot-root {
        bottom: 16px;
        right: 16px;
    }

    .chat-panel {
        width: calc(100vw - 32px);
        height: 480px;
    }
}
</style>
