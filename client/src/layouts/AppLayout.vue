<template>
  <div class="emp-layout">
    <!-- Mobile Top Navbar -->
    <nav class="emp-topbar d-lg-none">
      <span class="brand">BDP EMP</span>
      <button class="btn btn-sm btn-outline-light" type="button"
              data-bs-toggle="offcanvas" data-bs-target="#empSidebar">
        <i class="bi bi-list fs-5"></i>
      </button>
    </nav>

    <!-- Sidebar -->
    <aside class="emp-sidebar offcanvas offcanvas-start d-lg-flex flex-column"
           id="empSidebar" tabindex="-1">
      <div class="sidebar-brand">
        <span class="brand-text">BDP EMP</span>
        <small>Best Deal Paisa</small>
        <button class="btn-close btn-close-white d-lg-none ms-auto"
                data-bs-dismiss="offcanvas"></button>
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
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { watch } from 'vue'
import SidebarLink      from '../components/sidebar/SidebarLink.vue'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

// Close mobile offcanvas and clean up backdrops on route change
watch(() => route.path, () => {
  // Dismiss Bootstrap offcanvas programmatically
  const sidebarEl = document.getElementById('empSidebar')
  if (sidebarEl && window.bootstrap) {
    const offcanvas = window.bootstrap.Offcanvas.getInstance(sidebarEl)
    if (offcanvas) {
      offcanvas.hide()
    }
  }
  
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
