<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Admin Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <!-- Users Overview Cards -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-4">
          <StatCard icon="briefcase" label="Managers" :value="stats.managers" color="#3b82f6" />
        </div>
        <div class="col-12 col-sm-4">
          <StatCard icon="people" label="Team Leads" :value="stats.teamLeads" color="#10b981" />
        </div>
        <div class="col-12 col-sm-4">
          <StatCard icon="headset" label="Tele Callers" :value="stats.teleCallers" color="#f97316" />
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

      <!-- Advanced Analytics: Leaderboard & Disbursement Trends -->
      <div class="row g-3 mt-2">
        <!-- Performance Leaderboard (Top Employees Grouped by Role) -->
        <div class="col-md-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <h6 class="fw-600 mb-0"><i class="bi bi-trophy text-warning me-2"></i>Performance Leaderboard — Top Employees</h6>
              <span class="badge bg-primary-subtle text-primary">This Month</span>
            </div>
            <div class="card-body">
              <LoadingSpinner v-if="advLoading" />
              <div v-else-if="!advAnalytics.leaderboard || !advAnalytics.leaderboard.length" class="text-center py-4 text-muted">
                No approved disbursements recorded yet.
              </div>
              <div v-else class="d-flex flex-column gap-4">
                <!-- Managers Group -->
                <div v-if="groupedLeaderboard.managers.length">
                  <div class="fw-bold text-primary mb-2 small text-uppercase tracking-wider">
                    <i class="bi bi-briefcase me-1"></i> Managers
                  </div>
                  <div class="d-flex flex-column gap-3">
                    <div v-for="(tc, idx) in groupedLeaderboard.managers" :key="tc.id" class="d-flex align-items-center gap-3">
                      <div class="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white shadow-sm"
                           :style="{
                             width: '32px', height: '32px',
                             background: idx === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' :
                                         idx === 1 ? 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)' :
                                         idx === 2 ? 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' :
                                         'linear-gradient(135deg, #93c5fd 0%, #2563eb 100%)'
                           }"
                           style="font-size: 0.85rem;"
                      >
                        {{ idx + 1 }}
                      </div>
                      <div class="flex-grow-1">
                        <div class="fw-600 text-dark" style="font-size: 0.85rem;">{{ tc.name }}</div>
                        <small class="text-muted d-block" style="font-size: 0.75rem;">ID: {{ tc.empId }}</small>
                      </div>
                      <div class="text-end">
                        <div class="fw-bold text-success" style="font-size: 0.9rem;">₹{{ tc.totalDisbursed.toLocaleString('en-IN') }}</div>
                        <small class="text-muted" style="font-size: 0.75rem;">Disbursed</small>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Team Leads Group -->
                <div v-if="groupedLeaderboard.teamLeads.length">
                  <div class="fw-bold text-success mb-2 small text-uppercase tracking-wider border-top pt-3" :class="{ 'mt-1': groupedLeaderboard.managers.length }">
                    <i class="bi bi-people me-1"></i> Team Leads
                  </div>
                  <div class="d-flex flex-column gap-3">
                    <div v-for="(tc, idx) in groupedLeaderboard.teamLeads" :key="tc.id" class="d-flex align-items-center gap-3">
                      <div class="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white shadow-sm"
                           :style="{
                             width: '32px', height: '32px',
                             background: idx === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' :
                                         idx === 1 ? 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)' :
                                         idx === 2 ? 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' :
                                         'linear-gradient(135deg, #93c5fd 0%, #2563eb 100%)'
                           }"
                           style="font-size: 0.85rem;"
                      >
                        {{ idx + 1 }}
                      </div>
                      <div class="flex-grow-1">
                        <div class="fw-600 text-dark" style="font-size: 0.85rem;">{{ tc.name }}</div>
                        <small class="text-muted d-block" style="font-size: 0.75rem;">ID: {{ tc.empId }}</small>
                      </div>
                      <div class="text-end">
                        <div class="fw-bold text-success" style="font-size: 0.9rem;">₹{{ tc.totalDisbursed.toLocaleString('en-IN') }}</div>
                        <small class="text-muted" style="font-size: 0.75rem;">Disbursed</small>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Telecallers Group -->
                <div v-if="groupedLeaderboard.telecallers.length">
                  <div class="fw-bold text-warning mb-2 small text-uppercase tracking-wider border-top pt-3" :class="{ 'mt-1': groupedLeaderboard.managers.length || groupedLeaderboard.teamLeads.length }">
                    <i class="bi bi-headset me-1"></i> Tele Callers
                  </div>
                  <div class="d-flex flex-column gap-3">
                    <div v-for="(tc, idx) in groupedLeaderboard.telecallers" :key="tc.id" class="d-flex align-items-center gap-3">
                      <div class="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white shadow-sm"
                           :style="{
                             width: '32px', height: '32px',
                             background: idx === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' :
                                         idx === 1 ? 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)' :
                                         idx === 2 ? 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' :
                                         'linear-gradient(135deg, #93c5fd 0%, #2563eb 100%)'
                           }"
                           style="font-size: 0.85rem;"
                      >
                        {{ idx + 1 }}
                      </div>
                      <div class="flex-grow-1">
                        <div class="fw-600 text-dark" style="font-size: 0.85rem;">{{ tc.name }}</div>
                        <small class="text-muted d-block" style="font-size: 0.75rem;">ID: {{ tc.empId }}</small>
                      </div>
                      <div class="text-end">
                        <div class="fw-bold text-success" style="font-size: 0.9rem;">₹{{ tc.totalDisbursed.toLocaleString('en-IN') }}</div>
                        <small class="text-muted" style="font-size: 0.75rem;">Disbursed</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Disbursement Trends by Category -->
        <div class="col-md-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-light">
              <h6 class="fw-600 mb-0"><i class="bi bi-pie-chart text-success me-2"></i>Loan Distribution & Trends</h6>
            </div>
            <div class="card-body">
              <LoadingSpinner v-if="advLoading" />
              <div v-else-if="!advAnalytics.trends || !advAnalytics.trends.length" class="text-center py-4 text-muted">
                No approved leads available for analysis.
              </div>
              <div v-else class="d-flex flex-column gap-3">
                <div v-for="item in advAnalytics.trends" :key="item.type">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-500" style="font-size: 0.85rem;">{{ item.type }}</span>
                    <span class="fw-semibold text-dark" style="font-size: 0.85rem;">₹{{ item.amount.toLocaleString('en-IN') }} ({{ item.percentage }}%)</span>
                  </div>
                  <div class="progress" style="height: 10px; background-color: #f1f5f9;">
                    <div class="progress-bar" role="progressbar" 
                         :style="{ width: item.percentage + '%', background: getTrendBarColor(item.type) }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Analytics: Approval Speeds -->
      <div class="row g-3 mt-2 mb-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light">
              <h6 class="fw-600 mb-0"><i class="bi bi-clock-history text-info me-2"></i>Operational Review Response Speeds</h6>
            </div>
            <div class="card-body">
              <LoadingSpinner v-if="advLoading" />
              <div v-else class="row text-center g-3">
                <div class="col-md-6 border-end">
                  <div class="py-2">
                    <i class="bi bi-lightning-charge-fill text-warning fs-3 mb-2 d-inline-block"></i>
                    <h3 class="fw-bold text-dark mb-1">{{ advAnalytics.avgTLHoursStr || (advAnalytics.avgTLHours + ' hrs') }}</h3>
                    <div class="text-muted" style="font-size: 0.8rem;">Average Team Lead Approval Speed</div>
                    <small class="text-muted d-block mt-2" style="font-size: 0.75rem;">Time from submission to Level 1 decision</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="py-2">
                    <i class="bi bi-check-circle-fill text-success fs-3 mb-2 d-inline-block"></i>
                    <h3 class="fw-bold text-dark mb-1">{{ advAnalytics.avgMgrHoursStr || (advAnalytics.avgMgrHours + ' hrs') }}</h3>
                    <div class="text-muted" style="font-size: 0.8rem;">Average Manager Approval Speed</div>
                    <small class="text-muted d-block mt-2" style="font-size: 0.75rem;">Time from submission to final decision</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Incoming Support Tickets Section -->
      <div class="row g-3 mt-2 mb-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <h6 class="fw-600 mb-0"><i class="bi bi-envelope-exclamation text-warning me-2"></i>Incoming Support Tickets</h6>
              <router-link to="/issues" class="btn btn-xs btn-primary py-1 px-2" style="font-size: 0.75rem;">Manage Tickets</router-link>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="font-size: 0.85rem;">
                  <thead class="table-light">
                    <tr>
                      <th class="px-3">Reporter</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th class="px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!incomingIssues.length">
                      <td colspan="4" class="text-center py-4 text-muted">No incoming tickets pending.</td>
                    </tr>
                    <tr v-for="issue in incomingIssues.slice(0, 5)" :key="issue.id">
                      <td class="px-3">
                        <span class="fw-600 text-dark">{{ issue.reporter?.name }}</span>
                        <small class="text-muted d-block" style="font-size: 0.7rem;">{{ issue.reporter?.empId }}</small>
                      </td>
                      <td>
                        <span class="fw-600 text-dark">{{ issue.title }}</span>
                        <small class="text-muted d-block text-truncate" style="max-width: 300px;">{{ issue.description }}</small>
                      </td>
                      <td>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ issue.category }}</span>
                      </td>
                      <td class="px-3">
                        <span class="badge" :class="issueStatusBadgeClass(issue.status)">{{ formatIssueStatus(issue.status) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
const incomingIssues = ref([])

const advLoading = ref(true)
const advAnalytics = ref({ leaderboard: [], trends: [], avgTLHours: 0, avgMgrHours: 0 })

const groupedLeaderboard = computed(() => {
  const list = advAnalytics.value.leaderboard || []
  const managers = list.filter(u => u.role === 'MANAGER').sort((a, b) => b.totalDisbursed - a.totalDisbursed)
  const teamLeads = list.filter(u => u.role === 'TEAM_LEAD').sort((a, b) => b.totalDisbursed - a.totalDisbursed)
  const telecallers = list.filter(u => u.role === 'TELE_CALLER').sort((a, b) => b.totalDisbursed - a.totalDisbursed)
  return { managers, teamLeads, telecallers }
})

const getTrendBarColor = (type) => {
  const t = type.toLowerCase();
  if (t.includes('home')) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  if (t.includes('personal')) return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
  if (t.includes('business')) return 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)';
  return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
}

const reportsStats = computed(() => {
  const total = allReports.value.length
  const approved = allReports.value.filter(r => r.status === 'APPROVED').length
  const pending = allReports.value.filter(r => r.status === 'PENDING_APPROVAL').length
  const rejected = allReports.value.filter(r => r.status === 'REJECTED').length
  return { total, approved, pending, rejected }
})

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

async function loadAdvancedAnalytics() {
  advLoading.value = true
  try {
    const { data } = await api.get(`/admin/advanced-analytics?month=${analyticsMonth.value}&year=${analyticsYear.value}`)
    advAnalytics.value = data
  } catch (e) {
    console.error('Advanced analytics load error:', e)
  } finally {
    advLoading.value = false
  }
}

function onPeriodChange() {
  loadAnalytics();
  loadAdvancedAnalytics();
}

const issueStatusBadgeClass = (status) => {
  if (status === 'PENDING') return 'bg-warning-subtle text-warning-emphasis'
  if (status === 'IN_PROGRESS') return 'bg-info-subtle text-info-emphasis'
  return 'bg-success-subtle text-success-emphasis'
}

const formatIssueStatus = (status) => {
  if (status === 'PENDING') return 'Pending'
  if (status === 'IN_PROGRESS') return 'In Progress'
  return 'Resolved'
}

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/dashboard')
    stats.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
  loadAnalytics()
  loadAdvancedAnalytics()
  loadAllReports()

  try {
    const res = await api.get('/issues/incoming')
    incomingIssues.value = res.data
  } catch (err) {
    console.error('Failed to load incoming issues on Admin dashboard:', err)
  }
})
</script>
