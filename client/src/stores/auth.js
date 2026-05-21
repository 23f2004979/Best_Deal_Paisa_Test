import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('emp_user') || 'null'))
  const token = ref(localStorage.getItem('emp_token') || null)

  const isLoggedIn  = computed(() => !!token.value)
  const role        = computed(() => user.value?.role)
  const isAdmin     = computed(() => role.value === 'MASTER_ADMIN')
  const isManager   = computed(() => role.value === 'MANAGER')
  const isTeamLead  = computed(() => role.value === 'TEAM_LEAD')
  const isTeleCaller= computed(() => role.value === 'TELE_CALLER')

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    token.value = data.token
    user.value  = data.user
    localStorage.setItem('emp_token', data.token)
    localStorage.setItem('emp_user',  JSON.stringify(data.user))
  }

  function logout() {
    token.value = null
    user.value  = null
    localStorage.removeItem('emp_token')
    localStorage.removeItem('emp_user')
  }

  return { user, token, isLoggedIn, role, isAdmin, isManager, isTeamLead, isTeleCaller, login, logout }
})
