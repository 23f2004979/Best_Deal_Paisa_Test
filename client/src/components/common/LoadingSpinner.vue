<template>
  <div class="d-flex flex-column align-items-center justify-content-center py-5 gap-2">
    <div class="pulse-container">
      <img src="/favicon.png" alt="Loading..." class="pulse-logo" />
    </div>
    <small class="text-muted fw-500">Loading details...</small>
  </div>
</template>

<style scoped>
.pulse-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
}
.pulse-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  animation: pulse 1.5s infinite ease-in-out;
}
@keyframes pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.5;
  }
}
</style>
