<template>
  <div class="card border-0 shadow-sm">
    <div class="card-body">
      <h6 class="fw-600 mb-3">Loan Calendar — {{ monthName }} {{ year }}</h6>
      <div class="table-responsive">
        <table class="table table-bordered table-sm text-center">
          <thead class="table-dark">
            <tr>
              <th v-for="d in daysInMonth" :key="d">{{ d }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="d in daysInMonth" :key="d">
                <span v-if="dayMap[d]" class="badge bg-success">₹{{ dayMap[d] }}</span>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  loans: Array,
  month: Number,
  year: Number,
})

const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const monthName = computed(() => monthNames[props.month] || '')
const daysInMonth = computed(() => new Date(props.year, props.month, 0).getDate())

const dayMap = computed(() => {
  const map = {}
  if (props.loans) {
    props.loans.forEach(l => {
      const day = new Date(l.disbursedDate).getDate()
      map[day] = (map[day] || 0) + l.amount
    })
  }
  return map
})
</script>
