// Cargar carrito desde LocalStorage o crear uno nuevo
// NOTA: Usamos 'cart' en lugar de 'dperfumes_cart' para compartir el mismo carrito con Catalogo.js
let cart = JSON.parse(localStorage.getItem('cart')) || [];

const cartCount = document.getElementById("cart-count"); 
const cartSidebar = document.getElementById("cart-sidebar");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalLabel = document.getElementById("cart-total");

// Renderizar el carrito apenas carga la página
document.addEventListener("DOMContentLoaded", updateCartUI);

// --- LÓGICA DEL CARRITO ---

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;
    renderCart();
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Adaptamos addToCart para que reciba los datos directamente
// (Asegúrate de actualizar los botones en tu index.html para pasar estos parámetros)
function addToCart(id, name, price, image, size = 'Única', quantity = 1) {
    const cartItemId = `${id}-${size}`;
    const existingItem = cart.find(item => item.cartId === cartItemId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ 
            cartId: cartItemId, 
            id: id, 
            name: name, 
            price: price, 
            size: size, 
            quantity: quantity,
            image: image 
        });
    }

    updateCartUI();
    
    // Animación de feedback
    cartCount.classList.add("scale-125", "bg-emerald-600");
    setTimeout(() => {
        cartCount.classList.remove("scale-125", "bg-emerald-600");
    }, 300);
    
    // Abrir el menú lateral automáticamente al agregar
    if(cartSidebar.classList.contains('translate-x-full')) {
        toggleCart();
    }
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
        document.body.style.overflow = "hidden"; // Evita scroll al estar abierto
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
    if (cart.length === 0) {
        alert("Agrega productos antes de confirmar.");
        return;
    }
    
    const telefono = "573007350100"; 
    let lista = cart.map(item => `- ${item.quantity}x ${item.name} (${item.size}) — $${(item.price * item.quantity).toLocaleString('es-CO')}`).join('\n');
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const mensaje = encodeURIComponent(`¡Hola dPerfumes! Quisiera confirmar el siguiente pedido:\n\n${lista}\n\nTotal: $${total.toLocaleString('es-CO')}\n\n¿Me indican los pasos para el pago?`);
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}

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

// --- LÓGICA DE LA BARRA DE ANUNCIOS ---
const announcements = [
    "Envíos gratis por compras superiores a $250.000",
    "10% off en primera compra"
];

let currentAnnouncement = 0;
const announcementElement = document.getElementById("announcement-text");

function rotateAnnouncements() {
    if (!announcementElement) return;

    // 1. Desvanecer (ocultar)
    announcementElement.classList.replace("opacity-100", "opacity-0");

    setTimeout(() => {
        // 2. Cambiar el texto
        currentAnnouncement = (currentAnnouncement + 1) % announcements.length;
        announcementElement.innerText = announcements[currentAnnouncement];

        // 3. Mostrar de nuevo
        announcementElement.classList.replace("opacity-0", "opacity-100");
    }, 200); // Espera a que termine la animación de salida
}

// Cambiar cada 4 segundos
setInterval(rotateAnnouncements, 2500);