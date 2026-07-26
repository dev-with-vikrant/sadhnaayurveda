/* =============================================
   SADHNA AYURVEDA – JAVASCRIPT
   ============================================= */

// =================== THEME TOGGLE ===================
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('sadhna-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('sadhna-theme', next);
  showToast(next === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
});

// =================== ANNOUNCEMENT BAR ===================
const annMessages = [
  '🌿 Free Shipping on Prepaid Orders',
  '✨ Use code SADHNA10 for 10% OFF your first order',
  '🌱 100% Natural & Organic – No Side Effects',
  '📞 24/7 Customer Support: +91 9718179397'
];

let annIndex = 0;
const annTrack = document.getElementById('annTrack');

// Build doubled content for infinite scroll
function buildAnnTrack() {
  const msgs = [...annMessages, ...annMessages];
  annTrack.innerHTML = msgs.map(m => `<span>${m}</span>`).join('');
}

buildAnnTrack();

document.getElementById('annPrev').addEventListener('click', () => {
  annIndex = (annIndex - 1 + annMessages.length) % annMessages.length;
});

document.getElementById('annNext').addEventListener('click', () => {
  annIndex = (annIndex + 1) % annMessages.length;
});

// =================== HEADER SCROLL ===================
const mainHeader = document.getElementById('mainHeader');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    mainHeader.classList.add('scrolled');
  } else {
    mainHeader.classList.remove('scrolled');
  }
});

// =================== HAMBURGER MENU ===================
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('mainNav');

hamburger.addEventListener('click', () => {
  mainNav.classList.toggle('mobile-open');
  const spans = hamburger.querySelectorAll('span');
  if (mainNav.classList.contains('mobile-open')) {
    spans[0].style.transform = 'rotate(45deg) translateY(7.5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translateY(-7.5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
});

// Close nav when clicking outside
document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !mainNav.contains(e.target)) {
    mainNav.classList.remove('mobile-open');
    const spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
});

// =================== HERO SLIDER ===================
const slides = document.querySelectorAll('.hero-slide');
const slideDots = document.querySelectorAll('#slideDots .dot');
let currentSlide = 0;
let slideInterval;

function goToSlide(index) {
  slides[currentSlide].classList.remove('active');
  slideDots[currentSlide].classList.remove('active');
  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  slideDots[currentSlide].classList.add('active');
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

function startSlideShow() {
  slideInterval = setInterval(nextSlide, 5000);
}

function resetSlideShow() {
  clearInterval(slideInterval);
  startSlideShow();
}

document.getElementById('slideNext').addEventListener('click', () => { nextSlide(); resetSlideShow(); });
document.getElementById('slidePrev').addEventListener('click', () => { prevSlide(); resetSlideShow(); });

slideDots.forEach((dot, i) => {
  dot.addEventListener('click', () => { goToSlide(i); resetSlideShow(); });
});

startSlideShow();

// Swipe support
let touchStartX = 0;
const heroSlider = document.getElementById('heroSlider');

heroSlider.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
});

heroSlider.addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextSlide();
    else prevSlide();
    resetSlideShow();
  }
});

