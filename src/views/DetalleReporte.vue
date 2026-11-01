<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { authStore } from '../services/authStore'
import {
  obtenerReporte,
  listarHistorial,
  cambiarEstadoReporte,
} from '../services/reportesService'

const props = defineProps({ id: { type: [String, Number], required: true } })
const route = useRoute()

const reporte = ref(null)
const historial = ref([])
const cargando = ref(true)
const error = ref('')
const guardando = ref(false)

const nuevoEstado = ref('')
const comentario = ref('')

const esTecnico = computed(() => authStore.state.perfil?.rol === 'tecnico')
const esAdmin = computed(() => authStore.state.perfil?.rol === 'administrador')
const puedeCambiarEstado = computed(() => esTecnico.value || esAdmin.value)

const opcionesEstado = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'cancelado', label: 'Cancelado' },
]

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    reporte.value = await obtenerReporte(route.params.id)
    historial.value = await listarHistorial(route.params.id)
    nuevoEstado.value = reporte.value.estado
  } catch (e) {
    error.value = 'No se pudo cargar el reporte: ' + e.message
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

async function guardarCambioEstado() {
  if (!nuevoEstado.value) return
  guardando.value = true
  error.value = ''
  try {
    await cambiarEstadoReporte({
      reporteId: reporte.value.id,
      estadoNuevo: nuevoEstado.value,
      userId: authStore.state.user.id,
      comentario: comentario.value.trim() || null,
      // Si el técnico toma un reporte sin asignar, queda asignado a él.
      tecnicoId: esTecnico.value && !reporte.value.tecnico ? authStore.state.user.id : undefined,
    })
    comentario.value = ''
    await cargar()
  } catch (e) {
    error.value = 'No se pudo actualizar el estado: ' + e.message
  } finally {
    guardando.value = false
  }
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es-AR')
}
</script>

<template>
  <div v-if="cargando">Cargando...</div>
  <div v-else-if="error" class="alert error">{{ error }}</div>
  <div v-else-if="reporte">
    <div class="card">
      <h1 style="margin-top:0;">{{ reporte.titulo }}</h1>
      <p>
        <span class="badge" :class="reporte.estado">{{ reporte.estado.replace('_', ' ') }}</span>
      </p>
      <p><strong>Lugar:</strong> {{ reporte.ubicaciones?.nombre }}</p>
      <p><strong>Tipo:</strong> {{ reporte.categorias?.nombre }}</p>
      <p><strong>Reportó:</strong> {{ reporte.autor?.nombre }} ({{ formatearFecha(reporte.created_at) }})</p>
      <p><strong>Técnico asignado:</strong> {{ reporte.tecnico?.nombre || 'Sin asignar' }}</p>
      <p><strong>Descripción:</strong><br>{{ reporte.descripcion }}</p>

      <div v-if="puedeCambiarEstado" style="border-top:1px solid var(--color-border); padding-top:1rem; margin-top:1rem;">
        <h3 style="margin-top:0;">Cambiar estado</h3>
        <div class="field">
          <label for="estado">Nuevo estado</label>
          <select id="estado" v-model="nuevoEstado">
            <option v-for="o in opcionesEstado" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="field">
          <label for="comentario">Comentario (qué se hizo o se va a hacer)</label>
          <textarea id="comentario" v-model="comentario" rows="2"></textarea>
        </div>
        <button @click="guardarCambioEstado" :disabled="guardando">
          {{ guardando ? 'Guardando...' : 'Guardar cambio' }}
        </button>
      </div>
    </div>

    <div class="card">
      <h2 style="margin-top:0;">Historial</h2>
      <p v-if="historial.length === 0" style="color: var(--color-text-muted);">Sin movimientos todavía.</p>
      <div v-for="h in historial" :key="h.id" class="comment">
        <div class="meta">
          {{ formatearFecha(h.created_at) }} · {{ h.autor?.nombre }} ·
          <span class="badge" :class="h.estado_nuevo" style="font-size:0.7rem;">{{ h.estado_nuevo.replace('_', ' ') }}</span>
        </div>
        <div v-if="h.comentario">{{ h.comentario }}</div>
      </div>
    </div>
  </div>
</template>
