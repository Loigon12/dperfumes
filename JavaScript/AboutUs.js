
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