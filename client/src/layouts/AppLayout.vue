<template>
  <div class="emp-layout" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- Top Navbar -->
    <nav class="emp-topbar">
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-sm text-light border-0 p-0" type="button" @click="toggleSidebar" aria-label="Toggle Sidebar">
          <i class="bi bi-list fs-4"></i>
        </button>
        <span class="brand" v-if="!isSidebarOpen || isMobile">BDP EMP</span>
      </div>
      <div class="d-flex align-items-center gap-3">
        <span class="text-white-50 small d-none d-sm-inline">Welcome, {{ auth.user?.name }}</span>
      </div>
    </nav>

    <!-- Backdrop for mobile/tablet -->
    <div v-if="isSidebarOpen" class="sidebar-backdrop d-lg-none" @click="isSidebarOpen = false"></div>

    <!-- Sidebar -->
    <aside class="emp-sidebar" id="empSidebar" tabindex="-1">
      <div class="sidebar-brand">
        <span class="brand-text">BDP EMP</span>
        <small>Best Deal Paisa</small>
        <button class="btn-close btn-close-white d-lg-none ms-auto"
                @click="isSidebarOpen = false"></button>
      </div>

      <nav class="sidebar-nav flex-grow-1">
        <template v-if="auth.isAdmin">
          <SidebarLink to="/dashboard"       icon="speedometer2"  label="Dashboard" />
          <SidebarLink to="/admin/employees" icon="people"        label="Employees" />
          <SidebarLink to="/reports"         icon="bar-chart-line" label="Reports" />
          <SidebarLink to="/issues"          icon="exclamation-circle" label="Issues" />
        </template>
        <template v-else-if="auth.isManager">
          <SidebarLink to="/dashboard"       icon="speedometer2" label="Dashboard" />
          <SidebarLink to="/reports"         icon="folder2-open" label="Reports" />
          <SidebarLink to="/attendance"      icon="calendar-check" label="Attendance" />
          <SidebarLink to="/issues"          icon="exclamation-circle" label="Issues" />
        </template>
        <template v-else-if="auth.isTeamLead">
          <SidebarLink to="/dashboard"       icon="speedometer2"    label="Dashboard" />
          <SidebarLink to="/reports"         icon="folder2-open"    label="Reports" />
          <SidebarLink to="/attendance"      icon="calendar-check"  label="Attendance" />
          <SidebarLink to="/issues"          icon="exclamation-circle" label="Issues" />
        </template>
        <template v-else-if="auth.isTeleCaller">
          <SidebarLink to="/dashboard"       icon="speedometer2"   label="Dashboard" />
          <SidebarLink to="/reports"         icon="folder-plus"    label="Reports" />
          <SidebarLink to="/attendance"      icon="calendar-check" label="Attendance" />
          <SidebarLink to="/issues"          icon="exclamation-circle" label="Issues" />
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <i class="bi bi-person-circle fs-5"></i>
          <span>{{ auth.user?.name }}</span>
        </div>
        <button class="btn btn-sm btn-outline-light w-100 mt-2" @click="handleLogout">
          <i class="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="emp-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import SidebarLink      from '../components/sidebar/SidebarLink.vue'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const isSidebarOpen = ref(false)
const isMobile = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function updateMobileState() {
  isMobile.value = window.innerWidth < 992
}

onMounted(() => {
  updateMobileState()
  window.addEventListener('resize', updateMobileState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileState)
})

// Close sidebar on route change
watch(() => route.path, () => {
  isSidebarOpen.value = false
  
  // Clean up any lingering backdrops (to avoid unclickable dark overlays)
  const backdrops = document.querySelectorAll('.offcanvas-backdrop, .modal-backdrop')
  backdrops.forEach(el => el.remove())
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.body.classList.remove('modal-open')
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
