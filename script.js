// FAQ accordion
document.querySelectorAll('.faq-btn, .faq-q').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var isOpen = this.getAttribute('aria-expanded') === 'true';
    // fecha todos
    document.querySelectorAll('.faq-btn, .faq-q').forEach(function(b) {
      b.setAttribute('aria-expanded', 'false');
      var next = b.nextElementSibling;
      if (next) next.hidden = true;
    });
    // abre o clicado
    if (!isOpen) {
      this.setAttribute('aria-expanded', 'true');
      var next = this.nextElementSibling;
      if (next) next.hidden = false;
    }
  });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var t = document.querySelector(this.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// Scroll reveal
var revealEls = document.querySelectorAll('.pain-card, .cg-item, .why-card, .sc, .hp-item');
revealEls.forEach(function(el, i) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .5s ease ' + (i % 4 * 0.08) + 's, transform .5s ease ' + (i % 4 * 0.08) + 's';
});

function reveal() {
  revealEls.forEach(function(el) {
    if (el.getBoundingClientRect().top < window.innerHeight - 60) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  });
}

window.addEventListener('scroll', reveal, { passive: true });
reveal();

// Meta Pixel — CTA clicks
document.querySelectorAll('.cta-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (typeof fbq !== 'undefined') {
      fbq('track', 'InitiateCheckout', { value: 9.99, currency: 'BRL' });
    }
  });
});
