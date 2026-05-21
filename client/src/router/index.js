import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Lazy-load views
const LoginView      = () => import('../views/auth/LoginView.vue')
const NotFound       = () => import('../views/errors/NotFound.vue')
const Forbidden      = () => import('../views/errors/Forbidden.vue')

// Shared new views
const Dashboard            = () => import('../views/shared/Dashboard.vue')
const AttendanceCalendar   = () => import('../views/shared/AttendanceCalendar.vue')
const ReportsList          = () => import('../views/shared/ReportsList.vue')
const AdminEmployeeManagement = () => import('../views/admin/AdminEmployeeManagement.vue')
const IssuesView           = () => import('../views/shared/IssuesView.vue')

const routes = [
  { path: '/',        redirect: '/login' },
  { path: '/login',   component: LoginView, meta: { public: true } },

  // Shared routes
  { path: '/dashboard',  component: Dashboard },
  { path: '/attendance', component: AttendanceCalendar },
  { path: '/reports',    component: ReportsList },
  { path: '/issues',     component: IssuesView },

  // Admin routes
  { path: '/admin/employees', component: AdminEmployeeManagement, meta: { roles: ['ADMIN', 'MASTER_ADMIN'] } },

  { path: '/403', component: Forbidden },
  { path: '/:pathMatch(.*)*', component: NotFound },
]

const router = createRouter({ history: createWebHistory(), routes })

// Global navigation guard
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isLoggedIn) return '/login'
  
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return '/403'
  
  // If there's an old role meta, convert it
  if (to.meta.role && auth.role !== to.meta.role) return '/403'
  
  return true
})

export default router
