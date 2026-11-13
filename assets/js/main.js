// main.js — semua gerakan dan interaksi situs dikendalikan file kecil ini
// Tidak ada library eksternal, cukup JavaScript vanilla

// Cek apakah pengguna memilih reduced motion
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   0. INTRO SCREEN (short, skippable, and motion-preference aware)
   ============================================================ */
var introScreen = document.getElementById('introScreen');
var skipIntro = document.getElementById('skipIntro');
var typedName = document.getElementById('typedName');
var introTimer;
var typingTimer;
var heroTypingStarted = false;

function startHeroTyping() {
  if (!typedName || heroTypingStarted) return;

  heroTypingStarted = true;
  if (reduceMotion) return;

  var name = 'Rahardyan';
  var characterIndex = 0;
  typedName.textContent = '';

  function typeNextCharacter() {
    characterIndex++;
    typedName.textContent = name.slice(0, characterIndex);
    if (characterIndex < name.length) {
      typingTimer = window.setTimeout(typeNextCharacter, 112);
    } else {
      typedName.parentElement.classList.add('is-typed');
    }
  }

  typingTimer = window.setTimeout(typeNextCharacter, 180);
}

function finishIntro() {
  if (!introScreen || introScreen.hidden) {
    startHeroTyping();
    return;
  }

  window.clearTimeout(introTimer);
  introScreen.classList.add('is-leaving');
  document.body.classList.remove('intro-active');
  startHeroTyping();
  window.setTimeout(function () {
    introScreen.hidden = true;
  }, 720);
}

if (introScreen && !reduceMotion) {
  introScreen.hidden = false;
  document.body.classList.add('intro-active');
  introTimer = window.setTimeout(finishIntro, 1850);

  if (skipIntro) {
    skipIntro.addEventListener('click', finishIntro);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') finishIntro();
  });
}

/* ============================================================
   1. REVEAL SAAT ELEMEN MASUK LAYAR (berulang)
   Menggunakan IntersectionObserver untuk menambah/hapus class
   'is-visible' setiap kali elemen masuk atau keluar viewport.
   Animasi akan terulang saat scroll naik maupun turun.
   ============================================================ */
const targets = document.querySelectorAll('[data-reveal], [data-reveal-lines], .section-label, .section-heading');

targets.forEach(function (target) {
  if (!target.matches('[data-reveal]')) return;

  var revealSiblings = Array.from(target.parentElement.children).filter(function (sibling) {
    return sibling.matches('[data-reveal]');
  });

  if (revealSiblings.length > 1) {
    target.style.setProperty('--reveal-order', revealSiblings.indexOf(target));
  }
});

if (reduceMotion || !('IntersectionObserver' in window)) {
  // Jika reduced motion aktif atau browser tidak mendukung IO,
  // langsung tampilkan semua elemen tanpa animasi
  targets.forEach(function (el) {
    el.classList.add('is-visible');
  });
} else {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        entry.target.classList.remove('is-visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) {
    observer.observe(el);
  });
}


/* ============================================================
   2. NAVBAR BERUBAH SAAT SCROLL & ACTIVE LINK SCROLLSPY
   - Navbar mendapat class 'is-scrolled' setelah scroll > 20px.
   - Mengubah status aktif link navbar seketika saat scroll memasuki tiap section.
   ============================================================ */
var nav = document.querySelector('.site-nav');
var navLinks = document.querySelectorAll('.site-nav .nav-link-x, .offcanvas-nav .nav-link-x');
var sections = document.querySelectorAll('section[id]');
var scrollProgress = document.getElementById('scrollProgress');
var backToTop = document.getElementById('backToTop');
var heroVisual = document.querySelector('.hero-visual-container');
var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
var desktopViewport = window.matchMedia('(min-width: 992px)');
var ticking = false;

