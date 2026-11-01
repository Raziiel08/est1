<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  listarReportes,
  listarUbicaciones,
  listarCategorias,
} from '../services/reportesService'

const reportes = ref([])
const ubicaciones = ref([])
const categorias = ref([])
const cargando = ref(true)
const error = ref('')

const filtroEstado = ref('')
const filtroUbicacion = ref('')
const filtroCategoria = ref('')
const busqueda = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    reportes.value = await listarReportes({
      estado: filtroEstado.value || undefined,
      ubicacionId: filtroUbicacion.value || undefined,
      categoriaId: filtroCategoria.value || undefined,
      busqueda: busqueda.value || undefined,
    })
  } catch (e) {
    error.value = 'No se pudieron cargar los reportes: ' + e.message
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  ubicaciones.value = await listarUbicaciones()
  categorias.value = await listarCategorias()
  await cargar()
})

let debounceId
watch([filtroEstado, filtroUbicacion, filtroCategoria], cargar)
watch(busqueda, () => {
  clearTimeout(debounceId)
  debounceId = setTimeout(cargar, 300)
})

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString('es-AR')
}
</script>

<template>
  <div class="card">
    <h1 style="margin-top:0;">Lista de reportes</h1>

    <div class="filters">
      <input v-model="busqueda" type="search" placeholder="Buscar por título o descripción..." />
      <select v-model="filtroEstado">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="en_revision">En revisión</option>
        <option value="resuelto">Resuelto</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <select v-model="filtroUbicacion">
        <option value="">Todos los lugares</option>
        <option v-for="u in ubicaciones" :key="u.id" :value="u.id">{{ u.nombre }}</option>
      </select>
      <select v-model="filtroCategoria">
        <option value="">Todos los tipos</option>
        <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
      </select>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <p v-else-if="cargando">Cargando...</p>
    <p v-else-if="reportes.length === 0" style="color: var(--color-text-muted);">
      No se encontraron reportes con esos filtros.
    </p>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Problema</th><th>Lugar</th><th>Estado</th><th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reportes" :key="r.id">
            <td>{{ r.id }}</td>
            <td><router-link :to="`/reportes/${r.id}`">{{ r.titulo }}</router-link></td>
            <td>{{ r.ubicaciones?.nombre }}</td>
            <td><span class="badge" :class="r.estado">{{ r.estado.replace('_', ' ') }}</span></td>
            <td>{{ formatearFecha(r.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
