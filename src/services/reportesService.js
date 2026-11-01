import { supabase } from "../supabase";

export async function listarReportes(filtros = {}) {
  let query = supabase
    .from("reportes")
    .select(
      `
      id, titulo, descripcion, estado, created_at,
      ubicaciones ( id, nombre ),
      categorias ( id, nombre ),
      autor:perfiles!reportes_autor_id_fkey ( id, nombre ),
      tecnico:perfiles!reportes_tecnico_id_fkey ( id, nombre )
    `,
    )
    .order("created_at", { ascending: false });

  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.ubicacionId)
    query = query.eq("ubicacion_id", filtros.ubicacionId);
  if (filtros.categoriaId)
    query = query.eq("categoria_id", filtros.categoriaId);
  if (filtros.soloMios && filtros.userId)
    query = query.eq("autor_id", filtros.userId);
  if (filtros.busqueda) {
    query = query.or(
      `titulo.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function obtenerReporte(id) {
  const { data, error } = await supabase
    .from("reportes")
    .select(
      `
      id, titulo, descripcion, estado, created_at,
      ubicaciones ( id, nombre ),
      categorias ( id, nombre ),
      autor:perfiles!reportes_autor_id_fkey ( id, nombre ),
      tecnico:perfiles!reportes_tecnico_id_fkey ( id, nombre )
    `,
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function crearReporte({
  titulo,
  descripcion,
  ubicacionId,
  categoriaId,
  autorId,
}) {
  const { data, error } = await supabase
    .from("reportes")
    .insert({
      titulo,
      descripcion,
      ubicacion_id: ubicacionId,
      categoria_id: categoriaId,
      autor_id: autorId,
      estado: "pendiente",
    })
    .select()
    .single();
  if (error) throw error;

  await agregarHistorial({
    reporteId: data.id,
    estadoNuevo: "pendiente",
    userId: autorId,
    comentario: "Reporte creado.",
  });

  return data;
}

export async function cambiarEstadoReporte({
  reporteId,
  estadoNuevo,
  userId,
  comentario,
  tecnicoId,
}) {
  const update = { estado: estadoNuevo };
  if (tecnicoId) update.tecnico_id = tecnicoId;

  const { error: updateError } = await supabase
    .from("reportes")
    .update(update)
    .eq("id", reporteId);
  if (updateError) throw updateError;

  await agregarHistorial({ reporteId, estadoNuevo, userId, comentario });
}

export async function agregarHistorial({
  reporteId,
  estadoNuevo,
  userId,
  comentario,
}) {
  const { error } = await supabase.from("historial_estados").insert({
    reporte_id: reporteId,
    estado_nuevo: estadoNuevo,
    autor_id: userId,
    comentario: comentario || null,
  });
  if (error) throw error;
}

export async function listarHistorial(reporteId) {
  const { data, error } = await supabase
    .from("historial_estados")
    .select(
      "id, estado_nuevo, comentario, created_at, autor:perfiles(id, nombre)",
    )
    .eq("reporte_id", reporteId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listarUbicaciones() {
  const { data, error } = await supabase
    .from("ubicaciones")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data;
}

export async function listarCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data;
}

export async function obtenerEstadisticas() {
  const { data, error } = await supabase
    .from("reportes")
    .select("estado, created_at, historial_estados(estado_nuevo, created_at)");
  if (error) throw error;

  const total = data.length;
  const resueltos = data.filter((r) => r.estado === "resuelto").length;

  const tiempos = data
    .filter((r) => r.estado === "resuelto")
    .map((r) => {
      const cierre = r.historial_estados
        ?.filter((h) => h.estado_nuevo === "resuelto")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      if (!cierre) return null;
      const dias =
        (new Date(cierre.created_at) - new Date(r.created_at)) / 86400000;
      return dias;
    })
    .filter((d) => d !== null);

  const promedio = tiempos.length
    ? (tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(1)
    : null;

  return { total, resueltos, promedioDias: promedio };
}
