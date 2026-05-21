<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Team Lead Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-6">
          <StatCard icon="headset" label="My Tele Callers" :value="stats.teleCallers" color="#3b82f6" />
        </div>
        <div class="col-6 col-lg-6">
          <StatCard icon="cash-stack" label="Pending Loans" :value="stats.pendingLoans" color="#ef4444" />
        </div>
      </div>

      <!-- Mark Subordinate Attendance (Telecallers) -->
      <SubordinateAttendance rolePrefix="teamlead" />
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
const stats = ref({ teleCallers: 0, pendingLoans: 0 })

onMounted(async () => {
  try {
    const { data } = await api.get('/teamlead/dashboard')
    stats.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
