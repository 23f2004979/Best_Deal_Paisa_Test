<template>
  <div class="card border-0 shadow-sm p-4 mt-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
      <h6 class="fw-600 mb-0"><i class="bi bi-people me-2"></i>Team Attendance & Salary Projection</h6>
      <div class="d-flex gap-2">
        <input 
          v-model="searchQuery" 
          type="text" 
          class="form-control form-control-sm" 
          placeholder="Search by name..." 
          style="max-width: 180px;"
        />
        <select 
          v-model="selectedRole" 
          class="form-select form-select-sm" 
          style="max-width: 140px;"
        >
          <option value="">All Roles</option>
          <option value="MANAGER">Managers</option>
          <option value="TEAM_LEAD">Team Leads</option>
          <option value="TELE_CALLER">Tele Callers</option>
        </select>
      </div>
    </div>
    
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <LoadingSpinner v-if="loading" />
    <div v-else class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Present</th>
            <th>Half-Day</th>
            <th>Absent</th>
            <th>Leave</th>
            <th>Projected Salary</th>
            <th class="text-end">Today's Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="8" class="text-center py-4 text-muted">
              <img src="/favicon.png" alt="BDP Logo" style="opacity: 0.12; height: 36px; width: 36px; filter: grayscale(1);" class="mb-2 d-block mx-auto" />
              <span>No subordinates found.</span>
            </td>
          </tr>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td class="fw-500">{{ user.name }}</td>
            <td><span class="badge bg-secondary">{{ formatRole(user.role) }}</span></td>
            <td><span class="badge bg-success">{{ user.presentDays }}</span></td>
            <td><span class="badge bg-info text-white">{{ user.halfDays || 0 }}</span></td>
            <td><span class="badge bg-danger">{{ user.absentDays || 0 }}</span></td>
            <td><span class="badge bg-warning text-dark">{{ user.leaveDays || 0 }}</span></td>
            <td class="fw-500 text-success">₹{{ user.projectedSalary.toLocaleString() }}</td>
            <td class="text-end">
              <div class="btn-group btn-group-sm">
                <button 
                  class="btn"
                  :class="user.todayStatus === 'PRESENT' ? 'btn-success' : 'btn-outline-success'"
                  :disabled="marking === user.id"
                  @click="markAttendance(user.id, 'PRESENT')"
                  title="Mark Present"
                >
                  <i class="bi bi-check-circle"></i> P
                </button>
                <button 
                  class="btn"
                  :class="user.todayStatus === 'HALF_DAY' ? 'btn-info' : 'btn-outline-info'"
                  :disabled="marking === user.id"
                  @click="markAttendance(user.id, 'HALF_DAY')"
                  title="Mark Half-Day"
                >
                  <i class="bi bi-circle-half"></i> H
                </button>
                <button 
                  class="btn"
                  :class="user.todayStatus === 'ABSENT' ? 'btn-danger' : 'btn-outline-danger'"
                  :disabled="marking === user.id"
                  @click="markAttendance(user.id, 'ABSENT')"
                  title="Mark Absent"
                >
                  <i class="bi bi-x-circle"></i> A
                </button>
                <button 
                  class="btn"
                  :class="user.todayStatus === 'LEAVE' ? 'btn-warning' : 'btn-outline-warning'"
                  :disabled="marking === user.id"
                  @click="markAttendance(user.id, 'LEAVE')"
                  title="Mark Leave"
                >
                  <i class="bi bi-dash-circle"></i> L
                </button>
              </div>
              <span v-if="marking === user.id" class="spinner-border spinner-border-sm ms-2"></span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner.vue'

const props = defineProps({
  rolePrefix: { type: String, required: true } // 'admin', 'manager', 'teamlead'
})

const loading = ref(true)
const marking = ref(null)
const error = ref('')
const success = ref('')
const users = ref([])

const searchQuery = ref('')
const selectedRole = ref('')

const filteredUsers = computed(() => {
  let list = users.value || []
  if (selectedRole.value) {
    list = list.filter(u => u.role === selectedRole.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(u => u.name.toLowerCase().includes(q))
  }
  return list
})

function formatRole(role) {
  const map = { MANAGER: 'Manager', TEAM_LEAD: 'Team Lead', TELE_CALLER: 'Tele Caller' }
  return map[role] || role
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get(`/${props.rolePrefix}/subordinate-attendance`)
    users.value = data
  } catch (e) {
    error.value = 'Failed to load team attendance.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function markAttendance(userId, status) {
  marking.value = userId
  error.value = ''
  success.value = ''
  try {
    const { data } = await api.post(`/${props.rolePrefix}/subordinate-attendance/${userId}`, { status })
    success.value = data.message
    await loadData()
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to mark attendance.'
  } finally {
    marking.value = null
  }
}

onMounted(loadData)
</script>
