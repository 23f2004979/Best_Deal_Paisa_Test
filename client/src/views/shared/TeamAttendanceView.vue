<template>
  <div class="page-content">
    <h5 class="page-title mb-4">
      {{ auth.isAdmin ? 'Attendance & Salaries' : 'Team Attendance & Salary Projection' }}
    </h5>
    
    <!-- Admin View -->
    <template v-if="auth.isAdmin">
      <!-- Team Attendance & Salary Projection (Mark Attendance) -->
      <SubordinateAttendance rolePrefix="admin" class="mb-4" />

      <div class="card border-0 shadow-sm">
        <div class="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 class="fw-600 mb-0"><i class="bi bi-graph-up me-2 text-primary"></i>Attendance Analytics & Expected Salaries</h6>
          <div class="d-flex gap-2">
            <select v-model="analyticsMonth" class="form-select form-select-sm" style="width: auto;" @change="loadAnalytics">
              <option v-for="m in 12" :key="m" :value="m">{{ new Date(2000, m-1).toLocaleString('default', { month: 'long' }) }}</option>
            </select>
            <input type="number" v-model="analyticsYear" class="form-control form-control-sm" style="width: 100px;" @change="loadAnalytics" />
          </div>
        </div>
        <div class="card-body p-0">
          <LoadingSpinner v-if="analyticsLoading" />
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th class="text-center">Present</th>
                  <th class="text-center">Absent</th>
                  <th class="text-center">Leave</th>
                  <th class="text-end">Projected Salary</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!analytics.attendanceData.length">
                  <td colspan="7" class="text-center py-4 text-muted">No data found for selected period.</td>
                </tr>
                <tr v-for="user in analytics.attendanceData" :key="user.id">
                  <td class="fw-500 text-primary">{{ user.empId }}</td>
                  <td class="fw-500">{{ user.name }}</td>
                  <td>
                    <span class="badge" :class="user.role === 'MANAGER' ? 'bg-primary' : (user.role === 'TEAM_LEAD' ? 'bg-success' : 'bg-warning text-dark')">
                      {{ formatRole(user.role) }}
                    </span>
                  </td>
                  <td class="text-center"><span class="badge bg-success">{{ user.presentDays }}</span></td>
                  <td class="text-center"><span class="badge bg-danger">{{ user.absentDays }}</span></td>
                  <td class="text-center"><span class="badge bg-warning text-dark">{{ user.leaveDays }}</span></td>
                  <td class="text-end fw-500 text-success">₹{{ user.projectedSalary?.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Manager/Team Lead View -->
    <template v-else>
      <SubordinateAttendance :rolePrefix="auth.role.toLowerCase() === 'master_admin' ? 'admin' : (auth.role.toLowerCase() === 'admin' ? 'admin' : auth.role.toLowerCase())" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../api/axios'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import SubordinateAttendance from '../../components/attendance/SubordinateAttendance.vue'

const auth = useAuthStore()

const analyticsLoading = ref(true)
const analyticsMonth = ref(new Date().getMonth() + 1)
const analyticsYear = ref(new Date().getFullYear())
const analytics = ref({ attendanceData: [], recentActivity: [], activeFiles: [] })

function formatRole(role) {
  const map = { MANAGER: 'Manager', TEAM_LEAD: 'Team Lead', TELE_CALLER: 'Tele Caller', MASTER_ADMIN: 'Master Admin' }
  return map[role] || role
}

async function loadAnalytics() {
  if (!auth.isAdmin) return
  analyticsLoading.value = true
  try {
    const { data } = await api.get(`/admin/analytics?month=${analyticsMonth.value}&year=${analyticsYear.value}`)
    analytics.value = data
  } catch (e) {
    console.error('Analytics load error:', e)
  } finally {
    analyticsLoading.value = false
  }
}

onMounted(() => {
  if (auth.isAdmin) {
    loadAnalytics()
  }
})
</script>
