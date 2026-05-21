<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Loan Report</h5>
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
      <div class="mt-3">
        <p class="text-muted small">Total loans this month: <strong>{{ loans.length }}</strong> | Total amount: <strong>₹{{ totalAmount }}</strong></p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/axios'
import LoanCalendar from '../../components/loan/LoanCalendar.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const now = new Date()
const month = ref(now.getMonth() + 1)
const year = ref(now.getFullYear())
const loading = ref(true)
const loans = ref([])
const totalAmount = computed(() => loans.value.reduce((s, l) => s + l.amount, 0))

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/admin/loan-report?month=${month.value}&year=${year.value}`)
    loans.value = data.loans
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(load)
</script>
