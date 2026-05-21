<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Manage Users</h5>
    <LoadingSpinner v-if="loading" />
    <DataTable v-else title="users" :columns="cols" :rows="users">
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #cell-createdAt="{ row }">
        {{ new Date(row.createdAt).toLocaleDateString() }}
      </template>
      <template #actions="{ row }">
        <div class="btn-group btn-group-sm">
          <button v-if="row.status !== 'ACTIVE'" class="btn btn-outline-success btn-sm"
                  @click="updateStatus(row.id, 'ACTIVE')">Approve</button>
          <button v-if="row.status !== 'BLACKLISTED'" class="btn btn-outline-danger btn-sm"
                  @click="updateStatus(row.id, 'BLACKLISTED')">Blacklist</button>
          <button v-if="row.status !== 'DEACTIVATED'" class="btn btn-outline-secondary btn-sm"
                  @click="updateStatus(row.id, 'DEACTIVATED')">Deactivate</button>
        </div>
      </template>
    </DataTable>

    <SubordinateAttendance rolePrefix="admin" />
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
const users = ref([])
const cols = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Joined' },
]

async function loadUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/users')
    users.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function updateStatus(id, status) {
  try {
    await api.patch(`/admin/users/${id}/status`, { status })
    await loadUsers()
  } catch (e) { console.error(e) }
}

onMounted(loadUsers)
</script>
