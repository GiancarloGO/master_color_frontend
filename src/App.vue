<script setup>
import ChatbotWidget from '@/components/ChatbotWidget.vue';
</script>

<template>
    <router-view />
    <ChatbotWidget store-name="Master Color" primary-color="#1D9E75" />
</template>

<style scoped></style>