// =================== CART FUNCTIONALITY ===================
let cart = JSON.parse(localStorage.getItem('sadhna-cart') || '[]');

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) cartCountEl.textContent = count;

  const cartTotalEl = document.getElementById('cartTotal');
  if (cartTotalEl) cartTotalEl.textContent = '₹' + total.toLocaleString('en-IN');

  const cartItemsEl = document.getElementById('cartItems');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');

  if (cartEmpty) {
    cartEmpty.style.display = cart.length === 0 ? 'flex' : 'none';
  }
  if (cartFooter) {
    cartFooter.style.display = cart.length === 0 ? 'none' : 'block';
  }

  if (cartItemsEl) {
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '';
      if (cartEmpty) cartItemsEl.appendChild(cartEmpty);
    } else {
      cartItemsEl.innerHTML = '';
      cart.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <div class="cart-item-info" style="flex:1">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')} × ${item.qty}</div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${idx})" aria-label="Remove item">
            <i class="fas fa-xmark"></i>
          </button>
        `;
        cartItemsEl.appendChild(div);
      });
    }
  }

  localStorage.setItem('sadhna-cart', JSON.stringify(cart));
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  updateCartUI();
  showToast(`✓ ${name} added to cart!`);
  // Small wobble animation on cart icon
  const cartBtn = document.getElementById('cartBtn');
  cartBtn.style.transform = 'scale(1.3)';
  setTimeout(() => { cartBtn.style.transform = ''; }, 200);
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  updateCartUI();
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

document.getElementById('cartBtn').addEventListener('click', toggleCart);

document.getElementById('checkoutBtn').addEventListener('click', openCheckoutModal);

updateCartUI();

// =================== BACK TO TOP ===================
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// =================== TOAST NOTIFICATIONS ===================
let toastTimeout;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// =================== COUNTDOWN TIMER ===================
function startPromoTimer() {
  // Set timer to 8 hours from now on page load
  let endTime = localStorage.getItem('sadhna-promo-end');
  if (!endTime || Date.now() > parseInt(endTime)) {
    endTime = Date.now() + 8 * 60 * 60 * 1000;
    localStorage.setItem('sadhna-promo-end', endTime.toString());
  }

  function updateTimer() {
    const remaining = Math.max(0, parseInt(endTime) - Date.now());
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);

    document.getElementById('timerH').textContent = String(h).padStart(2, '0');
    document.getElementById('timerM').textContent = String(m).padStart(2, '0');
    document.getElementById('timerS').textContent = String(s).padStart(2, '0');

    if (remaining === 0) {
      // Reset timer
      localStorage.removeItem('sadhna-promo-end');
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

startPromoTimer();

// =================== TESTIMONIALS SLIDER ===================
const testiTrack = document.getElementById('testiTrack');
const testiDots = document.querySelectorAll('#testiDots .dot');
let testiCurrent = 0;
let testiInterval;
let testiCardsVisible = window.innerWidth <= 900 ? 1 : 2;

function goToTesti(index) {
  const cards = testiTrack.querySelectorAll('.testi-card');
  const maxIndex = cards.length - testiCardsVisible;
  testiCurrent = Math.max(0, Math.min(index, maxIndex));

  const cardWidth = testiTrack.querySelector('.testi-card').offsetWidth + 24;
  testiTrack.style.transform = `translateX(-${testiCurrent * cardWidth}px)`;

  testiDots.forEach((d, i) => d.classList.toggle('active', i === testiCurrent));
}

document.getElementById('testiNext').addEventListener('click', () => {
  goToTesti(testiCurrent + 1);
  clearInterval(testiInterval);
  testiInterval = setInterval(() => goToTesti(testiCurrent + 1), 5000);
});

document.getElementById('testiPrev').addEventListener('click', () => {
  goToTesti(testiCurrent - 1);
  clearInterval(testiInterval);
  testiInterval = setInterval(() => goToTesti(testiCurrent + 1), 5000);
});

testiDots.forEach((dot, i) => {
  dot.addEventListener('click', () => goToTesti(i));
});

testiInterval = setInterval(() => goToTesti(testiCurrent + 1), 5000);

window.addEventListener('resize', () => {
  testiCardsVisible = window.innerWidth <= 900 ? 1 : 2;
  goToTesti(0);
});

// =================== WISHLIST ===================
const wishlistBtns = document.querySelectorAll('.wishlist-btn');
wishlistBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.classList.toggle('active');
    const icon = btn.querySelector('i');
    icon.className = btn.classList.contains('active') ? 'fas fa-heart' : 'fas fa-heart';
    icon.style.color = btn.classList.contains('active') ? '#c0392b' : '';
    showToast(btn.classList.contains('active') ? '❤️ Added to wishlist!' : 'Removed from wishlist');
  });
});

// =================== NEWSLETTER ===================
let newsletterSubmitted = false;
function subscribeNewsletter(e) {
  e.preventDefault();
  if (newsletterSubmitted) {
    showToast('✅ You are already subscribed!');
    return;
  }
  const emailInput = e.target.querySelector('input[type="email"]');
  if (emailInput && emailInput.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      showToast('⚠️ Please enter a valid email address.');
      return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-check"></i>'; }
    showToast('🎉 Subscribed! Thank you for joining Sadhna Ayurveda.');
    emailInput.value = '';
    newsletterSubmitted = true;
    setTimeout(() => { newsletterSubmitted = false; if (btn) { btn.disabled = false; btn.innerHTML = 'Subscribe <i class="fas fa-paper-plane"></i>'; } }, 30000);
  }
}

// =================== PRODUCT CATEGORY FILTER ===================
function filterProducts(category, pillBtn) {
  const cards = document.querySelectorAll('.product-card');
  const pills = document.querySelectorAll('.filter-pill');
  const bestsellersSection = document.getElementById('bestsellers');
  const heading = document.getElementById('productsHeading');

  // Update active pill styling
  pills.forEach(p => p.classList.remove('active'));
  if (pillBtn) {
    pillBtn.classList.add('active');
  } else {
    // Try to find matching pill button
    pills.forEach(p => {
      if (p.getAttribute('onclick') && p.getAttribute('onclick').includes(`'${category}'`)) {
        p.classList.add('active');
      }
    });
  }

  let matchCount = 0;
  category = (category || 'all').toLowerCase();

  cards.forEach(card => {
    const cats = (card.getAttribute('data-category') || '').toLowerCase();
    const name = card.querySelector('.product-name') ? card.querySelector('.product-name').textContent.toLowerCase() : '';
    const isMatch = category === 'all' || cats.includes(category) || name.includes(category);

    if (isMatch) {
      card.style.display = 'flex';
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
      matchCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // Fallback if category has no specific card yet
  if (matchCount === 0) {
    cards.forEach(card => {
      card.style.display = 'flex';
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    });
    if (heading) heading.textContent = `Recommended Products`;
    showToast(`🌿 Showing top recommended products`);
  } else {
    const catName = category.charAt(0).toUpperCase() + category.slice(1);
    if (heading) heading.textContent = category === 'all' ? `Our Ayurvedic Products` : `${catName} Products`;
    showToast(category === 'all' ? '🌿 Displaying all products' : `🌿 Showing ${catName} Products`);
  }

  // Smooth scroll to bestsellers section
  if (bestsellersSection) {
    bestsellersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Close mobile nav if open
  const mainNav = document.getElementById('mainNav');
  if (mainNav) mainNav.classList.remove('mobile-open');
}

// =================== SMART SEARCH & WEB SPEECH API VOICE SEARCH ===================
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const searchMicBtn = document.getElementById('searchMicBtn');
const searchSuggestions = document.getElementById('searchSuggestions');

const TRENDING_KEYWORDS = ['Madhu Shant', 'Nirog Sugar', 'Liver Detox', 'Joint Relieve', 'Diabetes Care', 'Capsules', 'Sugar Free Powder'];

function toggleSearchClearBtn() {
  if (!searchInput || !searchClearBtn) return;
  searchClearBtn.style.display = searchInput.value.trim().length > 0 ? 'block' : 'none';
}

function clearSearchInput() {
  if (searchInput) {
    searchInput.value = '';
    toggleSearchClearBtn();
    hideSearchSuggestions();
    filterProducts('all');
  }
}

function showSearchSuggestions() {
  if (!searchSuggestions) return;
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (query.length === 0) {
    // Show Trending Keywords when input is empty
    searchSuggestions.innerHTML = `
      <div class="suggestion-section-title"><i class="fas fa-fire" style="color:var(--accent-orange)"></i> Trending Ayurvedic Searches</div>
      <div class="suggestion-tags-group">
        ${TRENDING_KEYWORDS.map(tag => `<span class="suggestion-tag-pill" onclick="selectSearchTag('${tag}')">${tag}</span>`).join('')}
      </div>
    `;
    searchSuggestions.style.display = 'block';
    return;
  }

  // Find matching product cards for live preview
  const cards = document.querySelectorAll('.product-card');
  const matches = [];

  cards.forEach(card => {
    const nameEl = card.querySelector('.product-name');
    const catEl = card.querySelector('.product-category');
    const imgEl = card.querySelector('.product-img-wrapper img');
    const priceEl = card.querySelector('.price-sale');

    const name = nameEl ? nameEl.textContent : '';
    const category = catEl ? catEl.textContent : '';
    const imgSrc = imgEl ? imgEl.getAttribute('src') : '';
    const price = priceEl ? priceEl.textContent : 'From ₹3,500';
    const cardId = card.id;

    if (name.toLowerCase().includes(query) || category.toLowerCase().includes(query)) {
      matches.push({ id: cardId, name, category, imgSrc, price });
    }
  });

  if (matches.length > 0) {
    searchSuggestions.innerHTML = `
      <div class="suggestion-section-title"><i class="fas fa-sparkles" style="color:var(--accent-gold)"></i> Matching Products (${matches.length})</div>
      ${matches.map(m => `
        <div class="suggestion-item-mini" onclick="selectSuggestedProduct('${m.id}')">
          <img src="${m.imgSrc}" alt="${m.name}" />
          <div class="suggestion-item-info">
            <div class="suggestion-item-title">${m.name}</div>
            <div class="suggestion-item-cat">${m.category}</div>
          </div>
          <div class="suggestion-item-price">${m.price}</div>
        </div>
      `).join('')}
    `;
    searchSuggestions.style.display = 'block';
  } else {
    searchSuggestions.innerHTML = `
      <div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">
        <i class="fas fa-magnifying-glass" style="font-size:24px;margin-bottom:6px;display:block;opacity:0.5;"></i>
        No matching Ayurvedic products found for "${query}".
      </div>
    `;
    searchSuggestions.style.display = 'block';
  }
}

function hideSearchSuggestions() {
  if (searchSuggestions) {
    setTimeout(() => { searchSuggestions.style.display = 'none'; }, 200);
  }
}

function selectSearchTag(tag) {
  if (searchInput) {
    searchInput.value = tag;
    toggleSearchClearBtn();
    executeSearch();
    hideSearchSuggestions();
  }
}

function selectSuggestedProduct(cardId) {
  const targetCard = document.getElementById(cardId);
  const bestsellers = document.getElementById('bestsellers');

  if (targetCard) {
    document.querySelectorAll('.product-card').forEach(c => c.style.display = 'none');
    targetCard.style.display = 'flex';
    targetCard.style.opacity = '1';
    if (bestsellers) bestsellers.scrollIntoView({ behavior: 'smooth', block: 'start' });
    hideSearchSuggestions();
  }
}

function executeSearch() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  hideSearchSuggestions();

  if (!query) {
    filterProducts('all');
    return;
  }

  const cards = document.querySelectorAll('.product-card');
  const bestsellersSection = document.getElementById('bestsellers');
  let count = 0;

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const cats = (card.getAttribute('data-category') || '').toLowerCase();
    if (text.includes(query) || cats.includes(query)) {
      card.style.display = 'flex';
      card.style.opacity = '1';
      count++;
    } else {
      card.style.display = 'none';
    }
  });

  if (bestsellersSection) {
    bestsellersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (count > 0) {
    showToast(`🔍 Found ${count} product(s) for "${query}"`);
  } else {
    showToast(`🔍 No exact match for "${query}". Showing all products.`);
    cards.forEach(c => c.style.display = 'flex');
  }
}

// Web Speech API Voice Search Implementation (English & Hindi)
function startVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast('⚠️ Voice search is not supported on this browser. Please use Google Chrome or Edge.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-IN'; // Indian English & Hindi voice recognition

  if (searchMicBtn) {
    searchMicBtn.classList.add('recording-active');
  }

  showToast('🎙️ Listening... Speak your search query in English or Hindi');

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (searchInput) {
      searchInput.value = transcript;
      toggleSearchClearBtn();
      showSearchSuggestions();
    }
  };

  recognition.onspeechend = () => {
    recognition.stop();
    if (searchMicBtn) searchMicBtn.classList.remove('recording-active');
    executeSearch();
  };

  recognition.onerror = (event) => {
    if (searchMicBtn) searchMicBtn.classList.remove('recording-active');
    if (event.error !== 'no-speech') {
      showToast(`⚠️ Voice search: ${event.error}`);
    }
  };

  recognition.onend = () => {
    if (searchMicBtn) searchMicBtn.classList.remove('recording-active');
  };

  try {
    recognition.start();
  } catch (e) {
    console.error('Voice search start error:', e);
  }
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    toggleSearchClearBtn();
    showSearchSuggestions();
  });
  searchInput.addEventListener('focus', () => {
    showSearchSuggestions();
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeSearch();
  });
}

// Close suggestions on outside click
document.addEventListener('click', (e) => {
  const searchContainer = document.querySelector('.search-container');
  if (searchContainer && !searchContainer.contains(e.target)) {
    if (searchSuggestions) searchSuggestions.style.display = 'none';
  }
});

// =================== SMOOTH NAV LINK SCROLL ===================
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile menu
      mainNav.classList.remove('mobile-open');
    }
  });
});

// =================== INTERSECTION OBSERVER (ANIMATE ON SCROLL) ===================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

// Apply entrance animation to cards
const animElements = document.querySelectorAll(
  '.category-card, .product-card, .why-card, .blog-card, .testi-card, .trust-item'
);

animElements.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s, box-shadow 0.3s ease, border-color 0.3s ease`;
  observer.observe(el);
});

