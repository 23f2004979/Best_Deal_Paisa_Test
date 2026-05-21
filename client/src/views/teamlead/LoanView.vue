<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Loan Tracker</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <LoanCalendar :loans="loans" :month="month" :year="year" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import LoanCalendar from '../../components/loan/LoanCalendar.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const loading = ref(true)
const loans = ref([])
const now = new Date()
const month = ref(now.getMonth() + 1)
const year = ref(now.getFullYear())

onMounted(async () => {
  try { const { data } = await api.get(`/teamlead/loan?month=${month.value}&year=${year.value}`); loans.value = data.loans }
  catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
