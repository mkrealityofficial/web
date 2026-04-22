// properties.js - Logic for step-by-step wizard and data logic

let allProperties = []; // Local cache

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

// WIZARD LOGIC
function nextStep(step) {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    
    // Update tracks
    document.getElementById('track-1').style.background = step >= 1 ? 'var(--gold-primary)' : 'var(--glass-border)';
    document.getElementById('track-2').style.background = step >= 2 ? 'var(--gold-primary)' : 'var(--glass-border)';
    document.getElementById('track-3').style.background = step >= 3 ? 'var(--gold-primary)' : 'var(--glass-border)';

    if (step === 3) handleTypeChange(); // Recalculate budget when hitting step 3
}

function prevStep(step) {
    nextStep(step);
}

function resetWizard() {
    document.getElementById('wizard-container').style.display = 'block';
    document.getElementById('results-container').style.display = 'none';
    document.getElementById('dynamic-header').style.display = 'block';
    nextStep(1);
}

function submitWizard() {
    // Hide Wizard, Show Results
    document.getElementById('wizard-container').style.display = 'none';
    document.getElementById('dynamic-header').style.display = 'none'; // hide large header for cleaner results view
    const results = document.getElementById('results-container');
    results.style.display = 'block';
    results.classList.add('fade-in', 'appear');

    // Update tags
    document.getElementById('filter-summary-tags').innerHTML = `
        <span class="filter-tag">Area: ${document.getElementById('filter-area').value}</span>
        <span class="filter-tag">Type: ${document.getElementById('filter-type').value}</span>
        <span class="filter-tag">Max: ${document.getElementById('budget-display').innerText}</span>
    `;

    // Process
    fetchProperties();
}

// BUDGET LOGIC
const typeSelect = document.getElementById('filter-type');
const budgetSlider = document.getElementById('filter-budget');
const budgetDisplay = document.getElementById('budget-display');

function handleTypeChange() {
    const type = typeSelect.value;
    const isRent = type.toLowerCase().includes('rent') || type.toLowerCase().includes('pg');
    const isAll = type === 'All';

    if (isAll) {
        budgetSlider.disabled = true;
        budgetSlider.min = "0";
        budgetSlider.max = "100000000";
        budgetDisplay.innerText = "Any";
    } else {
        budgetSlider.disabled = false;
        if (isRent) {
            // Rent: 4k to 10L
            budgetSlider.min = "4000";
            budgetSlider.max = "1000000";
            budgetSlider.step = "1000";
            budgetSlider.value = "1000000";
        } else {
            // Sale: 10L to 10Cr
            budgetSlider.min = "1000000";
            budgetSlider.max = "100000000";
            budgetSlider.step = "500000";
            budgetSlider.value = "100000000";
        }
        updateBudgetDisplay();
    }
}

function updateBudgetDisplay() {
    if(budgetSlider.disabled) {
        budgetDisplay.innerText = "Any";
    } else {
        budgetDisplay.innerText = `Up to ${formatCurrency(parseInt(budgetSlider.value))}`;
    }
}

budgetSlider.addEventListener('input', updateBudgetDisplay);

