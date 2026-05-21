<template>
  <span class="badge rounded-pill" :class="badgeClass">{{ status }}</span>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ status: String })
const badgeClass = computed(() => ({
  'badge-pending':     props.status === 'PENDING',
  'badge-active':      props.status === 'ACTIVE' || props.status === 'APPROVED',
  'badge-rejected':    props.status === 'REJECTED',
  'badge-blacklisted': props.status === 'BLACKLISTED' || props.status === 'DEACTIVATED',
}))
</script>