function updateActiveNav() {
  var scrollY = window.scrollY;
  var currentSectionId = '';
  var triggerOffset = 130; // Jarak trigger dari atas viewport (disesuaikan dengan tinggi navbar)

  // Cek posisi scroll terhadap tiap section
  sections.forEach(function (section) {
    var top = section.offsetTop - triggerOffset;
    var height = section.offsetHeight;
    var id = section.getAttribute('id');

    if (scrollY >= top && scrollY < top + height) {
      currentSectionId = id;
    }
  });

  // Jika berada di paling atas halaman
  if (scrollY < 80) {
    currentSectionId = 'home';
  }
  // Jika sudah scroll sampai paling bawah dokumen (footer / kontak)
  else if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60)) {
    var lastSection = sections[sections.length - 1];
    if (lastSection) {
      currentSectionId = lastSection.getAttribute('id');
    }
  }

  // Terapkan class active ke link yang sesuai
  if (currentSectionId) {
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === '#' + currentSectionId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'location');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(function () {
    var y = window.scrollY;

    // Navbar: transparan to solid as the page scrolls.
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 20);
    }

    var scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollRatio = scrollableHeight > 0 ? Math.min(y / scrollableHeight, 1) : 0;
    if (scrollProgress) {
      scrollProgress.style.transform = 'scaleX(' + scrollRatio + ')';
    }
    if (backToTop) {
      backToTop.classList.toggle('is-visible', y > 480);
    }
    if (heroVisual && !reduceMotion) {
      var offset = desktopViewport.matches && finePointer.matches
        ? Math.min(y * 0.06, 24)
        : 0;
      heroVisual.style.setProperty('--parallax-y', offset + 'px');
    }

    // Update active navbar link secara langsung
    updateActiveNav();

    ticking = false;
  });
}

// Event listener saat scroll & saat halaman pertama kali dimuat
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
document.addEventListener('DOMContentLoaded', updateActiveNav);
onScroll(); // jalankan sekali saat script dieksekusi

// Smooth active change saat link navigasi diklik
navLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    var href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      navLinks.forEach(function (l) {
        var isActive = l.getAttribute('href') === href;
        l.classList.toggle('active', isActive);
        if (isActive) {
          l.setAttribute('aria-current', 'location');
        } else {
          l.removeAttribute('aria-current');
        }
      });
    }
  });
});


/* ============================================================
   3. PARALLAX HALUS PADA FOTO HERO (desktop saja)
   Maksimal 24px, hanya di perangkat lebar ≥ 992px
   ============================================================ */
if (heroVisual && !reduceMotion && finePointer.matches) {
  heroVisual.addEventListener('pointermove', function (event) {
    var bounds = heroVisual.getBoundingClientRect();
    var horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
    var vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

    heroVisual.style.setProperty('--tilt-x', (vertical * -5).toFixed(2) + 'deg');
    heroVisual.style.setProperty('--tilt-y', (horizontal * 5).toFixed(2) + 'deg');
  });

  heroVisual.addEventListener('pointerleave', function () {
    heroVisual.style.setProperty('--tilt-x', '0deg');
    heroVisual.style.setProperty('--tilt-y', '0deg');
  });
}

var projectFilterButtons = document.querySelectorAll('[data-project-filter]');
var projectItems = document.querySelectorAll('.project-item');
var projectCount = document.getElementById('projectCount');
var projectSearch = document.getElementById('projectSearch');
var clearProjectSearch = document.getElementById('clearProjectSearch');
var projectEmpty = document.getElementById('projectEmpty');
var savedProjectCount = document.getElementById('savedProjectCount');
var projectFeedback = document.getElementById('projectFeedback');
var activeProjectFilter = 'all';
var savedProjectIds = new Set();
var projectStorageKey = 'rahardyan-saved-projects-v1';
var projectStorageAvailable = true;
var projectFeedbackTimer;
var validProjectIds = new Set(Array.from(projectItems, function (item) {
  return item.getAttribute('data-project-id');
}));

