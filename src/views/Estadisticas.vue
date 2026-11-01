<script setup>
import { ref, onMounted } from 'vue'
import { obtenerEstadisticas } from '../services/reportesService'

const stats = ref(null)
const cargando = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await obtenerEstadisticas()
  } catch (e) {
    error.value = 'No se pudieron calcular las estadísticas: ' + e.message
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <div class="card">
    <h1 style="margin-top:0;">Estadísticas</h1>
    <p v-if="cargando">Calculando...</p>
    <div v-else-if="error" class="alert error">{{ error }}</div>
    <div v-else class="stat-grid">
      <div class="stat-box">
        <div class="value">{{ stats.total }}</div>
        <div class="label">Reportados</div>
      </div>
      <div class="stat-box">
        <div class="value">{{ stats.resueltos }}</div>
        <div class="label">Resueltos</div>
      </div>
      <div class="stat-box">
        <div class="value">{{ stats.promedioDias ?? '—' }}</div>
        <div class="label">Días promedio de resolución</div>
      </div>
    </div>
  </div>
</template>
