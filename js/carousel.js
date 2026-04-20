/**
 * Nexo Avionix — Lógica del Carrusel de Destinos
 */

const DESTINATIONS = [
  {
    title: "Cartagena Mágica",
    desc: "Historia, murallas y el encanto del Caribe colombiano.",
    img: "imgs/dest-cartagena.png",
    price: "Desde $189.000"
  },
  {
    title: "San Andrés Insular",
    desc: "El mar de los siete colores te espera para bucear.",
    img: "imgs/dest-san-andres.png",
    price: "Desde $310.000"
  },
  {
    title: "Medellín: Ciudad Eterna",
    desc: "Primavera todo el año, cultura y gastronomía de alto nivel.",
    img: "https://images.unsplash.com/photo-1593014631832-72352ade1130?auto=format&fit=crop&q=80&w=1200", // Fallback a Unsplash
    price: "Desde $120.000"
  }
];

let currentIndex = 0;
let autoPlayInterval = null;

export function initCarousel() {
  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  
  if (!track) return;

  // Render slides
  track.innerHTML = DESTINATIONS.map((dest, i) => `
    <div class="carousel-slide ${i === 0 ? 'active' : ''}" style="background-image: linear-gradient(to top, rgba(29,53,87,0.7), transparent), url('${dest.img}')">
      <div class="slide-content">
        <span class="slide-tag">Destino del mes</span>
        <h2>${dest.title}</h2>
        <p>${dest.desc}</p>
        <div class="slide-footer">
          <span class="slide-price">${dest.price}</span>
          <button class="btn-search-action">Ver disponibilidad</button>
        </div>
      </div>
    </div>
  `).join('');

  // Render dots
  dotsContainer.innerHTML = DESTINATIONS.map((_, i) => `
    <span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
  `).join('');

  // Event Listeners
  document.getElementById('carousel-next')?.addEventListener('click', nextSlide);
  document.getElementById('carousel-prev')?.addEventListener('click', prevSlide);
  
  dotsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('dot')) {
      goToSlide(parseInt(e.target.dataset.index, 10));
    }
  });

  startAutoPlay();
}

function nextSlide() {
  goToSlide((currentIndex + 1) % DESTINATIONS.length);
}

function prevSlide() {
  goToSlide((currentIndex - 1 + DESTINATIONS.length) % DESTINATIONS.length);
}

function goToSlide(index) {
  currentIndex = index;
  updateUI();
  resetAutoPlay();
}

function updateUI() {
  const track = document.getElementById('carousel-track');
  const dots = document.querySelectorAll('.dot');
  const slides = document.querySelectorAll('.carousel-slide');

  slides.forEach((s, i) => s.classList.toggle('active', i === currentIndex));
  dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

  // Opción 1: Transform X (si es scroll)
  // Opción 2: Opacity (si es fade) - Vamos a usar fade por ahora en CSS.
}

function startAutoPlay() {
  autoPlayInterval = setInterval(nextSlide, 5000);
}

function resetAutoPlay() {
  clearInterval(autoPlayInterval);
  startAutoPlay();
}
