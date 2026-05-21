<template>
  <div v-if="show" class="alert" :class="alertClass" role="alert">
    {{ message }}
    <button type="button" class="btn-close" @click="$emit('close')"></button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  show: Boolean,
  message: String,
  type: { default: 'success' }
})
defineEmits(['close'])
const alertClass = computed(() => `alert-${props.type} alert-dismissible fade show`)
</script>
