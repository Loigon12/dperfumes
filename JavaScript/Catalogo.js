let cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartCount = document.getElementById("cart-count");
const cartSidebar = document.getElementById("cart-sidebar");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalLabel = document.getElementById("cart-total");
const searchInput = document.getElementById('search-input');
// --- LÓGICA DEL CARRITO ---

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;
    renderCart();
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(id, quantity, size, price) {
    const prod = productosDB.find(p => p.id === id);
    if (!prod) return;

    const cartItemId = `${id}-${size}`;
    const existingItem = cart.find(item => item.cartId === cartItemId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ 
            cartId: cartItemId, 
            id: prod.id, 
            name: prod.name, 
            price: price, 
            size: size, 
            quantity: quantity,
            image: prod.image // Añadimos imagen para el mini-carrito
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
    cartItemsContainer.innerHTML = "";
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="text-stone-400 text-center mt-10 font-light italic text-sm">El carrito está vacío</p>`;
        cartTotalLabel.innerText = "$0";
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
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
            </button>
        `;
        cartItemsContainer.appendChild(div);
    });
    cartTotalLabel.innerText = `$${total.toLocaleString('es-CO')}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function confirmarPedido() {
    if (cart.length === 0) return;
    const telefono = "573007350100"; 
    let lista = cart.map(item => `- ${item.quantity}x ${item.name} (${item.size}) — $${(item.price * item.quantity).toLocaleString('es-CO')}`).join('\n');
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const mensaje = encodeURIComponent(`¡Hola dPerfumes! Quisiera confirmar el siguiente pedido:\n\n${lista}\n\nTotal: $${total.toLocaleString('es-CO')}\n\n¿Me indican los pasos para el pago?`);
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}

// --- MODAL DE PRODUCTO ---

let currentModalProductId = null;
let currentModalQuantity = 1;
let selectedSize = null;
let selectedPrice = 0;

function openProductModal(id) {
    const prod = productosDB.find(p => p.id === id);
    if (!prod) return;

    currentModalProductId = id;
    currentModalQuantity = 1;
    document.getElementById('modal-qty').innerText = currentModalQuantity;

    const defaultPres = prod.presentations[0];
    selectedSize = defaultPres.size;
    selectedPrice = defaultPres.price;

    document.getElementById('modal-img').src = prod.image;
    document.getElementById('modal-name').innerText = prod.name;
    document.getElementById('modal-brand').innerText = prod.brand;
    updateModalPriceUI();
    
    const sizeContainer = document.getElementById('modal-sizes');
    sizeContainer.innerHTML = "";
    prod.presentations.forEach(pres => {
        const btn = document.createElement('button');
        btn.innerText = pres.size;
        btn.className = `px-4 py-2 text-xs border transition ${selectedSize === pres.size ? 'border-black bg-black text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`;
        btn.onclick = () => selectPresentation(pres.size, pres.price, btn);
        sizeContainer.appendChild(btn);
    });

    document.getElementById('modal-notas-salida').innerHTML = `<strong>Notas de Salida:</strong> ${prod.notasSalida}`;
    document.getElementById('modal-notas-corazon').innerHTML = `<strong>Notas de Corazón:</strong> ${prod.notasCorazon}`;
    document.getElementById('modal-notas-fondo').innerHTML = `<strong>Notas de Fondo:</strong> ${prod.notasFondo}`;

    const addBtn = document.getElementById('modal-add-btn');
    if(prod.inStock) {
        addBtn.disabled = false;
        addBtn.className = "w-full bg-black text-white py-4 text-xs uppercase tracking-[0.2em] hover:bg-stone-800 transition mt-4 rounded";
        addBtn.innerText = "Agregar al Carrito";
        addBtn.onclick = () => addToCart(prod.id, currentModalQuantity, selectedSize, selectedPrice);
    } else {
        addBtn.disabled = true;
        addBtn.className = "w-full bg-stone-300 text-stone-500 py-4 text-xs uppercase tracking-[0.2em] cursor-not-allowed mt-4 rounded";
        addBtn.innerText = "Agotado";
    }

    const modal = document.getElementById('product-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden"; 
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function selectPresentation(size, price, btnElement) {
    selectedSize = size;
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

// --- RENDERIZADO DEL GRID ---

const productGrid = document.getElementById("product-grid");
const noResultsMessage = document.getElementById("no-results");

function renderProductos(items) {
    productGrid.innerHTML = "";
    if (items.length === 0) {
        productGrid.classList.add('hidden');
        noResultsMessage.classList.remove('hidden');
        return;
    }

    productGrid.classList.remove('hidden');
    noResultsMessage.classList.add('hidden');

    items.forEach(prod => {
        const priceToShow = prod.presentations[0].price; // Precio de la primera opción
        const badge = !prod.inStock ? `<span class="absolute top-2 left-2 bg-white/90 text-[10px] px-2 py-1 uppercase tracking-tighter">Agotado</span>` : '';

        const html = `
            <div class="group text-center">
                <div class="relative aspect-[3/4] bg-stone-100 overflow-hidden mb-4 cursor-pointer rounded-lg" onclick="openProductModal(${prod.id})">
                    <img src="${prod.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt="${prod.name}">
                    ${badge}
                    <button class="absolute bottom-0 left-0 w-full bg-black text-white py-4 text-xs uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition duration-300">
                        Ver detalles
                    </button>
                </div>
                <h4 class="text-sm font-medium tracking-tight mt-2 cursor-pointer hover:text-stone-500 transition" onclick="openProductModal(${prod.id})">${prod.name}</h4>
                <p class="text-stone-500 text-sm mt-1 font-light">$${priceToShow.toLocaleString('es-CO')} COP</p>
            </div>
        `;
        productGrid.insertAdjacentHTML('beforeend', html);
    });
}

// --- FILTROS ---

function aplicarFiltros() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const checkedBrands = Array.from(document.querySelectorAll('input[data-filter="brand"]:checked')).map(cb => cb.value);
    const checkedScents = Array.from(document.querySelectorAll('input[data-filter="scent"]:checked')).map(cb => cb.value);
    const checkedAvailability = Array.from(document.querySelectorAll('input[data-filter="availability"]:checked')).map(cb => cb.value);
    const maxPrice = parseInt(document.getElementById('price-range').value);

    let filtrados = productosDB.filter(prod => {
        const prodPrice = prod.presentations[0].price;
        if (searchTerm && !(prod.name.toLowerCase().includes(searchTerm) || prod.brand.toLowerCase().includes(searchTerm))) return false;
        if (prodPrice > maxPrice) return false;
        if (checkedBrands.length > 0 && !checkedBrands.includes(prod.brand)) return false;
        if (checkedScents.length > 0 && !checkedScents.includes(prod.scent === 'Gourmand' ? 'Dulce' : prod.scent)) return false;
        if (checkedAvailability.length > 0) {
            if (checkedAvailability.includes('in-stock') && !prod.inStock) return false;
            if (checkedAvailability.includes('out-of-stock') && prod.inStock) return false;
        }
        return true;
    });

    const sortBy = document.getElementById('sort-select').value;
    if (sortBy === 'az') filtrados.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'za') filtrados.sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === 'low-high') filtrados.sort((a, b) => a.presentations[0].price - b.presentations[0].price);
    if (sortBy === 'high-low') filtrados.sort((a, b) => b.presentations[0].price - a.presentations[0].price);

    renderProductos(filtrados);
}

