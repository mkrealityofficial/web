// main.js - Core UI Logic and Animations

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollAnimations();
  initExitIntent();
  initWhatsAppButtons();
});

// Mobile Menu Toggle
function initMobileMenu() {
  const mobileBtn = document.querySelector('.nav-mobile-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

// Scroll Animations using Intersection Observer
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
}

// Exit Intent Popup
function initExitIntent() {
  const overlay = document.getElementById('exit-intent-overlay');
  const closeBtn = document.getElementById('exit-close');
  const form = document.getElementById('exit-form');
  
  if (!overlay) return; // Only init if the HTML is present on the page

  let hasShown = false;

  document.addEventListener('mouseout', (e) => {
    if (e.clientY < 50 && !hasShown && !sessionStorage.getItem('exitIntentShown')) {
      overlay.classList.add('active');
      hasShown = true;
      sessionStorage.setItem('exitIntentShown', 'true');
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      
      const name = document.getElementById('exit-name').value;
      const phone = document.getElementById('exit-phone').value;

      btn.innerText = 'Redirecting...';

      // Construct WhatsApp Message
      const waMessage = `Hello MK Real Estate!\nI left my details on the site.\n*Name:* ${name}\n*Phone:* ${phone}\nPlease reach out to me.`;
      const waNum = window.MK_CONFIG.WHATSAPP_NUMBER;
      const url = `https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`;

      // Open WhatsApp
      window.open(url, '_blank');
      
      setTimeout(() => {
          overlay.classList.remove('active');
          btn.innerText = 'Yes, Contact Me!';
      }, 1000);
    });
  }
}

// Global WhatsApp button wrapper
function initWhatsAppButtons() {
  document.querySelectorAll('.whatsapp-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      let customMsg = btn.getAttribute('data-message') || window.MK_CONFIG.WHATSAPP_MESSAGE;
      let url = `https://wa.me/${window.MK_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(customMsg)}`;
      window.open(url, '_blank');
    });
  });
}