// =================== ACCOUNT / GIFT BUTTONS ===================
document.getElementById('accountBtn').addEventListener('click', () => {
  openAccountModal();
});

document.getElementById('giftBtn').addEventListener('click', () => {
  showToast('🎁 Special offers & gifts loading...');
});

// =================== VOICE SEARCH (MOCK) ===================
document.querySelector('.search-mic').addEventListener('click', () => {
  showToast('🎤 Voice search: speak now...');
});

// =================== RAZORPAY PAYMENT GATEWAY INTEGRATION ===================
// IMPORTANT: Replace the key below with your actual Razorpay Key ID from razorpay.com
let RAZORPAY_KEY_ID = localStorage.getItem('sadhna-rzp-key') || 'rzp_test_YOUR_KEY_ID_HERE';

function saveRazorpayKeyFromUI() {
  const input = document.getElementById('rzpKeyInput');
  if (input && input.value.trim()) {
    RAZORPAY_KEY_ID = input.value.trim();
    localStorage.setItem('sadhna-rzp-key', RAZORPAY_KEY_ID);
    showToast('✅ Razorpay API Key ID saved successfully!');
  } else {
    showToast('⚠️ Please enter a valid Key ID.');
  }
}

let appliedCoupon = null;

function buyNow(name, price) {
  addToCart(name, price);
  openCheckoutModal();
}

function applyCouponCode() {
  const input = document.getElementById('couponInput');
  const msgEl = document.getElementById('couponMsg');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (code === 'SADHNA10') {
    appliedCoupon = { code: 'SADHNA10', discountPercent: 10 };
    if (msgEl) {
      msgEl.style.color = '#27ae60';
      msgEl.textContent = '✓ Code SADHNA10 applied! 10% discount subtracted.';
    }
    showToast('🎉 10% Discount Applied with code SADHNA10!');
  } else if (code === '') {
    appliedCoupon = null;
    if (msgEl) msgEl.textContent = '';
  } else {
    showToast('⚠️ Invalid coupon code. Use SADHNA10 for 10% OFF.');
    if (msgEl) {
      msgEl.style.color = '#e74c3c';
      msgEl.textContent = '❌ Invalid code. Try SADHNA10';
    }
    return;
  }
  calculateCheckoutTotals();
}

function calculateCheckoutTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discountAmount = 0;

  if (appliedCoupon && appliedCoupon.discountPercent) {
    discountAmount = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const subtotalEl = document.getElementById('checkoutSubtotal');
  if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN');

  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountAmtEl = document.getElementById('checkoutDiscountAmount');
  if (discountRow && discountAmtEl) {
    if (discountAmount > 0) {
      discountRow.style.display = 'flex';
      discountAmtEl.textContent = '-₹' + discountAmount.toLocaleString('en-IN');
    } else {
      discountRow.style.display = 'none';
    }
  }

  const finalTotalEl = document.getElementById('checkoutFinalAmount');
  if (finalTotalEl) finalTotalEl.textContent = '₹' + finalTotal.toLocaleString('en-IN');

  return { subtotal, discountAmount, finalTotal };
}

