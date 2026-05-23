<template>
  <div class="page-content">
    <h5 class="page-title mb-4">My Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <StatCard icon="folder2" label="Total Files" :value="stats.totalFiles" color="#3b82f6" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="hourglass" label="Pending Files" :value="stats.pendingFiles" color="#f97316" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="calendar-check" label="Present Days" :value="stats.presentDays" color="#10b981" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard icon="cash" label="Loans This Month" :value="stats.loans" color="#8b5cf6" />
        </div>
      </div>

      <!-- Recent Files & Loans -->
      <div class="row g-4">
        <div class="col-12 col-xl-7">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light">
              <h6 class="fw-600 mb-0"><i class="bi bi-file-earmark-text text-primary me-2"></i>My Recent Files</h6>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!recentFiles.length">
                      <td colspan="3" class="text-center py-3 text-muted">
                        <img src="/favicon.png" alt="BDP Logo" style="opacity: 0.12; height: 32px; width: 32px; filter: grayscale(1);" class="mb-2 d-block mx-auto" />
                        <span>No recent files found.</span>
                      </td>
                    </tr>
                    <tr v-for="file in recentFiles" :key="file.id">
                      <td>
                        <span class="fw-600 text-dark">{{ file.title }}</span>
                        <small class="text-muted d-block text-truncate" style="font-size: 0.75rem; max-width: 280px;">{{ file.description || 'No description' }}</small>
                      </td>
                      <td>
                        <span class="badge" :class="statusBadgeClass(file.status)">{{ file.status?.replace('_', ' ') }}</span>
                      </td>
                      <td class="small text-muted">{{ new Date(file.createdAt).toLocaleDateString('en-IN') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-xl-5">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-light">
              <h6 class="fw-600 mb-0"><i class="bi bi-cash-coin text-success me-2"></i>Recent Loans Disbursed</h6>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!recentLoans.length">
                      <td colspan="3" class="text-center py-3 text-muted">
                        <img src="/favicon.png" alt="BDP Logo" style="opacity: 0.12; height: 32px; width: 32px; filter: grayscale(1);" class="mb-2 d-block mx-auto" />
                        <span>No recent loans disbursed.</span>
                      </td>
                    </tr>
                    <tr v-for="loan in recentLoans" :key="loan.id">
                      <td class="fw-600 text-success">₹{{ loan.amount.toLocaleString('en-IN') }}</td>
                      <td>
                        <span class="badge" :class="loanStatusBadgeClass(loan.status)">{{ loan.status }}</span>
                      </td>
                      <td class="small text-muted">{{ new Date(loan.disbursedDate).toLocaleDateString('en-IN') }}</td>
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
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import StatCard from '../../components/common/StatCard.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const loading = ref(true)
const stats = ref({ totalFiles: 0, pendingFiles: 0, presentDays: 0, loans: 0 })
const recentFiles = ref([])
const recentLoans = ref([])

const statusBadgeClass = (status) => {
  if (status === 'APPROVED') return 'bg-success text-white'
  if (status === 'REJECTED') return 'bg-danger text-white'
  if (status === 'PENDING_APPROVAL' || status === 'PENDING') return 'bg-warning text-dark'
  if (status === 'CHANGES_REQUESTED') return 'bg-info text-white'
  return 'bg-secondary text-white'
}

const loanStatusBadgeClass = (status) => {
  if (status === 'APPROVED') return 'bg-success text-white'
  if (status === 'REJECTED') return 'bg-danger text-white'
  return 'bg-warning text-dark'
}

onMounted(async () => {
  try {
    const { data } = await api.get('/telecaller/dashboard')
    stats.value = data

    const filesRes = await api.get('/telecaller/files')
    recentFiles.value = filesRes.data.slice(0, 5)

    const loansRes = await api.get('/telecaller/loan')
    recentLoans.value = (loansRes.data.loans || []).slice(0, 5)
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
})
</script>
