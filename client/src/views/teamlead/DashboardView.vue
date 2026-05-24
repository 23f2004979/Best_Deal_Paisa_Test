<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Team Lead Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-6">
          <StatCard icon="headset" label="My Tele Callers" :value="stats.teleCallers" color="#3b82f6" />
        </div>
        <div class="col-6 col-lg-6">
          <StatCard icon="folder-check" label="Approved Loans" :value="stats.approvedLoans" color="#10b981" />
        </div>
      </div>

      <!-- Mark Subordinate Attendance (Telecallers) -->
      <SubordinateAttendance rolePrefix="teamlead" />

      <!-- Daily Productivity Tracking -->
      <div class="card border-0 shadow-sm mt-4 mb-4">
        <div class="card-header bg-light">
          <h6 class="fw-600 mb-0"><i class="bi bi-clock-history text-primary me-2"></i>Daily Productivity Tracking (Today)</h6>
        </div>
        <div class="card-body">
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <div class="border rounded p-3 text-center bg-light">
                <span class="text-muted small d-block text-uppercase fw-600" style="font-size: 0.7rem;">Today's Submissions</span>
                <span class="fs-3 fw-bold text-primary">{{ todaySubmissions }}</span>
              </div>
            </div>
            <div class="col-md-4">
              <div class="border rounded p-3 text-center bg-light">
                <span class="text-muted small d-block text-uppercase fw-600" style="font-size: 0.7rem;">Today's Approved Loans</span>
                <span class="fs-3 fw-bold text-success">{{ todayApproved }}</span>
              </div>
            </div>
            <div class="col-md-4">
              <div class="border rounded p-3 text-center bg-light">
                <span class="text-muted small d-block text-uppercase fw-600" style="font-size: 0.7rem;">Today's Verified Amount</span>
                <span class="fs-3 fw-bold text-success">₹{{ todayLoanAmount.toLocaleString('en-IN') }}</span>
              </div>
            </div>
          </div>

          <h6 class="fw-600 mb-2 small text-secondary">Telecaller Output Today</h6>
          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Telecaller Name</th>
                  <th class="text-center">Today's Reports</th>
                  <th class="text-end">Today's Verified Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!telecallerProductivity.length">
                  <td colspan="3" class="text-center py-2 text-muted small">No productivity tracked today.</td>
                </tr>
                <tr v-for="caller in telecallerProductivity" :key="caller.id">
                  <td>{{ caller.name }} <span class="text-muted small">({{ caller.empId }})</span></td>
                  <td class="text-center fw-600">{{ caller.count }}</td>
                  <td class="text-end fw-600 text-success">₹{{ caller.loanAmount.toLocaleString('en-IN') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Telecaller Report Viewer -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 class="fw-600 mb-0"><i class="bi bi-eye text-success me-2"></i>Approved Telecaller Loans</h6>
          <div class="d-flex gap-2">
            <input v-model="searchQuery" type="text" class="form-control form-control-sm" placeholder="Search by customer/report..." style="width: 200px;" />
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Report No.</th>
                  <th>Customer</th>
                  <th>Loan Amount</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredReports.length">
                  <td colspan="6" class="text-center py-4 text-muted">No reports found.</td>
                </tr>
                <tr v-for="report in filteredReports" :key="report.id">
                  <td>
                    <router-link :to="'/reports?search=' + report.reportNumber" class="fw-600 text-primary">{{ report.reportNumber }}</router-link>
                  </td>
                  <td>{{ getCustomerName(report) }}</td>
                  <td><span class="fw-600 text-success">₹{{ getLoanAmount(report).toLocaleString('en-IN') }}</span></td>
                  <td>{{ report.createdBy?.name }}</td>
                  <td><span class="badge" :class="statusBadge(report.status)">{{ report.status?.replace('_', ' ') }}</span></td>
                  <td class="small text-muted">{{ new Date(report.createdAt).toLocaleDateString('en-IN') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Support Tickets & Subordinate Issues Section -->
      <div class="row g-4 mt-2 mb-4">
        <!-- Subordinate Support Tickets (Incoming) -->
        <div class="col-12 col-xl-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <h6 class="fw-600 mb-0"><i class="bi bi-envelope-exclamation text-warning me-2"></i>Subordinate Support Tickets</h6>
              <router-link to="/issues" class="btn btn-xs btn-primary py-1 px-2" style="font-size: 0.75rem;">Manage Tickets</router-link>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="font-size: 0.85rem;">
                  <thead class="table-light">
                    <tr>
                      <th class="px-3">Reporter</th>
                      <th>Title</th>
                      <th class="px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!incomingIssues.length">
                      <td colspan="3" class="text-center py-4 text-muted">No subordinate issues pending.</td>
                    </tr>
                    <tr v-for="issue in incomingIssues.slice(0, 5)" :key="issue.id">
                      <td class="px-3">
                        <span class="fw-600 text-dark">{{ issue.reporter?.name }}</span>
                        <small class="text-muted d-block" style="font-size: 0.7rem;">{{ issue.reporter?.empId }}</small>
                      </td>
                      <td>
                        <span class="fw-600 text-dark">{{ issue.title }}</span>
                        <small class="text-muted d-block text-truncate" style="max-width: 200px;">{{ issue.description }}</small>
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

        <!-- My Submitted Tickets -->
        <div class="col-12 col-xl-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <h6 class="fw-600 mb-0"><i class="bi bi-chat-left-text text-primary me-2"></i>My Submitted Tickets</h6>
              <router-link to="/issues" class="btn btn-xs btn-primary py-1 px-2" style="font-size: 0.75rem;">Raise Ticket</router-link>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="font-size: 0.85rem;">
                  <thead class="table-light">
                    <tr>
                      <th class="px-3">Title</th>
                      <th>Category</th>
                      <th class="px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!myIssues.length">
                      <td colspan="3" class="text-center py-4 text-muted">No tickets raised.</td>
                    </tr>
                    <tr v-for="issue in myIssues.slice(0, 5)" :key="issue.id">
                      <td class="px-3">
                        <span class="fw-600 text-dark">{{ issue.title }}</span>
                        <small class="text-muted d-block text-truncate" style="max-width: 200px;">{{ issue.description }}</small>
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
const stats = ref({ teleCallers: 0, approvedLoans: 0 })

const reports = ref([])
const searchQuery = ref('')
const incomingIssues = ref([])
const myIssues = ref([])

const getCustomerName = (report) => {
  try {
    const details = report.customerDetails ? JSON.parse(report.customerDetails) : {}
    return details.name || 'N/A'
  } catch {
    return 'N/A'
  }
}

const getLoanAmount = (report) => {
  try {
    const details = report.customerDetails ? JSON.parse(report.customerDetails) : {}
    return Number(details.loanAmount) || 0
  } catch {
    return 0
  }
}

const statusBadge = (status) => {
  if (status === 'APPROVED') return 'bg-success text-white'
  if (status === 'REJECTED') return 'bg-danger text-white'
  if (status === 'PENDING_APPROVAL' || status === 'PENDING') return 'bg-warning text-dark'
  if (status === 'CHANGES_REQUESTED') return 'bg-info text-white'
  return 'bg-secondary text-white'
}

const filteredReports = computed(() => {
  return reports.value.filter(r => {
    // Only show approved reports
    if (r.status !== 'APPROVED') return false

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const repNo = r.reportNumber?.toLowerCase() || ''
      const creatorName = r.createdBy?.name?.toLowerCase() || ''
      let details = {}
      try {
        details = r.customerDetails ? JSON.parse(r.customerDetails) : {}
      } catch {}
      const custName = details.name?.toLowerCase() || ''
      
      return repNo.includes(q) || creatorName.includes(q) || custName.includes(q)
    }

    return true
  })
})

const todaySubmissions = computed(() => {
  const todayStr = new Date().toDateString()
  return reports.value.filter(r => new Date(r.createdAt).toDateString() === todayStr && r.status === 'APPROVED').length
})

const todayApproved = computed(() => {
  const todayStr = new Date().toDateString()
  return reports.value.filter(r => new Date(r.createdAt).toDateString() === todayStr && r.status === 'APPROVED').length
})

const todayLoanAmount = computed(() => {
  const todayStr = new Date().toDateString()
  return reports.value
    .filter(r => new Date(r.createdAt).toDateString() === todayStr && r.status === 'APPROVED')
    .reduce((sum, r) => sum + getLoanAmount(r), 0)
})

const telecallerProductivity = computed(() => {
  const todayStr = new Date().toDateString()
  const callerMap = {}
  
  reports.value
    .filter(r => new Date(r.createdAt).toDateString() === todayStr && r.status === 'APPROVED')
    .forEach(r => {
      const creator = r.createdBy
      if (!creator || creator.role !== 'TELE_CALLER') return
      
      if (!callerMap[creator.id]) {
        callerMap[creator.id] = {
          id: creator.id,
          name: creator.name,
          empId: creator.empId,
          count: 0,
          loanAmount: 0
        }
      }
      
      callerMap[creator.id].count += 1
      callerMap[creator.id].loanAmount += getLoanAmount(r)
    })
    
  return Object.values(callerMap)
})

const loadReports = async () => {
  try {
    const res = await api.get('/shared/reports?status=APPROVED')
    reports.value = res.data
  } catch (err) {
    console.error('Failed to load reports:', err)
  }
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
    const { data } = await api.get('/teamlead/dashboard')
    stats.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
  loadReports()

  try {
    const [incRes, myRes] = await Promise.all([
      api.get('/issues/incoming'),
      api.get('/issues/my')
    ])
    incomingIssues.value = incRes.data
    myIssues.value = myRes.data
  } catch (err) {
    console.error('Failed to load issues on TL dashboard:', err)
  }
})
</script>
