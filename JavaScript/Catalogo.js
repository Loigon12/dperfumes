// ============================================================
//  js/Catalogo.js  —  dPerfumes · Catálogo público
//  Integrado con Supabase y lógica de UI unificada
// ============================================================

const SUPABASE_URL  = 'https://aabdbymmnqbnnxppqzki.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYmRieW1tbnFibm54cHBxemtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjcxNjgsImV4cCI6MjA5MjUwMzE2OH0.CUSZHE6A1kCjQ3soKzuAznwxUjzaGx55KNrZb0VSDzI';
const BUCKET        = 'perfumes-images';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// Base de datos en memoria (cargada desde Supabase al inicio)
let productosDB = [];

// --- VARIABLES GLOBALES DE UI ---
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartCount           = document.getElementById("cart-count");
const cartSidebar         = document.getElementById("cart-sidebar");
const cartOverlay         = document.getElementById("cart-overlay");
const cartItemsContainer  = document.getElementById("cart-items");
const cartTotalLabel      = document.getElementById("cart-total");
const searchInput         = document.getElementById('search-input');
const productGrid         = document.getElementById("product-grid");
const noResultsMessage    = document.getElementById("no-results");

// ─── COLECCIONES ──────────────────────────────────────────────
const COLECCIONES = {
    ellos: ['Odyssey Mandarin Sky', 'Asad Bourbon', 'Bharara King', 'Nitro Red'],
    ellas: ['Eclaire', 'Yara', 'Yum Yum', 'Sublime']
};

// ─── CARGA INICIAL DE SUPABASE ────────────────────────────────

async function cargarProductos() {
    const { data, error } = await sb
        .from('perfumes')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error al cargar perfumes:', error.message);
        return;
    }

    productosDB = data.map(p => ({
        id:            p.id,
        name:          p.name,
        brand:         p.brand,
        scent:         p.scent,
        price:         p.presentations[0]?.price ?? 0,
        inStock:       p.in_stock,
        image:         p.imagen_path
                         ? sb.storage.from(BUCKET).getPublicUrl(p.imagen_path).data.publicUrl
                         : 'images/placeholder.webp',
        notasSalida:   p.notas_salida,
        notasCorazon:  p.notas_corazon,
        notasFondo:    p.notas_fondo,
        presentations: p.presentations,
    }));

    inicializarCatalogo();
}

function inicializarCatalogo() {
    actualizarFiltrosMarcas();

    // ─── FILTRO DE COLECCIÓN (viene de index.html) ────────────
    const coleccion = sessionStorage.getItem('coleccion');

    if (coleccion && COLECCIONES[coleccion]) {
        sessionStorage.removeItem('coleccion'); // no persiste al recargar

        const nombres = COLECCIONES[coleccion];
        const titulo  = coleccion === 'ellos' ? 'Favoritos de Ellos' : 'Favoritos de Ellas';

        const filtradosColeccion = productosDB.filter(p =>
            nombres.some(n => p.name.toLowerCase() === n.toLowerCase())
        );

        // Banner con botón "Ver todos"
        productGrid.innerHTML = `
            <div class="col-span-full mb-4">
                <div class="flex items-center justify-between bg-stone-100 border border-stone-200 px-4 py-3 rounded-lg">
                    <span class="text-xs uppercase tracking-widest font-bold text-stone-700">${titulo}</span>
                    <button onclick="this.closest('.col-span-full').remove(); aplicarFiltros()"
                            class="text-[10px] uppercase tracking-widest text-stone-400 hover:text-black underline transition">
                        Ver todos
                    </button>
                </div>
            </div>`;

        renderProductos(filtradosColeccion, true); // true = modo append (no limpiar grid)

        updateCartUI();
        rotateAnnouncements();
        return; // no ejecutar aplicarFiltros() normal
    }
    // ─────────────────────────────────────────────────────────

    aplicarFiltros();
    updateCartUI();
    rotateAnnouncements();
}

// Construye dinámicamente los checkboxes de marca
function actualizarFiltrosMarcas() {
    const marcas = [...new Set(productosDB.map(p => p.brand))].sort();
    const cont   = document.getElementById('filtro-marcas');
    if (!cont) return;

    cont.innerHTML = marcas.map(m => `
        <label class="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
            <input type="checkbox" class="filter-checkbox" data-filter="brand" value="${m}">
            <span>${m}</span>
        </label>`).join('');

    cont.querySelectorAll('.filter-checkbox').forEach(cb =>
        cb.addEventListener('change', aplicarFiltros)
    );
}

// ─── RENDERIZADO DEL GRID ─────────────────────────────────────

