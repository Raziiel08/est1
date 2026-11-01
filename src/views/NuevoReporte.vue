<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../services/authStore'
import { crearReporte, listarUbicaciones, listarCategorias } from '../services/reportesService'

const router = useRouter()

const titulo = ref('')
const descripcion = ref('')
const ubicacionId = ref('')
const categoriaId = ref('')

const ubicaciones = ref([])
const categorias = ref([])

const errores = ref({})
const errorGeneral = ref('')
const enviando = ref(false)

onMounted(async () => {
  try {
    ubicaciones.value = await listarUbicaciones()
    categorias.value = await listarCategorias()
  } catch (e) {
    errorGeneral.value = 'No se pudieron cargar las listas: ' + e.message
  }
})

function validar() {
  const e = {}
  if (!titulo.value.trim()) e.titulo = 'El título es obligatorio.'
  else if (titulo.value.length > 80) e.titulo = 'Máximo 80 caracteres.'
  if (!descripcion.value.trim()) e.descripcion = 'La descripción es obligatoria.'
  if (!ubicacionId.value) e.ubicacion = 'Elegí un lugar.'
  if (!categoriaId.value) e.categoria = 'Elegí un tipo de problema.'
  errores.value = e
  return Object.keys(e).length === 0
}

async function enviar() {
  errorGeneral.value = ''
  if (!validar()) return
  enviando.value = true
  try {
    const reporte = await crearReporte({
      titulo: titulo.value.trim(),
      descripcion: descripcion.value.trim(),
      ubicacionId: ubicacionId.value,
      categoriaId: categoriaId.value,
      autorId: authStore.state.user.id,
    })
    router.push(`/reportes/${reporte.id}`)
  } catch (e) {
    errorGeneral.value = 'No se pudo enviar el reporte: ' + e.message
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  router.push({ name: 'inicio' })
}
</script>

<template>
  <div class="card" style="max-width: 520px;">
    <h1 style="margin-top:0;">Nuevo reporte</h1>
    <div v-if="errorGeneral" class="alert error">{{ errorGeneral }}</div>
    <form @submit.prevent="enviar" novalidate>
      <div class="field">
        <label for="categoria">Tipo de problema</label>
        <select id="categoria" v-model="categoriaId">
          <option value="" disabled>Elegí una opción</option>
          <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
        <span v-if="errores.categoria" class="error">{{ errores.categoria }}</span>
      </div>

      <div class="field">
        <label for="ubicacion">Lugar</label>
        <select id="ubicacion" v-model="ubicacionId">
          <option value="" disabled>Elegí una opción</option>
          <option v-for="u in ubicaciones" :key="u.id" :value="u.id">{{ u.nombre }}</option>
        </select>
        <span v-if="errores.ubicacion" class="error">{{ errores.ubicacion }}</span>
      </div>

      <div class="field">
        <label for="titulo">Título breve</label>
        <input id="titulo" v-model="titulo" type="text" maxlength="80" placeholder="Ej: Proyector no enciende" />
        <span v-if="errores.titulo" class="error">{{ errores.titulo }}</span>
      </div>

      <div class="field">
        <label for="descripcion">Descripción</label>
        <textarea id="descripcion" v-model="descripcion" rows="4" placeholder="Contá qué pasa, desde cuándo, etc."></textarea>
        <span v-if="errores.descripcion" class="error">{{ errores.descripcion }}</span>
      </div>

      <div style="display:flex; gap:0.6rem;">
        <button type="submit" :disabled="enviando">{{ enviando ? 'Enviando...' : 'Enviar' }}</button>
        <button type="button" class="secondary" @click="cancelar">Cancelar</button>
      </div>
    </form>
  </div>
</template>
