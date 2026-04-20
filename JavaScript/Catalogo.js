  let cart = JSON.parse(localStorage.getItem('cart')) || []; 
        const cartCount = document.getElementById("cart-count");
        const cartSidebar = document.getElementById("cart-sidebar");
        const cartOverlay = document.getElementById("cart-overlay");
        const cartItemsContainer = document.getElementById("cart-items");
        const cartTotalLabel = document.getElementById("cart-total");

        function updateCartUI() {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.innerText = totalItems;
            renderCart();
            localStorage.setItem('cart', JSON.stringify(cart));
        }

        function addToCart(id, quantity, size, price) {
    const prod = productosDB.find(p => p.id === id);
    if (!prod) return;

    // El ID único ahora es una combinación de ID + Tamaño
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
            quantity: quantity 
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
                cartItemsContainer.innerHTML = `<p class="text-stone-400 text-center mt-10 font-light italic">El carrito está vacío</p>`;
                cartTotalLabel.innerText = "$0";
                return;
            }
            let total = 0;
            cart.forEach((item, index) => {
                const subtotal = item.price * item.quantity;
                total += subtotal;
                const div = document.createElement("div");
                div.className = "flex justify-between items-center border-b border-stone-50 pb-3";
                div.innerHTML = `
                    <div>
                        <p class="text-xs uppercase font-bold tracking-tighter">${item.name} <span class="text-stone-400 font-normal">x${item.quantity}</span></p>
                        <p class="text-stone-500 text-xs">$${subtotal.toLocaleString('es-CO')}</p>
                    </div>
                    <button onclick="removeFromCart(${index})" class="text-stone-300 hover:text-red-500 transition">
                        <i class="fa-solid fa-trash-can text-sm"></i>
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

        // --- VARIABLES DE ESTADO DEL MODAL ---
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

    // Seteamos la primera presentación por defecto
    const defaultPres = prod.presentations[0];
    selectedSize = defaultPres.size;
    selectedPrice = defaultPres.price;

    document.getElementById('modal-img').src = prod.image;
    document.getElementById('modal-name').innerText = prod.name;
    document.getElementById('modal-brand').innerText = prod.brand;
    updateModalPriceUI();
    
    // Generar botones de tamaño
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

    // Actualizar estilo visual de los botones
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

        // --- BASE DE DATOS LOCAL CON PRODUCTOS EXTRAÍDOS ---
        const productosDB = [
    { 
        id: 1, name: "9 AM Dive", brand: "Afnan", scent: "Fresco", price: 270000, inStock: true, image: "images/9amDive.webp", 
        notasSalida: "Limón, menta, grosella negra y pimienta rosa", 
        notasCorazon: "Manzana, cedro e incienso", 
        notasFondo: "Jengibre, sándalo, pachuli y jazmín",
        
        presentations: [
            { size: "100ml", price: 340000 }
        ]
    },
    { 
        id: 2, name: "9 PM Pour Femme", brand: "Afnan", scent: "Frutal", price: 260000, inStock: true, image: "images/9amPourFemme.webp", 
        notasSalida: "Frambuesa, violeta, manzana y naranja", 
        notasCorazon: "Rosa, peonía, iris y jazmín", 
        notasFondo: "Ciprés, pino, ámbar y cedro", 
        presentations: [
            { size: "100ml", price: 340000 }
        ]
    },
    { 
        id: 3, name: "9 PM", brand: "Afnan", scent: "Dulce", price: 250000, inStock: true, image: "images/9pm.webp", 
        notasSalida: "Manzana, canela, lavanda silvestre y bergamota", 
        notasCorazon: "Flor de Naranjo y Lirio del Valle", 
        notasFondo: "Vainilla, haba tonka, ámbar y pachulí", 

        presentations: [
            { size: "100ml", price: 340000 }
        ]
    },
    { 
        id: 4, name: "9 PM Elixir", brand: "Afnan", scent: "Especiado", price: 300000, inStock: true, image: "images/9pmElixir.webp", 
        notasSalida: "Cardamomo, nuez moscada y elemí", 
        notasCorazon: "Pimiento, Lavanda y Cuero", 
        notasFondo: "Vainilla, pachulí, labdanum y rosa de roca",
        
        presentations: [
            { size: "100ml", price: 340000 }
        ]
    },
    { 
        id: 5, name: "9 PM Night out", brand: "Afnan", scent: "Dulce", price: 330000, inStock: true, image: "images/9pmNightOut.webp", 
        notasSalida: "Pitahaya, lavanda, coñac, manzana y bergamota", 
        notasCorazon: "Toffee, Gamuza, Cardamomo, Cedar y Mahonial", 
        notasFondo: "Haba tonka, ambroxan, madera de akigalala y pachulí" ,
        presentations: [
            { size: "100ml", price: 340000 }
        ]
    },
    { 
        id: 6, name: "9 PM Rebel", brand: "Afnan", scent: "Amaderado", price: 300000, inStock: true, image: "images/9Pm-Rebel.webp", 
        notasSalida: "Piña, manzana y mandarina", 
        notasCorazon: "Musgo de roble, cedro y vainilla", 
        notasFondo: "Madera seca, ámbar gris, caramelo y almizcle",
        presentations: [
            { size: "100ml", price: 340000 }
        ] 
    },
    { 
        id: 7, name: "Amber Oud Aqua Dubai", brand: "Al Haramain", scent: "Fresco", price: 340000, inStock: true, image: "images/AmberOudAquiaDubai.webp", 
        notasSalida: "Bergamota, notas verdes y mandarina", 
        notasCorazon: "Melón, ámbar, grosella negra y piña", 
        notasFondo: "Almizcle, petitgrain, galbanum y vainilla", 

        presentations: [
            { size: "75ml", price: 340000 },
            { size: "100ml", price: 410000 }
            
        ]
    },
    { 
        id: 8, name: "Amber Oud Dubai Night", brand: "Al Haramain", scent: "Oriental", price: 360000, inStock: true, image: "images/AmberOudDubaiNight.webp", 
        notasSalida: "Azafrán, bergamota y elemi", 
        notasCorazon: "Agarwood, rosa búlgara y Lirio del Valle", 
        notasFondo: "Haba tonka, ámbar, almizcle blanco y musgo de roble",
        
        presentations: [
            { size: "75ml", price: 360000 },
            { size: "100ml", price: 410000 }
            
        ]
    },
    { 
        id: 9, name: "Amber Oud Gold Edition", brand: "Al Haramain", scent: "Dulce", price: 250000, inStock: true, image: "images/Al-Haramain-Amber-Oud-Gold-Edition-60-ml.webp", 
        notasSalida: "Bergamota y Notas Verdes", 
        notasCorazon: "Melón, Piña y Ámbar", 
        notasFondo: "Vainilla, Almizcle y Notas Amaderadas",

        presentations: [
            { size: "75ml", price: 250000 },
            { size: "100ml", price: 330000 },
            { size: "120ml", price: 360000 }
            
        ]
    },
    { 
        id: 10, name: "Amber Oud Ruby", brand: "Al Haramain", scent: "Amaderado", price: 300000, inStock: true, image: "images/AlHaramainAmberOudRubyEdition.webp", 
        notasSalida: "Azafrán y almendra amarga", 
        notasCorazon: "Cedro y jazmín egipcio", 
        notasFondo: "Ámbar gris, notas amaderadas y almizcle",

        presentations: [
            { size: "75ml", price: 300000 },
            { size: "100ml", price: 400000 },
            { size: "120ml", price: 460000 }
            
        ]
    },
    { 
        id: 11, name: "Art of Nature II", brand: "Lattafa", scent: "Amaderado", price: 320000, inStock: true, image: "images/Art-of-Nature-II-scaled_1200x1200.webp", 
        notasSalida: "Incienso de olíbano (franquincienso), mandarina, bergamota y manzana", 
        notasCorazon: "Cardamomo, flor de azahar del naranjo y rosa", 
        notasFondo: "Vainilla, almizcle, ambroxan, madera de gaiac y cedro",
        presentations: [
            { size: "100ml", price: 320000 }
        ]
    },
    { 
        id: 12, name: "Art of Universe", brand: "Lattafa", scent: "Cítrico", price: 320000, inStock: true, image: "images/Lattafa-Art-Of-Universe.webp", 
        notasSalida: "Mandarina, jengibre, bergamota y menta", 
        notasCorazon: "Pera y flor de azahar del naranjo", 
        notasFondo: "Almizcle, ámbar y cedro",
        presentations: [
            { size: "100ml", price: 320000 }
        ]
    },
    { 
        id: 13, name: "Asad", brand: "Lattafa", scent: "Amaderado", price: 250000, inStock: true, image: "images/LattafaAsad.webp", 
        notasSalida: "Pimienta negra, tabaco y piña", 
        notasCorazon: "Pachulí, café e iris", 
        notasFondo: "Vainilla, ámbar, madera seca, benjuí y ládano",
        presentations: [
            { size: "100ml", price: 250000 }
        ] 
    },
    { 
        id: 14, name: "Asad Bourbon", brand: "Lattafa", scent: "Especiado", price: 310000, inStock: true, image: "images/Asad_Bourbon_Lattafa.webp", 
        notasSalida: "Lavanda, ciruela Mirabel y pimienta rosa", 
        notasCorazon: "Cacao, nuez moscada y Davana", 
        notasFondo: "Vainilla Bourbon, ámbar y vetiver",
        presentations: [
            { size: "100ml", price: 310000 }
        ]
    },
    { 
        id: 15, name: "Asad Elixir", brand: "Lattafa", scent: "Amaderado", price: 310000, inStock: true, image: "images/assadElixir.webp", 
        notasSalida: "Pimienta rosa, azafrán y toronja (pomelo)", 
        notasCorazon: "Tabaco, vainilla y cedro", 
        notasFondo: "Ámbar ligero, Incienso, pachulí y cachemira",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 16, name: "Atlas", brand: "Lattafa", scent: "Fresco", price: 280000, inStock: true, image: "images/AtlasLataffa.webp", 
        notasSalida: "Notas marinas, sal y limón (lima ácida)", 
        notasCorazon: "Davana e iris", 
        notasFondo: "Ámbar gris, musgo de roble y sándalo",
        presentations: [
            { size: "100ml", price: 280000 }
        ] 
    },
    { 
        id: 17, name: "Bharara Femme", brand: "Bharara", scent: "Floral", price: 330000, inStock: true, image: "images/Bharara-Niche-Femme-GDE.webp", 
        notasSalida: "Frutas", 
        notasCorazon: "Rosa turca e incienso", 
        notasFondo: "Sándalo y vainilla",
        presentations: [
            { size: "100ml", price: 330000 }
        ]
    },
    { 
        id: 18, name: "Bharara King", brand: "Bharara", scent: "Cítrico", price: 350000, inStock: true, image: "images/Bharara-king.webp", 
        notasSalida: "Naranja, bergamota y limón (lima ácida)", 
        notasCorazon: "Notas afrutadas", 
        notasFondo: "Vainilla, almizcle blanco y ámbar",
        presentations: [
            { size: "100ml", price: 350000 }
        ] 
    },
    { 
        id: 19, name: "Bharara King Gold", brand: "Bharara", scent: "Frutal", price: 410000, inStock: true, image: "images/Bharara King Gold.webp", 
        notasSalida: "Naranja dulce, bergamota, cítricos y limón (lima ácida)", 
        notasCorazon: "Notas afrutadas, coco y Frutas rojas", 
        notasFondo: "Vainilla, notas orientales, ámbar y almizcle blanco",
        presentations: [
            { size: "100ml", price: 410000 }
        ]
    },
    { 
        id: 20, name: "Bharara Niche", brand: "Bharara", scent: "Amaderado", price: 330000, inStock: true, image: "images/PERFUME-BHARARA-NICHE-100ML.webp", 
        notasSalida: "Cítricos y enebro", 
        notasCorazon: "Jazmín, chocolate y abeto balsámico", 
        notasFondo: "Amberwood y musgo",
        presentations: [
            { size: "100ml", price: 330000 }
        ]
    },
    { 
        id: 21, name: "Bharara Onyx", brand: "Bharara", scent: "Especiado", price: 400000, inStock: true, image: "images/Bharara Onyx.webp", 
        notasSalida: "Cilantro, bergamota y flores", 
        notasCorazon: "Manzana, vainilla y ambroxan", 
        notasFondo: "Ámbar gris, haba tonka y notas amaderadas",
        presentations: [
            { size: "100ml", price: 400000 }
        ] 
    },
    { 
        id: 22, name: "Bharara Rose", brand: "Bharara", scent: "Floral", price: 350000, inStock: true, image: "images/fragancia-premium-bharara-rose-edp-100ml.webp", 
        notasSalida: "No especificadas en el catálogo", 
        notasCorazon: "No especificadas en el catálogo", 
        notasFondo: "No especificadas en el catálogo",
        presentations: [
            { size: "100ml", price: 350000 }
        ]
    },
    { 
        id: 23, name: "Club de Nuit Iconic", brand: "Armaf", scent: "Amaderado", price: 280000, inStock: true, image: "images/armaf-fragancias-armaf-club-de-nuit-iconic.webp", 
        notasSalida: "Toronja (pomelo), pimienta rosa, limón (lima ácida), menta y cilantro", 
        notasCorazon: "Melón, jengibre, jazmín y nuez moscada", 
        notasFondo: "Incienso, notas amaderadas, sándalo, cedro, ámbar, pachulí y ládano",
        presentations: [
            { size: "100ml", price: 280000 }
        ]
    },
    { 
        id: 24, name: "Club de Nuit Intense Man", brand: "Armaf", scent: "Cítrico", price: 230000, inStock: true, image: "images/perfume-armaf-club-de-nuit-intense-man-hombre-locion-105ml.webp", 
        notasSalida: "Limón (lima ácida), piña, bergamota, grosellas negras y manzana", 
        notasCorazon: "Abedul, jazmín y rosa", 
        notasFondo: "Almizcle, ámbar gris, pachulí y vainilla",
        presentations: [
            { size: "100ml", price: 230000 }
        ]
    },
    { 
        id: 25, name: "Club de Nuit Precieux I", brand: "Armaf", scent: "Amaderado", price: 370000, inStock: true, image: "images/ClubDeNuitPrecieux.webp", 
        notasSalida: "Piña, limón, bergamota, caramelo, pimienta rosa, pera y pimienta negra", 
        notasCorazon: "Musgo de roble, madera blanca, jazmín, lirio de los valles y anís", 
        notasFondo: "Ambroxan, almizcle blanco, pachulí, ámbar, cedro, cuero y vainilla",
        presentations: [
            { size: "55ml", price: 370000 }
        ] 
    },
    { 
        id: 26, name: "Club de Nuit Sillage", brand: "Armaf", scent: "Fresco", price: 240000, inStock: true, image: "images/ClubDeNuitSillage.webp", 
        notasSalida: "Bergamota, limón (lima ácida), lima, grosellas negras, hojas de violeta y jengibre", 
        notasCorazon: "Rosa, iris y jazmín", 
        notasFondo: "Ambroxan, almizcle, sándalo y cedro",
        presentations: [
            { size: "105ml", price: 240000 }
        ] 
    },
    { 
        id: 27, name: "Club de Nuit Untold", brand: "Armaf", scent: "Amaderado", price: 330000, inStock: true, image: "images/ClubdeNuitUntold.webp", 
        notasSalida: "Azafrán y jazmín", 
        notasCorazon: "Amberwood y ámbar gris", 
        notasFondo: "Resina de abeto y cedro",
        presentations: [
            { size: "105ml", price: 330000 }
        ]
    },
    { 
        id: 28, name: "Club de Nuit Urban Man Elixir", brand: "Armaf", scent: "Especiado", price: 315000, inStock: true, image: "images/clubdenuitUrbanElixir-convertido-de-avif.webp", 
        notasSalida: "Bergamota, pimienta rosa, flor de azahar del naranjo y jazmín", 
        notasCorazon: "Lavanda, elemí, geranio, vetiver, azafrán y cempasúchil", 
        notasFondo: "Ambroxan, ámbar, cedro, pachulí y ládano",
        presentations: [
            { size: "105ml", price: 315000 }
        ] 
    },
    { 
        id: 29, name: "Club de Nuit Woman", brand: "Armaf", scent: "Frutal", price: 210000, inStock: true, image: "images/ArmafClubdeNuitMujer.webp", 
        notasSalida: "Naranja, bergamota, toronja (pomelo) y durazno (melocotón)", 
        notasCorazon: "Rosa, jazmín, geranio y lichi", 
        notasFondo: "Pachulí, almizcle, vainilla y vetiver",
        presentations: [
            { size: "105ml", price: 210000 }
        ] 
    },
    { 
        id: 30, name: "Eclaire", brand: "Lattafa", scent: "Dulce", price: 330000, inStock: true, image: "images/eclaire-lattafa-mujer-100-ml-edp.webp", 
        notasSalida: "Caramelo, leche y azúcar", 
        notasCorazon: "Miel y flores blancas", 
        notasFondo: "Vainilla, praliné y almizcle",
        presentations: [
            { size: "100ml", price: 330000 }
        ] 
    },
    { 
        id: 31, name: "Emeer", brand: "Lattafa", scent: "Amaderado", price: 310000, inStock: true, image: "images/emeer.webp", 
        notasSalida: "Limón (lima ácida), bergamota, esclarea y bayas de enebro", 
        notasCorazon: "Té Blanco, sándalo, cardamomo e incienso de olíbano", 
        notasFondo: "Ámbar gris, cedro, cachemira y pachulí",
        presentations: [
            { size: "100ml", price: 310000 }
        ]
    },
    { 
        id: 32, name: "Fakhar Black", brand: "Lattafa", scent: "Fresco", price: 250000, inStock: true, image: "images/fakharBlack.webp", 
        notasSalida: "Manzana, bergamota y jengibre", 
        notasCorazon: "Lavanda, salvia, bayas de enebro y geranio", 
        notasFondo: "Haba tonka, cedro, Amberwood y vetiver",
        presentations: [
            { size: "100ml", price: 250000 }
        ] 
    },
    { 
        id: 33, name: "Fakhar Gold", brand: "Lattafa", scent: "Amaderado", price: 240000, inStock: true, image: "images/fakharGold.webp", 
        notasSalida: "Nardos y sal", 
        notasCorazon: "Ámbar, haba tonka y cachemira", 
        notasFondo: "Cedro, ládano y vetiver",
        presentations: [
            { size: "100ml", price: 240000 }
        ] 
    },
    { 
        id: 34, name: "Fakhar Platin", brand: "Lattafa", scent: "Especiado", price: 260000, inStock: true, image: "images/FakharPlatin.webp", 
        notasSalida: "Bergamota, pimienta rosa y cardamomo", 
        notasCorazon: "Guayaba, lavanda y jengibre", 
        notasFondo: "Incienso, palo santo y sándalo",
        presentations: [
            { size: "100ml", price: 260000 }
        ] 
    },
    { 
        id: 35, name: "Fakhar Rose", brand: "Lattafa", scent: "Floral", price: 250000, inStock: true, image: "images/fakharRose.webp", 
        notasSalida: "Frutas, azucena, granada y aldehídos", 
        notasCorazon: "Nardos, jazmín, gardenia, ylang-ylang, madreselva, rosa y peonía", 
        notasFondo: "Vainilla, almizcle blanco, sándalo y ambroxan",
        presentations: [
            { size: "100ml", price: 250000 }
        ] 
    },
    { 
        id: 36, name: "Hawas For Him", brand: "Rasasi", scent: "Fresco", price: 340000, inStock: true, image: "images/Hawas-for-Him-Rasasi-convertido-de-png.webp", 
        notasSalida: "Manzana, bergamota, limón (lima ácida) y canela", 
        notasCorazon: "Notas acuosas, ciruela, flor de azahar del naranjo y cardamomo", 
        notasFondo: "Ámbar gris, almizcle, pachulí y trozos de madera a la deriva",
        presentations: [
            { size: "100ml", price: 340000 },
            { size: "100ml", price: 410000 }
            
        ] 
    },
    { 
        id: 37, name: "Hawas Fire", brand: "Rasasi", scent: "Amaderado", price: 410000, inStock: true, image: "images/hawasFire.webp", 
        notasSalida: "Esclarea", 
        notasCorazon: "Notas marinas y jazmín egipcio", 
        notasFondo: "Ámbar, Notas minerales y ámbar gris",
        presentations: [
            { size: "100ml", price: 410000 }
        ]
    },
    { 
        id: 38, name: "Hawas Ice", brand: "Rasasi", scent: "Fresco", price: 410000, inStock: true, image: "images/hawasIce.webp", 
        notasSalida: "Manzana, limón italiano, bergamota de Sicilia y anís estrellado", 
        notasCorazon: "Ciruela, flor de azahar del naranjo y cardamomo", 
        notasFondo: "Almizcle, ámbar, trozos de madera a la deriva y musgo",
        presentations: [
            { size: "100ml", price: 410000 }
        ]
         
    },
    { 
        id: 39, name: "Hawas Kobra", brand: "Rasasi", scent: "Cítrico", price: 410000, inStock: true, image: "images/perfume-hawas-kobra-for-him-rasasi-eau-de-parfum-100ml-hombre-7074933_grande.webp", 
        notasSalida: "Jengibre, bergamota y naranja tangerina", 
        notasCorazon: "Canela, té verde y neroli", 
        notasFondo: "Almizcle, notas amaderadas y ámbar",
        presentations: [
            { size: "100ml", price: 410000 }
        ]

    },
    { 
        id: 40, name: "Hawas Malibu", brand: "Rasasi", scent: "Frutal", price: 410000, inStock: true, image: "images/perfume_hawas_malibu_rasasi_hombre.webp", 
        notasSalida: "Piña, naranja y toronja (pomelo)", 
        notasCorazon: "Ámbar, raíz de lirio y lavanda", 
        notasFondo: "Haba tonka, almizcle, cachemira y pachulí",
        presentations: [
            { size: "100ml", price: 410000 }
        ]
    },
    { 
        id: 41, name: "Hawas Black", brand: "Rasasi", scent: "Amaderado", price: 410000, inStock: true, image: "images/Hawas-Rasasi-Black.webp", 
        notasSalida: "Bergamota, toronja (pomelo) y piña", 
        notasCorazon: "Pachulí, cedro y jazmín", 
        notasFondo: "Musgo de roble, notas amaderadas y ámbar",
        
        presentations: [
            { size: "100ml", price: 410000 }
        ]
    },
    { 
        id: 42, name: "Hawas Elixir", brand: "Rasasi", scent: "Dulce", price: 410000, inStock: true, image: "images/hawasElixir.webp", 
        notasSalida: "Menta, bergamota y abrótano", 
        notasCorazon: "Chocolate oscuro, lavanda y benjuí", 
        notasFondo: "Vainilla, haba tonka y almizcle blanco",
        presentations: [
            { size: "100ml", price: 410000 }
        ]
    },
    { 
        id: 43, name: "Hawas Tropical", brand: "Rasasi", scent: "Frutal", price: 410000, inStock: true, image: "images/hawas-tropical-de-rasasi-100-ml-edp-hombre.webp", 
        notasSalida: "Agua de coco, hojas de higuera y jengibre", 
        notasCorazon: "Coco, higo y menta", 
        notasFondo: "Sándalo, haba tonka y almizcle",
        presentations: [
            { size: "100ml", price: 410000 }
        ]
    },
    { 
        id: 44, name: "Hawas Atlantis", brand: "Rasasi", scent: "Fresco", price: 380000, inStock: true, image: "images/HawasAtlantis.webp", 
        notasSalida: "Bergamota, limón (lima ácida), manzana y canela", 
        notasCorazon: "Notas acuosas, flor de azahar del naranjo, ciruela y cardamomo", 
        notasFondo: "Trozos de madera a la deriva, ámbar gris, almizcle y pachulí",
        presentations: [
            { size: "100ml", price: 380000 }
        ]
    },
    { 
        id: 45, name: "Hawas Pink", brand: "Rasasi", scent: "Dulce", price: 400000, inStock: true, image: "images/hawaspink.webp", 
        notasSalida: "Canela, nuez moscada y neroli", 
        notasCorazon: "Malvavisco (bombón), nardos y flor de azahar del naranjo", 
        notasFondo: "Algodón de azúcar, vainilla y haba tonka",
        presentations: [
            { size: "100ml", price: 400000 }
        ] 
    },
    { 
        id: 46, name: "Haya", brand: "Lattafa", scent: "Floral", price: 280000, inStock: true, image: "images/haya.webp", 
        notasSalida: "Fresa, champaña, naranja tangerina, naranja sanguina y rosa", 
        notasCorazon: "Gardenia, jazmín y orquídea de vainilla", 
        notasFondo: "Ámbar, sándalo y castaña",
        presentations: [
            { size: "100ml", price: 280000 }
        ] 
    },
    { 
        id: 47, name: "Her Confession", brand: "Lattafa", scent: "Dulce", price: 340000, inStock: true, image: "images/Lattafa-Her-Confession-EDP-100ml.webp", 
        notasSalida: "Canela y Mystikal", 
        notasCorazon: "Nardos, jazmín, incienso y Mahonial", 
        notasFondo: "Vainilla, almizcle y haba tonka",
        presentations: [
            { size: "100ml", price: 340000 }
        ]
    },
    { 
        id: 48, name: "His Confession", brand: "Lattafa", scent: "Amaderado", price: 310000, inStock: true, image: "images/hisConfession.webp", 
        notasSalida: "Lavanda, canela y mandarina", 
        notasCorazon: "Iris, benjuí, ciprés y Mahonial", 
        notasFondo: "Vainilla, haba tonka, ámbar, incienso, cedro y pachulí",
        presentations: [
            { size: "100ml", price: 310000 }
        ]
    },
    { 
        id: 49, name: "Honor & Glory", brand: "Lattafa", scent: "Dulce", price: 250000, inStock: true, image: "images/honoryGlory.webp", 
        notasSalida: "Piña y créme brulée", 
        notasCorazon: "Canela, cúrcuma (azafrán de la India), pimienta negra y benjuí", 
        notasFondo: "Vainilla, sándalo, cachemira y musgo",
        presentations: [
            { size: "100ml", price: 250000 }
        ]
    },
    { 
        id: 50, name: "Island Bliss", brand: "Armaf", scent: "Dulce", price: 360000, inStock: true, image: "images/armaf-island-bliss.webp", 
        notasSalida: "Bayas silvestres y notas verdes", 
        notasCorazon: "Coco, flor de azahar del naranjo, Lactonas y nenúfar (lirio de agua)", 
        notasFondo: "Vainilla, haba tonka y almizcle",
        presentations: [
            { size: "100ml", price: 360000 }
        ]
    },
    { 
        id: 51, name: "Khamrah", brand: "Lattafa", scent: "Dulce", price: 310000, inStock: true, image: "images/khamrah.webp", 
        notasSalida: "Canela, nuez moscada y bergamota", 
        notasCorazon: "Dátiles, praliné, nardos y Mahonial", 
        notasFondo: "Vainilla, haba tonka, Amberwood, mirra, benjuí y Akigalawood",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 52, name: "Khamrah Dukhan", brand: "Lattafa", scent: "Especiado", price: 360000, inStock: true, image: "images/kHAMRAHDUKHAN.webp", 
        notasSalida: "Especias, pimienta de Jamaica y mandarina", 
        notasCorazon: "Incienso, ládano, flor de azahar del naranjo y pachulí", 
        notasFondo: "Praliné, tabaco, ámbar, haba tonka y benjuí",
        presentations: [
            { size: "100ml", price: 360000 }
        ] 
    },
    { 
        id: 53, name: "Khamrah Qahwa", brand: "Lattafa", scent: "Dulce", price: 315000, inStock: true, image: "images/LattafaKhamrahQawha.webp", 
        notasSalida: "Canela, cardamomo y jengibre", 
        notasCorazon: "Praliné, Frutas confitadas y flores blancas", 
        notasFondo: "Vainilla, café, haba tonka, benjuí y almizcle",
        presentations: [
            { size: "100ml", price: 315000 }
        ]
    },
    { 
        id: 54, name: "The Kingdom Man", brand: "Lattafa", scent: "Dulce", price: 260000, inStock: true, image: "images/the-kingdom-lattafa-100-ml-edp-hombre.webp", 
        notasSalida: "Lavanda, menta y salvia", 
        notasCorazon: "Vainilla, tabaco y flor de azahar del naranjo", 
        notasFondo: "Haba tonka, benjuí y ládano",
        presentations: [
            { size: "100ml", price: 260000 }
        ]
    },
    { 
        id: 55, name: "Musamam White Intense", brand: "Lattafa", scent: "Cítrico", price: 340000, inStock: true, image: "images/perfume-musamam-white-intense-lattafa-dama-100-ml-edp.webp", 
        notasSalida: "Especias, bergamota y naranja", 
        notasCorazon: "Coco, ylang-ylang, ambroxan y Mahonial", 
        notasFondo: "Sándalo, almizcle y benjuí" ,
        presentations: [
            { size: "100ml", price: 340000 }
        ]
    },
    { 
        id: 56, name: "Nitro Elixir", brand: "Dumont", scent: "Amaderado", price: 310000, inStock: true, image: "images/nitroElixir.webp", 
        notasSalida: "Manzana, bergamota, cardamomo y naranja", 
        notasCorazon: "Flor de azahar del naranjo, praliné, geranio y menta", 
        notasFondo: "Ámbar gris, haba tonka, ámbar y musgo",
        presentations: [
            { size: "100ml", price: 310000 }
        ]
    },
    { 
        id: 57, name: "Nitro Intense", brand: "Dumont", scent: "Especiado", price: 260000, inStock: true, image: "images/perfume_nitro_intense_dumont_hombre.webp", 
        notasSalida: "Piña, grosellas negras, ciruela, bergamota, canela y coñac", 
        notasCorazon: "Abedul, lavanda, pachulí, mirra, pimienta, jazmín, iris y rosa", 
        notasFondo: "Ámbar, almizcle, sándalo, vainilla y haba tonka",
        presentations: [
            { size: "100ml", price: 260000 }
        ] 
    },
    { 
        id: 58, name: "Nitro Red", brand: "Dumont", scent: "Fresco", price: 280000, inStock: true, image: "images/Nitro-Red.webp", 
        notasSalida: "Manzana, lavanda y bergamota", 
        notasCorazon: "Sandía, cedro y cálamo aromático", 
        notasFondo: "Ámbar, sándalo y pachulí",
        presentations: [
            { size: "100ml", price: 280000 }
        ]
    },
    { 
        id: 59, name: "Nitro Red Intensely", brand: "Dumont", scent: "Amaderado", price: 310000, inStock: true, image: "images/redIntensely-convertido-de-jpg.webp", 
        notasSalida: "Melón, durazno (melocotón), manzana y bergamota", 
        notasCorazon: "Ámbar, sal de mar, cedro y lirio de los valles", 
        notasFondo: "Ámbar, sándalo, pachulí y musgo",
        presentations: [
            { size: "100ml", price: 310000 }
        ]
    },
    { 
        id: 60, name: "Nitro White", brand: "Dumont", scent: "Dulce", price: 260000, inStock: true, image: "images/Nitro_White_Dumont.webp", 
        notasSalida: "Bayas de enebro, iris y ciprés", 
        notasCorazon: "Mirra y pachulí", 
        notasFondo: "Miel, vainilla, ámbar, almizcle y cuero",
        presentations: [
            { size: "100ml", price: 260000 }
        ] 
    },
    { 
        id: 61, name: "Odyssey Aqua", brand: "Armaf", scent: "Fresco", price: 240000, inStock: true, image: "images/Armaf-Odyssey-_Aqua-100ml.webp", 
        notasSalida: "Naranja, toronja (pomelo) y abrótano", 
        notasCorazon: "Menta y lavanda", 
        notasFondo: "Ambroxan, ciprés y pachulí",
        presentations: [
            { size: "100ml", price: 240000 }
        ] 
    },
    { 
        id: 62, name: "Odyssey Artisto", brand: "Armaf", scent: "Dulce", price: 315000, inStock: true, image: "images/Perfume-Armaf-Odyssey-Artisto-Edp-Hombre-100ml-2.webp", 
        notasSalida: "Bergamota, Notas de frutos secos y salvia", 
        notasCorazon: "Coco, frutas tropicales y canela", 
        notasFondo: "Ámbar, vainilla y haba tonka",
        presentations: [
            { size: "100ml", price: 315000 }
        ]
    },
    { 
        id: 63, name: "Odyssey Bahamas", brand: "Armaf", scent: "Fresco", price: 310000, inStock: true, image: "images/Odyssey-Bahamas.webp", 
        notasSalida: "Melón cantalupo, melón, Algas, sal, pera, manzana Granny Smith y ciruela", 
        notasCorazon: "Notas acuáticas, nenúfar (lirio de agua), musgo de roble y Incienso", 
        notasFondo: "Almizcle, ámbar, azúcar y cedro",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 64, name: "Odyssey Candee", brand: "Armaf", scent: "Dulce", price: 280000, inStock: true, image: "images/candee-convertido-de-avif.webp", 
        notasSalida: "Fresa, frambuesa, geranio, durazno (melocotón) y bergamota", 
        notasCorazon: "Caramelo, jazmín y maracuyá (fruta de la pasión)", 
        notasFondo: "Pachulí, almizcle y ámbar",
        presentations: [
            { size: "100ml", price: 280000 }
        ] 
    },
    { 
        id: 65, name: "Odyssey Go Mango", brand: "Armaf", scent: "Frutal", price: 310000, inStock: true, image: "images/goMango.webp", 
        notasSalida: "Limón (lima ácida), pimienta rosa, jengibre y flores blancas", 
        notasCorazon: "Mango, haba tonka y Madera seca", 
        notasFondo: "Ámbar, vainilla, madera de gaiac, almizcle y Notas de frutos secos",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 66, name: "Odyssey Homme", brand: "Armaf", scent: "Oriental", price: 240000, inStock: true, image: "images/Armafhomme.webp", 
        notasSalida: "Vainilla y ámbar", 
        notasCorazon: "Notas orientales, especias e iris", 
        notasFondo: "Vainilla, cuero y jazmín",
        presentations: [
            { size: "100ml", price: 240000 }
        ] 
    },
    { 
        id: 67, name: "Odyssey Homme White", brand: "Armaf", scent: "Fresco", price: 260000, inStock: true, image: "images/Armaf-Odyssey-Homme-White.webp", 
        notasSalida: "Pimienta rosa, toronja (pomelo) y yuzu", 
        notasCorazon: "Hojas de violeta y notas marinas", 
        notasFondo: "Ámbar, Amberwood y madera de gaiac",
        presentations: [
            { size: "100ml", price: 260000 }
        ] 
    },
    { 
        id: 68, name: "Odyssey Mandarin Sky", brand: "Armaf", scent: "Dulce", price: 280000, inStock: true, image: "images/Armaf-Odyssey-Mandarin-Sky.webp", 
        notasSalida: "Mandarina, naranja, azafrán y salvia", 
        notasCorazon: "Caramelo, haba tonka y cempasúchil (tagete, clavelón)", 
        notasFondo: "Ambroxan, cedro y vetiver",
        presentations: [
            { size: "100ml", price: 280000 }
        ] 
    },
    { 
        id: 69, name: "Odyssey Mandarin Sky Elix", brand: "Armaf", scent: "Especiado", price: 315000, inStock: true, image: "images/Odyssey-Mandarin-Sky-Elixir.webp", 
        notasSalida: "Mandarina, naranja, lavanda, cardamomo y pimienta negra", 
        notasCorazon: "Caramelo, haba tonka, pachulí e incienso", 
        notasFondo: "Vainilla y vetiver",
        presentations: [
            { size: "100ml", price: 315000 }
        ]
    },
    { 
        id: 70, name: "Odyssey Marshmallow", brand: "Armaf", scent: "Dulce", price: 310000, inStock: true, image: "images/Armaf-Odyssey-Marshmallow.webp", 
        notasSalida: "Coco, manzana, limón (lima ácida), peonía y lirio de los valles", 
        notasCorazon: "Malvavisco (bombón), fresa, durazno (melocotón), chabacano, frambuesa y flor de azahar del naranjo", 
        notasFondo: "Praliné, vainilla, almizcle, haba tonka y ámbar",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 71, name: "Odyssey Mega", brand: "Armaf", scent: "Cítrico", price: 240000, inStock: true, image: "images/OdysseyMega-convertido-de-jpg.webp", 
        notasSalida: "Naranja, bergamota, limón (lima ácida), jengibre y menta", 
        notasCorazon: "Piña, salvia, enebro y geranio", 
        notasFondo: "Almizcle, cedro, haba tonka y vetiver",
        presentations: [
            { size: "100ml", price: 240000 }
        ] 
    },
    { 
        id: 72, name: "Odyssey Spectra", brand: "Armaf", scent: "Especiado", price: 270000, inStock: true, image: "images/Odyssey-Spectra.webp", 
        notasSalida: "Canela, manzana y bergamota", 
        notasCorazon: "Canela, lavanda, flor de azahar del naranjo y lirio de los valles", 
        notasFondo: "Vainilla, tabaco, haba tonka, ámbar y pachulí",
        presentations: [
            { size: "100ml", price: 270000 }
        ] 
    },
    { 
        id: 73, name: "Orientica Amber Noir", brand: "Orientica", scent: "Amaderado", price: 410000, inStock: true, image: "images/OrienticaAmberNoir.webp", 
        notasSalida: "Zanahoria, higo y elemí", 
        notasCorazon: "Lirio de los valles (muguete)", 
        notasFondo: "Sándalo, almizcle y cedro",
        presentations: [
            { size: "80ml", price: 410000 }
        ] 
    },
    { 
        id: 74, name: "Orientica Amber Rouge", brand: "Orientica", scent: "Amaderado", price: 410000, inStock: true, image: "images/OrienticaAmberRouge.webp", 
        notasSalida: "Azafrán y jazmín", 
        notasCorazon: "Amberwood y ámbar gris", 
        notasFondo: "Cedro y resina de abeto",
        presentations: [
            { size: "80ml", price: 410000 }
        ] 
    },
    { 
        id: 75, name: "Orientica Azure Fantasy", brand: "Orientica", scent: "Fresco", price: 510000, inStock: true, image: "images/azure-fantancy-orientica.webp", 
        notasSalida: "Bergamota, jengibre, menta y nuez moscada", 
        notasCorazon: "Jazmín, lirio de los valles (muguete) y geranio", 
        notasFondo: "Almizcle, ámbar gris y madera de gaiac",
        presentations: [
            { size: "80ml", price: 510000 }
        ]
    },
    { 
        id: 76, name: "Orientica Oud Saffron", brand: "Orientica", scent: "Oriental", price: 410000, inStock: true, image: "images/perfume-unisex-orientica-oud-safron-de-al-haramain-100-ml-edp.webp", 
        notasSalida: "Notas orientales y vainilla", 
        notasCorazon: "Azafrán y pachulí", 
        notasFondo: "Madera de oud, almizcle y madera de gaiac",
        presentations: [
            { size: "80ml", price: 410000 }
        ] 
    },
    { 
        id: 77, name: "Orientica Royal Amber", brand: "Orientica", scent: "Dulce", price: 410000, inStock: true, image: "images/OrienticaRoyalAmber.webp", 
        notasSalida: "Bergamota y notas verdes", 
        notasCorazon: "Notas dulces, melón, piña y ámbar", 
        notasFondo: "Almizcle, notas amaderadas y vainilla",
        presentations: [
            { size: "80ml", price: 410000 }
        ] 
    },
    { 
        id: 78, name: "Orientica Royal Bleu", brand: "Orientica", scent: "Cítrico", price: 410000, inStock: true, image: "images/royalBleu.webp", 
        notasSalida: "Lavanda, manzana verde, mandarina, pimienta y bergamota", 
        notasCorazon: "Cardamomo, geranio, violeta y jazmín", 
        notasFondo: "Vainilla, sándalo, madera de gaiac, pachulí y almizcle",
        presentations: [
            { size: "80ml", price: 410000 }
        ] 
    },
    { 
        id: 79, name: "Orientica Velvet Gold", brand: "Orientica", scent: "Dulce", price: 410000, inStock: true, image: "images/orienticaVelvedGold.webp", 
        notasSalida: "Caramelo, violeta, pimienta rosa y bergamota", 
        notasCorazon: "Notas atalcadas, rosa y pachulí", 
        notasFondo: "Vainilla, almizcle y Notas de animal",
        presentations: [
            { size: "80ml", price: 410000 }
        ] 
    },
    { 
        id: 80, name: "Rayhaan Corium", brand: "Rayhaan", scent: "Amaderado", price: 250000, inStock: true, image: "images/rayhaanCorium-convertido-de-jpg.webp", 
        notasSalida: "Castaña, especias y elemí", 
        notasCorazon: "Salvia", 
        notasFondo: "Vainilla, cuero y madera de oud",
        presentations: [
            { size: "100ml", price: 250000 }
        ]
    },
    { 
        id: 81, name: "Rayhaan Crimson", brand: "Rayhaan", scent: "Especiado", price: 280000, inStock: true, image: "images/crimson.webp", 
        notasSalida: "Canela, pimienta rosa y cardamomo", 
        notasCorazon: "Pachulí", 
        notasFondo: "Benjuí, haba tonka y vainilla",
        presentations: [
            { size: "100ml", price: 280000 }
        ] 
    },
    { 
        id: 82, name: "Rayhaan Elixir", brand: "Rayhaan", scent: "Fresco", price: 280000, inStock: true, image: "images/rayhaan-elixir-perfume-bottle-beside-box-against-white-background.webp", 
        notasSalida: "Menta y bergamota", 
        notasCorazon: "Benjuí y lavanda", 
        notasFondo: "Vainilla y haba tonka",
        presentations: [
            { size: "100ml", price: 280000 }
        ] 
    },
    { 
        id: 83, name: "Rayhaan Italia", brand: "Rayhaan", scent: "Dulce", price: 310000, inStock: true, image: "images/Rayhaan_Italia.webp", 
        notasSalida: "Lavanda, limón (lima ácida) y bergamota", 
        notasCorazon: "Miel, canela, cachemira y jazmín", 
        notasFondo: "Vainilla, hojas de tabaco y haba tonka",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 84, name: "Rayhaan Lion", brand: "Rayhaan", scent: "Especiado", price: 260000, inStock: true, image: "images/rayhaanLion.webp", 
        notasSalida: "Lavanda, pera, menta y bergamota", 
        notasCorazon: "Canela, esclarea y comino", 
        notasFondo: "Vainilla, ámbar, cedro y pachulí",
        presentations: [
            { size: "100ml", price: 260000 }
        ] 
    },
    { 
        id: 85, name: "Rayhaan Obsidian", brand: "Rayhaan", scent: "Amaderado", price: 280000, inStock: true, image: "images/Rayhaan_Obsidian.webp", 
        notasSalida: "Iris y cítricos", 
        notasCorazon: "Cuero", 
        notasFondo: "Almizcle ambreta, sándalo, cedro y madera de oud",
        presentations: [
            { size: "100ml", price: 280000 }
        ] 
    },
    { 
        id: 86, name: "Rayhaan Tiger", brand: "Rayhaan", scent: "Especiado", price: 260000, inStock: true, image: "images/Rayhaan_Tiger.webp", 
        notasSalida: "Nuez moscada, clavo de olor y limón (lima ácida)", 
        notasCorazon: "Leche, rosa y Davana", 
        notasFondo: "Ámbar, pachulí, incienso y ládano",
        presentations: [
            { size: "100ml", price: 260000 }
        ] 
    },
    { 
        id: 87, name: "Rayhaan Pacific Aura", brand: "Rayhaan", scent: "Cítrico", price: 250000, inStock: true, image: "images/pacificAura.webp", 
        notasSalida: "Mandarina, menta, cidra, bergamota, grosellas negras y cilantro", 
        notasCorazon: "Albahaca, zanahoria y rosa", 
        notasFondo: "Higo, ambroxan y ámbar",
        presentations: [
            { size: "100ml", price: 250000 }
        ] 
    },
    { 
        id: 88, name: "Rayhaan Tropical Vibe", brand: "Rayhaan", scent: "Frutal", price: 310000, inStock: true, image: "images/rayhaan-tropical-vibe-100.webp", 
        notasSalida: "Mango, piña y bergamota", 
        notasCorazon: "Coco", 
        notasFondo: "Almizcle, ámbar, sándalo y vetiver",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 89, name: "Rome Pour Femme", brand: "Bharara", scent: "Floral", price: 230000, inStock: true, image: "images/Rome-Pour-Femme.webp", 
        notasSalida: "No especificadas en el catálogo", 
        notasCorazon: "No especificadas en el catálogo", 
        notasFondo: "No especificadas en el catálogo",
        presentations: [
            { size: "100ml", price: 230000 }
        ] 
    },
    { 
        id: 90, name: "Rome Pour Homme", brand: "Bharara", scent: "Fresco", price: 270000, inStock: true, image: "images/Rome-Pour-Hommee.webp", 
        notasSalida: "Geranio y rosa", 
        notasCorazon: "Salvia y jengibre", 
        notasFondo: "Cedro y vetiver",
        presentations: [
            { size: "100ml", price: 270000 }
        ]
    },
    { 
        id: 91, name: "Stallion 53", brand: "Emper", scent: "Amaderado", price: 250000, inStock: true, image: "images/stallion53.webp", 
        notasSalida: "Cardamomo y violeta", 
        notasCorazon: "Ámbar e iris", 
        notasFondo: "Sándalo, cuero, cedro de Virginia y papiro de Egipto",
        presentations: [
            { size: "100ml", price: 250000 }
        ] 
    },
    { 
        id: 92, name: "Sublime", brand: "Lattafa", scent: "Frutal", price: 240000, inStock: true, image: "images/sublime.webp", 
        notasSalida: "Manzana, lichi y rosa", 
        notasCorazon: "Ciruela y jazmín", 
        notasFondo: "Musgo, vainilla y pachulí",
        presentations: [
            { size: "100ml", price: 240000 }
        ]
    },
    { 
        id: 93, name: "Supremacy Collector’s Edition", brand: "Afnan", scent: "Frutal", price: 370000, inStock: true, image: "images/supremacyCollector.webp", 
        notasSalida: "Piña, bergamota, flores blancas y manzana", 
        notasCorazon: "Flor de azahar del naranjo, abedul y ámbar", 
        notasFondo: "Musgo de roble, almizcle y ámbar gris",
        presentations: [
            { size: "100ml", price: 370000 }
        ] 
    },
    { 
        id: 94, name: "Supremacy Not Only Intense", brand: "Afnan", scent: "Fresco", price: 340000, inStock: true, image: "images/Afnan-supremacy-600x600.webp", 
        notasSalida: "Grosellas negras, bergamota y manzana", 
        notasCorazon: "Musgo de roble, pachulí y lavanda", 
        notasFondo: "Ámbar gris, almizcle y azafrán",
        presentations: [
            { size: "100ml", price: 340000 }
        ] 
    },
    { 
        id: 95, name: "Teriaq", brand: "Lattafa", scent: "Dulce", price: 315000, inStock: true, image: "images/teriaq.webp", 
        notasSalida: "Caramelo, almendra amarga, chabacano y pimienta rosa", 
        notasCorazon: "Miel, ruibarbo, flores blancas y rosa", 
        notasFondo: "Cuero, vainilla, almizcle, vetiver y ládano",
        presentations: [
            { size: "100ml", price: 315000 }
        ] 
    },
    { 
        id: 96, name: "Teriaq Intense", brand: "Lattafa", scent: "Dulce", price: 340000, inStock: true, image: "images/teriaq-intense-de-lattafa-100-ml-edp.webp", 
        notasSalida: "Azafrán y bergamota", 
        notasCorazon: "Licor de ciruela y canela", 
        notasFondo: "Ámbar, haba tonka y benjuí",
        presentations: [
            { size: "100ml", price: 340000 }
        ] 
    },
    { 
        id: 97, name: "Turathi Blue", brand: "Afnan", scent: "Cítrico", price: 310000, inStock: true, image: "images/Afnan-turathi-blue-2.webp", 
        notasSalida: "Cítricos", 
        notasCorazon: "Ámbar y notas amaderadas", 
        notasFondo: "Almizcle, especias y pachulí",
        presentations: [
            { size: "90ml", price: 310000 }
        ] 
    },
    { 
        id: 98, name: "Turathi Electric", brand: "Afnan", scent: "Cítrico", price: 310000, inStock: true, image: "images/Afnan_Turathi_Electric.webp", 
        notasSalida: "Pera, toronja (pomelo) rosada, mandarina y bergamota", 
        notasCorazon: "Flor de azahar del naranjo, manzana y cedro", 
        notasFondo: "Almizcle, ámbar y vainilla",
        presentations: [
            { size: "90ml", price: 310000 }
        ] 
    },
    { 
        id: 99, name: "Vintage Radio", brand: "Lattafa", scent: "Amaderado", price: 310000, inStock: true, image: "images/lattafa-pride-vintage-radio-2.webp", 
        notasSalida: "Lavanda, salvia y bergamota", 
        notasCorazon: "Ciruela, palo santo y pimienta negra", 
        notasFondo: "Sándalo y madera de oud",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 100, name: "Yara", brand: "Lattafa", scent: "Dulce", price: 240000, inStock: true, image: "images/yara.webp", 
        notasSalida: "Orquídea, heliotropo y naranja tangerina", 
        notasCorazon: "Acorde goloso y frutas tropicales", 
        notasFondo: "Vainilla, almizcle y sándalo",
        presentations: [
            { size: "100ml", price: 240000 }
        ]
    },
    { 
        id: 101, name: "Yara Candy", brand: "Lattafa", scent: "Dulce", price: 310000, inStock: true, image: "images/lattafa-yara-candy-100ml-hlo-ltaf-yara-4219771.webp", 
        notasSalida: "Grosellas negras y Mandarina verde", 
        notasCorazon: "Caramelo de fresa efervescente y gardenia", 
        notasFondo: "Vainilla, almizcle, ámbar y sándalo",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 102, name: "Yara Elixir", brand: "Lattafa", scent: "Dulce", price: 310000, inStock: true, image: "images/yaraElixir.webp", 
        notasSalida: "S'mores de Fresa y grosellas negras", 
        notasCorazon: "Flor de azahar del naranjo y jazmín", 
        notasFondo: "Vainilla, caramelo, ámbar y almizcle",
        presentations: [
            { size: "100ml", price: 310000 }
        ] 
    },
    { 
        id: 103, name: "Yara Moi", brand: "Lattafa", scent: "Dulce", price: 240000, inStock: true, image: "images/yaramoi.webp", 
        notasSalida: "Jazmín y durazno (melocotón)", 
        notasCorazon: "Caramelo y ámbar", 
        notasFondo: "Pachulí y sándalo",
        presentations: [
            { size: "100ml", price: 240000 }
        ] 
    },
    { 
        id: 104, name: "Yara Tous", brand: "Lattafa", scent: "Frutal", price: 240000, inStock: true, image: "images/yaratousr.webp", 
        notasSalida: "Mango, coco y maracuyá (fruta de la pasión)", 
        notasCorazon: "Jazmín, flor de azahar del naranjo y heliotropo", 
        notasFondo: "Vainilla, almizcle y cachemira",

        presentations: [
            { size: "100ml", price: 240000 }
        ] 
         
    }
];

        const productGrid = document.getElementById("product-grid");
        const noResultsMessage = document.getElementById("no-results");
        
        const checkboxes = document.querySelectorAll('.filter-checkbox');
        const priceRange = document.getElementById('price-range');
        const priceDisplay = document.getElementById('price-display');
        const sortSelect = document.getElementById('sort-select');
        const searchInput = document.getElementById('search-input');

        function renderProductos(productos) {
            productGrid.innerHTML = "";
            
            if (productos.length === 0) {
                productGrid.classList.add('hidden');
                noResultsMessage.classList.remove('hidden');
                return;
            }

            productGrid.classList.remove('hidden');
            noResultsMessage.classList.add('hidden');

            productos.forEach(prod => {
                const btnText = prod.inStock ? 'Ver más' : 'Agotado';
                const btnClass = prod.inStock ? 'bg-black text-white hover:bg-stone-800' : 'bg-stone-300 text-stone-500 cursor-not-allowed';
                const btnAction = prod.inStock ? `onclick="addToCart(${prod.id}, 1); event.stopPropagation();"` : 'disabled';
                const btnOpenModal = prod.inStock ? `onclick="openProductModal(${prod.id})"` : '';

                const html = `
                    <div class="group text-center">
                        <div class="relative aspect-[3/4] bg-stone-100 overflow-hidden mb-4 cursor-pointer rounded-lg" onclick="openProductModal(${prod.id})">
                            <img src="${prod.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt="${prod.name}">
                            <button ${btnOpenModal} class="absolute bottom-0 left-0 w-full ${btnClass} py-4 text-xs uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition duration-300">
                                ${btnText}
                            </button>
                        </div>
                        <h4 class="text-sm font-medium tracking-tight mt-2 cursor-pointer hover:text-stone-500 transition" onclick="openProductModal(${prod.id})">${prod.name}</h4>
                        <p class="text-stone-500 text-sm mt-1 font-light">$${prod.price.toLocaleString('es-CO')} COP</p>
                    </div>
                `;
                productGrid.insertAdjacentHTML('beforeend', html);
            });
        }
function aplicarFiltros() {
    // 1. Capturar el término de búsqueda y pasarlo a minúsculas
    const searchTerm = searchInput.value.toLowerCase().trim(); 
    
    const checkedBrands = Array.from(document.querySelectorAll('input[data-filter="brand"]:checked')).map(cb => cb.value);
    const checkedScents = Array.from(document.querySelectorAll('input[data-filter="scent"]:checked')).map(cb => cb.value);
    const checkedAvailability = Array.from(document.querySelectorAll('input[data-filter="availability"]:checked')).map(cb => cb.value);
    const maxPrice = parseInt(priceRange.value);

    let filtrados = productosDB.filter(prod => {
        // --- NUEVA LÓGICA DE BÚSQUEDA ---
        if (searchTerm) {
            const matchName = prod.name.toLowerCase().includes(searchTerm);
            const matchBrand = prod.brand.toLowerCase().includes(searchTerm);
            // Si no coincide ni con el nombre ni con la marca, lo descartamos
            if (!matchName && !matchBrand) return false;
        }
        // ---------------------------------

        if (prod.price > maxPrice) return false;
        if (checkedBrands.length > 0 && !checkedBrands.includes(prod.brand)) return false;
        
        // Manejo de la categoría Dulce / Gourmand
        if (checkedScents.length > 0) {
            const mappedScent = prod.scent === 'Gourmand' ? 'Dulce' : prod.scent;
            if (!checkedScents.includes(mappedScent)) return false;
        }
        if (checkedAvailability.length > 0) {
            if (checkedAvailability.includes('in-stock') && !prod.inStock) return false;
            if (checkedAvailability.includes('out-of-stock') && prod.inStock) return false;
        }
        return true;
    });

    const sortBy = sortSelect.value;
    if (sortBy === 'az') filtrados.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'za') filtrados.sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === 'low-high') filtrados.sort((a, b) => a.price - b.price);
    if (sortBy === 'high-low') filtrados.sort((a, b) => b.price - a.price);

    renderProductos(filtrados);
}

        function resetFilters() {
    searchInput.value = ''; // Limpia el input de búsqueda
    checkboxes.forEach(cb => cb.checked = false);
    priceRange.value = 600000;
    priceDisplay.innerText = "$ 600.000";
    aplicarFiltros();
}

        checkboxes.forEach(cb => cb.addEventListener('change', aplicarFiltros));
        sortSelect.addEventListener('change', aplicarFiltros);
        
        priceRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            priceDisplay.innerText = "$ " + val.toLocaleString('es-CO');
        });
        priceRange.addEventListener('change', aplicarFiltros);

        updateCartUI();
        aplicarFiltros();
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