<template>
  <div class="container-fluid px-4 py-3" style="font-size: 0.9rem;">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0 fw-bold">Support Ticketing System</h4>
    </div>

    <!-- Ticket submission for TCs, TLs, and CMs -->
    <div v-if="role !== 'MASTER_ADMIN'" class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <TicketForm />
      </div>
    </div>

    <!-- Incoming tickets list for supervisors: TL, CM, MA -->
    <div v-if="role === 'MASTER_ADMIN' || role === 'MANAGER' || role === 'TEAM_LEAD'" class="card border-0 shadow-sm">
      <div class="card-body">
        <IncomingIssues />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import TicketForm from '../../components/issues/TicketForm.vue';
import IncomingIssues from '../../components/issues/IncomingIssues.vue';

const authStore = useAuthStore();
const role = computed(() => authStore.role);
</script>
