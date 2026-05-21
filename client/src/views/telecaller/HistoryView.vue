<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Application History</h5>
    <LoadingSpinner v-if="loading" />
    <DataTable v-else title="history" :columns="cols" :rows="history">
      <template #cell-file="{ row }">{{ row.file?.title }}</template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-updatedAt="{ row }">{{ new Date(row.updatedAt).toLocaleDateString() }}</template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const loading = ref(true)
const history = ref([])
const cols = [
  { key: 'file', label: 'File' }, { key: 'status', label: 'Status' }, { key: 'updatedAt', label: 'Updated' },
]

onMounted(async () => {
  try { const { data } = await api.get('/telecaller/history'); history.value = data }
  catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
