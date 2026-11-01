import { reactive, readonly } from "vue";
import { supabase } from "../supabase";

const state = reactive({
  user: null,
  perfil: null,
  cargando: true,
});

async function cargarPerfil(userId) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, rol")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("No se pudo cargar el perfil:", error.message);
    state.perfil = null;
    return;
  }
  state.perfil = data;
}

async function inicializar() {
  const { data } = await supabase.auth.getSession();
  state.user = data.session?.user ?? null;
  if (state.user) await cargarPerfil(state.user.id);
  state.cargando = false;

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user ?? null;
    if (state.user) {
      await cargarPerfil(state.user.id);
    } else {
      state.perfil = null;
    }
  });
}

async function registrarse({ email, password, nombre, rol }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, rol } },
  });
  if (error) throw error;
  return data;
}

async function iniciarSesion({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  state.user = data.user;
  if (data.user) await cargarPerfil(data.user.id);
  return data;
}

async function cerrarSesion() {
  await supabase.auth.signOut();
  state.user = null;
  state.perfil = null;
}

export const authStore = {
  state: readonly(state),
  inicializar,
  registrarse,
  iniciarSesion,
  cerrarSesion,
};
