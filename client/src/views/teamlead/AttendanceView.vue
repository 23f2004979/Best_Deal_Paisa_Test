<template>
  <div class="page-content">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="page-title mb-0">My Attendance</h5>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    
    <LoadingSpinner v-if="loading" />
    <DataTable v-else title="attendance" :columns="cols" :rows="records">
      <template #cell-date="{ row }">{{ new Date(row.date).toLocaleDateString() }}</template>
      <template #cell-user="{ row }">{{ row.user?.name || 'You' }}</template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
    </DataTable>

    <SubordinateAttendance rolePrefix="teamlead" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import SubordinateAttendance from '../../components/attendance/SubordinateAttendance.vue'

const loading = ref(true)
const error = ref('')
const success = ref('')
const records = ref([])
const cols = [
  { key: 'user', label: 'Employee' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' },
]

async function loadAttendance() {
  loading.value = true
  try { 
    const { data } = await api.get('/teamlead/attendance'); 
    records.value = data.records 
  }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(loadAttendance)
</script>
