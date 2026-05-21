<template>
  <div class="stat-card card border-0 shadow-sm h-100">
    <div class="card-body d-flex align-items-center gap-3">
      <div class="stat-icon" :style="{ background: color + '22', color }">
        <i :class="`bi bi-${icon} fs-4`"></i>
      </div>
      <div>
        <div class="stat-value fw-bold fs-4">{{ value }}</div>
        <div class="stat-label text-muted small">{{ label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ icon: String, value: [String, Number], label: String, color: { default: '#f97316' } })
</script>