try {
  var storedProjects = window.localStorage.getItem(projectStorageKey);
  if (storedProjects) {
    var parsedProjects = JSON.parse(storedProjects);
    if (Array.isArray(parsedProjects)) {
      parsedProjects.forEach(function (projectId) {
        if (typeof projectId === 'string' && validProjectIds.has(projectId)) {
          savedProjectIds.add(projectId);
        }
      });
    } else {
      console.warn('Daftar projek tersimpan tidak valid dan diabaikan.');
    }
  }
} catch (error) {
  projectStorageAvailable = false;
  console.warn('Penyimpanan lokal tidak tersedia; favorit hanya aktif selama halaman terbuka.', error);
}

function updateSavedProjectControls() {
  if (savedProjectCount) {
    savedProjectCount.textContent = String(savedProjectIds.size);
  }

  projectItems.forEach(function (item) {
    var projectId = item.getAttribute('data-project-id');
    var button = item.querySelector('[data-project-save]');
    var icon = button && button.querySelector('i');
    var isSaved = savedProjectIds.has(projectId);
    var projectTitle = item.querySelector('.project__title');

    if (!button || !icon || !projectTitle) return;

    var title = projectTitle.textContent.trim();
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', isSaved
      ? 'Hapus ' + title + ' dari projek tersimpan'
      : 'Simpan ' + title + ' ke projek tersimpan');
    button.classList.toggle('is-saved', isSaved);
    icon.className = isSaved ? 'bi bi-bookmark-check-fill' : 'bi bi-bookmark';
    button.querySelector('span').textContent = isSaved ? 'Tersimpan' : 'Simpan';
  });
}

function persistSavedProjects() {
  try {
    window.localStorage.setItem(projectStorageKey, JSON.stringify(Array.from(savedProjectIds)));
    projectStorageAvailable = true;
    return true;
  } catch (error) {
    projectStorageAvailable = false;
    console.warn('Favorit tidak dapat disimpan ke penyimpanan lokal.', error);
    return false;
  }
}

function announceProjectFeedback(message) {
  if (!projectFeedback) return;

  window.clearTimeout(projectFeedbackTimer);
  projectFeedback.textContent = message;
  projectFeedbackTimer = window.setTimeout(function () {
    projectFeedback.textContent = '';
  }, 5000);
}

function updateProjectResults() {
  var searchTerm = projectSearch ? projectSearch.value.trim().toLocaleLowerCase('id') : '';
  var visibleCount = 0;

  projectItems.forEach(function (item) {
    var matchesFilter = activeProjectFilter === 'all' ||
      (activeProjectFilter === 'saved'
        ? savedProjectIds.has(item.getAttribute('data-project-id'))
        : item.getAttribute('data-project-category') === activeProjectFilter);
    var searchableText = item.textContent.toLocaleLowerCase('id');
    var matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    var isVisible = matchesFilter && matchesSearch;

    item.hidden = !isVisible;
    if (isVisible) visibleCount++;
  });

  if (projectCount) {
    projectCount.textContent = visibleCount + ' projek';
  }
  if (projectEmpty) {
    projectEmpty.hidden = visibleCount !== 0;
  }
  if (clearProjectSearch) {
    clearProjectSearch.hidden = !searchTerm;
  }
}

updateSavedProjectControls();

document.querySelectorAll('[data-project-save]').forEach(function (button) {
  button.addEventListener('click', function () {
    var item = button.closest('.project-item');
    var projectId = item && item.getAttribute('data-project-id');
    var title = item && item.querySelector('.project__title');
    if (!projectId || !title) return;

    var wasSaved = savedProjectIds.has(projectId);
    if (wasSaved) {
      savedProjectIds.delete(projectId);
    } else {
      savedProjectIds.add(projectId);
    }

    updateSavedProjectControls();
    updateProjectResults();

    var persisted = persistSavedProjects();
    var action = wasSaved ? 'dihapus dari' : 'ditambahkan ke';
    announceProjectFeedback('"' + title.textContent.trim() + '" ' + action +
      ' daftar tersimpan.' + (persisted ? '' : ' Perubahan hanya tersimpan selama halaman ini terbuka.'));
  });
});

projectFilterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    activeProjectFilter = button.getAttribute('data-project-filter');

    projectFilterButtons.forEach(function (filterButton) {
      var isSelected = filterButton === button;
      filterButton.classList.toggle('is-active', isSelected);
      filterButton.setAttribute('aria-pressed', String(isSelected));
    });

    updateProjectResults();
  });
});

if (projectSearch) {
  projectSearch.addEventListener('input', updateProjectResults);
}

if (clearProjectSearch && projectSearch) {
  clearProjectSearch.addEventListener('click', function () {
    projectSearch.value = '';
    projectSearch.focus();
    updateProjectResults();
  });
}

document.addEventListener('keydown', function (event) {
  var isSearchShortcut = event.key === '/' ||
    ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k');
  if (!isSearchShortcut || event.altKey || event.shiftKey || !projectSearch) return;

  var target = event.target;
  var isEditing = target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable="true"], button');
  if (event.key === '/' && isEditing) return;
  if (projectLightbox && projectLightbox.open) return;

  event.preventDefault();
  document.getElementById('projek').scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start'
  });
  projectSearch.focus({ preventScroll: true });
});

document.querySelectorAll('[data-skill-search]').forEach(function (button) {
  button.addEventListener('click', function () {
    if (!projectSearch) return;

    activeProjectFilter = 'all';
    projectSearch.value = button.getAttribute('data-skill-search') || '';
    projectFilterButtons.forEach(function (filterButton) {
      var isSelected = filterButton.getAttribute('data-project-filter') === 'all';
      filterButton.classList.toggle('is-active', isSelected);
      filterButton.setAttribute('aria-pressed', String(isSelected));
    });

    updateProjectResults();
    document.getElementById('projek').scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  });
});

function showUnavailableProjectImage(image) {
  var media = image.closest('.project__media');
  var preview = image.closest('[data-project-preview]');
  var fallback = preview && preview.querySelector('.project-preview__fallback');
  if (!media || !preview || !fallback) return;

  media.classList.add('has-missing-image');
  preview.classList.add('project-preview--unavailable');
  preview.disabled = true;
  preview.setAttribute('aria-label',
    'Pratinjau gambar ' + (preview.getAttribute('data-title') || 'projek') + ' belum tersedia.');
  fallback.hidden = false;
}

document.querySelectorAll('[data-project-preview] img').forEach(function (image) {
  image.addEventListener('error', function () {
    showUnavailableProjectImage(image);
  });
  if (image.complete && image.naturalWidth === 0) {
    showUnavailableProjectImage(image);
  }
});

document.querySelectorAll('.btn-project--details').forEach(function (button) {
  button.addEventListener('click', function () {
    var details = button.closest('.project__body').querySelector('.project__extra');
    var isExpanded = button.getAttribute('aria-expanded') === 'true';

    button.setAttribute('aria-expanded', String(!isExpanded));
    button.textContent = isExpanded ? 'Ringkasan stack' : 'Tutup ringkasan';
    details.hidden = isExpanded;
  });
});

var aboutTabButtons = document.querySelectorAll('[data-about-tab]');
var aboutTabPanel = document.getElementById('aboutTabPanel');
var aboutTabContent = {
  learning: {
    icon: 'bi-lightbulb',
    label: 'aboutTabLearning',
    text: 'Sedang mengeksplorasi dasar web, pemrograman, basis data, framework, dan desain visual.'
  },
  building: {
    icon: 'bi-window',
    label: 'aboutTabBuilding',
    text: 'Menggabungkan struktur, tampilan, dan interaksi untuk membuat pengalaman website yang jelas dan responsif.'
  },
  growth: {
    icon: 'bi-graph-up-arrow',
    label: 'aboutTabGrowth',
    text: 'Terus berlatih lewat projek, belajar dari proses, dan terbuka terhadap masukan untuk berkembang.'
  }
};

