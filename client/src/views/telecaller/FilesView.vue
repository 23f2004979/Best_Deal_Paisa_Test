<template>
  <div class="page-content">
    <h5 class="page-title mb-4">My Files</h5>
    <div class="card border-0 shadow-sm p-3 mb-4">
      <h6 class="fw-600 mb-3">Create New File</h6>
      <div class="row g-2">
        <div class="col-md-4">
          <input v-model="newFile.title" class="form-control form-control-sm" placeholder="File title" />
        </div>
        <div class="col-md-6">
          <input v-model="newFile.description" class="form-control form-control-sm" placeholder="Description" />
        </div>
        <div class="col-md-2">
          <button class="btn btn-accent btn-sm w-100" @click="createFile" :disabled="!newFile.title">Create</button>
        </div>
      </div>
      <div v-if="createError" class="text-danger small mt-2">{{ createError }}</div>
    </div>
    <LoadingSpinner v-if="loading" />
    <DataTable v-else title="files" :columns="cols" :rows="files">
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-createdAt="{ row }">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../api/axios'
import DataTable from '../../components/common/DataTable.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const loading = ref(true)
const files = ref([])
const createError = ref('')
const newFile = reactive({ title: '', description: '' })
const cols = [
  { key: 'title', label: 'Title' }, { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Date' },
]

async function loadFiles() {
  loading.value = true
  try { const { data } = await api.get('/telecaller/files'); files.value = data }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function createFile() {
  createError.value = ''
  try {
    await api.post('/telecaller/files', { title: newFile.title, description: newFile.description })
    newFile.title = ''; newFile.description = ''
    await loadFiles()
  } catch (e) { createError.value = e.response?.data?.message || 'Failed to create file.' }
}

onMounted(loadFiles)
</script>
