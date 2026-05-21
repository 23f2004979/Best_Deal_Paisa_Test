<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Loan Tracker</h5>
    <div class="row g-2 mb-4">
      <div class="col-auto">
        <select v-model="month" class="form-select form-select-sm" @change="load">
          <option v-for="m in 12" :key="m" :value="m">{{ monthNames[m] }}</option>
        </select>
      </div>
      <div class="col-auto">
        <input v-model.number="year" type="number" class="form-control form-control-sm" style="width:100px" @change="load" />
      </div>
    </div>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <LoanCalendar :loans="loans" :month="month" :year="year" />
      <DataTable class="mt-4" title="loans" :columns="cols" :rows="loans">
        <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
        <template #cell-teleCaller="{ row }">{{ row.teleCaller?.name }}</template>
        <template #cell-disbursedDate="{ row }">{{ new Date(row.disbursedDate).toLocaleDateString() }}</template>
        <template #actions="{ row }">
          <button v-if="row.status === 'PENDING'" class="btn btn-outline-success btn-sm"
                  @click="approve(row.id)">Approve</button>
        </template>
      </DataTable>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import LoanCalendar from '../../components/loan/LoanCalendar.vue'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const now = new Date()
const month = ref(now.getMonth() + 1)
const year = ref(now.getFullYear())
const loading = ref(true)
const loans = ref([])
const cols = [
  { key: 'teleCaller', label: 'Tele Caller' }, { key: 'amount', label: 'Amount' },
  { key: 'disbursedDate', label: 'Date' }, { key: 'status', label: 'Status' },
]

async function load() {
  loading.value = true
  try { const { data } = await api.get(`/manager/loan?month=${month.value}&year=${year.value}`); loans.value = data.loans }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function approve(id) {
  try { await api.post(`/manager/loan/approve/${id}`); await load() }
  catch (e) { console.error(e) }
}

onMounted(load)
</script>