// append=true → agrega al grid sin vaciarlo (usado por colecciones)
function renderProductos(items, append = false) {
    if (!productGrid) return;

    if (!append) productGrid.innerHTML = '';

    if (items.length === 0 && !append) {
        productGrid.classList.add('hidden');
        if (noResultsMessage) noResultsMessage.classList.remove('hidden');
        return;
    }

    productGrid.classList.remove('hidden');
    if (noResultsMessage) noResultsMessage.classList.add('hidden');

    items.forEach(prod => {
        const priceToShow = prod.presentations[0]?.price ?? prod.price;
        const badge = !prod.inStock
            ? `<span class="absolute top-2 left-2 bg-white/90 text-[10px] px-2 py-1 uppercase tracking-tighter font-bold">Agotado</span>`
            : '';

        productGrid.insertAdjacentHTML('beforeend', `
            <div class="group text-center">
                <div class="relative aspect-[3/4] bg-stone-100 overflow-hidden mb-2 cursor-pointer rounded-lg"
                     onclick="openProductModal(${prod.id})">
                    <img src="${prod.image}"
                         class="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                         alt="${prod.name}"
                         onerror="this.src='images/placeholder.webp'">
                    ${badge}
                    <button class="hidden md:block absolute bottom-0 left-0 w-full bg-black/80 text-white py-3 text-[10px] uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition duration-300">
                        Ver detalles
                    </button>
                </div>
                <h4 class="text-[10px] md:text-sm font-medium tracking-tight mt-1 leading-tight h-8 flex items-center justify-center cursor-pointer"
                    onclick="openProductModal(${prod.id})">${prod.name}</h4>
                <p class="text-stone-500 text-[9px] md:text-sm mt-1 font-light">$${priceToShow.toLocaleString('es-CO')}</p>
            </div>`);
    });
}

// ─── FILTROS ──────────────────────────────────────────────────

function aplicarFiltros() {
    const searchTerm          = document.getElementById('search-input')?.value.toLowerCase().trim() ?? '';
    const checkedBrands       = Array.from(document.querySelectorAll('input[data-filter="brand"]:checked')).map(cb => cb.value);
    const checkedScents       = Array.from(document.querySelectorAll('input[data-filter="scent"]:checked')).map(cb => cb.value);
    const checkedAvailability = Array.from(document.querySelectorAll('input[data-filter="availability"]:checked')).map(cb => cb.value);
    const maxPrice            = parseInt(document.getElementById('price-range')?.value ?? 9999999);

    let filtrados = productosDB.filter(prod => {
        const prodPrice = prod.presentations[0]?.price ?? 0;
        if (searchTerm && !(prod.name.toLowerCase().includes(searchTerm) || prod.brand.toLowerCase().includes(searchTerm))) return false;
        if (prodPrice > maxPrice) return false;
        if (checkedBrands.length > 0 && !checkedBrands.includes(prod.brand)) return false;
        if (checkedScents.length > 0 && !checkedScents.includes(prod.scent === 'Gourmand' ? 'Dulce' : prod.scent)) return false;
        if (checkedAvailability.length > 0) {
            if (checkedAvailability.includes('in-stock')     && !prod.inStock) return false;
            if (checkedAvailability.includes('out-of-stock') &&  prod.inStock) return false;
        }
        return true;
    });

    const sortBy = document.getElementById('sort-select')?.value ?? '';
    if (sortBy === 'az')        filtrados.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'za')        filtrados.sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === 'low-high')  filtrados.sort((a, b) => (a.presentations[0]?.price ?? 0) - (b.presentations[0]?.price ?? 0));
    if (sortBy === 'high-low')  filtrados.sort((a, b) => (b.presentations[0]?.price ?? 0) - (a.presentations[0]?.price ?? 0));

    renderProductos(filtrados);
}

function toggleFilter(containerId, headerElement) {
    const container = document.getElementById(containerId);
    const icon = headerElement.querySelector('i');
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        icon.classList.remove('-rotate-180');
    } else {
        container.classList.add('hidden');
        icon.classList.add('-rotate-180');
    }
}

// ─── CARRITO ──────────────────────────────────────────────────

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.innerText = totalItems;
    renderCart();
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(id, quantity, size, price) {
    const prod = productosDB.find(p => p.id === id);
    if (!prod) return;

    const cartItemId   = `${id}-${size}`;
    const existingItem = cart.find(item => item.cartId === cartItemId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            cartId: cartItemId,
            id:     prod.id,
            name:   prod.name,
            price,
            size,
            quantity,
            image:  prod.image
        });
    }

    updateCartUI();
    toggleCart();
    closeProductModal();
}