aboutTabButtons.forEach(function (button, index) {
  button.tabIndex = button.getAttribute('aria-selected') === 'true' ? 0 : -1;

  button.addEventListener('click', function () {
    var selectedContent = aboutTabContent[button.getAttribute('data-about-tab')];
    if (!selectedContent || !aboutTabPanel) return;

    aboutTabButtons.forEach(function (tab) {
      var isSelected = tab === button;
      tab.classList.toggle('is-active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });

    aboutTabPanel.setAttribute('aria-labelledby', selectedContent.label);
    aboutTabPanel.querySelector('i').className = 'bi ' + selectedContent.icon;
    aboutTabPanel.querySelector('p').textContent = selectedContent.text;
  });

  button.addEventListener('keydown', function (event) {
    var nextIndex = index;
    if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = aboutTabButtons.length - 1;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      var direction = event.key === 'ArrowRight' ? 1 : -1;
      nextIndex = (index + direction + aboutTabButtons.length) % aboutTabButtons.length;
    } else {
      return;
    }

    event.preventDefault();
    aboutTabButtons[nextIndex].focus();
    aboutTabButtons[nextIndex].click();
  });
});

var projectLightbox = document.getElementById('projectLightbox');
var projectLightboxImage = document.getElementById('projectLightboxImage');
var projectLightboxTitle = document.getElementById('projectLightboxTitle');
var projectLightboxClose = projectLightbox && projectLightbox.querySelector('.project-lightbox__close');

if (projectLightbox && typeof projectLightbox.showModal === 'function') {
  document.querySelectorAll('[data-project-preview]').forEach(function (button) {
    button.addEventListener('click', function () {
      var previewImage = button.querySelector('img');
      if (!previewImage || !projectLightboxImage || !projectLightboxTitle) return;

      projectLightboxTitle.textContent = button.getAttribute('data-title') || 'Pratinjau projek';
      projectLightboxImage.src = previewImage.src;
      projectLightboxImage.alt = previewImage.alt;
      projectLightbox.showModal();
    });
  });

  if (projectLightboxClose) {
    projectLightboxClose.addEventListener('click', function () {
      projectLightbox.close();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && projectLightbox.open) {
      projectLightbox.close();
    }
  });

  projectLightbox.addEventListener('click', function (event) {
    if (event.target === projectLightbox) projectLightbox.close();
  });
}

if (!reduceMotion && finePointer.matches) {
  document.querySelectorAll('.project, .skill-card, .contact-card').forEach(function (card) {
    card.addEventListener('pointermove', function (event) {
      var bounds = card.getBoundingClientRect();
      var x = ((event.clientX - bounds.left) / bounds.width) * 100;
      var y = ((event.clientY - bounds.top) / bounds.height) * 100;
      card.style.setProperty('--pointer-x', x.toFixed(1) + '%');
      card.style.setProperty('--pointer-y', y.toFixed(1) + '%');

      if (card.classList.contains('project')) {
        card.style.setProperty('--card-tilt-x', ((50 - y) * 0.04).toFixed(2) + 'deg');
        card.style.setProperty('--card-tilt-y', ((x - 50) * 0.04).toFixed(2) + 'deg');
      }
    });

    card.addEventListener('pointerleave', function () {
      card.style.removeProperty('--card-tilt-x');
      card.style.removeProperty('--card-tilt-y');
    });
  });
}


/* ============================================================
   4. TUTUP OFFCANVAS SETELAH KLIK LINK
   Agar menu mobile otomatis tertutup saat navigasi
   ============================================================ */
var offcanvasEl = document.getElementById('mobileMenu');

if (offcanvasEl) {
  var offcanvasLinks = offcanvasEl.querySelectorAll('.nav-link-x');
  var mobileMenuToggle = document.querySelector('[data-bs-target="#mobileMenu"]');
  var bsOffcanvas = null;

  offcanvasEl.addEventListener('show.bs.offcanvas', function () {
    if (mobileMenuToggle) mobileMenuToggle.setAttribute('aria-expanded', 'true');
  });
  offcanvasEl.addEventListener('hidden.bs.offcanvas', function () {
    if (mobileMenuToggle) mobileMenuToggle.setAttribute('aria-expanded', 'false');
  });

  // Inisialisasi Bootstrap Offcanvas secara lazy
  offcanvasLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (!bsOffcanvas) {
        bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
      }
      bsOffcanvas.hide();
    });
  });
}


