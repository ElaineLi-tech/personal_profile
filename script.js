/* ===========================
   Elaine. — Interactive Script
   =========================== */

/* ---------- Photo data (12 items) ---------- */
const PHOTOS = [
  { id: 1,  src: 'pics/260.JPG',                       label: 'Photo 01' },
  { id: 2,  src: 'pics/IMG_2640.JPG',                  label: 'Photo 02' },
  { id: 3,  src: 'pics/IMG_5053.JPG',                  label: 'Photo 03' },
  { id: 4,  src: 'pics/IMG_6152.JPG',                  label: 'Photo 04' },
  { id: 5,  src: 'pics/IMG_6403.jpg',                  label: 'Photo 05' },
  { id: 6,  src: 'pics/IMG_6655.JPG',                  label: 'Photo 06' },
  { id: 7,  src: 'pics/IMG_7184.JPG',                  label: 'Photo 07' },
  { id: 8,  src: 'pics/IMG_7188.JPG',                  label: 'Photo 08' },
  { id: 9,  src: 'pics/c8770adce2d3ed0467a832425538882d.JPG', label: 'Photo 09' }
];

/* ---------- Build gallery ---------- */
(function buildGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  PHOTOS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'photo';
    el.dataset.id = p.id;
    el.innerHTML = `
      <img src="${p.src}" alt="${p.label}" loading="lazy" />
    `;
    el.addEventListener('click', () => openLightbox(p.id));
    grid.appendChild(el);
  });
})();

/* ---------- Lightbox ---------- */
const lb = document.getElementById('lightbox');
let lbIndex = 0;

function openLightbox(id) {
  lbIndex = PHOTOS.findIndex(p => p.id === id);
  renderLightbox();
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function renderLightbox() {
  const p = PHOTOS[lbIndex];
  lb.querySelector('.lb-stage').innerHTML = `
    <img src="${p.src}" alt="${p.label}" style="width:100%;height:100%;object-fit:contain;border-radius:16px;" />
  `;
  lb.querySelector('.lb-caption').textContent = `${lbIndex + 1} / ${PHOTOS.length} · ${p.label}`;
}
function navLightbox(dir) {
  lbIndex = (lbIndex + dir + PHOTOS.length) % PHOTOS.length;
  renderLightbox();
}
if (lb) {
  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-prev').addEventListener('click', () => navLightbox(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => navLightbox(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
  });
}

/* ---------- Subtle scroll reveal ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.style.opacity = '1';
      en.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.section, .hero, .footer, .sub-hero').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .8s ease, transform .8s ease';
  io.observe(el);
});

/* ---------- Secure contact unlock ---------- */
(function initSecureContact() {
  const data = window.SECURE_CONTACT_DATA;
  const phoneDisplay = document.getElementById('phoneDisplay');
  const phoneLink = document.getElementById('phoneLink');
  const contactHint = document.getElementById('contactHint');
  const qrLockedState = document.getElementById('qrLockedState');
  const qrUnlockedState = document.getElementById('qrUnlockedState');

  if (!data || !phoneDisplay || !phoneLink || !contactHint || !qrLockedState || !qrUnlockedState) {
    return;
  }

  const maskedPhone = data.maskedPhone || '***';
  const hashValue = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const params = new URLSearchParams(hashValue);
  const secret = params.get(data.hashParam || 'k');

  phoneDisplay.textContent = maskedPhone;
  contactHint.textContent = data.hint || '默认仅展示脱敏联系方式。';

  if (!secret || typeof CryptoJS === 'undefined') {
    return;
  }

  const decryptToUtf8 = ciphertext => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      return '';
    }
  };

  const validationText = decryptToUtf8(data.validatorCiphertext);
  if (validationText !== 'contact-access-granted') {
    return;
  }

  const decryptedPhone = decryptToUtf8(data.phoneCiphertext);
  const decryptedQr = decryptToUtf8(data.qrCiphertext);
  if (!decryptedPhone || !decryptedQr.startsWith('data:image/')) {
    return;
  }

  const qrImage = document.createElement('img');
  qrImage.className = 'qr-image';
  qrImage.alt = '微信二维码';
  qrImage.src = decryptedQr;

  qrUnlockedState.innerHTML = '';
  qrUnlockedState.appendChild(qrImage);
  qrUnlockedState.insertAdjacentHTML('beforeend', '<p class="contact-subtitle">二维码已解锁，请使用微信扫码添加。</p>');
  qrUnlockedState.hidden = false;
  qrLockedState.hidden = true;

  phoneDisplay.hidden = true;
  phoneLink.hidden = false;
  phoneLink.href = `tel:${decryptedPhone}`;
  phoneLink.textContent = decryptedPhone;
  contactHint.textContent = '已通过专属链接解锁完整微信与手机号信息。';
})();