// --- INICIALIZACIÓN ---

document.querySelectorAll('.filter-checkbox').forEach(cb => cb.addEventListener('change', aplicarFiltros));
document.getElementById('sort-select').addEventListener('change', aplicarFiltros);
document.getElementById('search-input').addEventListener('input', aplicarFiltros);
document.getElementById('price-range').addEventListener('input', (e) => {
    document.getElementById('price-display').innerText = "$ " + parseInt(e.target.value).toLocaleString('es-CO');
    aplicarFiltros();
});

  // --- LÓGICA DEL MODAL DE POLÍTICAS ---
        const policyModal = document.getElementById('policy-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

        // Datos del modal
        const policiesData = {
            envios: {
                title: "Política de Devoluciones o Cambios",
                html: "<p>El producto no puede estar abierto, usado ni modificado de su estado original. Debe estar en buen estado, limpio y con las etiquetas originales.</p>"
            },
            garantias: {
                title: "Garantía",
                html: "<p>En dperfumes garantizamos que todos nuestros productos son 100% originales.</p><p>Trabajamos únicamente con proveedores confiables para asegurar autenticidad, calidad y correcta conservación de cada fragancia.</p><p>Si tu producto presenta algún inconveniente, contáctanos y te ayudaremos a resolverlo de forma rápida y transparente.</p><p class='font-medium text-stone-800 pt-2'>Tu confianza es lo más importante para nosotros.</p>"
            },
            contacto: {
                title: "Contacto",
                html: "<p>¿Tienes preguntas o necesitas ayuda? Nuestro equipo de atención al cliente está aquí para ti. Puedes contactarnos a través de:</p><ul class='list-disc list-inside'><li><strong>WhatsApp:</strong> <a href='https://wa.me/573007350100' class='text-blue-600 hover:underline'>+57 300 7350100</a></li><li><strong>Instagram:</strong> <a href='https://instagram.com/dperfumes_1' class='text-blue-600 hover:underline'>@dperfumes_1</a></li><li><strong>Tiktok:</strong> <a href='https://tiktok.com/@dperfumes_ibg' class='text-blue-600 hover:underline'>@dperfumes_ibg</a></li></ul>"
            }

        };

        function openPolicyModal(type) {
            // Cargar contenido
            modalTitle.innerText = policiesData[type].title;
            modalContent.innerHTML = policiesData[type].html;
            
            // Mostrar modal con animación
            policyModal.classList.remove('hidden');
            setTimeout(() => {
                policyModal.classList.add('opacity-100');
                policyModal.querySelector('div').classList.remove('scale-95');
                policyModal.querySelector('div').classList.add('scale-100');
            }, 10);
            
            // Prevenir scroll en la página
            document.body.style.overflow = "hidden";
        }

        function closePolicyModal() {
            // Ocultar modal con animación
            policyModal.classList.remove('opacity-100');
            policyModal.querySelector('div').classList.remove('scale-100');
            policyModal.querySelector('div').classList.add('scale-95');
            
            setTimeout(() => {
                policyModal.classList.add('hidden');
            }, 300);
            
            // Restaurar scroll
            document.body.style.overflow = "auto";
        }

        // Cerrar el modal si se hace clic por fuera de la caja blanca
        policyModal.addEventListener('click', function(e) {
            if (e.target === policyModal) {
                closePolicyModal();
            }
        });
        // Escucha cada vez que el usuario teclea algo
        searchInput.addEventListener('input', aplicarFiltros);

// Ejecutar al cargar
updateCartUI();
aplicarFiltros();