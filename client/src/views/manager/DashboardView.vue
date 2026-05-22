<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Manager Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-4">
          <StatCard icon="people" label="Team Leads" :value="stats.teamLeads" color="#3b82f6" />
        </div>
        <div class="col-6 col-lg-4">
          <StatCard icon="headset" label="Tele Callers" :value="stats.teleCallers" color="#10b981" />
        </div>
        <div class="col-6 col-lg-4">
          <StatCard icon="folder-check" label="Pending Files" :value="stats.pendingFiles" color="#ef4444" />
        </div>
      </div>

      <!-- Mark Subordinate Attendance (Team Leads) -->
      <SubordinateAttendance rolePrefix="manager" />

      <!-- Employee Performance Summary -->
      <div class="card border-0 shadow-sm mt-4 mb-4">
        <div class="card-header bg-light">
          <h6 class="fw-600 mb-0"><i class="bi bi-bar-chart-line text-success me-2"></i>My Team Performance Summary</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Employee Name</th>
                  <th>Role</th>
                  <th class="text-center">Total Reports</th>
                  <th class="text-center">Approved Rate</th>
                  <th class="text-end">Total Loan Amount Verified</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!performanceSummary.length">
                  <td colspan="5" class="text-center py-3 text-muted">No team performance details found.</td>
                </tr>
                <tr v-for="emp in performanceSummary" :key="emp.id">
                  <td>
                    <span class="fw-600 text-dark">{{ emp.name }}</span>
                    <small class="text-muted d-block" style="font-size: 0.75rem;">Emp ID: {{ emp.empId }}</small>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{ formatRole(emp.role) }}</span>
                  </td>
                  <td class="text-center fw-600">{{ emp.total }}</td>
                  <td class="text-center">
                    <span class="badge bg-success" v-if="emp.approvedRate >= 80">{{ emp.approvedRate }}%</span>
                    <span class="badge bg-warning text-dark" v-else-if="emp.approvedRate >= 50">{{ emp.approvedRate }}%</span>
                    <span class="badge bg-danger text-white" v-else>{{ emp.approvedRate }}%</span>
                  </td>
                  <td class="text-end fw-600 text-success">₹{{ emp.totalLoanAmount.toLocaleString('en-IN') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- My Team Reports Table -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 class="fw-600 mb-0"><i class="bi bi-folder-check text-primary me-2"></i>My Team Reports</h6>
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <!-- Quick search -->
            <input v-model="searchQuery" type="text" class="form-control form-control-sm" placeholder="Search report or customer..." style="width: 200px;" />
            <!-- Quick filters -->
            <select v-model="filterStatus" class="form-select form-select-sm" style="width: auto;">
              <option value="">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
            </select>
            <select v-model="filterLoanType" class="form-select form-select-sm" style="width: auto;">
              <option value="">All Loan Types</option>
              <option value="Home Loan">Home Loan</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="Car Loan">Car Loan</option>
            </select>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Report No.</th>
                  <th>Customer Name</th>
                  <th>Loan Details</th>
                  <th>Assigned TL</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredReports.length">
                  <td colspan="7" class="text-center py-4 text-muted">No reports found.</td>
                </tr>
                <tr v-for="report in filteredReports" :key="report.id">
                  <td>
                    <router-link :to="'/reports?search=' + report.reportNumber" class="fw-600 text-primary">{{ report.reportNumber }}</router-link>
                    <small class="text-muted d-block">{{ report.title }}</small>
                  </td>
                  <td>{{ getCustomerName(report) }}</td>
                  <td>
                    <span class="fw-600 text-success">₹{{ getLoanAmount(report).toLocaleString('en-IN') }}</span>
                    <small class="text-muted d-block" style="font-size: 0.75rem;">{{ getLoanType(report) }}</small>
                  </td>
                  <td>
                    <span v-if="report.createdBy?.teamLead">{{ report.createdBy.teamLead.name }}</span>
                    <span v-else class="text-muted small">None</span>
                  </td>
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
const stats = ref({ teamLeads: 0, teleCallers: 0, pendingFiles: 0 })

const reports = ref([])
const searchQuery = ref('')
const filterStatus = ref('')
const filterLoanType = ref('')

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

const getLoanType = (report) => {
  try {
    const details = report.customerDetails ? JSON.parse(report.customerDetails) : {}
    return details.loanType || 'N/A'
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

function formatRole(role) {
  const map = { MANAGER: 'Manager', TEAM_LEAD: 'Team Lead', TELE_CALLER: 'Tele Caller', MASTER_ADMIN: 'Master Admin' }
  return map[role] || role
}

const filteredReports = computed(() => {
  return reports.value.filter(r => {
    if (filterStatus.value && r.status !== filterStatus.value) return false
    
    let details = {}
    try {
      details = r.customerDetails ? JSON.parse(r.customerDetails) : {}
    } catch {}

    if (filterLoanType.value && details.loanType !== filterLoanType.value) return false

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const repNo = r.reportNumber?.toLowerCase() || ''
      const title = r.title?.toLowerCase() || ''
      const creatorName = r.createdBy?.name?.toLowerCase() || ''
      const custName = details.name?.toLowerCase() || ''
      const custPhone = details.phone?.toLowerCase() || ''
      
      return repNo.includes(q) || title.includes(q) || creatorName.includes(q) || custName.includes(q) || custPhone.includes(q)
    }

    return true
  })
})

const performanceSummary = computed(() => {
  const employeeMap = {}
  
  reports.value.forEach(r => {
    const creator = r.createdBy
    if (!creator) return
    
    if (!employeeMap[creator.id]) {
      employeeMap[creator.id] = {
        id: creator.id,
        name: creator.name,
        empId: creator.empId,
        role: creator.role,
        total: 0,
        approved: 0,
        totalLoanAmount: 0
      }
    }
    
    const emp = employeeMap[creator.id]
    emp.total += 1
    if (r.status === 'APPROVED') {
      emp.approved += 1
    }
    
    let details = {}
    try {
      details = r.customerDetails ? JSON.parse(r.customerDetails) : {}
    } catch {}
    
    emp.totalLoanAmount += Number(details.loanAmount) || 0
  })
  
  return Object.values(employeeMap).map(emp => {
    return {
      ...emp,
      approvedRate: emp.total ? Math.round((emp.approved / emp.total) * 100) : 0
    }
  }).sort((a, b) => b.totalLoanAmount - a.totalLoanAmount)
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
    const { data } = await api.get('/manager/dashboard')
    stats.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
  loadReports()
})
</script>
