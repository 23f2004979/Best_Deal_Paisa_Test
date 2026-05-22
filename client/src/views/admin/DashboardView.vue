<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Admin Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <!-- Users Overview Cards -->
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

      <!-- Reports Overview Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <StatCard icon="folder" label="Total Reports" :value="reportsStats.total" color="#6366f1" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="folder-check" label="Approved Reports" :value="reportsStats.approved" color="#22c55e" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="folder-symlink" label="Pending Reports" :value="reportsStats.pending" color="#eab308" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="folder-x" label="Rejected Reports" :value="reportsStats.rejected" color="#ef4444" />
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
            <router-link to="/admin/files?status=PENDING_APPROVAL" class="btn btn-sm btn-accent">
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
      <div class="card border-0 shadow-sm mt-4">
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

      <!-- Team Performance & Productivity Stats -->
      <div class="row g-3 mt-2">
        <div class="col-md-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-light">
              <h6 class="fw-600 mb-0"><i class="bi bi-people-fill text-primary me-2"></i>Hierarchy Analytics</h6>
            </div>
            <div class="card-body">
              <ul class="list-group list-group-flush">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Managers (Direct Reports)</span>
                  <span class="badge bg-primary rounded-pill">{{ stats.managers }}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Team Leads (Level 2)</span>
                  <span class="badge bg-success rounded-pill">{{ stats.teamLeads }}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Tele Callers (Level 3)</span>
                  <span class="badge bg-warning text-dark rounded-pill">{{ stats.teleCallers }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-light">
              <h6 class="fw-600 mb-0"><i class="bi bi-bar-chart-fill text-success me-2"></i>Operational Performance Summary</h6>
            </div>
            <div class="card-body d-flex flex-column justify-content-around">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span>Report Approval Rate</span>
                <strong class="text-success">{{ reportsStats.total ? Math.round((reportsStats.approved / reportsStats.total) * 100) : 0 }}%</strong>
              </div>
              <div class="progress mb-3" style="height: 8px;">
                <div class="progress-bar bg-success" role="progressbar" :style="{ width: (reportsStats.total ? (reportsStats.approved / reportsStats.total) * 100 : 0) + '%' }"></div>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span>Pending Reviews Ratio</span>
                <strong class="text-warning">{{ reportsStats.total ? Math.round((reportsStats.pending / reportsStats.total) * 100) : 0 }}%</strong>
              </div>
              <div class="progress mb-3" style="height: 8px;">
                <div class="progress-bar bg-warning" role="progressbar" :style="{ width: (reportsStats.total ? (reportsStats.pending / reportsStats.total) * 100 : 0) + '%' }"></div>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span>Rejected Leads Rate</span>
                <strong class="text-danger">{{ reportsStats.total ? Math.round((reportsStats.rejected / reportsStats.total) * 100) : 0 }}%</strong>
              </div>
              <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-danger" role="progressbar" :style="{ width: (reportsStats.total ? (reportsStats.rejected / reportsStats.total) * 100 : 0) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Global Report Search -->
      <div class="card border-0 shadow-sm mt-4 mb-4">
        <div class="card-header bg-light">
          <h6 class="fw-600 mb-0"><i class="bi bi-search me-2 text-primary"></i>Global Report Search</h6>
        </div>
        <div class="card-body">
          <div class="row g-3 mb-3">
            <div class="col-md-8">
              <input v-model="globalSearchQuery" type="text" class="form-control" placeholder="Search by customer name, phone, email, creator name, ID, or report number..." />
            </div>
            <div class="col-md-4">
              <select v-model="globalSearchStatus" class="form-select">
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CHANGES_REQUESTED">Changes Requested</option>
              </select>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Report No.</th>
                  <th>Title</th>
                  <th>Customer Name</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!searchedReports.length">
                  <td colspan="6" class="text-center py-4 text-muted">No reports matching search query.</td>
                </tr>
                <tr v-for="report in searchedReports" :key="report.id">
                  <td>
                    <router-link :to="'/reports?search=' + report.reportNumber" class="fw-600 text-primary">{{ report.reportNumber }}</router-link>
                  </td>
                  <td>{{ report.title }}</td>
                  <td>{{ getCustomerName(report) }}</td>
                  <td>
                    <span>{{ report.createdBy?.name }}</span>
                    <small class="text-muted d-block" style="font-size: 0.75rem;">{{ formatRole(report.createdBy?.role) }}</small>
                  </td>
                  <td>
                    <span class="badge" :class="statusBadge(report.status)">{{ report.status?.replace('_', ' ') }}</span>
                  </td>
                  <td class="small text-muted">{{ new Date(report.createdAt).toLocaleDateString('en-IN') }}</td>
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
import { ref, onMounted, computed } from 'vue'
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

const allReports = ref([])
const globalSearchQuery = ref('')
const globalSearchStatus = ref('')

const reportsStats = computed(() => {
  const total = allReports.value.length
  const approved = allReports.value.filter(r => r.status === 'APPROVED').length
  const pending = allReports.value.filter(r => r.status === 'PENDING_APPROVAL').length
  const rejected = allReports.value.filter(r => r.status === 'REJECTED').length
  return { total, approved, pending, rejected }
})

const searchedReports = computed(() => {
  let list = allReports.value
  if (globalSearchStatus.value) {
    list = list.filter(r => r.status === globalSearchStatus.value)
  }
  if (globalSearchQuery.value) {
    const q = globalSearchQuery.value.toLowerCase()
    list = list.filter(r => {
      const repNo = r.reportNumber?.toLowerCase() || ''
      const title = r.title?.toLowerCase() || ''
      const creator = r.createdBy?.name?.toLowerCase() || ''
      const empId = r.createdBy?.empId?.toLowerCase() || ''
      let details = {}
      try {
        details = r.customerDetails ? JSON.parse(r.customerDetails) : {}
      } catch {}
      const custName = details.name?.toLowerCase() || ''
      const custPhone = details.phone?.toLowerCase() || ''
      const custEmail = details.email?.toLowerCase() || ''
      
      return repNo.includes(q) || title.includes(q) || creator.includes(q) || empId.includes(q) || custName.includes(q) || custPhone.includes(q) || custEmail.includes(q)
    })
  }
  return list.slice(0, 10)
})

const getCustomerName = (report) => {
  try {
    const details = report.customerDetails ? JSON.parse(report.customerDetails) : {}
    return details.name || 'N/A'
  } catch {
    return 'N/A'
  }
}

const statusBadge = (status) => {
  if (status === 'APPROVED') return 'bg-success text-white'
  if (status === 'REJECTED') return 'bg-danger text-white'
  if (status === 'PENDING_APPROVAL' || status === 'PENDING') return 'bg-warning text-dark'
  if (status === 'CHANGES_REQUESTED') return 'bg-info text-white'
  return 'bg-secondary text-white'
}

const loadAllReports = async () => {
  try {
    const res = await api.get('/shared/reports')
    allReports.value = res.data
  } catch (err) {
    console.error('Failed to load all reports:', err)
  }
}

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
  loadAllReports()
})
</script>
