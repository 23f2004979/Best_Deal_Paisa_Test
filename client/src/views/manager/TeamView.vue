<template>
  <div class="page-content">
    <h5 class="page-title mb-4">My Team</h5>
    <LoadingSpinner v-if="loading" />
    <div v-else>
      <div v-for="tl in teamLeads" :key="tl.id" class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <h6 class="fw-600"><i class="bi bi-person-badge me-2"></i>{{ tl.name }} <StatusBadge :status="tl.status" /></h6>
          <p class="text-muted small mb-2">{{ tl.email }}</p>
          <div v-if="tl.teleCallers.length" class="ms-3">
            <p class="small fw-500 mb-1">Tele Callers:</p>
            <div v-for="tc in tl.teleCallers" :key="tc.id" class="d-flex align-items-center gap-2 mb-1">
              <i class="bi bi-person text-muted"></i>
              <span class="small">{{ tc.name }}</span>
              <StatusBadge :status="tc.status" />
            </div>
          </div>
          <p v-else class="text-muted small ms-3">No tele callers assigned</p>
        </div>
      </div>
      <p v-if="!teamLeads.length" class="text-muted">No team leads found.</p>
    </div>

    <SubordinateAttendance rolePrefix="manager" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import StatusBadge from '../../components/common/StatusBadge.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import SubordinateAttendance from '../../components/attendance/SubordinateAttendance.vue'

const loading = ref(true)
const teamLeads = ref([])

onMounted(async () => {
  try {
    const { data } = await api.get('/manager/team')
    teamLeads.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
