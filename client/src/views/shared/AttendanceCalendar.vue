<template>
  <div class="container mt-4">
    <h2 class="mb-4">My Attendance & Salary</h2>
    
    <div class="row mb-4">
      <div class="col-md-3">
        <label>Month</label>
        <select v-model="selectedMonth" class="form-select" @change="loadData">
          <option v-for="m in 12" :key="m" :value="m">{{ new Date(2000, m-1).toLocaleString('default', { month: 'long' }) }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <label>Year</label>
        <input type="number" v-model="selectedYear" class="form-control" @change="loadData" />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row mb-4" v-if="summary">
      <div class="col-md-3">
        <div class="card bg-primary text-white shadow-sm">
          <div class="card-body">
            <h5>Total Present</h5>
            <h3>{{ summary.presentDays }} Days</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white shadow-sm">
          <div class="card-body">
            <h5>Earned Salary</h5>
            <h3>₹{{ summary.earnedSalary }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white shadow-sm">
          <div class="card-body">
            <h5>Daily Wage</h5>
            <h3>₹{{ summary.dailyWage }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar view (VIEW-ONLY for employees) -->
    <div class="card shadow-sm">
      <div class="card-header bg-light d-flex align-items-center">
        <i class="bi bi-calendar3 me-2"></i>
        <span class="fw-500">Attendance Calendar</span>
        <span class="badge bg-secondary ms-auto">View Only — Marked by your senior</span>
      </div>
      <div class="card-body">
        <div class="d-flex flex-wrap gap-2">
          <div 
            v-for="day in daysInMonth" 
            :key="day.date" 
            class="p-3 border rounded text-center"
            :class="getStyle(day.status)"
            style="width: 100px;"
          >
            <div class="fw-bold fs-5">{{ day.dayNum }}</div>
            <div class="small">{{ day.status || 'UNMARKED' }}</div>
            <div class="small" v-if="day.status === 'PRESENT'">+₹{{ day.dailyWage }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../api/axios';

const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());
const attendanceRecords = ref([]);
const summary = ref(null);

// Generate days for the selected month
const daysInMonth = computed(() => {
  const daysInMon = new Date(selectedYear.value, selectedMonth.value, 0).getDate();
  const days = [];
  for (let i = 1; i <= daysInMon; i++) {
    const d = new Date(selectedYear.value, selectedMonth.value - 1, i);
    const dStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const rec = attendanceRecords.value.find(r => r.date.split('T')[0] === dStr);
    days.push({
      dayNum: i,
      date: d,
      dateStr: dStr,
      status: rec ? rec.status : null,
      dailyWage: rec ? rec.dailyWage : 0
    });
  }
  return days;
});

const loadData = async () => {
  try {
    const res = await api.get(`/shared/attendance?month=${selectedMonth.value}&year=${selectedYear.value}`);
    attendanceRecords.value = res.data.attendance;
    summary.value = res.data.summary;
  } catch (err) {
    console.error(err);
  }
};

const getStyle = (status) => {
  if (status === 'PRESENT') return 'bg-success text-white';
  if (status === 'ABSENT') return 'bg-danger text-white';
  if (status === 'LEAVE') return 'bg-warning text-dark';
  return 'bg-light';
};

onMounted(loadData);
</script>
