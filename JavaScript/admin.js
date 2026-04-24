// ============================================================
//  js/admin.js  —  dPerfumes Panel Administrativo
//  Dependencia: @supabase/supabase-js v2 (cargado en admin.html)
// ============================================================

// ─── 1. Configuración ─────────────────────────────────────────
const SUPABASE_URL  = 'https://aabdbymmnqbnnxppqzki.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYmRieW1tbnFibm54cHBxemtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjcxNjgsImV4cCI6MjA5MjUwMzE2OH0.CUSZHE6A1kCjQ3soKzuAznwxUjzaGx55KNrZb0VSDzI';
const BUCKET        = 'perfumes-images';
const PAGE_SIZE     = 10;

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── 2. Estado ────────────────────────────────────────────────
let paginaActual   = 1;
let totalPerfumes  = 0;
let editandoId     = null;
let presentaciones = [];

// ─── 3. Auth (Supabase Auth) ──────────────────────────────────

async function loginAdmin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = 'Credenciales incorrectas. Verifica e intenta de nuevo.';
    return;
  }
  mostrarPanel();
}

async function logoutAdmin() {
  await sb.auth.signOut();
  document.getElementById('panel').classList.add('hidden');
  document.getElementById('login-section').classList.remove('hidden');
}

async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) mostrarPanel();
}

function mostrarPanel() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('panel').classList.remove('hidden');
  cargarPerfumes();
}

// ─── 4. CRUD ──────────────────────────────────────────────────

