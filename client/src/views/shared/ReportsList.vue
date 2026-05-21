<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-700 m-0"><i class="bi bi-folder-plus text-primary me-2"></i>Customer Reports</h2>
      <div class="d-flex gap-2">
        <button v-if="userRole !== 'TELE_CALLER' && reports.length" class="btn btn-outline-success" @click="exportToExcel">
          <i class="bi bi-file-earmark-excel me-1"></i> Export to Excel
        </button>
        <button v-if="userRole === 'TELE_CALLER'" class="btn btn-accent" @click="openCreateModal">
          <i class="bi bi-plus-lg me-1"></i> Create New Report
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="row mb-4">
      <div class="col-md-3">
        <label class="form-label">Filter by Status</label>
        <select v-model="filterStatus" class="form-select" @change="loadReports">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CHANGES_REQUESTED">Changes Requested</option>
        </select>
      </div>
    </div>

    <!-- Reports Table -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>Report No.</th>
                <th>Title</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!reports.length">
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="bi bi-folder2-open fs-2 mb-2 d-block"></i>
                  No reports found.
                </td>
              </tr>
              <tr v-for="report in reports" :key="report.id">
                <td class="fw-600 text-primary">{{ report.reportNumber }}</td>
                <td>{{ report.title }}</td>
                <td>
                  <span class="fw-500">{{ report.createdBy?.name }}</span>
                  <small class="text-muted d-block" style="font-size: 0.75rem;">{{ formatRole(report.createdBy?.role) }}</small>
                </td>
                <td>{{ new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }}</td>
                <td>
                  <span class="badge" :class="statusBadge(report.status)">
                    {{ report.status.replace('_', ' ') }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" @click="viewReportDetails(report)">
                    <i class="bi bi-eye me-1"></i> View
                  </button>
                  <button v-if="userRole === 'TELE_CALLER' && report.status !== 'APPROVED'" class="btn btn-sm btn-outline-warning" @click="editReport(report)">
                    <i class="bi bi-pencil me-1"></i> Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal d-block" tabindex="-1" style="background: rgba(15,23,42,0.6); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700 text-primary"><i class="bi bi-file-earmark-text me-2"></i>{{ editMode ? 'Edit' : 'Create' }} Customer Report</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveReport">
              <h6 class="fw-600 mb-3 border-bottom pb-2 text-secondary">General Details</h6>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Report Title</label>
                  <input v-model="form.title" type="text" class="form-control" placeholder="Enter report title" required />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Loan Type</label>
                  <select v-model="form.loanType" class="form-select" required>
                    <option value="">Select loan type</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Home Loan">Home Loan</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="LAP">Loan Against Property</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Report Description</label>
                <textarea v-model="form.description" class="form-control" rows="2" placeholder="Write a summary description..."></textarea>
              </div>

              <h6 class="fw-600 mb-3 border-bottom pb-2 pt-2 text-secondary">Customer Information</h6>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Customer Name</label>
                  <input v-model="form.customerName" type="text" class="form-control" placeholder="Enter customer full name" required />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Customer Phone</label>
                  <input v-model="form.customerPhone" type="tel" class="form-control" placeholder="10-digit mobile number" required />
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Customer Email</label>
                  <input v-model="form.customerEmail" type="email" class="form-control" placeholder="customer@email.com" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Requested Loan Amount (₹)</label>
                  <input v-model="form.loanAmount" type="number" class="form-control" placeholder="Enter loan amount" required />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Remarks / Additional Info</label>
                <textarea v-model="form.remarks" class="form-control" rows="2" placeholder="Any specific requirements or lead remarks..."></textarea>
              </div>

              <button type="submit" class="btn btn-accent w-100 mt-2">
                <i class="bi bi-save me-1"></i> Submit Report for Approval
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- View Details Modal -->
    <div v-if="showViewModal" class="modal d-block" tabindex="-1" style="background: rgba(15,23,42,0.6); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-700 text-primary">
              <i class="bi bi-file-earmark-check me-2"></i>Report Details: {{ selectedReport?.reportNumber }}
            </h5>
            <div>
              <button class="btn btn-sm btn-outline-secondary me-2" @click="downloadPDF(selectedReport)">
                <i class="bi bi-file-earmark-pdf me-1"></i> PDF
              </button>
              <button type="button" class="btn-close" @click="closeViewModal"></button>
            </div>
          </div>
          <div class="modal-body" style="max-height: calc(100vh - 200px); overflow-y: auto;">
            <!-- Overview & Status -->
            <div class="row mb-4">
              <div class="col-md-8">
                <h4 class="fw-700 m-0 mb-1">{{ selectedReport?.title }}</h4>
                <p class="text-muted m-0">{{ selectedReport?.description }}</p>
              </div>
              <div class="col-md-4 text-md-end">
                <label class="d-block text-muted small mb-1">Status</label>
                <span class="badge fs-6" :class="statusBadge(selectedReport?.status)">
                  {{ selectedReport?.status.replace('_', ' ') }}
                </span>
              </div>
            </div>

            <!-- Meta details grid -->
            <div class="card bg-light border-0 mb-4">
              <div class="card-body p-3">
                <div class="row text-center text-md-start">
                  <div class="col-md-4 mb-2 mb-md-0 border-end border-2 border-white">
                    <span class="text-muted small d-block">Created By</span>
                    <strong class="text-dark">{{ selectedReport?.createdBy?.name }}</strong>
                    <span class="text-secondary small d-block">{{ formatRole(selectedReport?.createdBy?.role) }}</span>
                  </div>
                  <div class="col-md-4 mb-2 mb-md-0 border-end border-2 border-white ps-md-4">
                    <span class="text-muted small d-block">Date Submitted</span>
                    <strong class="text-dark">{{ new Date(selectedReport?.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }}</strong>
                    <span class="text-secondary small d-block">{{ new Date(selectedReport?.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }}</span>
                  </div>
                  <div class="col-md-4 ps-md-4">
                    <span class="text-muted small d-block">Current Approval Level</span>
                    <strong class="text-dark">Level {{ selectedReport?.approvalLevel }} of 3</strong>
                    <span class="text-secondary small d-block">{{ getLevelLabel(selectedReport?.approvalLevel) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Details Card -->
            <h6 class="fw-700 text-secondary mb-3"><i class="bi bi-person-fill text-primary me-2"></i>Customer Information</h6>
            <div class="card border-0 border-start border-4 border-primary shadow-sm mb-4">
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6 col-md-4">
                    <span class="text-muted small d-block">Customer Name</span>
                    <span class="fw-600 text-dark">{{ parsedDetails.name || 'N/A' }}</span>
                  </div>
                  <div class="col-6 col-md-4">
                    <span class="text-muted small d-block">Phone Number</span>
                    <span class="fw-600 text-dark">{{ parsedDetails.phone || 'N/A' }}</span>
                  </div>
                  <div class="col-12 col-md-4">
                    <span class="text-muted small d-block">Email Address</span>
                    <span class="fw-600 text-dark">{{ parsedDetails.email || 'N/A' }}</span>
                  </div>
                  <div class="col-6 col-md-4">
                    <span class="text-muted small d-block">Requested Amount</span>
                    <span class="fw-600 text-success">₹{{ Number(parsedDetails.loanAmount || 0).toLocaleString('en-IN') }}</span>
                  </div>
                  <div class="col-6 col-md-4">
                    <span class="text-muted small d-block">Loan Category</span>
                    <span class="fw-600 text-primary">{{ parsedDetails.loanType || 'N/A' }}</span>
                  </div>
                  <div class="col-12">
                    <span class="text-muted small d-block">Customer Remarks</span>
                    <p class="text-dark m-0 small">{{ parsedDetails.remarks || 'No remarks provided.' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Approval Checklists / Comments -->
            <h6 class="fw-700 text-secondary mb-3"><i class="bi bi-clock-history text-primary me-2"></i>Approval History & Log</h6>
            <div class="timeline mb-4">
              <div v-if="!selectedReport?.approvalLogs || !selectedReport.approvalLogs.length" class="text-muted small p-2">
                No logs recorded yet.
              </div>
              <div v-else class="list-group list-group-flush border-bottom">
                <div v-for="log in selectedReport.approvalLogs" :key="log.id" class="list-group-item px-0 py-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <span class="badge me-2" :class="statusBadge(log.action)">
                        {{ log.action.replace('_', ' ') }}
                      </span>
                      <strong class="text-dark">{{ log.user?.name }}</strong>
                      <small class="text-muted ms-1">({{ formatRole(log.user?.role) }})</small>
                    </div>
                    <small class="text-muted">{{ new Date(log.createdAt).toLocaleDateString('en-IN') }} {{ new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }}</small>
                  </div>
                  <div class="mt-2 text-dark bg-light p-2 rounded small" style="border-left: 3px solid #cbd5e1;">
                    <span class="text-muted fw-600 d-block" style="font-size: 0.7rem; text-transform: uppercase;">Comment:</span>
                    {{ log.comments || 'No comment added.' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Panel for approval -->
            <div v-if="canApprove(selectedReport)" class="card border-0 bg-light p-3 mt-4 border-top border-4 border-warning shadow-sm">
              <h6 class="fw-700 text-dark mb-3"><i class="bi bi-shield-check text-warning me-2"></i>Required Approval Action</h6>
              <div class="mb-3">
                <label class="form-label small fw-600 text-muted">Add Review Comments (Optional)</label>
                <textarea v-model="approvalComment" class="form-control bg-white" rows="2" placeholder="Write comments to justify your approval, rejection or requested modifications..."></textarea>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-outline-warning btn-sm" @click="submitApproval(selectedReport, 'CHANGES_REQUESTED')">
                  <i class="bi bi-arrow-counterclockwise me-1"></i> Request Changes
                </button>
                <button class="btn btn-danger btn-sm" @click="submitApproval(selectedReport, 'REJECTED')">
                  <i class="bi bi-x-circle me-1"></i> Reject
                </button>
                <button class="btn btn-success btn-sm" @click="submitApproval(selectedReport, 'APPROVED')">
                  <i class="bi bi-check-circle me-1"></i> Approve Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../api/axios';

const reports = ref([]);
const userRole = ref('');
const filterStatus = ref('');

const showModal = ref(false);
const showViewModal = ref(false);
const editMode = ref(false);
const currentId = ref(null);

const approvalComment = ref('');
const selectedReport = ref(null);

const form = ref({
  title: '',
  description: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  loanAmount: '',
  loanType: '',
  remarks: ''
});

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('emp_user') || '{}');
  userRole.value = user.role;
  loadReports();
});

const loadReports = async () => {
  try {
    let url = '/shared/reports';
    if (filterStatus.value) url += `?status=${filterStatus.value}`;
    const res = await api.get(url);
    reports.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

const statusBadge = (status) => {
  if (status === 'APPROVED') return 'bg-success text-white';
  if (status === 'REJECTED') return 'bg-danger text-white';
  if (status === 'PENDING_APPROVAL' || status === 'PENDING') return 'bg-warning text-dark';
  if (status === 'CHANGES_REQUESTED') return 'bg-info text-white';
  return 'bg-secondary text-white';
};

const formatRole = (role) => {
  const map = {
    MASTER_ADMIN: 'Master Admin',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    TEAM_LEAD: 'Team Lead',
    TELE_CALLER: 'Tele Caller'
  };
  return map[role] || role;
};

const getLevelLabel = (level) => {
  if (level === 1) return 'Pending Team Lead approval';
  if (level === 2) return 'Pending Manager approval';
  if (level === 3) return 'Pending Admin approval';
  return 'Fully approved';
};

const parsedDetails = computed(() => {
  if (!selectedReport.value || !selectedReport.value.customerDetails) return {};
  try {
    return typeof selectedReport.value.customerDetails === 'string'
      ? JSON.parse(selectedReport.value.customerDetails)
      : selectedReport.value.customerDetails;
  } catch (e) {
    console.error('Failed to parse customerDetails', e);
    return {};
  }
});

const openCreateModal = () => {
  editMode.value = false;
  form.value = {
    title: '',
    description: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    loanAmount: '',
    loanType: '',
    remarks: ''
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editMode.value = false;
};

const closeViewModal = () => {
  showViewModal.value = false;
  selectedReport.value = null;
  approvalComment.value = '';
};

const viewReportDetails = (report) => {
  selectedReport.value = report;
  showViewModal.value = true;
  // Track file viewing activity for operational monitoring
  if (userRole.value !== 'TELE_CALLER') {
    api.post(`/shared/reports/${report.id}/track`).catch(() => {});
  }
};

const editReport = (report) => {
  currentId.value = report.id;
  let details = {};
  try {
    details = report.customerDetails ? JSON.parse(report.customerDetails) : {};
  } catch (e) {
    console.error(e);
  }

  form.value = {
    title: report.title,
    description: report.description,
    customerName: details.name || '',
    customerPhone: details.phone || '',
    customerEmail: details.email || '',
    loanAmount: details.loanAmount || '',
    loanType: details.loanType || '',
    remarks: details.remarks || ''
  };
  editMode.value = true;
  showModal.value = true;
};

const saveReport = async () => {
  try {
    const customerDetails = {
      name: form.value.customerName,
      phone: form.value.customerPhone,
      email: form.value.customerEmail,
      loanAmount: Number(form.value.loanAmount) || 0,
      loanType: form.value.loanType,
      remarks: form.value.remarks
    };

    const payload = {
      title: form.value.title,
      description: form.value.description,
      customerDetails
    };

    if (editMode.value) {
      await api.put(`/shared/reports/${currentId.value}`, payload);
    } else {
      await api.post('/shared/reports', payload);
    }
    closeModal();
    loadReports();
  } catch (err) {
    alert('Error saving report. Please check input parameters.');
  }
};

const canApprove = (report) => {
  if (!report || report.status !== 'PENDING_APPROVAL') return false;
  if (userRole.value === 'TEAM_LEAD' && report.approvalLevel === 1) return true;
  if (userRole.value === 'MANAGER' && report.approvalLevel <= 2) return true;
  if ((userRole.value === 'ADMIN' || userRole.value === 'MASTER_ADMIN') && report.approvalLevel <= 3) return true;
  return false;
};

const submitApproval = async (report, action) => {
  try {
    await api.post(`/shared/reports/${report.id}/approve`, { 
      action, 
      comments: approvalComment.value 
    });
    approvalComment.value = '';
    
    // Refresh the loaded reports and the current selected report modal data
    let url = '/shared/reports';
    if (filterStatus.value) url += `?status=${filterStatus.value}`;
    const res = await api.get(url);
    reports.value = res.data;
    
    // Find the updated report record in the list and set it as selected
    const updated = res.data.find(r => r.id === report.id);
    if (updated) {
      selectedReport.value = updated;
    } else {
      closeViewModal();
    }
  } catch (err) {
    alert('Error processing approval: ' + (err.response?.data?.message || err.message));
  }
};

const exportToExcel = () => {
  const headers = [
    'Report Number', 'Title', 'Description', 'Created By', 'Role', 
    'Status', 'Date', 'Customer Name', 'Customer Phone', 
    'Customer Email', 'Loan Amount', 'Loan Type', 'Remarks'
  ];
  
  const rows = reports.value.map(r => {
    let details = {};
    try {
      details = r.customerDetails ? JSON.parse(r.customerDetails) : {};
    } catch {}
    
    return [
      r.reportNumber,
      r.title,
      r.description || '',
      r.createdBy?.name || '',
      r.createdBy?.role || '',
      r.status,
      new Date(r.createdAt).toLocaleDateString(),
      details.name || '',
      details.phone || '',
      details.email || '',
      details.loanAmount || '',
      details.loanType || '',
      details.remarks || ''
    ];
  });
  
  const csvContent = "\uFEFF" + [
    headers.join(','), 
    ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `BDP_Customer_Reports_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadPDF = (report) => {
  let details = {};
  try {
    details = report.customerDetails ? JSON.parse(report.customerDetails) : {};
  } catch {}

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const docDate = new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Generate HTML for print
  const logsHtml = report.approvalLogs && report.approvalLogs.length 
    ? report.approvalLogs.map(log => `
      <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
          <div>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${log.action === 'APPROVED' ? '#d1fae5' : log.action === 'REJECTED' ? '#fee2e2' : '#e0f2fe'}; color: ${log.action === 'APPROVED' ? '#065f46' : log.action === 'REJECTED' ? '#991b1b' : '#0369a1'};">
              ${log.action.replace('_', ' ')}
            </span>
            <strong style="font-size: 13px; color: #1e293b; margin-left: 6px;">${log.user?.name}</strong>
            <span style="font-size: 12px; color: #64748b;">(${formatRole(log.user?.role)})</span>
          </div>
          <span style="font-size: 11px; color: #64748b;">${new Date(log.createdAt).toLocaleDateString('en-IN')} ${new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p style="margin: 0; font-size: 12px; color: #334155; padding-left: 10px; border-left: 2px solid #cbd5e1;">${log.comments || 'No comment added.'}</p>
      </div>
    `).join('')
    : '<p style="color:#64748b; font-size:12px; margin:0;">No approval history recorded.</p>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Report — ${report.reportNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #fff; color: #1e293b; padding: 40px; }
        .header { border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header-title { font-size: 24px; font-weight: 700; color: #0f172a; }
        .header-meta { text-align: right; font-size: 12px; color: #64748b; }
        .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #ea580c; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; margin-top: 30px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
        .grid-full { grid-column: span 3; }
        .field { margin-bottom: 5px; }
        .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px; }
        .value { font-size: 13px; color: #1e293b; font-weight: 500; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .timeline { border-left: 2px solid #cbd5e1; padding-left: 20px; margin-left: 10px; }
        @media print {
          body { padding: 20px; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="header-title">Best Deal Paisa</h1>
          <p style="font-size:12px; color:#ea580c; font-weight:600;">Customer Lead Verification Report</p>
        </div>
        <div class="header-meta">
          <p>Report No: <strong>${report.reportNumber}</strong></p>
          <p>Generated: ${dateStr} ${timeStr}</p>
        </div>
      </div>

      <div class="section-title">Lead Overview</div>
      <div class="grid">
        <div class="field">
          <span class="label">Report Title</span>
          <span class="value">${report.title}</span>
        </div>
        <div class="field">
          <span class="label">Created By</span>
          <span class="value">${report.createdBy?.name} (${formatRole(report.createdBy?.role)})</span>
        </div>
        <div class="field">
          <span class="label">Submission Date</span>
          <span class="value">${docDate}</span>
        </div>
        <div class="field">
          <span class="label">Current Status</span>
          <span class="value">
            <span class="badge" style="background: ${report.status === 'APPROVED' ? '#d1fae5' : report.status === 'REJECTED' ? '#fee2e2' : '#fef3c7'}; color: ${report.status === 'APPROVED' ? '#065f46' : report.status === 'REJECTED' ? '#991b1b' : '#92400e'};">
              ${report.status.replace('_', ' ')}
            </span>
          </span>
        </div>
        <div class="field" style="grid-column: span 2;">
          <span class="label">General Description</span>
          <span class="value">${report.description || 'No description provided.'}</span>
        </div>
      </div>

      <div class="section-title">Customer details</div>
      <div class="grid">
        <div class="field">
          <span class="label">Customer Name</span>
          <span class="value">${details.name || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Phone Number</span>
          <span class="value">${details.phone || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Email Address</span>
          <span class="value">${details.email || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Loan Amount</span>
          <span class="value" style="color: #059669; font-weight: 700;">₹${Number(details.loanAmount || 0).toLocaleString('en-IN')}</span>
        </div>
        <div class="field">
          <span class="label">Loan Category</span>
          <span class="value">${details.loanType || 'N/A'}</span>
        </div>
        <div class="field grid-full">
          <span class="label">Customer Remarks / Lead Notes</span>
          <span class="value" style="display:block; background:#f8fafc; padding:10px; border-radius:6px; border: 1px solid #e2e8f0;">${details.remarks || 'No remarks added.'}</span>
        </div>
      </div>

      <div class="section-title">Approval Flow Timeline</div>
      <div style="margin-top: 10px;">
        ${logsHtml}
      </div>

      <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Best Deal Paisa Employee Portal &bull; Private & Confidential Document
      </div>

      <script>
        window.onload = function() { window.print(); }
      <\/script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  printWindow.document.write(html);
  printWindow.document.close();
};
</script>

<style scoped>
.timeline {
  position: relative;
  padding-left: 10px;
}
</style>