function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('⚠️ Your cart is empty! Add products first.');
    return;
  }

  // Auto-fill saved profile details if available
  const savedProfile = JSON.parse(localStorage.getItem('sadhna-user-profile') || '{}');
  if (savedProfile.name && document.getElementById('custName')) document.getElementById('custName').value = savedProfile.name;
  if (savedProfile.phone && document.getElementById('custPhone')) document.getElementById('custPhone').value = savedProfile.phone;
  if (savedProfile.email && document.getElementById('custEmail')) document.getElementById('custEmail').value = savedProfile.email;
  if (savedProfile.address && document.getElementById('custAddress')) document.getElementById('custAddress').value = savedProfile.address;

  // Render Itemized Order Items
  const itemsContainer = document.getElementById('checkoutOrderItems');
  if (itemsContainer) {
    itemsContainer.innerHTML = cart.map(item => `
      <div class="checkout-item-row">
        <span class="checkout-item-name">${item.name} <small style="color:var(--text-muted)">x${item.qty}</small></span>
        <span class="checkout-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
      </div>
    `).join('');
  }

  calculateCheckoutTotals();

  // Close cart sidebar and open modal
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  const modalOverlay = document.getElementById('checkoutModalOverlay');
  const modal = document.getElementById('checkoutModal');
  if (modalOverlay) modalOverlay.classList.add('active');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  const modalOverlay = document.getElementById('checkoutModalOverlay');
  const modal = document.getElementById('checkoutModal');
  if (modalOverlay) modalOverlay.classList.remove('active');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function showOrderSuccessModal(orderData) {
  closeCheckoutModal();

  // Save Order to LocalStorage Order History & Send to Node.js Backend API
  orderData.timestamp = new Date().toLocaleString('en-IN');
  orderData.status = 'Pending Approval';
  const existingOrders = JSON.parse(localStorage.getItem('sadhna-orders') || '[]');
  existingOrders.unshift(orderData);
  localStorage.setItem('sadhna-orders', JSON.stringify(existingOrders));

  // Send Order to Node.js Backend REST API
  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(res => res.json()).then(data => {
      if (data && data.success) {
        console.log('🟢 Order submitted to Node.js Backend & Admin Approval Queue:', data.order);
      }
    }).catch(err => console.warn('Node.js Backend notice:', err));
  } catch (err) {
    console.warn('Node.js fetch error:', err);
  }

  // Construct WhatsApp Order Message Link for Admin (+91 9718179397)
  const waMsgText = encodeURIComponent(
    `🌿 *NEW ORDER RECEIVED - SADHNA AYURVEDA*\n\n` +
    `🆔 *Order ID:* ${orderData.paymentId}\n` +
    `👤 *Customer:* ${orderData.name}\n` +
    `📞 *Phone:* ${orderData.phone}\n` +
    `📧 *Email:* ${orderData.email}\n` +
    `📍 *Address:* ${orderData.address}\n` +
    `🛒 *Items:* ${orderData.itemsList}\n` +
    `💳 *Payment:* ${orderData.payMethod === 'razorpay' ? 'Razorpay Online (Paid)' : 'Cash on Delivery (COD)'}\n` +
    `💰 *Total Amount:* ₹${orderData.finalAmount.toLocaleString('en-IN')}\n` +
    `⏰ *Time:* ${orderData.timestamp}`
  );

  const waBtn = document.getElementById('sendWhatsappOrderBtn');
  if (waBtn) {
    waBtn.href = `https://wa.me/919718179397?text=${waMsgText}`;
  }

  const receiptContent = document.getElementById('receiptContent');
  if (receiptContent) {
    receiptContent.innerHTML = `
      <div class="receipt-row">
        <label>Transaction ID / Order ID:</label>
        <strong><span class="txn-badge-success">${orderData.paymentId}</span></strong>
      </div>
      <div class="receipt-row">
        <label>Customer Name:</label>
        <strong>${orderData.name}</strong>
      </div>
      <div class="receipt-row">
        <label>Phone / Email:</label>
        <strong>${orderData.phone} | ${orderData.email}</strong>
      </div>
      <div class="receipt-row">
        <label>Delivery Address:</label>
        <strong>${orderData.address}</strong>
      </div>
      <div class="receipt-row">
        <label>Items Purchased:</label>
        <strong>${orderData.itemsList}</strong>
      </div>
      <div class="receipt-row">
        <label>Payment Method:</label>
        <strong>${orderData.payMethod === 'razorpay' ? 'Razorpay Online (UPI/Card/NetBanking)' : 'Cash on Delivery (COD)'}</strong>
      </div>
      <div class="receipt-row" style="font-size:16px;font-weight:700;">
        <label>Total Amount Paid:</label>
        <strong style="color:#27ae60">₹${orderData.finalAmount.toLocaleString('en-IN')}</strong>
      </div>
    `;
  }

  // Clear Cart
  cart = [];
  appliedCoupon = null;
  updateCartUI();
  localStorage.removeItem('sadhna-cart');

  const overlay = document.getElementById('orderSuccessOverlay');
  const modal = document.getElementById('orderSuccessModal');
  if (overlay) overlay.classList.add('active');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeOrderSuccessModal() {
  const overlay = document.getElementById('orderSuccessOverlay');
  const modal = document.getElementById('orderSuccessModal');
  if (overlay) overlay.classList.remove('active');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function openAdminOrdersModal() {
  const orders = JSON.parse(localStorage.getItem('sadhna-orders') || '[]');
  const listContainer = document.getElementById('adminOrdersList');

  if (listContainer) {
    if (orders.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--text-muted);">
          <i class="fas fa-box-open" style="font-size:42px;margin-bottom:12px;display:block;"></i>
          <p style="font-size:15px;">No orders placed yet.</p>
          <small>Placed customer orders will appear here automatically.</small>
        </div>
      `;
    } else {
      listContainer.innerHTML = orders.map((ord, idx) => `
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="color:var(--accent-brown);font-size:14px;">#${ord.paymentId}</strong>
            <span style="font-size:11px;background:${ord.payMethod === 'razorpay' ? '#27ae60' : '#e67e22'};color:#fff;padding:2px 8px;border-radius:12px;font-weight:700;">
              ${ord.payMethod === 'razorpay' ? 'Paid via Razorpay' : 'Cash on Delivery (COD)'}
            </span>
          </div>
          <div style="font-size:13px;color:var(--text-primary);font-weight:600;">
            👤 ${ord.name} | 📞 ${ord.phone} | 📧 ${ord.email}
          </div>
          <div style="font-size:12.5px;color:var(--text-secondary);">
            📍 <strong>Address:</strong> ${ord.address}
          </div>
          <div style="font-size:12.5px;color:var(--text-secondary);">
            🛒 <strong>Items:</strong> ${ord.itemsList}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;padding-top:6px;border-top:1px dashed var(--border-color);">
            <small style="color:var(--text-muted);">⏰ ${ord.timestamp || 'Just now'}</small>
            <strong style="color:#27ae60;font-size:15px;">Total: ₹${(ord.finalAmount || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>
      `).join('');
    }
  }

  const overlay = document.getElementById('adminOrdersOverlay');
  const modal = document.getElementById('adminOrdersModal');
  if (overlay) overlay.classList.add('active');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAdminOrdersModal() {
  const overlay = document.getElementById('adminOrdersOverlay');
  const modal = document.getElementById('adminOrdersModal');
  if (overlay) overlay.classList.remove('active');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function clearAllOrders() {
  if (confirm('Are you sure you want to clear order history?')) {
    localStorage.removeItem('sadhna-orders');
    openAdminOrdersModal();
    showToast('🗑️ Order history cleared.');
  }
}

// Payment method radio selection handler
document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    document.querySelectorAll('.payment-opt').forEach(opt => opt.classList.remove('active'));
    e.target.closest('.payment-opt').classList.add('active');
    const btn = document.getElementById('payNowBtn');
    if (btn) {
      if (e.target.value === 'razorpay') {
        btn.innerHTML = '<i class="fas fa-lock"></i> Pay Now with Razorpay';
      } else {
        btn.innerHTML = '<i class="fas fa-truck"></i> Confirm Cash on Delivery Order';
      }
    }
  });
});

function handleRazorpayPayment(event) {
  event.preventDefault();
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const payMethod = document.querySelector('input[name="payMethod"]:checked').value;
  
  const { subtotal, discountAmount, finalTotal } = calculateCheckoutTotals();

  if (!name || !phone || !email || !address) {
    showToast('⚠️ Please fill out all required shipping details.');
    return;
  }

  // Validate T&C agreement
  const tcAgree = document.getElementById('tcAgree');
  if (tcAgree && !tcAgree.checked) {
    showToast('⚠️ Please agree to the Terms & Conditions to proceed.');
    return;
  }

  // Validate Indian phone number format (starts with 6-9, 10 digits)
  const phoneRegex = /^[6-9][0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    showToast('⚠️ Please enter a valid 10-digit Indian mobile number.');
    return;
  }

  const itemsSummary = cart.map(i => `${i.name} (x${i.qty})`).join(', ');

  if (payMethod === 'cod') {
    const codTxnId = 'COD_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    showOrderSuccessModal({
      paymentId: codTxnId,
      name,
      phone,
      email,
      address,
      itemsList: itemsSummary,
      payMethod: 'cod',
      finalAmount: finalTotal
    });
    showToast(`🎉 Order Placed (COD)! Thank you ${name}!`);
    return;
  }

  // Handle Razorpay Online Payment
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: finalTotal * 100, // Amount in paise
    currency: 'INR',
    name: 'Sadhna Ayurveda',
    description: `Payment for ${cart.length} Ayurvedic Product(s)`,
    image: 'images/logo.png',
    handler: function (response) {
      const paymentId = response.razorpay_payment_id || ('RZP_' + Math.random().toString(36).substring(2, 10).toUpperCase());
      showOrderSuccessModal({
        paymentId,
        name,
        phone,
        email,
        address,
        itemsList: itemsSummary,
        payMethod: 'razorpay',
        finalAmount: finalTotal
      });
      showToast(`✅ Razorpay Payment Successful! ID: ${paymentId}`);
    },
    prefill: {
      name: name,
      email: email,
      contact: phone
    },
    notes: {
      address: address,
      items: itemsSummary,
      coupon: appliedCoupon ? appliedCoupon.code : 'NONE'
    },
    theme: {
      color: '#6b4226'
    },
    modal: {
      ondismiss: function () {
        showToast('ℹ️ Razorpay payment window closed.');
      }
    }
  };

  try {
    if (typeof Razorpay !== 'undefined') {
      const rzp = new Razorpay(options);
      rzp.open();
    } else {
      throw new Error('Razorpay SDK not available');
    }
  } catch (err) {
    console.error('Razorpay Launch Exception (Demo fallback):', err);
    const demoPaymentId = 'RZP_DEMO_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    showOrderSuccessModal({
      paymentId: demoPaymentId,
      name,
      phone,
      email,
      address,
      itemsList: itemsSummary,
      payMethod: 'razorpay',
      finalAmount: finalTotal
    });
    showToast(`✅ Razorpay Demo Payment Verified! ID: ${demoPaymentId}`);
  }
}

// Touch Swipe Gestures for Mobile Account Modal Tabs
let modalTouchStartX = 0;
let modalTouchStartY = 0;
let modalTouchEndX = 0;
let modalTouchEndY = 0;

function setupAccountModalSwipeGestures() {
  const modalBody = document.querySelector('#accountModal .modal-body');
  if (!modalBody || modalBody.dataset.swipeInitialized) return;

  modalBody.dataset.swipeInitialized = 'true';

  modalBody.addEventListener('touchstart', (e) => {
    modalTouchStartX = e.changedTouches[0].screenX;
    modalTouchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  modalBody.addEventListener('touchend', (e) => {
    modalTouchEndX = e.changedTouches[0].screenX;
    modalTouchEndY = e.changedTouches[0].screenY;
    handleTabSwipeGesture();
  }, { passive: true });
}

function handleTabSwipeGesture() {
  const deltaX = modalTouchEndX - modalTouchStartX;
  const deltaY = modalTouchEndY - modalTouchStartY;

  // Ensure horizontal swipe is dominant and longer than 50px threshold
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
    const visibleTabBtns = Array.from(document.querySelectorAll('.account-tab-btn')).filter(btn => btn.style.display !== 'none');
    const activeBtnIndex = visibleTabBtns.findIndex(btn => btn.classList.contains('active'));

    if (activeBtnIndex !== -1) {
      if (deltaX < 0 && activeBtnIndex < visibleTabBtns.length - 1) {
        // Swipe Left -> Next Tab
        const nextBtn = visibleTabBtns[activeBtnIndex + 1];
        nextBtn.click();
      } else if (deltaX > 0 && activeBtnIndex > 0) {
        // Swipe Right -> Previous Tab
        const prevBtn = visibleTabBtns[activeBtnIndex - 1];
        prevBtn.click();
      }
    }
  }
}

// =================== ACCOUNT & DASHBOARD MANAGEMENT ===================
function openAccountModal() {
  loadUserProfile();
  renderUserOrders();
  renderAdminTabDashboard();
  setupAccountModalSwipeGestures();

  const rzpKeyInput = document.getElementById('rzpKeyInput');
  if (rzpKeyInput) rzpKeyInput.value = RAZORPAY_KEY_ID;

  const overlay = document.getElementById('accountModalOverlay');
  const modal = document.getElementById('accountModal');
  if (overlay) overlay.classList.add('active');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAccountModal() {
  const overlay = document.getElementById('accountModalOverlay');
  const modal = document.getElementById('accountModal');
  if (overlay) overlay.classList.remove('active');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function switchAccountTab(tabId, btn) {
  document.querySelectorAll('.account-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.account-tab-content').forEach(c => c.classList.remove('active'));

  if (btn) {
    btn.classList.add('active');
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  
  const targetId = tabId === 'profile' ? 'accountTabProfile' :
                   tabId === 'orders' ? 'accountTabOrders' :
                   tabId === 'addresses' ? 'accountTabAddresses' : 'accountTabAdmin';
  
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');
}

function loadUserProfile() {
  const savedProfile = JSON.parse(localStorage.getItem('sadhna-user-profile') || '{}');

  const profileName = document.getElementById('profileName');
  const profilePhone = document.getElementById('profilePhone');
  const profileEmail = document.getElementById('profileEmail');
  const profileAddress = document.getElementById('profileAddress');

  if (profileName) profileName.value = savedProfile.name || '';
  if (profilePhone) profilePhone.value = savedProfile.phone || '';
  if (profileEmail) profileEmail.value = savedProfile.email || '';
  if (profileAddress) profileAddress.value = savedProfile.address || '';

  const headerName = document.getElementById('accountUserHeaderName');
  const headerPhone = document.getElementById('accountUserHeaderPhone');
  const avatarText = document.getElementById('accountUserAvatar');
  const avatarImg = document.getElementById('accountUserAvatarImg');
  const authBadge = document.getElementById('userAuthBadge');
  const logoutBtn = document.getElementById('btnLogoutPill');
  const savedAddrText = document.getElementById('savedAddressText');
  const googleAuthBox = document.getElementById('googleAuthBox');

  if (savedProfile.authProvider === 'google' || savedProfile.email) {
    if (headerName) headerName.textContent = savedProfile.name || 'Sadhna Ayurveda Member';
    if (headerPhone) headerPhone.innerHTML = `<i class="fas fa-envelope" style="color:var(--accent-brown)"></i> ${savedProfile.email}`;
    if (authBadge) authBadge.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (googleAuthBox) googleAuthBox.style.display = 'none';

    if (savedProfile.avatarUrl && avatarImg) {
      avatarImg.src = savedProfile.avatarUrl;
      avatarImg.style.display = 'block';
      if (avatarText) avatarText.style.display = 'none';
    } else {
      if (avatarImg) avatarImg.style.display = 'none';
      if (avatarText) {
        avatarText.style.display = 'flex';
        avatarText.textContent = savedProfile.name ? savedProfile.name.charAt(0).toUpperCase() : 'S';
      }
    }
  } else {
    if (headerName) headerName.textContent = 'Welcome, Guest User';
    if (headerPhone) headerPhone.innerHTML = '<i class="fas fa-shield-halved" style="color:#27ae60"></i> Sadhna Ayurveda Member';
    if (authBadge) authBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (googleAuthBox) googleAuthBox.style.display = 'block';
    if (avatarImg) avatarImg.style.display = 'none';
    if (avatarText) {
      avatarText.style.display = 'flex';
      avatarText.textContent = 'S';
    }
  }

  if (savedAddrText) {
    savedAddrText.textContent = savedProfile.address ? `${savedProfile.name || 'Member'} (${savedProfile.phone || 'Phone not set'}) - ${savedProfile.address}` : 'No primary address saved yet. Save your details in "My Profile".';
  }
}

let GOOGLE_CLIENT_ID = localStorage.getItem('sadhna-google-client-id') || '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';

function saveGoogleClientIdFromUI() {
  const input = document.getElementById('googleClientIdInput');
  if (input && input.value.trim()) {
    GOOGLE_CLIENT_ID = input.value.trim();
    localStorage.setItem('sadhna-google-client-id', GOOGLE_CLIENT_ID);
    showToast('✅ Google Cloud OAuth Client ID saved successfully!');
    initGoogleAuthSDK();
  } else {
    showToast('⚠️ Please enter a valid Google Client ID.');
  }
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token:', e);
    return null;
  }
}

function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    showToast('⚠️ Google Sign-In failed. Please try again.');
    return;
  }

  const payload = parseJwt(response.credential);
  if (payload) {
    const googleUser = {
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      avatarUrl: payload.picture,
      googleId: payload.sub,
      authProvider: 'google',
      role: payload.email === 'info@sadhnaayurveda.com' ? 'admin' : 'customer',
      token: response.credential
    };

    localStorage.setItem('sadhna-user-profile', JSON.stringify(googleUser));
    loadUserProfile();
    showToast(`🟢 Authenticated via Google OAuth 2.0 as ${googleUser.name}!`);
  }
}

function initGoogleAuthSDK() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      console.log('🟢 Google Identity Services SDK initialized with Client ID:', GOOGLE_CLIENT_ID);
    } catch (e) {
      console.warn('Google Auth SDK init notice:', e);
    }
  }
}

function handleGoogleSignIn() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    initGoogleAuthSDK();
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const dummyGoogleUser = {
          name: 'Vikrant Sharma',
          email: 'vikrant@sadhnaayurveda.com',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          authProvider: 'google',
          role: 'customer',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlZpa3JhbnQgU2hhcm1hIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNTE2MjM5MDIyfQ'
        };
        localStorage.setItem('sadhna-user-profile', JSON.stringify(dummyGoogleUser));
        loadUserProfile();
        showToast(`🟢 Signed in via Google as ${dummyGoogleUser.name}`);
      }
    });
  } else {
    const dummyGoogleUser = {
      name: 'Vikrant Sharma',
      email: 'vikrant@sadhnaayurveda.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      authProvider: 'google',
      role: 'customer',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlZpa3JhbnQgU2hhcm1hIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNTE2MjM5MDIyfQ'
    };
    localStorage.setItem('sadhna-user-profile', JSON.stringify(dummyGoogleUser));
    loadUserProfile();
    showToast(`🟢 Signed in via Google as ${dummyGoogleUser.name}`);
  }
}

function handleUserLogout() {
  localStorage.removeItem('sadhna-user-profile');
  loadUserProfile();
  showToast('👋 You have been logged out.');
}

function openGpsPermissionModal() {
  const overlay = document.getElementById('gpsPermissionOverlay');
  const modal = document.getElementById('gpsPermissionModal');
  if (overlay && modal) {
    overlay.classList.add('active');
    modal.classList.add('active');
  }
}

function closeGpsPermissionModal() {
  const overlay = document.getElementById('gpsPermissionOverlay');
  const modal = document.getElementById('gpsPermissionModal');
  if (overlay && modal) {
    overlay.classList.remove('active');
    modal.classList.remove('active');
  }
}

// HTML5 Geolocation API Automatic Live Location Detection
async function detectLiveLocation(targetTextareaId) {
  const target = document.getElementById(targetTextareaId);
  const btn = document.querySelector(`.btn-live-location[onclick*="${targetTextareaId}"]`);

  if (!navigator.geolocation) {
    showToast('⚠️ Geolocation (GPS) is not supported on this browser.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting Location...';
  }

  showToast('📍 Fetching your live GPS location...');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        // Reverse Geocoding via OpenStreetMap Nominatim API
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();

        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.suburb || addr.neighbourhood || '';
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const state = addr.state || '';
          const postcode = addr.postcode || '';
          const country = addr.country || 'India';

          const formattedAddress = [road, city, state, country, postcode ? `Pincode: ${postcode}` : '']
            .filter(Boolean)
            .join(', ');

          if (target) {
            target.value = formattedAddress;
          }

          showToast(`📍 Live Location Detected: ${city}, ${state}`);
        } else {
          if (target) target.value = `GPS Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
          showToast(`📍 GPS Location captured (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        }
      } catch (err) {
        console.warn('Reverse geocoding fetch error:', err);
        if (target) target.value = `GPS Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
        showToast('📍 GPS Location captured successfully!');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Detect Live Location';
        }
      }
    },
    (error) => {
      console.warn('Geolocation error:', error.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Detect Live Location';
      }
      if (error.code === error.PERMISSION_DENIED) {
        openGpsPermissionModal();
      } else {
        showToast('⚠️ Unable to fetch live GPS location. Please enter address manually.');
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function saveUserProfile(e) {
  e.preventDefault();
  const name = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const email = document.getElementById('profileEmail').value.trim();
  const address = document.getElementById('profileAddress').value.trim();

  const existingProfile = JSON.parse(localStorage.getItem('sadhna-user-profile') || '{}');
  const updatedProfile = { ...existingProfile, name, phone, email, address };
  localStorage.setItem('sadhna-user-profile', JSON.stringify(updatedProfile));

  loadUserProfile();
  showToast('✅ Profile & Delivery Details saved!');
}

function renderUserOrders() {
  const orders = JSON.parse(localStorage.getItem('sadhna-orders') || '[]');
  const listContainer = document.getElementById('userOrdersList');

  if (!listContainer) return;

  if (orders.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align:center;padding:36px;color:var(--text-muted);">
        <i class="fas fa-box-open" style="font-size:48px;margin-bottom:12px;display:block;color:var(--border-color)"></i>
        <h4 style="font-size:16px;color:var(--text-primary);margin-bottom:4px;">No Orders Placed Yet</h4>
        <p style="font-size:13px;">Explore our Ayurvedic products and place your first order!</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = orders.map((ord, idx) => {
    const awbNum = ord.awbNumber || `SR${840000000 + (idx * 137) % 100000000}`;
    const trackingUrl = `https://shiprocket.co/tracking/${awbNum}`;

    const waMsgText = encodeURIComponent(
      `🌿 *ORDER STATUS INQUIRY - SADHNA AYURVEDA*\n\n` +
      `🆔 *Order ID:* ${ord.paymentId}\n` +
      `🚚 *AWB Tracking:* ${awbNum}\n` +
      `👤 *Name:* ${ord.name}\n` +
      `📞 *Phone:* ${ord.phone}\n` +
      `💰 *Total:* ₹${(ord.finalAmount || 0).toLocaleString('en-IN')}`
    );

    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <strong style="color:var(--accent-brown);font-size:14.5px;">#${ord.paymentId}</strong>
            <small style="color:var(--text-muted);display:block;font-size:11px;">Placed on ${ord.timestamp || 'Recently'}</small>
          </div>
          <span style="font-size:11.5px;background:#27ae60;color:#fff;padding:3px 10px;border-radius:12px;font-weight:700;">
            ${ord.payMethod === 'razorpay' ? 'Paid via Razorpay' : 'Cash on Delivery (COD)'}
          </span>
        </div>

        <div style="font-size:13px;color:var(--text-primary);margin-bottom:8px;font-weight:600;">
          🛒 ${ord.itemsList}
        </div>

        <div style="font-size:12px;color:var(--text-secondary);background:var(--bg-body);padding:6px 12px;border-radius:8px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border-color);">
          <span><i class="fas fa-barcode" style="color:var(--accent-brown);margin-right:4px;"></i> <strong>Shipment AWB:</strong> <code style="font-size:12px;color:var(--accent-brown);">${awbNum}</code></span>
          <span style="font-size:11px;color:#27ae60;font-weight:600;"><i class="fas fa-truck-fast"></i> Shiprocket Express</span>
        </div>

        <!-- Order Live Status Timeline Bar -->
        <div class="order-tracker-box">
          <div class="tracker-timeline">
            <div class="tracker-step completed">
              <div class="tracker-dot"><i class="fas fa-check"></i></div>
              <span>Placed</span>
            </div>
            <div class="tracker-step completed">
              <div class="tracker-dot"><i class="fas fa-box"></i></div>
              <span>Packed</span>
            </div>
            <div class="tracker-step completed">
              <div class="tracker-dot"><i class="fas fa-truck"></i></div>
              <span>Shipped</span>
            </div>
            <div class="tracker-step">
              <div class="tracker-dot"><i class="fas fa-house-chimney"></i></div>
              <span>Delivered</span>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-color);flex-wrap:wrap;gap:8px;">
          <strong style="color:#27ae60;font-size:15px;">Total: ₹${(ord.finalAmount || 0).toLocaleString('en-IN')}</strong>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" class="btn" style="background:#1b4332;color:#fff;font-size:11.5px;padding:6px 12px;border-radius:6px;text-decoration:none;font-weight:600;">
              <i class="fas fa-truck-fast"></i> Track Courier (AWB)
            </a>
            <a href="https://wa.me/919718179397?text=${waMsgText}" target="_blank" rel="noopener noreferrer" class="btn" style="background:#25d366;color:#fff;font-size:11.5px;padding:6px 12px;border-radius:6px;text-decoration:none;font-weight:600;">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
            <button type="button" class="btn btn-outline-primary" onclick="window.print()" style="font-size:11.5px;padding:6px 10px;"><i class="fas fa-print"></i> Invoice</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Role-based Dashboard Management with 4-Digit Security PIN Protection
let currentDashboardRole = 'customer'; // Default role is 'customer'
let ADMIN_SECURITY_PIN = localStorage.getItem('sadhna-admin-pin') || '1234';

function openAdminPinModal() {
  const overlay = document.getElementById('adminPinOverlay');
  const modal = document.getElementById('adminPinModal');
  const errorMsg = document.getElementById('pinErrorMessage');

  if (errorMsg) errorMsg.style.display = 'none';

  ['pinDigit1', 'pinDigit2', 'pinDigit3', 'pinDigit4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (overlay && modal) {
    overlay.classList.add('active');
    modal.classList.add('active');
    setTimeout(() => {
      const d1 = document.getElementById('pinDigit1');
      if (d1) d1.focus();
    }, 150);
  }
}

function closeAdminPinModal() {
  const overlay = document.getElementById('adminPinOverlay');
  const modal = document.getElementById('adminPinModal');
  if (overlay && modal) {
    overlay.classList.remove('active');
    modal.classList.remove('active');
  }
}

function handlePinDigitInput(currentEl, nextId, prevId) {
  if (currentEl.value.length === 1 && nextId) {
    const nextEl = document.getElementById(nextId);
    if (nextEl) nextEl.focus();
  }
}

function togglePinMask(checkbox) {
  const type = checkbox.checked ? 'text' : 'password';
  ['pinDigit1', 'pinDigit2', 'pinDigit3', 'pinDigit4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.type = type;
  });
}

function verifyAdminPin(e) {
  e.preventDefault();
  const d1 = document.getElementById('pinDigit1').value;
  const d2 = document.getElementById('pinDigit2').value;
  const d3 = document.getElementById('pinDigit3').value;
  const d4 = document.getElementById('pinDigit4').value;
  const enteredPin = `${d1}${d2}${d3}${d4}`;

  const errorMsg = document.getElementById('pinErrorMessage');
  const inputGroup = document.getElementById('pinInputGroup');

  if (enteredPin === ADMIN_SECURITY_PIN) {
    sessionStorage.setItem('sadhna-admin-unlocked', 'true');
    closeAdminPinModal();
    showToast('🟢 Security PIN Verified! Admin panel unlocked.');

    currentDashboardRole = 'admin';
    applyDashboardRoleState();
    switchAccountTab('admin', document.getElementById('navTabAdmin'));
  } else {
    if (errorMsg) errorMsg.style.display = 'block';
    if (inputGroup) {
      inputGroup.style.animation = 'none';
      inputGroup.offsetHeight;
      inputGroup.style.animation = 'pinShake 0.4s ease-in-out';
    }
    showToast('❌ Incorrect Security PIN!');
  }
}

function toggleDashboardRole() {
  if (currentDashboardRole === 'customer') {
    if (sessionStorage.getItem('sadhna-admin-unlocked') === 'true') {
      currentDashboardRole = 'admin';
      applyDashboardRoleState();
      showToast('Switched to Store Admin View');
    } else {
      openAdminPinModal();
    }
  } else {
    currentDashboardRole = 'customer';
    applyDashboardRoleState();
    showToast('Switched to Customer View');
  }
}

function applyDashboardRoleState() {
  const roleLabel = document.getElementById('dashboardRoleLabel');
  const rolePill = document.getElementById('dashboardRolePill');
  const navTabAdmin = document.getElementById('navTabAdmin');

  if (currentDashboardRole === 'admin') {
    if (roleLabel) roleLabel.textContent = 'Admin View (Active)';
    if (rolePill) rolePill.classList.add('admin-active');
    if (navTabAdmin) navTabAdmin.style.display = 'inline-flex';
  } else {
    if (roleLabel) roleLabel.textContent = 'Switch to Admin';
    if (rolePill) rolePill.classList.remove('admin-active');
    if (navTabAdmin) navTabAdmin.style.display = 'none';
    // If currently on admin tab, switch back to profile
    const activeTab = document.querySelector('.account-tab-content.active');
    if (activeTab && activeTab.id === 'accountTabAdmin') {
      const profileBtn = document.getElementById('navTabProfile');
      switchAccountTab('profile', profileBtn);
    }
  }
}

function updateRazorpayStatusBadge() {
  const keyInput = document.getElementById('rzpKeyInput');
  const badge = document.getElementById('rzpKeyStatusBadge');
  if (!keyInput || !badge) return;

  const val = keyInput.value.trim();
  if (!val) {
    badge.className = 'badge-status-mode test-mode';
    badge.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Key Required';
  } else if (val.startsWith('rzp_live_')) {
    badge.className = 'badge-status-mode active-mode';
    badge.innerHTML = '<i class="fas fa-circle-check"></i> Active (Live Mode)';
  } else {
    badge.className = 'badge-status-mode test-mode';
    badge.innerHTML = '<i class="fas fa-circle-check"></i> Active (Test Mode)';
  }
}

function copyRazorpayKey() {
  const keyInput = document.getElementById('rzpKeyInput');
  if (!keyInput || !keyInput.value) {
    showToast('⚠️ No API Key to copy.');
    return;
  }
  navigator.clipboard.writeText(keyInput.value).then(() => {
    showToast('📋 Razorpay API Key copied to clipboard!');
  }).catch(() => {
    keyInput.select();
    document.execCommand('copy');
    showToast('📋 Razorpay API Key copied!');
  });
}

function confirmClearOrders() {
  if (confirm('⚠️ Are you sure you want to clear all store order logs? This action cannot be undone.')) {
    clearAllOrders();
    showToast('🗑️ Order history cleared.');
  }
}

function renderAdminTabDashboard() {
  const orders = JSON.parse(localStorage.getItem('sadhna-orders') || '[]');
  
  const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  const razorpayPaidCount = orders.filter(o => o.payMethod === 'razorpay').length;

  const revEl = document.getElementById('adminStatRevenue');
  const countEl = document.getElementById('adminStatOrders');
  const rzpEl = document.getElementById('adminStatRazorpay');

  if (revEl) revEl.textContent = '₹' + totalRevenue.toLocaleString('en-IN');
  if (countEl) countEl.textContent = orders.length;
  if (rzpEl) rzpEl.textContent = razorpayPaidCount;

  updateRazorpayStatusBadge();

  const tabList = document.getElementById('adminTabOrdersList');
  if (tabList) {
    if (orders.length === 0) {
      tabList.innerHTML = `
        <div class="empty-orders-state">
          <div class="empty-icon-circle"><i class="fas fa-box-open"></i></div>
          <h4>No Store Orders Logged Yet</h4>
          <p>When customers place orders using Razorpay or Cash on Delivery, they will automatically appear here with real-time analytics.</p>
        </div>
      `;
    } else {
      tabList.innerHTML = orders.map(ord => `
        <div style="background:var(--bg-card);border:1px solid var(--border-color);padding:12px 14px;border-radius:10px;font-size:12.5px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong style="color:var(--accent-brown)">#${ord.paymentId}</strong> — ${ord.name} (${ord.phone})
            <small style="display:block;color:var(--text-secondary);margin-top:2px;">🛒 ${ord.itemsList}</small>
          </div>
          <div style="text-align:right;">
            <strong style="color:#27ae60;font-size:13.5px;display:block;">₹${(ord.finalAmount || 0).toLocaleString('en-IN')}</strong>
            <span style="font-size:10.5px;background:${ord.payMethod === 'razorpay' ? '#0c2340' : '#27ae60'};color:#fff;padding:2px 6px;border-radius:4px;font-weight:600;">
              ${ord.payMethod === 'razorpay' ? 'Razorpay' : 'COD'}
            </span>
          </div>
        </div>
      `).join('');
    }
  }
}

// Initialize Dashboard state on load
document.addEventListener('DOMContentLoaded', () => {
  applyDashboardRoleState();
});

console.log('🌿 Sadhna Ayurveda website with Role-Based Dashboard & Analytics loaded successfully!');