// DATA FETCH AND RENDER
async function fetchProperties() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const grid = document.getElementById('properties-grid');
    const emptyState = document.getElementById('no-results');

    loadingSpinner.style.display = 'block';
    grid.innerHTML = '';
    emptyState.style.display = 'none';

    // Fake Mock Data Fallback incase Supabase is not configured yet
    allProperties = [
        { id: 1, title: 'Luxury Villa', type: 'Sale: Houses & Apartments', area: 'Alkapuri', price: 25000000, images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80'] },
        { id: 2, title: 'Modern 3BHK', type: 'Rent: Houses & Apartments', area: 'Fatehgunj', price: 15000, images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80'] },
        { id: 3, title: 'Commercial Office Space', type: 'Sale: Shops & Offices', area: 'Akota', price: 12000000, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80'] },
        { id: 4, title: 'Premium Plot', type: 'Lands & Plots', area: 'Gotri', price: 4500000, images: ['https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&q=80'] },
        { id: 5, title: 'Luxury PG For Men', type: 'PG & Guest Houses', area: 'Karelibaug', price: 6000, images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80']}
    ];

    async function executeFetch() {
        if (window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient.from('properties').select('*');
                if(!error && data && data.length > 0) {
                    allProperties = data;
                }
            } catch (err) {
                console.warn('Supabase fetch failed, using fallback database', err);
            }
        }
        
        loadingSpinner.style.display = 'none';
        applyFilters(); 
    }

    if (window.supabaseClient) {
        executeFetch();
    } else {
        let triggered = false;
        const fallbackTimer = setTimeout(() => {
            if(!triggered) { triggered = true; executeFetch(); }
        }, 800);
        window.addEventListener('supabase_ready', () => {
            if(!triggered) { triggered = true; clearTimeout(fallbackTimer); executeFetch(); }
        });
    }
}

function applyFilters() {
    const selectedArea = document.getElementById('filter-area').value;
    const selectedType = typeSelect.value;
    const maxBudget = budgetSlider.disabled ? Infinity : parseInt(budgetSlider.value);

    const filtered = allProperties.filter(prop => {
        const areaMatch = selectedArea === 'All' || prop.area === selectedArea;
        const typeMatch = selectedType === 'All' || prop.type === selectedType;
        const pureNum = parseInt(prop.price.toString().replace(/[^0-9]/g, '')) || 0;
        const budgetMatch = pureNum <= maxBudget;

        return areaMatch && typeMatch && budgetMatch;
    });

    renderCards(filtered);
}

function renderCards(properties) {
    const grid = document.getElementById('properties-grid');
    const emptyState = document.getElementById('no-results');

    grid.innerHTML = '';
    if (properties.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    properties.forEach((prop, i) => {
        const imageSrc = (prop.images && prop.images.length > 0) ? prop.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600';
        const delay = i * 0.1;

        const card = document.createElement('div');
        card.className = 'property-card glass fade-in';
        card.style.animationDelay = `${delay}s`;
        
        // Use WhatsApp pure logic inline rather than full global if preferred, or use data-message to bind
        card.innerHTML = `
            <img src="${imageSrc}" alt="${prop.title}" class="property-img" loading="lazy">
            <div class="property-info">
                <h3 class="property-title">${prop.title}</h3>
                <div class="property-price">${formatCurrency(prop.price)}</div>
                <div class="property-meta">
                    <span>${prop.type}</span>
                    <span>${prop.area}</span>
                </div>
                <div style="display: flex; gap: var(--space-xs); margin-top: var(--space-sm);">
                    <a href="property-details.html?id=${prop.id}" class="btn-primary" style="flex:1;">Details</a>
                    <button class="btn-outline whatsapp-btn" data-message="Hello, I am interested in [${prop.type}] titled ${prop.title}." style="padding: 12px; display:flex; align-items:center; justify-content:center;">WA</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Trigger appear animation
    setTimeout(() => {
        document.querySelectorAll('#properties-grid .fade-in').forEach(el => el.classList.add('appear'));
    }, 50);
    
    // Re-init whatsapp button listeners 
    if(window.initWhatsAppButtons) window.initWhatsAppButtons();
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if there's type passed from index category cards to automatically start search
    const urlParams = new URLSearchParams(window.location.search);
    const inType = urlParams.get('type');
    if(inType) {
        if(inType === 'sale') typeSelect.value = "Sale: Houses & Apartments";
        if(inType === 'rent') typeSelect.value = "Rent: Houses & Apartments";
        if(inType === 'commercial') typeSelect.value = "Sale: Shops & Offices";
        submitWizard(); // Bypass wizard immediately
    } else {
        // Initialize logic normally
        handleTypeChange();
    }
});
