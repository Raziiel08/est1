<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../services/authStore'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Completá usuario y clave.'
    return
  }
  cargando.value = true
  try {
    await authStore.iniciarSesion({ email: email.value, password: password.value })
    router.push({ name: 'inicio' })
  } catch (e) {
    error.value = 'No se pudo iniciar sesión: ' + e.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="container" style="max-width: 380px; padding-top: 3rem;">
    <div class="card">
      <h1 style="margin-top:0;">Ingresar</h1>
      <div v-if="error" class="alert error">{{ error }}</div>
      <form @submit.prevent="enviar">
        <div class="field">
          <label for="email">Usuario (email)</label>
          <input id="email" v-model="email" type="email" required autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">Clave</label>
          <input id="password" v-model="password" type="password" required autocomplete="current-password" />
        </div>
        <button type="submit" :disabled="cargando" style="width:100%;">
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
      <p style="margin-bottom:0;">¿No tenés cuenta? <router-link to="/registro">Registrate</router-link></p>
    </div>
  </div>
</template>
