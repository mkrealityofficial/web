// contact.js - Logic for handling form submission via WhatsApp integration

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('main-contact-form');
    const statusText = document.getElementById('form-status');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = form.querySelector('button');
            const originalBtnText = btn.innerText;

            const name = document.getElementById('contact-name').value;
            const phone = document.getElementById('contact-phone').value;
            const type = document.getElementById('contact-type').value;
            const note = document.getElementById('contact-note').value;

            btn.innerText = 'Redirecting to WhatsApp...';
            btn.disabled = true;

            // Construct WhatsApp Message
            let waMessage = `Hello, I am interested in ${type}.\n\n*Name:* ${name}\n*Phone:* ${phone}`;
            if (note.trim() !== '') {
                waMessage += `\n*Note:* ${note}`;
            }

            const waNum = window.MK_CONFIG.WHATSAPP_NUMBER;
            const url = `https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`;

            // Open WhatsApp in new tab
            window.open(url, '_blank');

            // Reset UI
            setTimeout(() => {
                form.reset();
                btn.innerText = originalBtnText;
                btn.disabled = false;
                
                statusText.innerText = "Redirected successfully! You can close this window.";
                statusText.style.color = "var(--gold-primary)";
                statusText.style.display = "block";
            }, 1000);
        });
    }
});
