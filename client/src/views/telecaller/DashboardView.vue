<template>
  <div class="page-content">
    <h5 class="page-title mb-4">My Dashboard</h5>
    <LoadingSpinner v-if="loading" />
    <div v-else class="row g-3">
      <div class="col-6 col-lg-3">
        <StatCard icon="folder2" label="Total Files" :value="stats.totalFiles" color="#3b82f6" />
      </div>
      <div class="col-6 col-lg-3">
        <StatCard icon="hourglass" label="Pending Files" :value="stats.pendingFiles" color="#f97316" />
      </div>
      <div class="col-6 col-lg-3">
        <StatCard icon="calendar-check" label="Present Days" :value="stats.presentDays" color="#10b981" />
      </div>
      <div class="col-6 col-lg-3">
        <StatCard icon="cash" label="Loans This Month" :value="stats.loans" color="#8b5cf6" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import StatCard from '../../components/common/StatCard.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const loading = ref(true)
const stats = ref({ totalFiles: 0, pendingFiles: 0, presentDays: 0, loans: 0 })

onMounted(async () => {
  try { const { data } = await api.get('/telecaller/dashboard'); stats.value = data }
  catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
