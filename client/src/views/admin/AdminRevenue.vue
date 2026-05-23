<template>
  <div class="page-content px-4 py-3">
    <h5 class="page-title mb-4"><i class="bi bi-cash-coin text-primary me-2"></i>Employee Revenue Analytics</h5>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm p-3 mb-4">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <!-- Filter Mode Switches -->
        <div class="btn-group btn-group-sm" role="group" aria-label="Filter Mode">
          <button 
            type="button" 
            class="btn" 
            :class="filterMode === 'day' ? 'btn-primary' : 'btn-outline-primary'"
            @click="setFilterMode('day')"
          >
            By Day
          </button>
          <button 
            type="button" 
            class="btn" 
            :class="filterMode === 'month' ? 'btn-primary' : 'btn-outline-primary'"
            @click="setFilterMode('month')"
          >
            By Month
          </button>
          <button 
            type="button" 
            class="btn" 
            :class="filterMode === 'year' ? 'btn-primary' : 'btn-outline-primary'"
            @click="setFilterMode('year')"
          >
            By Year
          </button>
        </div>

        <!-- Dynamic Filter Controls -->
        <div class="d-flex flex-wrap align-items-center gap-2">
          <!-- Daily Date Picker -->
          <div v-if="filterMode === 'day'" class="d-flex align-items-center gap-2">
            <label class="small text-muted fw-500 mb-0">Date:</label>
            <input type="date" v-model="selectedDate" class="form-control form-control-sm" style="width: 150px;" />
          </div>

          <!-- Monthly Pickers -->
          <div v-if="filterMode === 'month'" class="d-flex align-items-center gap-2">
            <label class="small text-muted fw-500 mb-0">Month:</label>
            <select v-model="selectedMonth" class="form-select form-select-sm" style="width: 120px;">
              <option v-for="m in 12" :key="m" :value="m">
                {{ new Date(2000, m - 1).toLocaleString('default', { month: 'long' }) }}
              </option>
            </select>
            <label class="small text-muted fw-500 mb-0">Year:</label>
            <input type="number" v-model="selectedYear" class="form-control form-control-sm" style="width: 90px;" />
          </div>

          <!-- Yearly Picker -->
          <div v-if="filterMode === 'year'" class="d-flex align-items-center gap-2">
            <label class="small text-muted fw-500 mb-0">Year:</label>
            <input type="number" v-model="selectedYear" class="form-control form-control-sm" style="width: 90px;" />
          </div>

          <button class="btn btn-sm btn-accent" @click="loadRevenueReport">
            <i class="bi bi-funnel me-1"></i> Apply Filter
          </button>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <template v-else>
      <!-- KPI Overview Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3">
            <div class="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
              <i class="bi bi-wallet2 fs-4"></i>
            </div>
            <div>
              <span class="small text-muted d-block fw-500">Total Revenue Generated</span>
              <h4 class="fw-bold text-dark mb-0">₹{{ data.totalRevenue?.toLocaleString('en-IN') }}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3">
            <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
              <i class="bi bi-file-earmark-check fs-4"></i>
            </div>
            <div>
              <span class="small text-muted d-block fw-500">Total Disbursed Loans</span>
              <h4 class="fw-bold text-dark mb-0">{{ data.totalLoans }} Loans</h4>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3">
            <div class="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
              <i class="bi bi-trophy fs-4"></i>
            </div>
            <div>
              <span class="small text-muted d-block fw-500">Top Performer</span>
              <h4 class="fw-bold text-dark mb-0 text-truncate" style="max-width: 200px;">
                {{ topPerformer ? topPerformer.name : 'No sales' }}
              </h4>
              <small class="text-success fw-bold" v-if="topPerformer">
                ₹{{ topPerformer.totalRevenue?.toLocaleString('en-IN') }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Revenue Table -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-light d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <h6 class="fw-600 mb-0"><i class="bi bi-list-stars me-2 text-primary"></i>Revenue Breakdowns by Employee</h6>
          <div class="d-flex gap-2">
            <input 
              v-model="searchQuery" 
              type="text" 
              class="form-control form-control-sm" 
              placeholder="Search employee..." 
              style="width: 200px;" 
            />
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 80px;" class="text-center">Rank</th>
                  <th>Emp ID</th>
                  <th>Employee Name</th>
                  <th>Role</th>
                  <th class="text-center">Loans Count</th>
                  <th class="text-end">Revenue Generated</th>
                  <th style="width: 150px;" class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredSummary.length">
                  <td colspan="7" class="text-center py-5 text-muted">
                    <img src="/favicon.png" alt="BDP Logo" style="opacity: 0.12; height: 48px; width: 48px; filter: grayscale(1);" class="mb-2 d-block mx-auto" />
                    <span>No employee sales recorded for this period.</span>
                  </td>
                </tr>
                <tr v-for="(emp, idx) in filteredSummary" :key="emp.id">
                  <td class="text-center">
                    <span 
                      class="badge rounded-circle d-inline-flex align-items-center justify-content-center"
                      :class="idx === 0 ? 'bg-warning text-dark' : idx === 1 ? 'bg-secondary text-white' : idx === 2 ? 'bg-dark text-white' : 'bg-light text-dark'"
                      style="width: 24px; height: 24px; font-size: 0.75rem; font-weight: 700;"
                    >
                      {{ idx + 1 }}
                    </span>
                  </td>
                  <td class="fw-bold text-primary">{{ emp.empId }}</td>
                  <td class="fw-500">{{ emp.name }}</td>
                  <td><span class="badge bg-secondary-subtle text-secondary-emphasis">{{ formatRole(emp.role) }}</span></td>
                  <td class="text-center fw-600">{{ emp.loanCount }}</td>
                  <td class="text-end fw-bold text-success">₹{{ emp.totalRevenue?.toLocaleString('en-IN') }}</td>
                  <td class="text-end">
                    <button class="btn btn-xs btn-outline-primary py-1 px-3" style="font-size: 0.75rem;" @click="viewDetails(emp)">
                      <i class="bi bi-eye me-1"></i> Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Details Modal -->
    <div v-if="showDetailModal && selectedEmployee" class="modal d-block" tabindex="-1" style="background: rgba(15,23,42,0.6); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-light">
            <h5 class="modal-title fw-bold text-primary">
              <i class="bi bi-person-badge-fill me-2"></i>{{ selectedEmployee.name }} ({{ selectedEmployee.empId }})
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body p-4">
            <!-- Modal Meta Info -->
            <div class="row g-3 mb-4">
              <div class="col-6 col-sm-3">
                <small class="text-muted d-block fw-500">Designation</small>
                <strong class="text-dark">{{ formatRole(selectedEmployee.role) }}</strong>
              </div>
              <div class="col-6 col-sm-3">
                <small class="text-muted d-block fw-500">Total Loans</small>
                <strong class="text-dark">{{ selectedEmployee.loanCount }} Loans</strong>
              </div>
              <div class="col-12 col-sm-6 text-sm-end">
                <small class="text-muted d-block fw-500">Total Generated Revenue</small>
                <strong class="text-success fs-5">₹{{ selectedEmployee.totalRevenue?.toLocaleString('en-IN') }}</strong>
              </div>
            </div>

            <!-- Transaction Table -->
            <h6 class="fw-bold text-secondary mb-3 border-bottom pb-2">Loan Details List</h6>
            <div class="table-responsive" style="max-height: 300px;">
              <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                <thead class="table-light">
                  <tr>
                    <th>S.No.</th>
                    <th>Disbursement Date</th>
                    <th>Approved By</th>
                    <th class="text-end">Loan Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(loan, idx) in selectedEmployee.loans" :key="loan.id">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ loan.dateStr }}</td>
                    <td><span class="text-muted">{{ loan.approvedBy }}</span></td>
                    <td class="text-end fw-bold text-success">₹{{ loan.amount?.toLocaleString('en-IN') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-sm btn-outline-success" @click="exportCSV(selectedEmployee)">
              <i class="bi bi-file-earmark-spreadsheet me-1"></i> Export to CSV
            </button>
            <button type="button" class="btn btn-sm btn-secondary" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../api/axios'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const loading = ref(true)
const filterMode = ref('month') // 'day' | 'month' | 'year'

const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())

const searchQuery = ref('')
const data = ref({ summary: [], totalRevenue: 0, totalLoans: 0 })

const topPerformer = computed(() => {
  const list = data.value.summary || []
  return list.length > 0 ? list[0] : null
})

const filteredSummary = computed(() => {
  const list = data.value.summary || []
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase()
  return list.filter(emp => emp.name.toLowerCase().includes(q) || emp.empId.toLowerCase().includes(q))
})

const showDetailModal = ref(false)
const selectedEmployee = ref(null)

function setFilterMode(mode) {
  filterMode.value = mode
}

function formatRole(role) {
  const map = { MANAGER: 'Manager', TEAM_LEAD: 'Team Lead', TELE_CALLER: 'Tele Caller' }
  return map[role] || role
}

async function loadRevenueReport() {
  loading.value = true
  try {
    let url = `/admin/revenue-report?`
    if (filterMode.value === 'day') {
      url += `date=${selectedDate.value}`
    } else if (filterMode.value === 'month') {
      url += `month=${selectedMonth.value}&year=${selectedYear.value}`
    } else if (filterMode.value === 'year') {
      url += `year=${selectedYear.value}`
    }

    const res = await api.get(url)
    data.value = res.data
  } catch (e) {
    console.error('Failed to load revenue report:', e)
  } finally {
    loading.value = false
  }
}

function viewDetails(emp) {
  selectedEmployee.value = emp
  showDetailModal.value = true
}

function closeModal() {
  showDetailModal.value = false
  selectedEmployee.value = null
}

function exportCSV(emp) {
  const headers = ['S.No.', 'Disbursement Date', 'Approved By', 'Loan Amount'];
  const rows = emp.loans.map((loan, idx) => [
    idx + 1,
    loan.dateStr,
    loan.approvedBy,
    loan.amount
  ]);

  const csvContent = "\uFEFF" + [
    headers.join(','),
    ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `BDP_Revenue_${emp.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(loadRevenueReport)
</script>

<style scoped>
.btn-accent {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #ffffff;
  border: none;
}
.btn-accent:hover {
  background: linear-gradient(135deg, #ea580c 0%, #dd5209 100%);
  color: #ffffff;
}
.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
  border-radius: 0.2rem;
}
.modal-title {
  margin-bottom: 0;
  line-height: 1.5;
}
.modal-footer {
  border-top: 1px solid #e9ecef;
}
</style>
