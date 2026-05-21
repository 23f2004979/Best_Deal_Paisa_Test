<template>
  <div class="container-fluid px-4 py-3" style="font-size: 0.9rem;">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0 fw-bold">Employee Management</h4>
      <button class="btn btn-sm btn-primary" @click="openCreateModal">
        <i class="bi bi-person-plus me-1"></i> Add New Employee
      </button>
    </div>

    <!-- Employee List (Borderless & Transparent) -->
    <div class="table-responsive">
      <table class="table table-hover table-sm table-borderless align-middle mb-0" style="font-size: 0.85rem;">
        <thead class="table-light">
          <tr>
            <th class="py-2 px-3">Emp ID</th>
            <th class="py-2">Name</th>
            <th class="py-2">Email</th>
            <th class="py-2">Role</th>
            <th class="py-2">Assigned To</th>
            <th class="py-2">Base Salary</th>
            <th class="py-2">Status</th>
            <th class="py-2 px-3 text-nowrap text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!users.length">
            <td colspan="8" class="text-center py-4 text-muted">No employees found.</td>
          </tr>
          <tr v-for="user in users" :key="user.id">
            <td class="px-3 fw-bold text-primary">{{ user.empId }}</td>
            <td class="text-nowrap">{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ formatRole(user.role) }}</span>
            </td>
            <td>
              <span v-if="user.managerName" class="badge bg-info-subtle text-info-emphasis">{{ user.managerName }}</span>
              <span v-else-if="user.teamLeadName" class="badge bg-info-subtle text-info-emphasis">{{ user.teamLeadName }}</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="fw-semibold">₹{{ user.baseSalary?.toLocaleString('en-IN') }}</td>
            <td>
              <span class="badge py-1 px-2" :class="user.status === 'ACTIVE' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'">
                {{ user.status }}
              </span>
            </td>
            <td class="px-3 text-nowrap text-end">
              <button class="btn btn-xs btn-outline-info me-1 py-0 px-2" style="font-size: 0.75rem;" @click="openSalaryModal(user)">
                <i class="bi bi-currency-rupee"></i> Salary
              </button>
              <button class="btn btn-xs btn-outline-danger py-0 px-2" style="font-size: 0.75rem;" @click="deleteUser(user)">
                <i class="bi bi-trash"></i> Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Employee Modal -->
    <div v-if="showModal" class="modal d-block" tabindex="-1" style="background: rgba(15,23,42,0.6); backdrop-filter: blur(4px);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create Employee Account</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createEmployee">
              <div class="mb-3">
                <label>Full Name</label>
                <input v-model="form.name" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label>Email</label>
                <input v-model="form.email" type="email" class="form-control" required />
              </div>
              <div class="mb-3">
                <label>Password</label>
                <input v-model="form.password" type="password" class="form-control" required />
              </div>
              <div class="mb-3">
                <label>Role</label>
                <select v-model="form.role" class="form-select" required @change="onRoleChange">
                  <option value="MANAGER">Manager</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="TELE_CALLER">Telecaller</option>
                </select>
              </div>

              <!-- Dynamic Senior Assignment -->
              <div v-if="form.role === 'TEAM_LEAD'" class="mb-3">
                <label>Assign to Manager <span class="text-danger">*</span></label>
                <select v-model="form.managerId" class="form-select" required>
                  <option value="">-- Select Manager --</option>
                  <option v-for="mgr in seniors.managers" :key="mgr.id" :value="mgr.id">
                    {{ mgr.name }} ({{ mgr.empId }})
                  </option>
                </select>
                <div class="form-text text-muted">This Team Lead's attendance will be marked by the selected Manager.</div>
              </div>

              <div v-if="form.role === 'TELE_CALLER'" class="mb-3">
                <label>Assign to Team Lead <span class="text-danger">*</span></label>
                <select v-model="form.teamLeadId" class="form-select" required>
                  <option value="">-- Select Team Lead --</option>
                  <option v-for="tl in seniors.teamLeads" :key="tl.id" :value="tl.id">
                    {{ tl.name }} ({{ tl.empId }})
                  </option>
                </select>
                <div class="form-text text-muted">This Telecaller's attendance will be marked by the selected Team Lead.</div>
              </div>

              <div v-if="form.role === 'MANAGER'" class="mb-3">
                <div class="alert alert-info py-2 mb-0">
                  <i class="bi bi-info-circle me-1"></i>
                  Manager's attendance will be managed by the Master Admin.
                </div>
              </div>

              <div class="row">
                <div class="col-6 mb-3">
                  <label>Base Salary (Monthly)</label>
                  <input v-model="form.baseSalary" type="number" class="form-control" required />
                </div>
                <div class="col-6 mb-3">
                  <label>Daily Wage</label>
                  <input v-model="form.dailyWage" type="number" class="form-control" required />
                </div>
              </div>
              <button type="submit" class="btn btn-primary w-100" :disabled="creating">
                <span v-if="creating" class="spinner-border spinner-border-sm me-1"></span>
                Create Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Salary Config Modal -->
    <div v-if="showSalaryModal" class="modal d-block" tabindex="-1" style="background: rgba(15,23,42,0.6); backdrop-filter: blur(4px);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Update Salary: {{ selectedUser?.name }}</h5>
            <button type="button" class="btn-close" @click="showSalaryModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateSalary">
              <div class="mb-3">
                <label>New Base Salary</label>
                <input v-model="salaryForm.baseSalary" type="number" class="form-control" required />
              </div>
              <div class="mb-3">
                <label>New Daily Wage</label>
                <input v-model="salaryForm.dailyWage" type="number" class="form-control" required />
              </div>
              <div class="mb-3">
                <label>Effective Date</label>
                <input v-model="salaryForm.effectiveDate" type="date" class="form-control" required />
              </div>
              <button type="submit" class="btn btn-warning w-100">Update Salary</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal d-block" tabindex="-1" style="background: rgba(15,23,42,0.6); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
          <div class="modal-body text-center p-5">
            <div class="mb-4">
              <i class="bi bi-exclamation-triangle text-danger" style="font-size: 4rem;"></i>
            </div>
            <h3 class="fw-bold mb-3">Are you sure?</h3>
            <p class="text-muted mb-4">
              Do you really want to delete <strong>{{ userToDelete?.name }}</strong>? <br>
              This action will remove them from the system and cannot be undone.
            </p>
            <div class="d-flex gap-3 justify-content-center">
              <button class="btn btn-light px-4" @click="showDeleteModal = false">Cancel</button>
              <button class="btn btn-danger px-4 shadow-sm" @click="confirmDelete">Delete Employee</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/axios';

