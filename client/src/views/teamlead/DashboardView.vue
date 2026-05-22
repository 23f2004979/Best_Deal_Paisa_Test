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
          <StatCard icon="cash-stack" label="Pending Loans" :value="stats.pendingLoans" color="#ef4444" />
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
          <h6 class="fw-600 mb-0"><i class="bi bi-eye text-success me-2"></i>Telecaller Report Viewer</h6>
          <div class="d-flex gap-2">
            <input v-model="searchQuery" type="text" class="form-control form-control-sm" placeholder="Search by customer/report..." style="width: 200px;" />
            <select v-model="filterStatus" class="form-select form-select-sm" style="width: auto;">
              <option value="">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
            </select>
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
const stats = ref({ teleCallers: 0, pendingLoans: 0 })

const reports = ref([])
const searchQuery = ref('')
const filterStatus = ref('')

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
    if (filterStatus.value && r.status !== filterStatus.value) return false

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
  return reports.value.filter(r => new Date(r.createdAt).toDateString() === todayStr).length
})

const todayApproved = computed(() => {
  const todayStr = new Date().toDateString()
  return reports.value.filter(r => new Date(r.createdAt).toDateString() === todayStr && r.status === 'APPROVED').length
})

const todayLoanAmount = computed(() => {
  const todayStr = new Date().toDateString()
  return reports.value
    .filter(r => new Date(r.createdAt).toDateString() === todayStr)
    .reduce((sum, r) => sum + getLoanAmount(r), 0)
})

const telecallerProductivity = computed(() => {
  const todayStr = new Date().toDateString()
  const callerMap = {}
  
  reports.value
    .filter(r => new Date(r.createdAt).toDateString() === todayStr)
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
    const res = await api.get('/shared/reports')
    reports.value = res.data
  } catch (err) {
    console.error('Failed to load reports:', err)
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/teamlead/dashboard')
    stats.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
  loadReports()
})
</script>
