<template>
  <div class="d-flex flex-column align-items-center justify-content-center py-5 text-center min-vh-75">
    <div class="mb-4 position-relative">
      <img src="/favicon.png" alt="BDP Logo" style="opacity: 0.15; height: 120px; width: 120px; filter: grayscale(1);" />
      <h1 class="position-absolute top-50 start-50 translate-middle m-0 display-1 fw-bold text-dark-emphasis" style="line-height: 1;">404</h1>
    </div>
    <h4 class="fw-bold mb-2">Page Not Found</h4>
    <p class="text-muted mb-4" style="max-width: 400px;">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
    <router-link to="/dashboard" class="btn btn-accent px-4">Go to Dashboard</router-link>
  </div>
</template>
