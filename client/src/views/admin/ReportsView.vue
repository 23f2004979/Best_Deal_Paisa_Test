<template>
  <div class="page-content">
    <h5 class="page-title mb-4">Reports</h5>
    <div class="card border-0 shadow-sm p-4">
      <h6 class="fw-600 mb-3"><i class="bi bi-download me-2"></i>Download User Report</h6>
      <p class="text-muted small">Export all users data as a PDF file.</p>
      <button class="btn btn-accent" @click="downloadPDF" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        <i v-else class="bi bi-file-earmark-pdf me-2"></i>
        {{ loading ? 'Generating...' : 'Download PDF' }}
      </button>
      <div v-if="error" class="text-danger small mt-2">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../../api/axios'

const loading = ref(false)
const error = ref('')

function formatRole(role) {
  const map = { MASTER_ADMIN: 'Master Admin', MANAGER: 'Manager', TEAM_LEAD: 'Team Lead', TELE_CALLER: 'Tele Caller' }
  return map[role] || role
}

function statusColor(status) {
  const map = { ACTIVE: '#065f46', PENDING: '#92400e', BLACKLISTED: '#991b1b', DEACTIVATED: '#6b7280', REJECTED: '#991b1b' }
  return map[status] || '#1a2340'
}

function statusBg(status) {
  const map = { ACTIVE: '#d1fae5', PENDING: '#fef3c7', BLACKLISTED: '#fee2e2', DEACTIVATED: '#e5e7eb', REJECTED: '#fee2e2' }
  return map[status] || '#f3f4f6'
}

async function downloadPDF() {
  error.value = ''
  loading.value = true
  try {
    const { data: users } = await api.get('/admin/reports/download')
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

    // Build styled HTML for PDF
    const rows = users.map((u, i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;color:#1a2340;font-size:13px;">${u.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">${u.email}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${formatRole(u.role)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${statusBg(u.status)};color:${statusColor(u.status)};">${u.status}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">₹${(u.baseSalary || 0).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">${new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
      </tr>
    `).join('')

    const totalActive = users.filter(u => u.status === 'ACTIVE').length
    const totalPending = users.filter(u => u.status === 'PENDING').length

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Best Deal Paisa — User Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', 'Segoe UI', sans-serif; }
          body { background: #fff; color: #1a2340; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a2340 0%,#2d3a5e 100%);padding:28px 32px;color:#fff;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h1 style="font-size:22px;font-weight:700;margin-bottom:4px;">Best Deal Paisa</h1>
              <p style="font-size:12px;opacity:.7;">Employee Management Portal — User Report</p>
            </div>
            <div style="text-align:right;">
              <p style="font-size:12px;opacity:.7;">Generated on</p>
              <p style="font-size:14px;font-weight:500;">${dateStr} at ${timeStr}</p>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div style="display:flex;gap:16px;padding:20px 32px;background:#f8fafc;">
          <div style="flex:1;background:#fff;border-radius:10px;padding:14px 18px;border:1px solid #e5e7eb;">
            <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Total Users</p>
            <p style="font-size:24px;font-weight:700;color:#1a2340;">${users.length}</p>
          </div>
          <div style="flex:1;background:#fff;border-radius:10px;padding:14px 18px;border:1px solid #e5e7eb;">
            <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Active</p>
            <p style="font-size:24px;font-weight:700;color:#065f46;">${totalActive}</p>
          </div>
          <div style="flex:1;background:#fff;border-radius:10px;padding:14px 18px;border:1px solid #e5e7eb;">
            <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Pending</p>
            <p style="font-size:24px;font-weight:700;color:#92400e;">${totalPending}</p>
          </div>
          <div style="flex:1;background:#fff;border-radius:10px;padding:14px 18px;border:1px solid #e5e7eb;">
            <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Other</p>
            <p style="font-size:24px;font-weight:700;color:#6b7280;">${users.length - totalActive - totalPending}</p>
          </div>
        </div>

        <!-- Table -->
        <div style="padding:8px 32px 32px;">
          <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
            <thead>
              <tr style="background:#1a2340;">
                <th style="padding:12px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;">#</th>
                <th style="padding:12px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;">Name</th>
                <th style="padding:12px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;">Email</th>
                <th style="padding:12px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;">Role</th>
                <th style="padding:12px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;">Status</th>
                <th style="padding:12px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;">Base Salary</th>
                <th style="padding:12px;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;">Joined</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;color:#9ca3af;font-size:11px;">
          <span>Best Deal Paisa — Confidential</span>
          <span>Delhi NCR, India</span>
        </div>

        <!-- Auto-print -->
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
      </html>
    `

    // Open in a new window and trigger print (Save as PDF)
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    printWindow.document.write(html)
    printWindow.document.close()
  } catch (e) {
    error.value = 'Failed to generate report. Try again.'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
