<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Manager Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-4">
          <StatCard icon="people" label="Team Leads" :value="stats.teamLeads" color="#3b82f6" />
        </div>
        <div class="col-6 col-lg-4">
          <StatCard icon="headset" label="Tele Callers" :value="stats.teleCallers" color="#10b981" />
        </div>
        <div class="col-6 col-lg-4">
          <StatCard icon="folder-check" label="Pending Files" :value="stats.pendingFiles" color="#ef4444" />
        </div>
      </div>

      <!-- Mark Subordinate Attendance (Team Leads) -->
      <SubordinateAttendance rolePrefix="manager" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import StatCard from '../../components/common/StatCard.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import SubordinateAttendance from '../../components/attendance/SubordinateAttendance.vue'

const loading = ref(true)
const stats = ref({ teamLeads: 0, teleCallers: 0, pendingFiles: 0 })

onMounted(async () => {
  try {
    const { data } = await api.get('/manager/dashboard')
    stats.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
