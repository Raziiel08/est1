<script setup>
import { ref, onMounted } from 'vue'
import { authStore } from '../services/authStore'
import { listarReportes } from '../services/reportesService'

const misReportes = ref([])
const cargando = ref(true)
const error = ref('')

const esTecnicoOAdmin = () =>
  ['tecnico', 'administrador'].includes(authStore.state.perfil?.rol)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    if (esTecnicoOAdmin()) {
      // Técnico/admin ven los pendientes como foco de inicio.
      misReportes.value = await listarReportes({ estado: 'pendiente' })
    } else {
      misReportes.value = await listarReportes({
        soloMios: true,
        userId: authStore.state.user?.id,
      })
    }
  } catch (e) {
    error.value = 'No se pudieron cargar los reportes: ' + e.message
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div>
    <div class="card">
      <h1 style="margin-top:0;">Hola, {{ authStore.state.perfil?.nombre || '...' }}</h1>
      <router-link to="/reportes/nuevo">
        <button>+ Nuevo reporte</button>
      </router-link>
    </div>

    <div class="card">
      <h2 style="margin-top:0;">
        {{ esTecnicoOAdmin() ? 'Reportes pendientes' : 'Mis reportes' }}
      </h2>
      <div v-if="error" class="alert error">{{ error }}</div>
      <p v-else-if="cargando">Cargando...</p>
      <p v-else-if="misReportes.length === 0" style="color: var(--color-text-muted);">
        No hay reportes para mostrar.
      </p>
      <div v-else>
        <div v-for="r in misReportes" :key="r.id" class="list-item">
          <router-link :to="`/reportes/${r.id}`">{{ r.titulo }}</router-link>
          <span class="badge" :class="r.estado">{{ r.estado.replace('_', ' ') }}</span>
        </div>
      </div>
      <p style="margin-bottom:0; margin-top:1rem;">
        <router-link to="/reportes">Ver lista general de reportes →</router-link>
      </p>
    </div>
  </div>
</template>