const users = ref([]);
const showModal = ref(false);
const showSalaryModal = ref(false);
const showDeleteModal = ref(false);
const selectedUser = ref(null);
const userToDelete = ref(null);
const creating = ref(false);

const seniors = ref({ managers: [], teamLeads: [] });

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'TELE_CALLER',
  baseSalary: 0,
  dailyWage: 0,
  managerId: '',
  teamLeadId: ''
});

const salaryForm = ref({
  baseSalary: 0,
  dailyWage: 0,
  effectiveDate: new Date().toISOString().split('T')[0]
});

function formatRole(role) {
  const map = { MANAGER: 'Manager', TEAM_LEAD: 'Team Lead', TELE_CALLER: 'Tele Caller', MASTER_ADMIN: 'Master Admin' };
  return map[role] || role;
}

function onRoleChange() {
  form.value.managerId = '';
  form.value.teamLeadId = '';
}

const loadSeniors = async () => {
  try {
    const res = await api.get('/shared/active-seniors');
    seniors.value = res.data;
  } catch (err) {
    console.error('Failed to load seniors:', err);
  }
};

const openCreateModal = async () => {
  await loadSeniors();
  form.value = { name: '', email: '', password: '', role: 'TELE_CALLER', baseSalary: 0, dailyWage: 0, managerId: '', teamLeadId: '' };
  showModal.value = true;
};

const loadUsers = async () => {
  try {
    const res = await api.get('/admin/users');
    // Enrich with senior names from the seniors list
    await loadSeniors();
    const mgrMap = {};
    const tlMap = {};
    seniors.value.managers.forEach(m => { mgrMap[m.id] = m.name; });
    seniors.value.teamLeads.forEach(t => { tlMap[t.id] = t.name; });
    users.value = res.data.map(u => ({
      ...u,
      managerName: u.managerId ? mgrMap[u.managerId] : null,
      teamLeadName: u.teamLeadId ? tlMap[u.teamLeadId] : null
    }));
  } catch (err) {
    console.error(err);
  }
};

const createEmployee = async () => {
  creating.value = true;
  try {
    const payload = { ...form.value };
    // For Managers, auto-assign to Master Admin (the current logged-in user)
    if (payload.role === 'MANAGER') {
      const userStr = localStorage.getItem('emp_user');
      if (userStr) {
        const adminUser = JSON.parse(userStr);
        payload.managerId = adminUser.id;
      }
    }
    // Clean empty strings
    if (!payload.managerId) delete payload.managerId;
    if (!payload.teamLeadId) delete payload.teamLeadId;
    
    await api.post('/auth/register', payload);
    showModal.value = false;
    loadUsers();
  } catch (err) {
    alert('Error creating user: ' + (err.response?.data?.message || err.message));
  } finally {
    creating.value = false;
  }
};

const openSalaryModal = (user) => {
  selectedUser.value = user;
  salaryForm.value = {
    baseSalary: user.baseSalary,
    dailyWage: user.dailyWage || 0,
    effectiveDate: new Date().toISOString().split('T')[0]
  };
  showSalaryModal.value = true;
};

const updateSalary = async () => {
  try {
    await api.post('/shared/salary/update', {
      userId: selectedUser.value.id,
      baseSalary: salaryForm.value.baseSalary,
      dailyWage: salaryForm.value.dailyWage,
      effectiveDate: salaryForm.value.effectiveDate
    });
    showSalaryModal.value = false;
    loadUsers();
  } catch (err) {
    alert('Error updating salary');
  }
};

const deleteUser = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  try {
    await api.patch(`/admin/users/${userToDelete.value.id}/status`, { status: 'DELETED' });
    showDeleteModal.value = false;
    userToDelete.value = null;
    loadUsers();
  } catch (err) {
    alert('Error deleting user: ' + (err.response?.data?.message || err.message));
  }
};

onMounted(loadUsers);
</script>
