<template>
  <div class="login-wrap">
    <div class="login-card card shadow-lg border-0">
      <div class="card-header text-center py-4 border-0">
        <img src="/favicon.png" alt="BDP Logo" class="mb-2" style="height: 48px; width: 48px; object-fit: contain;" />
        <h4 class="fw-bold mb-1 page-title">Best Deal Paisa</h4>
        <small class="text-muted">Employee Management Portal</small>
      </div>
      <div class="card-body p-4">
        <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
        <div class="mb-3">
          <label class="form-label fw-500">Email Address</label>
          <input v-model="form.email" type="email" class="form-control"
                 placeholder="you@bestdealpaisa.com" />
        </div>
        <div class="mb-4">
          <label class="form-label fw-500">Password</label>
          <input v-model="form.password" type="password" class="form-control"
                 placeholder="••••••••" @keyup.enter="handleLogin" />
        </div>
        <button class="btn btn-accent w-100 py-2"
                :disabled="loading" @click="handleLogin">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter }      from 'vue-router'
import { useAuthStore }   from '../../stores/auth'

const auth    = useAuthStore()
const router  = useRouter()
const loading = ref(false)
const error   = ref('')
const form    = reactive({ email: '', password: '' })

const dashboardMap = {
  MASTER_ADMIN: '/admin/dashboard',
  MANAGER:      '/manager/dashboard',
  TEAM_LEAD:    '/teamlead/dashboard',
  TELE_CALLER:  '/telecaller/dashboard',
}

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(form.email, form.password)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message || 'Login failed. Try again.'
  } finally {
    loading.value = false
  }
}
</script>
