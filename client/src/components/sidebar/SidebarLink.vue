<template>
  <router-link :to="to" class="sidebar-link" :class="{ active: isActive }">
    <i :class="`bi bi-${icon}`"></i>
    <span>{{ label }}</span>
  </router-link>
</template>

<script setup>
import { computed }    from 'vue'
import { useRoute }    from 'vue-router'

const props = defineProps({ to: String, icon: String, label: String })
const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
