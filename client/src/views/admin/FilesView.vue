<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Manage Files</h5>
    <LoadingSpinner v-if="loading" />
    <DataTable v-else title="files" :columns="cols" :rows="files">
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #cell-createdBy="{ row }">
        {{ row.createdBy?.name }} ({{ row.createdBy?.role }})
      </template>
      <template #cell-createdAt="{ row }">
        {{ new Date(row.createdAt).toLocaleDateString() }}
      </template>
      <template #actions="{ row }">
        <div class="btn-group btn-group-sm" v-if="row.status === 'PENDING_APPROVAL'">
          <button class="btn btn-outline-success btn-sm" @click="updateStatus(row.id, 'APPROVED')">Approve</button>
          <button class="btn btn-outline-danger btn-sm" @click="updateStatus(row.id, 'REJECTED')">Reject</button>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api/axios'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const route = useRoute()
const loading = ref(true)
const files = ref([])
const cols = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdAt', label: 'Date' },
]

async function loadFiles() {
  loading.value = true
  try {
    const status = route.query.status
    let url = '/admin/files'
    if (status) {
      url += `?status=${status}`
    }
    const { data } = await api.get(url)
    files.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function updateStatus(id, status) {
  try {
    await api.post(`/shared/reports/${id}/approve`, { action: status, comments: 'Approved via Admin Panel' })
    await loadFiles()
  } catch (e) { console.error(e) }
}

onMounted(loadFiles)
</script>
