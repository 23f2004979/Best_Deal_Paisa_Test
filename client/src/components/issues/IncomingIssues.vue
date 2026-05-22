<template>
  <div class="mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="fw-bold text-primary mb-0">Subordinate Issues & Tickets</h5>
      
      <!-- Filters -->
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" :class="{ active: selectedFilter === '' }" @click="setFilter('')">All</button>
        <button class="btn btn-outline-warning" :class="{ active: selectedFilter === 'PENDING' }" @click="setFilter('PENDING')">Pending</button>
        <button class="btn btn-outline-info" :class="{ active: selectedFilter === 'IN_PROGRESS' }" @click="setFilter('IN_PROGRESS')">In Progress</button>
        <button class="btn btn-outline-success" :class="{ active: selectedFilter === 'RESOLVED' }" @click="setFilter('RESOLVED')">Resolved</button>
      </div>
    </div>

    <!-- Incoming Issues Table -->
    <div class="table-responsive">
      <table class="table table-hover table-sm table-borderless align-middle mb-0" style="font-size: 0.85rem;">
        <thead class="table-light">
          <tr>
            <th class="py-2 px-3">Reporter</th>
            <th class="py-2">Issue Title / Description</th>
            <th class="py-2">Category</th>
            <th class="py-2">Status</th>
            <th class="py-2 px-3 text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!incomingIssues.length">
            <td colspan="5" class="text-center py-4 text-muted">No incoming issues matching this filter.</td>
          </tr>
          <tr v-for="issue in incomingIssues" :key="issue.id">
            <td class="px-3">
              <div class="fw-semibold">{{ issue.reporter?.name }}</div>
              <small class="text-muted">{{ formatRole(issue.reporter?.role) }} ({{ issue.reporter?.empId }})</small>
            </td>
            <td>
              <div class="fw-semibold text-dark">{{ issue.title }}</div>
              <small class="text-secondary">{{ issue.description }}</small>
            </td>
            <td>
              <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ issue.category }}</span>
            </td>
            <td>
              <span class="badge py-1 px-2" :class="statusClass(issue.status)">
                {{ formatStatus(issue.status) }}
              </span>
            </td>
            <td class="px-3 text-end text-nowrap">
              <button v-if="issue.status === 'PENDING'" class="btn btn-xs btn-outline-info me-1 py-0 px-2" style="font-size: 0.75rem;" @click="updateStatus(issue.id, 'IN_PROGRESS')">
                <i class="bi bi-play-fill"></i> Start
              </button>
              <button v-if="issue.status !== 'RESOLVED'" class="btn btn-xs btn-outline-success py-0 px-2" style="font-size: 0.75rem;" @click="updateStatus(issue.id, 'RESOLVED')">
                <i class="bi bi-check-lg"></i> Resolve
              </button>
              <span v-else class="text-success fw-bold d-block" style="font-size: 0.75rem;">
                <i class="bi bi-check-circle-fill"></i> Resolved
                <span v-if="issue.resolvedBy" class="text-secondary small d-block" style="font-weight: 500;">by {{ issue.resolvedBy.name }}</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/axios';

const incomingIssues = ref([]);
const selectedFilter = ref('');

function statusClass(status) {
  if (status === 'PENDING') return 'bg-warning-subtle text-warning-emphasis';
  if (status === 'IN_PROGRESS') return 'bg-info-subtle text-info-emphasis';
  return 'bg-success-subtle text-success-emphasis';
}

function formatStatus(status) {
  if (status === 'PENDING') return 'Pending';
  if (status === 'IN_PROGRESS') return 'In Progress';
  return 'Resolved';
}

function formatRole(role) {
  const map = { MANAGER: 'Manager', TEAM_LEAD: 'Team Lead', TELE_CALLER: 'Tele Caller', MASTER_ADMIN: 'Master Admin' };
  return map[role] || role;
}

const setFilter = (filter) => {
  selectedFilter.value = filter;
  loadIncomingIssues();
};

const loadIncomingIssues = async () => {
  try {
    let url = '/issues/incoming';
    if (selectedFilter.value) {
      url += `?status=${selectedFilter.value}`;
    }
    const res = await api.get(url);
    incomingIssues.value = res.data;
  } catch (err) {
    console.error('Failed to load incoming issues:', err);
  }
};

const updateStatus = async (id, status) => {
  try {
    await api.patch(`/issues/${id}/status`, { status });
    await loadIncomingIssues();
  } catch (err) {
    alert('Failed to update issue status: ' + (err.response?.data?.message || err.message));
  }
};

onMounted(loadIncomingIssues);
</script>