/* ============================================================
   6. TAHUN OTOMATIS DI FOOTER
   Memastikan copyright selalu menampilkan tahun berjalan
   ============================================================ */
var copyrightEl = document.querySelector('.footer-copy');
if (copyrightEl) {
  var currentYear = new Date().getFullYear();
  copyrightEl.textContent = '\u00a9 ' + currentYear +
    ' Rahardyan Putra Winata. Dibuat dengan sepenuh hati.';
}

var printPortfolio = document.getElementById('printPortfolio');
if (printPortfolio) {
  printPortfolio.addEventListener('click', function () {
    window.print();
  });
}

var sharePortfolio = document.getElementById('sharePortfolio');
var shareFeedback = document.getElementById('shareFeedback');
var shareFeedbackTimer;

function announceShareFeedback(message) {
  if (!shareFeedback) return;

  window.clearTimeout(shareFeedbackTimer);
  shareFeedback.textContent = message;
  shareFeedbackTimer = window.setTimeout(function () {
    shareFeedback.textContent = '';
  }, 5000);
}

async function copyPortfolioUrl() {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  }

  var temporaryField = document.createElement('textarea');
  temporaryField.value = window.location.href;
  temporaryField.setAttribute('readonly', '');
  temporaryField.style.position = 'fixed';
  temporaryField.style.opacity = '0';
  document.body.appendChild(temporaryField);
  temporaryField.select();

  var copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    temporaryField.remove();
  }

  return copied;
}

if (sharePortfolio && shareFeedback) {
  sharePortfolio.addEventListener('click', async function () {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: document.title,
          text: 'Portofolio Rahardyan Putra Winata',
          url: window.location.href
        });
        announceShareFeedback('Menu berbagi telah ditutup.');
      } catch (error) {
        if (error.name === 'AbortError') {
          announceShareFeedback('Berbagi dibatalkan.');
          return;
        }

        console.warn('Menu berbagi tidak tersedia.', error);
        announceShareFeedback('Menu berbagi tidak tersedia. Tautan tetap dapat disalin manual.');
      }
      return;
    }

    try {
      var copied = await copyPortfolioUrl();
      announceShareFeedback(copied
        ? 'Tautan portofolio berhasil disalin.'
        : 'Tautan belum dapat disalin otomatis. Salin alamat halaman dari bilah alamat.');
    } catch (error) {
      console.warn('Tautan portofolio tidak dapat disalin otomatis.', error);
      announceShareFeedback('Tautan belum dapat disalin otomatis. Salin alamat halaman dari bilah alamat.');
    }
  });
}

var contactForm = document.getElementById('contactMessageForm');
var contactName = document.getElementById('contactName');
var contactCategory = document.getElementById('contactCategory');
var contactMessage = document.getElementById('contactMessage');
var contactDraft = document.getElementById('contactDraft');
var copyContactDraft = document.getElementById('copyContactDraft');
var contactFormNote = document.getElementById('contactFormNote');

function updateContactDraft() {
  if (!contactDraft || !contactName || !contactCategory || !contactMessage) return;

  var trimmedName = contactName.value.trim();
  var trimmedMessage = contactMessage.value.trim();
  var name = trimmedName || '[Nama Anda]';
  var category = contactCategory.value || 'Pertanyaan';
  var message = trimmedMessage || '[Tulis pesan Anda di sini]';

  contactDraft.value = 'Halo Rahardyan, saya ' + name + '.\n' +
    'Saya ingin menghubungi untuk ' + category.toLowerCase() + '.\n\n' +
    message + '\n\nTerima kasih.';

  contactName.setCustomValidity(trimmedName ? '' : 'Masukkan nama sebelum menyiapkan draft.');
  contactMessage.setCustomValidity(trimmedMessage ? '' : 'Tulis pesan sebelum menyiapkan draft.');
  if (copyContactDraft) {
    copyContactDraft.disabled = !trimmedName || !trimmedMessage;
  }
}

