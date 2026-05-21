<template>
  <div class="page-content">
    <h5 class="page-title mb-4">My Salary</h5>
    <LoadingSpinner v-if="loading" />
    <DataTable v-else title="salary" :columns="cols" :rows="salaries">
      <template #cell-netSalary="{ row }">₹{{ row.netSalary.toLocaleString() }}</template>
      <template #cell-baseSalary="{ row }">₹{{ row.baseSalary.toLocaleString() }}</template>
      <template #cell-deductions="{ row }">₹{{ row.deductions.toLocaleString() }}</template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import DataTable from '../../components/common/DataTable.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const loading = ref(true)
const salaries = ref([])
const cols = [
  { key: 'month', label: 'Month' }, { key: 'year', label: 'Year' },
  { key: 'baseSalary', label: 'Base' }, { key: 'attendanceDays', label: 'Days' },
  { key: 'deductions', label: 'Deductions' }, { key: 'netSalary', label: 'Net Salary' },
]

onMounted(async () => {
  try { const { data } = await api.get('/teamlead/salary'); salaries.value = data }
  catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