async function getPerfumes(busqueda = '', pagina = 1) {
  const desde = (pagina - 1) * PAGE_SIZE;
  const hasta = desde + PAGE_SIZE - 1;

  let query = sb
    .from('perfumes')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(desde, hasta);

  if (busqueda) {
    query = query.or(`name.ilike.%${busqueda}%,brand.ilike.%${busqueda}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data, count };
}

async function getPerfumeById(id) {
  const { data, error } = await sb
    .from('perfumes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function createPerfume(perfume) {
  validarPerfume(perfume);
  const { data, error } = await sb
    .from('perfumes')
    .insert([perfume])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updatePerfume(id, cambios) {
  validarPerfume(cambios);
  const { data, error } = await sb
    .from('perfumes')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deletePerfume(id, imagenPath = null) {
  if (imagenPath) {
    await sb.storage.from(BUCKET).remove([imagenPath]);
  }
  const { error } = await sb.from('perfumes').delete().eq('id', id);
  if (error) throw error;
}

// ─── 5. Storage ───────────────────────────────────────────────

async function subirImagen(archivo, rutaAnterior = null) {
  if (!archivo) return null;

  if (rutaAnterior) {
    await sb.storage.from(BUCKET).remove([rutaAnterior]);
  }

  const ext  = archivo.name.split('.').pop().toLowerCase();
  const path = `perfumes/${Date.now()}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, archivo, { upsert: false });

  if (error) throw error;
  return path;
}

function getImagenUrl(imagenPath) {
  if (!imagenPath) return 'images/placeholder.webp';
  const { data } = sb.storage.from(BUCKET).getPublicUrl(imagenPath);
  return data.publicUrl;
}

// ─── 6. Validación ────────────────────────────────────────────

function validarPerfume({ name, brand, scent, presentations }) {
  if (!name?.trim())  throw new Error('El nombre es obligatorio.');
  if (!brand?.trim()) throw new Error('La marca es obligatoria.');
  if (!scent?.trim()) throw new Error('La familia olfativa es obligatoria.');

  if (!Array.isArray(presentations) || presentations.length === 0) {
    throw new Error('Agrega al menos una presentación (tamaño + precio).');
  }
  for (const p of presentations) {
    if (!p.size?.trim()) throw new Error('Cada presentación necesita un tamaño.');
    const precio = Number(p.price);
    if (!Number.isFinite(precio) || precio <= 0) {
      throw new Error(`Precio de "${p.size}" debe ser mayor a 0.`);
    }
    p.price = precio; // normalizar a número
  }
}

// ─── 7. Render tabla ──────────────────────────────────────────

async function cargarPerfumes() {
  const busqueda = document.getElementById('search-admin').value.trim();
  try {
    const { data, count } = await getPerfumes(busqueda, paginaActual);
    totalPerfumes = count;
    renderTabla(data);
    renderPaginacion();
    document.getElementById('total-label').textContent =
      `${count} perfume${count !== 1 ? 's' : ''} en total`;
  } catch (err) {
    mostrarToast('Error al cargar: ' + err.message, 'error');
  }
}

function renderTabla(perfumes) {
  const tbody = document.getElementById('tabla-perfumes');
  if (!perfumes?.length) {
    tbody.innerHTML = `<tr>
      <td colspan="7" class="text-center py-12 text-gray-400 text-sm">
        Sin resultados para esta búsqueda.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = perfumes.map(p => {
    const precio = p.presentations[0]?.price?.toLocaleString('es-CO') ?? '—';
    const imgSrc = getImagenUrl(p.imagen_path);
    const stock  = p.in_stock
      ? `<span class="badge-stock in">En stock</span>`
      : `<span class="badge-stock out">Agotado</span>`;

    return `<tr>
      <td class="py-2 px-3">
        <img src="${imgSrc}" alt="${p.name}"
             class="tabla-img" onerror="this.src='images/placeholder.webp'">
      </td>
      <td class="py-2 px-3 font-medium text-sm">${p.name}</td>
      <td class="py-2 px-3 text-sm text-gray-500">${p.brand}</td>
      <td class="py-2 px-3 text-sm text-gray-500">${p.scent}</td>
      <td class="py-2 px-3 text-sm font-medium">$${precio}</td>
      <td class="py-2 px-3">${stock}</td>
      <td class="py-2 px-3 text-right space-x-1">
        <button class="btn-accion btn-editar"
                onclick="abrirModalEditar(${p.id})"> Editar</button>
        <button class="btn-accion btn-eliminar"
                onclick="confirmarEliminar(${p.id},'${p.imagen_path ?? ''}')">
           Eliminar</button>
      </td>
    </tr>`;
  }).join('');
}

function renderPaginacion() {
  const totalPaginas = Math.ceil(totalPerfumes / PAGE_SIZE) || 1;
  const cont = document.getElementById('paginacion');
  cont.innerHTML = '';

  const btn = (label, pag, activa = false, dis = false) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.disabled    = dis;
    b.className   = activa ? 'pag-btn activa' : 'pag-btn';
    b.onclick     = () => { paginaActual = pag; cargarPerfumes(); };
    return b;
  };

  cont.appendChild(btn('←', paginaActual - 1, false, paginaActual === 1));
  for (let i = 1; i <= totalPaginas; i++) {
    cont.appendChild(btn(String(i), i, i === paginaActual));
  }
  cont.appendChild(btn('→', paginaActual + 1, false, paginaActual >= totalPaginas));
}

// ─── 8. Modal crear / editar ──────────────────────────────────

function abrirModalCrear() {
  editandoId     = null;
  presentaciones = [{ size: '100ml', price: 0 }];
  document.getElementById('modal-titulo').textContent = '+ Nuevo Perfume';
  document.getElementById('perfume-form').reset();
  document.getElementById('img-preview').src     = 'images/placeholder.webp';
  document.getElementById('f-imagen-path').value = '';
  renderPresentaciones();
  document.getElementById('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

async function abrirModalEditar(id) {
  try {
    const p = await getPerfumeById(id);
    editandoId     = id;
    presentaciones = JSON.parse(JSON.stringify(p.presentations)); // copia profunda

    document.getElementById('modal-titulo').textContent   = '+ Editar Perfume';
    document.getElementById('f-name').value               = p.name;
    document.getElementById('f-brand').value              = p.brand;
    document.getElementById('f-scent').value              = p.scent;
    document.getElementById('f-notas-salida').value       = p.notas_salida;
    document.getElementById('f-notas-corazon').value      = p.notas_corazon;
    document.getElementById('f-notas-fondo').value        = p.notas_fondo;
    document.getElementById('f-in-stock').checked         = p.in_stock;
    document.getElementById('f-imagen-path').value        = p.imagen_path ?? '';
    document.getElementById('img-preview').src            = getImagenUrl(p.imagen_path);
    renderPresentaciones();
    document.getElementById('modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  }
}

function cerrarModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  editandoId = null;
}

// ─── 9. Presentaciones dinámicas ─────────────────────────────

function renderPresentaciones() {
  const cont = document.getElementById('presentaciones-list');
  cont.innerHTML = presentaciones.map((p, i) => `
    <div class="pres-row">
      <input type="text" value="${p.size}" placeholder="Ej: 100ml"
             oninput="presentaciones[${i}].size = this.value.trim()"
             class="pres-input pres-size">
      <span class="pres-sep">$</span>
      <input type="number" value="${p.price}" placeholder="Precio COP"
             oninput="presentaciones[${i}].price = +this.value"
             class="pres-input pres-price" min="1" step="1000">
      <button type="button" onclick="quitarPresentacion(${i})"
              class="btn-quitar-pres" title="Eliminar presentación">✕</button>
    </div>`).join('');
}

function agregarPresentacion() {
  presentaciones.push({ size: '', price: 0 });
  renderPresentaciones();
}

function quitarPresentacion(i) {
  if (presentaciones.length === 1) {
    mostrarToast('Debe haber al menos una presentación.', 'warn');
    return;
  }
  presentaciones.splice(i, 1);
  renderPresentaciones();
}

// ─── 10. Submit ───────────────────────────────────────────────

async function guardarPerfume(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-guardar');
  btn.disabled    = true;
  btn.textContent = 'Guardando…';

  try {
    const archivo      = document.getElementById('f-imagen').files[0] ?? null;
    const rutaAnterior = document.getElementById('f-imagen-path').value || null;

    let imagenPath = rutaAnterior;
    if (archivo) {
      imagenPath = await subirImagen(archivo, rutaAnterior);
    }

    const payload = {
      name:          document.getElementById('f-name').value.trim(),
      brand:         document.getElementById('f-brand').value.trim(),
      scent:         document.getElementById('f-scent').value,
      notas_salida:  document.getElementById('f-notas-salida').value.trim(),
      notas_corazon: document.getElementById('f-notas-corazon').value.trim(),
      notas_fondo:   document.getElementById('f-notas-fondo').value.trim(),
      presentations: presentaciones,
      imagen_path:   imagenPath,
      in_stock:      document.getElementById('f-in-stock').checked,
    };

    if (editandoId) {
      await updatePerfume(editandoId, payload);
      mostrarToast('Perfume actualizado ✓', 'ok');
    } else {
      await createPerfume(payload);
      mostrarToast('Perfume creado ✓', 'ok');
    }

    cerrarModal();
    cargarPerfumes();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar';
  }
}

// ─── 11. Confirmar / ejecutar eliminar ────────────────────────

function confirmarEliminar(id, imagenPath) {
  document.getElementById('confirm-id').value   = id;
  document.getElementById('confirm-path').value = imagenPath;
  document.getElementById('confirm-modal').classList.remove('hidden');
}

async function ejecutarEliminar() {
  const id   = +document.getElementById('confirm-id').value;
  const path = document.getElementById('confirm-path').value || null;
  try {
    await deletePerfume(id, path);
    mostrarToast('Perfume eliminado ✓', 'ok');
    document.getElementById('confirm-modal').classList.add('hidden');
    if ((totalPerfumes - 1) <= (paginaActual - 1) * PAGE_SIZE && paginaActual > 1) {
      paginaActual--;
    }
    cargarPerfumes();
  } catch (err) {
    mostrarToast('Error al eliminar: ' + err.message, 'error');
  }
}

// ─── 12. Inicialización ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Preview de imagen al seleccionar archivo
  document.getElementById('f-imagen')?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => (document.getElementById('img-preview').src = ev.target.result);
    reader.readAsDataURL(file);
  });

  // Búsqueda con debounce
  let timer;
  document.getElementById('search-admin')?.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { paginaActual = 1; cargarPerfumes(); }, 350);
  });

  // Cerrar modal al hacer clic en el overlay
  document.getElementById('modal-overlay')?.addEventListener('click', cerrarModal);
});

// ─── 13. Toast ────────────────────────────────────────────────

function mostrarToast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast show ${tipo}`;
  setTimeout(() => t.classList.remove('show'), 3500);
}