if (contactForm && contactDraft && copyContactDraft && contactFormNote) {
  contactForm.addEventListener('input', updateContactDraft);
  contactForm.addEventListener('change', updateContactDraft);
  contactForm.addEventListener('submit', function (event) {
    event.preventDefault();
    updateContactDraft();
    if (!contactForm.reportValidity()) return;
    contactFormNote.textContent = 'Draft siap disalin. Pesan belum dikirim.';
    copyContactDraft.focus();
  });
  updateContactDraft();

  copyContactDraft.addEventListener('click', function () {
    var draftText = contactDraft.value;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(draftText).then(function () {
        contactFormNote.textContent = 'Draft berhasil disalin. Pesan belum dikirim.';
      }).catch(function () {
        contactDraft.focus();
        contactDraft.select();
        contactFormNote.textContent =
          'Draft tidak dapat disalin otomatis. Teks sudah dipilih—salin secara manual.';
      });
      return;
    }

    contactDraft.focus();
    contactDraft.select();
    try {
      var copied = document.execCommand('copy');
      contactFormNote.textContent = copied
        ? 'Draft berhasil disalin. Pesan belum dikirim.'
        : 'Teks draft sudah dipilih. Salin secara manual untuk menggunakannya.';
    } catch (error) {
      contactFormNote.textContent =
        'Penyalinan otomatis tidak tersedia. Teks sudah dipilih—salin secara manual.';
    }
  });
}

var labIdeaIndex = document.getElementById('labIdeaIndex');
var labIdeaProgress = document.getElementById('labIdeaProgress');
var labIdeaCategory = document.getElementById('labIdeaCategory');
var labIdeaTitle = document.getElementById('labIdeaTitle');
var labIdeaDescription = document.getElementById('labIdeaDescription');
var labIdeaCriteria = document.getElementById('labIdeaCriteria');
var nextLabIdea = document.getElementById('nextLabIdea');
var copyLabIdea = document.getElementById('copyLabIdea');
var labFeedback = document.getElementById('labFeedback');
var currentLabIdea = 0;

var labIdeas = [
  {
    category: 'HTML · CSS',
    title: 'Kartu profil satu halaman',
    description: 'Rancang kartu profil responsif yang menampilkan perkenalan singkat, minat, dan tautan penting dalam satu tampilan.',
    criteria: 'Informasi mudah dipindai dan tata letak tetap nyaman dibaca di layar ponsel.'
  },
  {
    category: 'CSS · RESPONSIVE',
    title: 'Menu navigasi yang ringkas',
    description: 'Buat navigasi untuk halaman sederhana yang punya tampilan desktop dan menu ringkas di layar kecil.',
    criteria: 'Semua tautan dapat dijangkau dengan keyboard dan tidak menyebabkan halaman melebar di ponsel.'
  },
  {
    category: 'JAVASCRIPT',
    title: 'Daftar tugas mini',
    description: 'Buat daftar tugas yang bisa ditambah, ditandai selesai, dan dihapus tanpa memuat ulang halaman.',
    criteria: 'Status tiap tugas terlihat jelas dan kontrol dapat digunakan dengan keyboard.'
  },
  {
    category: 'JAVASCRIPT · UI',
    title: 'Pencarian koleksi sederhana',
    description: 'Tampilkan beberapa item contoh dengan kolom pencarian yang menyaring hasil saat pengguna mengetik.',
    criteria: 'Hasil cocok diperbarui langsung dan pesan yang membantu muncul saat tidak ada hasil.'
  },
  {
    category: 'PHP · MYSQL',
    title: 'Formulir masukan dasar',
    description: 'Rancang latihan formulir yang memeriksa input sebelum data disiapkan untuk disimpan.',
    criteria: 'Input tidak valid diberi pesan yang jelas; jangan hubungkan ke database publik tanpa validasi server.'
  },
  {
    category: 'CANVA · HTML',
    title: 'Halaman acara sederhana',
    description: 'Susun halaman informasi acara dengan urutan konten, hirarki judul, dan ajakan bertindak yang jelas.',
    criteria: 'Informasi utama mudah ditemukan dan tombol ajakan dapat digunakan pada layar sentuh.'
  }
];

