<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authStore } from './services/authStore'

const router = useRouter()
const route = useRoute()

onMounted(() => {
  authStore.inicializar()
})

const rolLabel = {
  estudiante_docente: 'Estudiante/Docente',
  tecnico: 'Técnico',
  administrador: 'Administrador',
}

async function salir() {
  await authStore.cerrarSesion()
  router.push({ name: 'login' })
}
</script>

<template>
  <header v-if="!route.meta.publica && authStore.state.user" class="topbar">
    <div>
      <strong>EST1 · Mantenimiento</strong>
      <span class="role-tag">Rol simulado: {{ rolLabel[authStore.state.perfil?.rol] || '...' }}</span>
    </div>
    <nav style="display:flex; gap:0.5rem; align-items:center;">
      <router-link to="/inicio">Inicio</router-link>
      <router-link to="/reportes">Reportes</router-link>
      <router-link
        v-if="authStore.state.perfil?.rol === 'administrador'"
        to="/estadisticas"
      >Estadísticas</router-link>
      <button class="secondary" @click="salir">Salir</button>
    </nav>
  </header>

  <main class="container">
    <router-view />
  </main>
</template>
