<template>
  <div class="container-fluid px-4 py-3">
    <AdminDashboard v-if="role === 'MASTER_ADMIN' || role === 'ADMIN'" />
    <ManagerDashboard v-else-if="role === 'MANAGER'" />
    <TeamLeadDashboard v-else-if="role === 'TEAM_LEAD'" />
    <TeleCallerDashboard v-else-if="role === 'TELE_CALLER'" />
    <div v-else class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import AdminDashboard from '../admin/DashboardView.vue';
import ManagerDashboard from '../manager/DashboardView.vue';
import TeamLeadDashboard from '../teamlead/DashboardView.vue';
import TeleCallerDashboard from '../telecaller/DashboardView.vue';

const authStore = useAuthStore();
const role = computed(() => authStore.role);
</script>