function toggleCart() {
    const isOpen = !cartSidebar.classList.contains('translate-x-full');
    if (isOpen) {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
        cartOverlay.classList.remove('opacity-100');
        document.body.style.overflow = "auto";
    } else {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
        setTimeout(() => cartOverlay.classList.add('opacity-100'), 10);
        document.body.style.overflow = "hidden";
    }
}

function renderCart() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="text-stone-400 text-center mt-10 font-light italic text-sm">El carrito está vacío</p>`;
        if (cartTotalLabel) cartTotalLabel.innerText = "$0";
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        const div = document.createElement("div");
        div.className = "flex gap-4 items-center border-b border-stone-100 pb-4 mb-2";
        div.innerHTML = `
            <img src="${item.image}" class="w-16 h-20 object-cover bg-stone-100 rounded">
            <div class="flex-1">
                <p class="text-[11px] uppercase font-bold tracking-tight leading-none">${item.name}</p>
                <p class="text-[10px] text-stone-400 uppercase mt-1">${item.size}</p>
                <p class="text-stone-600 text-xs mt-1">${item.quantity} x $${item.price.toLocaleString('es-CO')}</p>
            </div>
            <button onclick="removeFromCart(${index})" class="text-stone-300 hover:text-red-500 transition px-2">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>`;
        cartItemsContainer.appendChild(div);
    });
    if (cartTotalLabel) cartTotalLabel.innerText = `$${total.toLocaleString('es-CO')}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function confirmarPedido() {
    if (cart.length === 0) return;
    const telefono = "573007350100";
    const lista    = cart.map(item => `- ${item.quantity}x ${item.name} (${item.size}) — $${(item.price * item.quantity).toLocaleString('es-CO')}`).join('\n');
    const total    = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const mensaje  = encodeURIComponent(`¡Hola dPerfumes! Quisiera confirmar el siguiente pedido:\n\n${lista}\n\nTotal: $${total.toLocaleString('es-CO')}\n\n¿Me indican los pasos para el pago?`);
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}

// ─── MODAL DE PRODUCTO ────────────────────────────────────────

let currentModalProductId = null;
let currentModalQuantity  = 1;
let selectedSize  = null;
let selectedPrice = 0;

