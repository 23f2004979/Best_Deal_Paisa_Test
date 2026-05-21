<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Admin Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <StatCard icon="briefcase" label="Managers" :value="stats.managers" color="#3b82f6" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="people" label="Team Leads" :value="stats.teamLeads" color="#10b981" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="headset" label="Tele Callers" :value="stats.teleCallers" color="#f97316" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="hourglass-split" label="Pending Approvals"
                    :value="stats.pendingUsers + stats.pendingFiles" color="#ef4444" />
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12 col-md-6">
          <div class="card border-0 shadow-sm p-3">
            <h6 class="fw-600 mb-3"><i class="bi bi-person-check me-2 text-warning"></i>Pending User Approvals</h6>
            <router-link to="/admin/users?status=PENDING" class="btn btn-sm btn-accent">
              Review {{ stats.pendingUsers }} Users →
            </router-link>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="card border-0 shadow-sm p-3">
            <h6 class="fw-600 mb-3"><i class="bi bi-folder-check me-2 text-success"></i>Pending File Approvals</h6>
            <router-link to="/admin/files?status=PENDING" class="btn btn-sm btn-accent">
              Review {{ stats.pendingFiles }} Files →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Manager Attendance Marking (Subordinate Panel) -->
      <SubordinateAttendance rolePrefix="admin" />

      <!-- Attendance Analytics & Operational Tracking -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h6 class="fw-600 mb-0"><i class="bi bi-graph-up me-2 text-primary"></i>Attendance Analytics — Managers & Team Leads</h6>
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
                  <td><span class="badge" :class="user.role === 'MANAGER' ? 'bg-primary' : 'bg-success'">{{ formatRole(user.role) }}</span></td>
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

      <!-- Operational Tracking: Recent File Activity -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-light">
          <h6 class="fw-600 mb-0"><i class="bi bi-activity me-2 text-info"></i>Operational Tracking — Recent File Activity</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Report</th>
                  <th>Actioned By</th>
                  <th>Action</th>
                  <th>Comments</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!analytics.recentActivity?.length">
                  <td colspan="5" class="text-center py-4 text-muted">No recent activity.</td>
                </tr>
                <tr v-for="log in analytics.recentActivity" :key="log.id">
                  <td>
                    <span class="fw-600 text-primary">{{ log.file?.reportNumber }}</span>
                    <small class="text-muted d-block">{{ log.file?.title }}</small>
                  </td>
                  <td>
                    <span class="fw-500">{{ log.user?.name }}</span>
                    <small class="text-muted d-block">{{ formatRole(log.user?.role) }}</small>
                  </td>
                  <td>
                    <span class="badge" :class="actionBadge(log.action)">{{ log.action }}</span>
                  </td>
                  <td class="text-muted" style="max-width: 200px;">{{ log.comments || '—' }}</td>
                  <td class="small text-muted">{{ new Date(log.createdAt).toLocaleString('en-IN') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Active Files Being Worked On -->
      <div class="card border-0 shadow-sm mt-4 mb-4">
        <div class="card-header bg-light">
          <h6 class="fw-600 mb-0"><i class="bi bi-folder-symlink me-2 text-warning"></i>Active Files — Pending Review</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Report No.</th>
                  <th>Title</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!analytics.activeFiles?.length">
                  <td colspan="5" class="text-center py-4 text-muted">No active files.</td>
                </tr>
                <tr v-for="file in analytics.activeFiles" :key="file.id">
                  <td class="fw-600 text-primary">{{ file.reportNumber }}</td>
                  <td>{{ file.title }}</td>
                  <td>
                    <span class="fw-500">{{ file.createdBy?.name }}</span>
                    <small class="text-muted d-block">{{ formatRole(file.createdBy?.role) }}</small>
                  </td>
                  <td><span class="badge bg-warning text-dark">{{ file.status?.replace('_', ' ') }}</span></td>
                  <td class="small text-muted">{{ new Date(file.updatedAt).toLocaleString('en-IN') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import StatCard from '../../components/common/StatCard.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import SubordinateAttendance from '../../components/attendance/SubordinateAttendance.vue'

const loading = ref(true)
const stats = ref({ managers: 0, teamLeads: 0, teleCallers: 0, pendingUsers: 0, pendingFiles: 0 })

const analyticsLoading = ref(true)
const analyticsMonth = ref(new Date().getMonth() + 1)
const analyticsYear = ref(new Date().getFullYear())
const analytics = ref({ attendanceData: [], recentActivity: [], activeFiles: [] })

function formatRole(role) {
  const map = { MANAGER: 'Manager', TEAM_LEAD: 'Team Lead', TELE_CALLER: 'Tele Caller', MASTER_ADMIN: 'Master Admin' }
  return map[role] || role
}

function actionBadge(action) {
  if (action === 'APPROVED') return 'bg-success'
  if (action === 'REJECTED') return 'bg-danger'
  if (action === 'REQUESTED_CHANGES') return 'bg-warning text-dark'
  return 'bg-secondary'
}

async function loadAnalytics() {
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

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/dashboard')
    stats.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
  loadAnalytics()
})
</script>
