/* ============================================================
   MiniStat - js/sidebar.js
   Fitur sidebar yang dapat disembunyikan (Desktop & Drawer Mobile)
   ============================================================ */

function initSidebar() {
  const btnHamburger = document.getElementById('btn-hamburger');
  const appWrapper = document.querySelector('.app-wrapper');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const menuButtons = document.querySelectorAll('.menu-btn');
  const headerJudul = document.getElementById('header-judul-aktif');

  if (!btnHamburger || !sidebar) return;

  const STORAGE_KEY = 'ministat_sidebar_collapsed';

  // Baca preferensi tersimpan di localStorage (dengan try/catch)
  let isCollapsed = false;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      isCollapsed = saved === 'true';
    }
  } catch (e) {
    // localStorage mungkin diblokir / tidak tersedia
  }

  // Terapkan status awal (hanya berlaku di desktop >760px)
  function applyInitialState() {
    if (window.innerWidth > 760) {
      if (isCollapsed) {
        appWrapper?.classList.add('sidebar-collapsed');
        btnHamburger.setAttribute('aria-expanded', 'false');
        btnHamburger.setAttribute('aria-label', 'Tampilkan menu');
      } else {
        appWrapper?.classList.remove('sidebar-collapsed');
        btnHamburger.setAttribute('aria-expanded', 'true');
        btnHamburger.setAttribute('aria-label', 'Sembunyikan menu');
      }
    } else {
      // Layar kecil: drawer tersembunyi secara default
      appWrapper?.classList.remove('sidebar-open');
      btnHamburger.setAttribute('aria-expanded', 'false');
      btnHamburger.setAttribute('aria-label', 'Tampilkan menu');
    }
  }

  applyInitialState();

  // Handler toggle hamburger
  function toggleSidebar() {
    const isMobile = window.innerWidth <= 760;

    if (isMobile) {
      const isOpen = appWrapper?.classList.toggle('sidebar-open');
      btnHamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      btnHamburger.setAttribute('aria-label', isOpen ? 'Sembunyikan menu' : 'Tampilkan menu');
    } else {
      isCollapsed = !appWrapper?.classList.contains('sidebar-collapsed');
      appWrapper?.classList.toggle('sidebar-collapsed', isCollapsed);
      btnHamburger.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      btnHamburger.setAttribute('aria-label', isCollapsed ? 'Tampilkan menu' : 'Sembunyikan menu');

      try {
        localStorage.setItem(STORAGE_KEY, String(isCollapsed));
      } catch (e) {
        // Abaikan jika localStorage terlarang
      }
    }
  }

  // Event listener hamburger & backdrop
  btnHamburger.addEventListener('click', toggleSidebar);

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      appWrapper?.classList.remove('sidebar-open');
      btnHamburger.setAttribute('aria-expanded', 'false');
      btnHamburger.setAttribute('aria-label', 'Tampilkan menu');
    });
  }

  // Tutup drawer mobile saat tekan tombol Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.innerWidth <= 760 && appWrapper?.classList.contains('sidebar-open')) {
      appWrapper.classList.remove('sidebar-open');
      btnHamburger.setAttribute('aria-expanded', 'false');
      btnHamburger.setAttribute('aria-label', 'Tampilkan menu');
    }
  });

  // Update Judul Header saat menu diklik + tutup drawer di mobile
  const JUDUL_MENU = {
    'panel-data': 'Data',
    'panel-deskriptif': 'Statistik deskriptif',
    'panel-uji': 'Uji hipotesis',
    'panel-grafik': 'Visualisasi'
  };

  menuButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      if (headerJudul && JUDUL_MENU[targetId]) {
        headerJudul.textContent = JUDUL_MENU[targetId];
      }

      // Jika di layar mobile, tutup drawer setelah memilih menu
      if (window.innerWidth <= 760) {
        appWrapper?.classList.remove('sidebar-open');
        btnHamburger.setAttribute('aria-expanded', 'false');
        btnHamburger.setAttribute('aria-label', 'Tampilkan menu');
      }
    });
  });

  // Penanganan resize window
  window.addEventListener('resize', () => {
    applyInitialState();
  });
}

// Ekspor ke window agar bisa dipanggil dari script.js
window.initSidebar = initSidebar;
