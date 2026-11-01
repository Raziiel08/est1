import { createRouter, createWebHistory } from "vue-router";
import { authStore } from "../services/authStore";

const routes = [
  { path: "/", redirect: "/inicio" },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Login.vue"),
    meta: { publica: true },
  },
  {
    path: "/registro",
    name: "registro",
    component: () => import("../views/Registro.vue"),
    meta: { publica: true },
  },
  {
    path: "/inicio",
    name: "inicio",
    component: () => import("../views/Inicio.vue"),
  },
  {
    path: "/reportes/nuevo",
    name: "nuevo-reporte",
    component: () => import("../views/NuevoReporte.vue"),
  },
  {
    path: "/reportes",
    name: "lista-reportes",
    component: () => import("../views/ListaReportes.vue"),
  },
  {
    path: "/reportes/:id",
    name: "detalle-reporte",
    component: () => import("../views/DetalleReporte.vue"),
    props: true,
  },
  {
    path: "/estadisticas",
    name: "estadisticas",
    component: () => import("../views/Estadisticas.vue"),
    meta: { roles: ["administrador"] },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  // Esperar a que termine de resolverse la sesión antes de decidir.
  while (authStore.state.cargando) {
    await new Promise((r) => setTimeout(r, 30));
  }

  const logueado = !!authStore.state.user;
  if (!to.meta.publica && !logueado) {
    return { name: "login" };
  }
  if (to.meta.publica && logueado) {
    return { name: "inicio" };
  }
  if (to.meta.roles && !to.meta.roles.includes(authStore.state.perfil?.rol)) {
    return { name: "inicio" };
  }
  return true;
});

export default router;