function renderLabIdea() {
  if (!labIdeaIndex || !labIdeaProgress || !labIdeaCategory ||
      !labIdeaTitle || !labIdeaDescription || !labIdeaCriteria) return;

  var idea = labIdeas[currentLabIdea];
  var displayIndex = String(currentLabIdea + 1).padStart(2, '0');
  var totalLabel = labIdeaIndex.querySelector('span');

  labIdeaIndex.firstChild.textContent = displayIndex + ' ';
  if (totalLabel) {
    totalLabel.textContent = '/ ' + String(labIdeas.length).padStart(2, '0');
  }
  labIdeaIndex.setAttribute('aria-label',
    'Ide ' + (currentLabIdea + 1) + ' dari ' + labIdeas.length);
  labIdeaProgress.style.width = ((currentLabIdea + 1) / labIdeas.length * 100) + '%';
  labIdeaCategory.textContent = idea.category;
  labIdeaTitle.textContent = idea.title;
  labIdeaDescription.textContent = idea.description;
  labIdeaCriteria.textContent = idea.criteria;
}

if (nextLabIdea && labFeedback) {
  renderLabIdea();
  nextLabIdea.addEventListener('click', function () {
    currentLabIdea = (currentLabIdea + 1) % labIdeas.length;
    renderLabIdea();
    labFeedback.textContent = '';
  });
}

if (copyLabIdea && labFeedback) {
  copyLabIdea.addEventListener('click', async function () {
    var idea = labIdeas[currentLabIdea];
    var brief = idea.title + ' [' + idea.category + ']\n\n' +
      idea.description + '\n\nKriteria selesai: ' + idea.criteria;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(brief);
        labFeedback.textContent = 'Brief latihan berhasil disalin.';
        return;
      } catch (error) {
        console.warn('Penyalinan brief latihan melalui Clipboard API gagal.', error);
      }
    }

    var temporaryField = document.createElement('textarea');
    temporaryField.value = brief;
    temporaryField.setAttribute('readonly', '');
    temporaryField.style.position = 'fixed';
    temporaryField.style.opacity = '0';
    document.body.appendChild(temporaryField);
    temporaryField.select();

    try {
      var copied = document.execCommand('copy');
      labFeedback.textContent = copied
        ? 'Brief latihan berhasil disalin.'
        : 'Penyalinan otomatis tidak tersedia. Salin brief secara manual.';
    } catch (error) {
      console.warn('Penyalinan brief latihan melalui fallback gagal.', error);
      labFeedback.textContent = 'Penyalinan otomatis gagal. Salin brief secara manual.';
    } finally {
      temporaryField.remove();
    }
  });
}

/* ============================================================
   7. MICRO-INTERACTIONS & ACCESSIBILITY REFINEMENT
   Enhancement non-invasif: tidak menggantikan fitur yang sudah ada.
   ============================================================ */
(function () {
  'use strict';

  // Gerakan magnetik ringan hanya untuk pointer desktop, tanpa mengubah area klik.
  if (!reduceMotion && finePointer.matches) {
    document.querySelectorAll('.hero-cta, .btn-cta').forEach(function (button) {
      button.addEventListener('pointermove', function (event) {
        var rect = button.getBoundingClientRect();
        var dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
        var dy = (event.clientY - rect.top - rect.height / 2) / rect.height;
        button.style.transform = 'translate(' + (dx * 5).toFixed(1) + 'px, ' +
          (dy * 5 - 2).toFixed(1) + 'px)';
      });
      button.addEventListener('pointerleave', function () {
        button.style.transform = '';
      });
      button.addEventListener('blur', function () {
        button.style.transform = '';
      });
    });
  }

})();
