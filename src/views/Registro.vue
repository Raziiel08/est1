<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../services/authStore'

const router = useRouter()
const nombre = ref('')
const email = ref('')
const password = ref('')
const rol = ref('estudiante_docente')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  if (!nombre.value || !email.value || !password.value) {
    error.value = 'Completá todos los campos.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'La clave debe tener al menos 6 caracteres.'
    return
  }
  cargando.value = true
  try {
    await authStore.registrarse({
      nombre: nombre.value,
      email: email.value,
      password: password.value,
      rol: rol.value,
    })
    router.push({ name: 'inicio' })
  } catch (e) {
    error.value = 'No se pudo registrar: ' + e.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="container" style="max-width: 380px; padding-top: 3rem;">
    <div class="card">
      <h1 style="margin-top:0;">Registrarse</h1>
      <p class="alert info">
        El rol se elige acá solo para poder probar los tres tipos de usuario.
        En una versión final, técnico y administrador los daría de alta el colegio.
      </p>
      <div v-if="error" class="alert error">{{ error }}</div>
      <form @submit.prevent="enviar">
        <div class="field">
          <label for="nombre">Nombre</label>
          <input id="nombre" v-model="nombre" type="text" required />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">Clave</label>
          <input id="password" v-model="password" type="password" required autocomplete="new-password" />
        </div>
        <div class="field">
          <label for="rol">Rol (simulado)</label>
          <select id="rol" v-model="rol">
            <option value="estudiante_docente">Estudiante / Docente</option>
            <option value="tecnico">Técnico</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
        <button type="submit" :disabled="cargando" style="width:100%;">
          {{ cargando ? 'Creando cuenta...' : 'Registrarme' }}
        </button>
      </form>
      <p style="margin-bottom:0;"><router-link to="/login">Volver a ingresar</router-link></p>
    </div>
  </div>
</template>
