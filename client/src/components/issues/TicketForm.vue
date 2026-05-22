<template>
  <div class="row g-4">
    <!-- Issue Submission Form -->
    <div class="col-md-5">
      <div class="p-3 border-0 bg-light rounded-3">
        <h5 class="fw-bold mb-3 text-primary">Raise a New Issue</h5>
        <form @submit.prevent="submitTicket">
          <div class="mb-3">
            <label class="form-label fw-semibold text-muted">Issue Title</label>
            <input v-model="form.title" type="text" class="form-control form-control-sm border-0 bg-white" placeholder="Brief summary of the issue..." required />
          </div>
          <div class="row">
            <div class="col-12 mb-3">
              <label class="form-label fw-semibold text-muted">Category</label>
              <select v-model="form.category" class="form-select form-select-sm border-0 bg-white" required>
                <option value="" disabled>-- Select Category --</option>
                <option value="IT Support">IT Support</option>
                <option value="HR / Payroll">HR / Payroll</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold text-muted">Description</label>
            <textarea v-model="form.description" class="form-control form-control-sm border-0 bg-white" rows="4" placeholder="Detail the problem here..." required></textarea>
          </div>
          <button type="submit" class="btn btn-sm btn-primary w-100 py-2" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
            Raise Issue
          </button>
        </form>
      </div>
    </div>

    <!-- User's Previous Tickets -->
    <div class="col-md-7">
      <div class="p-3">
        <h5 class="fw-bold mb-3 text-secondary">My Submitted Issues</h5>
        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
          <table class="table table-hover table-sm table-borderless align-middle mb-0" style="font-size: 0.85rem;">
            <thead class="table-light">
              <tr>
                <th class="py-2 px-3">Title</th>
                <th class="py-2">Category</th>
                <th class="py-2">Status</th>
                <th class="py-2 text-end px-3">Raised On</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!myIssues.length">
                <td colspan="4" class="text-center py-4 text-muted">No issues raised yet.</td>
              </tr>
              <tr v-for="issue in myIssues" :key="issue.id">
                <td class="px-3">
                  <div class="fw-semibold text-dark">{{ issue.title }}</div>
                  <small class="text-muted text-truncate d-inline-block" style="max-width: 250px;">{{ issue.description }}</small>
                </td>
                <td>
                  <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ issue.category }}</span>
                </td>
                <td>
                  <span class="badge py-1 px-2" :class="statusClass(issue.status)">
                    {{ formatStatus(issue.status) }}
                  </span>
                  <small v-if="issue.status === 'RESOLVED' && issue.resolvedBy" class="text-muted d-block" style="font-size: 0.7rem; font-weight: 500; margin-top: 2px;">
                    by {{ issue.resolvedBy.name }}
                  </small>
                </td>
                <td class="text-end px-3 text-muted" style="font-size: 0.75rem;">
                  {{ new Date(issue.createdAt).toLocaleDateString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/axios';

const form = ref({
  title: '',
  category: '',
  description: ''
});

const submitting = ref(false);
const myIssues = ref([]);

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

const loadMyIssues = async () => {
  try {
    const res = await api.get('/issues/my');
    myIssues.value = res.data;
  } catch (err) {
    console.error('Failed to load issues:', err);
  }
};

const submitTicket = async () => {
  submitting.value = true;
  try {
    await api.post('/issues', form.value);
    form.value = { title: '', category: '', description: '' };
    await loadMyIssues();
  } catch (err) {
    alert('Error submitting issue: ' + (err.response?.data?.message || err.message));
  } finally {
    submitting.value = false;
  }
};

onMounted(loadMyIssues);
</script>
