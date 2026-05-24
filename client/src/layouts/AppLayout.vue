<template>
  <div class="emp-layout" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- Top Navbar -->
    <nav class="emp-topbar">
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-sm text-light border-0 p-0" type="button" @click="toggleSidebar" aria-label="Toggle Sidebar">
          <i class="bi bi-list fs-4"></i>
        </button>
        <div class="bg-white px-2 py-1 rounded d-flex align-items-center justify-content-center" v-if="!isSidebarOpen || isMobile" style="height: 32px; cursor: pointer;" @click="router.push('/dashboard')">
          <img src="/logo.png" alt="Best Deal Paisa Logo" style="height: 100%; object-fit: contain;" />
        </div>
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
        <div class="d-flex align-items-center justify-content-between w-100">
          <div class="bg-white px-3 py-2 rounded d-flex align-items-center justify-content-center" style="height: 48px; width: 175px; cursor: pointer;" @click="router.push('/dashboard')">
            <img src="/logo.png" alt="Best Deal Paisa Logo" style="height: 100%; width: 100%; object-fit: contain;" />
          </div>
          <button class="btn-close btn-close-white d-lg-none ms-auto"
                  @click="isSidebarOpen = false"></button>
        </div>
      </div>

      <nav class="sidebar-nav flex-grow-1">
        <template v-if="auth.isAdmin">
          <SidebarLink to="/dashboard"       icon="speedometer2"  label="Dashboard" />
          <SidebarLink to="/admin/employees" icon="people"        label="Employees" />
          <SidebarLink to="/reports"         icon="bar-chart-line" label="Reports" />
          <SidebarLink to="/admin/revenue"   icon="currency-rupee" label="Revenue" />
          <SidebarLink to="/team-attendance" icon="calendar-range" label="Attendance & Salaries" />
          <SidebarLink to="/issues"          icon="exclamation-circle" label="Issues" />
        </template>
        <template v-else-if="auth.isManager">
          <SidebarLink to="/dashboard"       icon="speedometer2" label="Dashboard" />
          <SidebarLink to="/reports"         icon="folder2-open" label="Reports" />
          <SidebarLink to="/attendance"      icon="calendar-check" label="Attendance" />
          <SidebarLink to="/team-attendance" icon="calendar-range" label="Team Attendance" />
          <SidebarLink to="/issues"          icon="exclamation-circle" label="Issues" />
        </template>
        <template v-else-if="auth.isTeamLead">
          <SidebarLink to="/dashboard"       icon="speedometer2"    label="Dashboard" />
          <SidebarLink to="/reports"         icon="folder2-open"    label="Reports" />
          <SidebarLink to="/attendance"      icon="calendar-check"  label="Attendance" />
          <SidebarLink to="/team-attendance" icon="calendar-range" label="Team Attendance" />
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
        <div class="d-flex align-items-center justify-content-center gap-1 mt-3 pt-2 text-white-50 border-top border-white-10" style="font-size: 0.7rem; border-color: rgba(255,255,255,0.05) !important;">
          <img src="/favicon.png" alt="Logo" style="height: 12px; width: 12px; opacity: 0.6; object-fit: contain;" />
          <span>© 2026 Best Deal Paisa</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="emp-main position-relative" style="position: relative; overflow-x: hidden;">
      <!-- Background Watermark -->
      <div v-if="auth.user" class="watermark-container" :style="watermarkStyle"></div>

      <div class="position-relative w-100" style="z-index: 1;">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import SidebarLink      from '../components/sidebar/SidebarLink.vue'

const auth   = useAuthStore()

const watermarkStyle = computed(() => {
  if (!auth.user) return {};
  const text = `${auth.user.name} — ${auth.user.empId}`.toUpperCase();
  
  // Staggered dense layout SVG tile (260x120)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="120">
    <text x="130" y="60" 
          fill="#0f172a" 
          font-family="sans-serif" 
          font-weight="900" 
          font-size="14" 
          opacity="0.08" 
          text-anchor="middle" 
          letter-spacing="1.5"
          transform="rotate(-20 130 60)">
      ${text}
    </text>
  </svg>`;
  
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return {
    backgroundImage: `url("data:image/svg+xml;base64,${base64}")`,
    backgroundRepeat: 'repeat'
  };
});
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

<style scoped>
.watermark-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  user-select: none;
}
</style>
