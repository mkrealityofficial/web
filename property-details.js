// property-details.js

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');

    const container = document.getElementById('property-container');
    const errorContainer = document.getElementById('error-container');

    if (!propertyId) {
        showError();
        return;
    }

    // Format currency Helper robustly handling strings with symbols
    const formatCurrency = (val) => {
        if (!val) return 'On Request';
        const strVal = val.toString();
        if (/[a-zA-Z\/]/.test(strVal)) return strVal.includes('₹') ? strVal : `₹${strVal}`;
        
        const pureNum = parseInt(strVal.replace(/[^0-9]/g, ''));
        if (isNaN(pureNum)) return strVal;

        if (pureNum >= 10000000) return `₹${(pureNum / 10000000).toFixed(2)} Cr`;
        if (pureNum >= 100000) return `₹${(pureNum / 100000).toFixed(2)} Lacs`;
        return `₹${pureNum.toLocaleString('en-IN')}`;
    };

    // Load Data
    let propertyData = null;

    // Data Loading Core Logic
    async function loadPropertyData() {
        // Supabase Fetch
        if (window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient.from('properties').select('*').eq('id', propertyId).single();
                if (!error && data) {
                    propertyData = data;
                } else if (error) {
                    console.error('Supabase fetch error:', error);
                }
            } catch (err) {
                console.error('Error fetching property data', err);
            }
        }

        // Fallback Mock if Supabase not connected or found locally
        if (!propertyData) {
            const fakeDb = [
                { id: 1, title: 'Luxury Villa', type: 'Sale: Houses & Apartments', area: 'Alkapuri', price: 25000000, description: 'A beautiful luxury villa in the heart of Alkapuri featuring 4 large bedrooms, a modular kitchen, private pool, and expansive lush green lawns. Perfect for high-end living built with premium architecture.', created_at: '2023-10-01', category: 'Featured', images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'] },
                { id: 2, title: 'Modern 3BHK', type: 'Rent: Houses & Apartments', area: 'Fatehgunj', price: 15000, description: 'Fully furnished 3BHK apartment ready to move. Includes ACs, beds, and modular kitchen. Proximity to MSU and local markets.', created_at: '2024-01-15', category: 'Standard', images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'] },
                { id: 3, title: 'Commercial Office Space', type: 'Sale: Shops & Offices', area: 'Akota', price: 12000000, description: 'Prime commercial office space right on the main road. Suitable for IT startups, coaching classes, or retail outlets.', created_at: '2023-11-20', category: 'Standard', images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'] },
                { id: 4, title: 'Premium Plot', type: 'Lands & Plots', area: 'Gotri', price: 4500000, description: 'Investment opportunity in Gotri. Open plot suitable for constructing a dream home or holding for excellent ROI.', created_at: '2024-02-10', category: 'Standard', images: ['https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80'] },
                { id: 5, title: 'Luxury PG For Men', type: 'PG & Guest Houses', area: 'Karelibaug', price: 6000, description: 'Fully furnished PG with AC, TV, WiFi, and meal facilities.', created_at: '2024-03-01', category: 'Standard', images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'] }
            ];
            propertyData = fakeDb.find(p => p.id == propertyId);
        }

        if (!propertyData) {
            showError();
            return;
        }

        renderProperty(propertyData);
    }

    // Execute logic waiting for supabase potentially
    if (window.supabaseClient) {
        loadPropertyData();
    } else {
        // Wait maximum 800ms for supabase to fire, else run fallback natively
        let triggered = false;
        const fallbackTimer = setTimeout(() => {
            if(!triggered) { triggered = true; loadPropertyData(); }
        }, 800);
        
        window.addEventListener('supabase_ready', () => {
            if(!triggered) {
                triggered = true;
                clearTimeout(fallbackTimer);
                loadPropertyData();
            }
        });
    }

    function showError() {
        if(container) container.style.display = 'none';
        if(errorContainer) errorContainer.style.display = 'block';
    }

    function renderProperty(prop) {
        // Core Details
        document.getElementById('prop-title').innerText = prop.title;
        document.getElementById('prop-type').innerText = prop.type;
        document.getElementById('prop-price').innerText = formatCurrency(prop.price);
        document.getElementById('prop-area').innerText = prop.area;
        document.getElementById('prop-desc').innerText = prop.description || 'No description provided.';
        
        const dateObj = prop.created_at ? new Date(prop.created_at) : new Date();
        document.getElementById('prop-date').innerText = dateObj.toLocaleDateString();

        if (prop.category === 'Featured' || prop.category === 'Pre-Leased') {
            const catBadge = document.getElementById('prop-category');
            catBadge.style.display = 'inline-block';
            catBadge.innerText = prop.category;
        }

        // WhatsApp Custom Message Logic
        const waBtn = document.getElementById('prop-wa-btn');
        if (waBtn) {
            waBtn.setAttribute('data-message', `Hello MK Real Estate, I am highly interested in the property: "${prop.title}" (${prop.type} at ${prop.area}) priced at ${formatCurrency(prop.price)}. Please share more details.`);
            if(window.initWhatsAppButtons) window.initWhatsAppButtons(); // Re-bind listener since DOM updated
        }

        // Gallery Setup
        const mainImage = document.getElementById('main-image');
        const thumbsContainer = document.getElementById('gallery-thumbs');
        const defaultImg = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800';
        
        const images = (prop.images && prop.images.length > 0) ? prop.images : [defaultImg];
        
        mainImage.src = images[0];

        if (images.length > 1) {
            images.forEach((imgSrc, idx) => {
                const img = document.createElement('img');
                img.src = imgSrc;
                if(idx === 0) img.classList.add('active');
                
                img.addEventListener('click', () => {
                    // Update main image with fade effect
                    mainImage.style.opacity = '0.5';
                    setTimeout(() => {
                        mainImage.src = imgSrc;
                        mainImage.style.opacity = '1';
                    }, 150);
                    
                    // Update active state on thumbs
                    document.querySelectorAll('.gallery-thumbs img').forEach(t => t.classList.remove('active'));
                    img.classList.add('active');
                });
                thumbsContainer.appendChild(img);
            });
        }

        // Setup Inquiry Form to WhatsApp
        const inqForm = document.getElementById('inquiry-form');
        if(inqForm) {
            inqForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = inqForm.querySelector('button');
                btn.innerText = "Redirecting...";
                
                const name = document.getElementById('inq-name').value;
                const phone = document.getElementById('inq-phone').value;
                const msg = document.getElementById('inq-message').value;
                
                let waMessage = `Hello MK Real Estate!\nI am interested in Property: ${prop.title} (${prop.id})\n\n*Name:* ${name}\n*Phone:* ${phone}`;
                if (msg.trim() !== '') waMessage += `\n*Note:* ${msg}`;
                
                const waNum = window.MK_CONFIG.WHATSAPP_NUMBER;
                const url = `https://wa.me/${waNum}?text=${encodeURIComponent(waMessage)}`;
                window.open(url, '_blank');
                
                setTimeout(() => {
                    btn.innerText = "Send Request";
                    inqForm.reset();
                }, 1000);
            });
        }

        container.style.display = 'grid'; // Show layout
    }
});