function openProductModal(id) {
    const prod = productosDB.find(p => p.id === id);
    if (!prod) return;

    currentModalProductId = id;
    currentModalQuantity  = 1;
    document.getElementById('modal-qty').innerText = 1;

    const defaultPres = prod.presentations[0];
    selectedSize  = defaultPres.size;
    selectedPrice = defaultPres.price;

    document.getElementById('modal-img').src         = prod.image;
    document.getElementById('modal-name').innerText  = prod.name;
    document.getElementById('modal-brand').innerText = prod.brand;
    updateModalPriceUI();

    const sizeContainer = document.getElementById('modal-sizes');
    sizeContainer.innerHTML = "";
    prod.presentations.forEach(pres => {
        const btn = document.createElement('button');
        btn.innerText  = pres.size;
        btn.className  = `px-4 py-2 text-xs border transition ${selectedSize === pres.size ? 'border-black bg-black text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`;
        btn.onclick    = () => selectPresentation(pres.size, pres.price, btn);
        sizeContainer.appendChild(btn);
    });

    document.getElementById('modal-notas-salida').innerHTML   = `<strong>Notas de Salida:</strong> ${prod.notasSalida}`;
    document.getElementById('modal-notas-corazon').innerHTML  = `<strong>Notas de Corazón:</strong> ${prod.notasCorazon}`;
    document.getElementById('modal-notas-fondo').innerHTML    = `<strong>Notas de Fondo:</strong> ${prod.notasFondo}`;

    const addBtn = document.getElementById('modal-add-btn');
    if (prod.inStock) {
        addBtn.disabled   = false;
        addBtn.className  = "w-full bg-black text-white py-4 text-xs uppercase tracking-[0.2em] hover:bg-stone-800 transition mt-4 rounded";
        addBtn.innerText  = "Agregar al Carrito";
        addBtn.onclick    = () => addToCart(prod.id, currentModalQuantity, selectedSize, selectedPrice);
    } else {
        addBtn.disabled   = true;
        addBtn.className  = "w-full bg-stone-300 text-stone-500 py-4 text-xs uppercase tracking-[0.2em] cursor-not-allowed mt-4 rounded";
        addBtn.innerText  = "Agotado";
    }

    const modal = document.getElementById('product-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function selectPresentation(size, price, btnElement) {
    selectedSize  = size;
    selectedPrice = price;
    updateModalPriceUI();
    document.querySelectorAll('#modal-sizes button').forEach(btn => {
        btn.className = "px-4 py-2 text-xs border border-stone-200 text-stone-600 hover:border-stone-400 transition";
    });
    btnElement.className = "px-4 py-2 text-xs border border-black bg-black text-white transition";
}

function updateModalPriceUI() {
    document.getElementById('modal-price').innerText = `$${selectedPrice.toLocaleString('es-CO')} COP`;
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.add('opacity-0');
    document.body.style.overflow = "auto";
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function updateModalQuantity(change) {
    currentModalQuantity += change;
    if (currentModalQuantity < 1) currentModalQuantity = 1;
    document.getElementById('modal-qty').innerText = currentModalQuantity;
}

// ─── MODAL DE POLÍTICAS ────────────────────────────────────────

const policyModal  = document.getElementById('policy-modal');
const modalTitle   = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');

const policiesData = {
    envios: {
        title: "Política de Devoluciones o Cambios",
        html:  "<p>El producto no puede estar abierto, usado ni modificado de su estado original. Debe estar en buen estado, limpio y con las etiquetas originales.</p>"
    },
    garantias: {
        title: "Garantía",
        html:  "<p>En dperfumes garantizamos que todos nuestros productos son 100% originales.</p><p>Trabajamos únicamente con proveedores confiables para asegurar autenticidad, calidad y correcta conservación de cada fragancia.</p><p>Si tu producto presenta algún inconveniente, contáctanos y te ayudaremos a resolverlo de forma rápida y transparente.</p><p class='font-medium text-stone-800 pt-2'>Tu confianza es lo más importante para nosotros.</p>"
    },
    contacto: {
        title: "Contacto",
        html:  "<p>¿Tienes preguntas o necesitas ayuda? Nuestro equipo de atención al cliente está aquí para ti. Puedes contactarnos a través de:</p><ul class='list-disc list-inside'><li><strong>WhatsApp:</strong> <a href='https://wa.me/573007350100' class='text-blue-600 hover:underline'>+57 300 7350100</a></li><li><strong>Instagram:</strong> <a href='https://instagram.com/dperfumes_1' class='text-blue-600 hover:underline'>@dperfumes_1</a></li><li><strong>Tiktok:</strong> <a href='https://tiktok.com/@dperfumes_ibg' class='text-blue-600 hover:underline'>@dperfumes_ibg</a></li></ul>"
    }
};

function openPolicyModal(type) {
    modalTitle.innerText   = policiesData[type].title;
    modalContent.innerHTML = policiesData[type].html;
    policyModal.classList.remove('hidden');
    setTimeout(() => {
        policyModal.classList.add('opacity-100');
        policyModal.querySelector('div').classList.remove('scale-95');
        policyModal.querySelector('div').classList.add('scale-100');
    }, 10);
    document.body.style.overflow = "hidden";
}

function closePolicyModal() {
    policyModal.classList.remove('opacity-100');
    policyModal.querySelector('div').classList.remove('scale-100');
    policyModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => policyModal.classList.add('hidden'), 300);
    document.body.style.overflow = "auto";
}

if (policyModal) {
    policyModal.addEventListener('click', e => {
        if (e.target === policyModal) closePolicyModal();
    });
}

// ─── BARRA DE ANUNCIOS ────────────────────────────────────────

const announcements      = ["Envíos gratis por compras superiores a $250.000", "10% off en primera compra"];
let currentAnnouncement  = 0;
const announcementElement = document.getElementById("announcement-text");

function rotateAnnouncements() {
    if (!announcementElement) return;
    announcementElement.classList.replace("opacity-100", "opacity-0");
    setTimeout(() => {
        currentAnnouncement = (currentAnnouncement + 1) % announcements.length;
        announcementElement.innerText = announcements[currentAnnouncement];
        announcementElement.classList.replace("opacity-0", "opacity-100");
    }, 200);
}
setInterval(rotateAnnouncements, 2000);

// ─── EVENT LISTENERS ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.addEventListener('change', aplicarFiltros));
    document.getElementById('sort-select')?.addEventListener('change', aplicarFiltros);
    document.getElementById('search-input')?.addEventListener('input', aplicarFiltros);
    document.getElementById('price-range')?.addEventListener('input', e => {
        document.getElementById('price-display').innerText = "$ " + parseInt(e.target.value).toLocaleString('es-CO');
        aplicarFiltros();
    });

    // Inicia todo: carga Supabase → inicializarCatalogo → detecta colección
    cargarProductos();
});