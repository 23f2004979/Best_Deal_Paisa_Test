<template>
  <div>
    <div class="mb-3">
      <input v-model="search" type="text" class="form-control table-search"
             :placeholder="`Search ${title}...`" />
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
            <th v-if="$slots.actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.id">
            <td v-for="col in columns" :key="col.key">
              <slot :name="`cell-${col.key}`" :row="row">
                {{ row[col.key] }}
              </slot>
            </td>
            <td v-if="$slots.actions">
              <slot name="actions" :row="row" />
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td :colspan="columns.length + 1" class="text-center text-muted py-4">
              No records found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title:   { default: 'records' },
  columns: Array,
  rows:    Array,
})

const search = ref('')
const filteredRows = computed(() => {
  if (!search.value) return props.rows
  const q = search.value.toLowerCase()
  return props.rows.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(q))
  )
})
</script>
