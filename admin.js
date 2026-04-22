// admin.js - Supabase Authentication and DB management logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authVeil = document.getElementById('auth-veil');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');

    const viewManage = document.getElementById('view-manage');
    const viewAdd = document.getElementById('view-add');
    const navManage = document.getElementById('nav-manage');
    const navAdd = document.getElementById('nav-add');
    const navLogout = document.getElementById('nav-logout');
    const btnGotoAdd = document.getElementById('btn-goto-add');

    const addForm = document.getElementById('add-property-form');
    const propertiesTableBody = document.querySelector('#properties-table tbody');
    
    const formTitle = document.getElementById('form-mode-title');
    const cancelEditBtn = document.getElementById('btn-cancel-edit');

    // Wait until Supabase client confirms session or mock it
    let currentSession = null;
    let fallbackAuthMode = false; // Used if Supabase URL isn't configured yet
    let editingId = null;         // State marker for Edit mode

    // Format currency Helper robustly handling strings with symbols
    const formatCurrency = (val) => {
        if (!val) return 'On Request';
        const strVal = val.toString();
        // If it clearly contains alphabets or symbols like /
        if (/[a-zA-Z\/]/.test(strVal)) {
            return strVal.includes('₹') ? strVal : `₹${strVal}`;
        }
        
        const pureNum = parseInt(strVal.replace(/[^0-9]/g, ''));
        if (isNaN(pureNum)) return strVal;

        if (pureNum >= 10000000) return `₹${(pureNum / 10000000).toFixed(2)} Cr`;
        if (pureNum >= 100000) return `₹${(pureNum / 100000).toFixed(2)} Lacs`;
        return `₹${pureNum.toLocaleString('en-IN')}`;
    };

    // Nav Logic
    function switchView(view) {
        if (view === 'manage') {
            viewManage.style.display = 'block';
            viewAdd.style.display = 'none';
            navManage.classList.add('active');
            navAdd.classList.remove('active');
            // reset edit state upon leaving
            resetFormState();
            loadProperties();
        } else if (view === 'add') {
            viewManage.style.display = 'none';
            viewAdd.style.display = 'block';
            navManage.classList.remove('active');
            navAdd.classList.add('active');
        }
    }

    navManage.addEventListener('click', () => switchView('manage'));
    navAdd.addEventListener('click', () => switchView('add'));
    btnGotoAdd.addEventListener('click', () => switchView('add'));
    
    cancelEditBtn.addEventListener('click', () => {
        resetFormState();
        switchView('manage');
    });

    navLogout.addEventListener('click', async () => {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
        fallbackAuthMode = false;
        dashboard.style.display = 'none';
        authVeil.style.display = 'flex';
        loginForm.reset();
    });

    function resetFormState() {
        addForm.reset();
        editingId = null;
        formTitle.innerText = "Add New Property";
        cancelEditBtn.style.display = 'none';
        document.getElementById('p-image-file').required = true; // file required on Add
        document.getElementById('btn-submit-prop').innerText = "Save Property";
    }

    // Authentication Logic //
    async function checkSession() {
        if (window.supabaseClient) {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                currentSession = session;
                showDashboard();
            }
        }
    }

    function showDashboard() {
        authVeil.style.display = 'none';
        dashboard.style.display = 'grid';
        switchView('manage');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value;
        const password = loginPassword.value;
        const btn = loginForm.querySelector('button');

        btn.disabled = true;
        btn.innerText = 'Verifying...';
        loginError.style.display = 'none';

        if (window.supabaseClient) {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email, password
            });

            if (error) {
                loginError.innerText = error.message;
                loginError.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Login';
            } else {
                currentSession = data.session;
                showDashboard();
            }
        } else {
            if (email === 'admin@mkreality.com' && password === 'admin') {
                fallbackAuthMode = true;
                showDashboard();
            } else {
                loginError.innerText = 'Supabase not connected. Use admin@mkreality.com / admin to bypass for testing.';
                loginError.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Login';
            }
        }
    });

    // Data Load logic (Mocked vs Supabase)
    let memoryDB = [
        { id: '1', title: 'Luxury Villa', type: 'Sale: Houses & Apartments', area: 'Alkapuri', price: 25000000, category: 'Featured', description: 'Sample desc.', images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600'] },
        { id: '2', title: 'Modern 3BHK', type: 'Rent: Houses & Apartments', area: 'Fatehgunj', price: 15000, category: 'Standard', description: 'Sample desc.', images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'] }
    ];

    async function loadProperties() {
        propertiesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
        
        let props = [];
        
        if (window.supabaseClient && !fallbackAuthMode) {
            const { data, error } = await window.supabaseClient.from('properties').select('*').order('created_at', { ascending: false });
            if (!error && data) props = data;
        } else {
            props = memoryDB;
        }

        propertiesTableBody.innerHTML = '';
        
        if (props.length === 0) {
            propertiesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No properties found. Add one!</td></tr>';
            return;
        }

        props.forEach(p => {
            const tr = document.createElement('tr');
            const imgSrc = (p.images && p.images.length > 0) ? p.images[0] : 'https://placehold.co/100x100?text=No+Img';
            
            tr.innerHTML = `
                <td><img src="${imgSrc}" alt="thumb"></td>
                <td style="font-weight: 500;">${p.title}</td>
                <td>${p.area}</td>
                <td style="color: var(--admin-muted);">${p.type}</td>
                <td style="color: var(--admin-gold); font-weight: 600;">${formatCurrency(p.price)}</td>
                <td style="display: flex; gap: 8px;">
                    <button class="btn-outline btn-edit" data-id="${p.id}" style="padding: 6px 12px; font-size: 12px; min-height:0;">Edit</button>
                    <button class="btn-danger btn-delete" data-id="${p.id}" style="padding: 6px 12px; font-size: 12px; min-height:0;">Delete</button>
                </td>
            `;
            propertiesTableBody.appendChild(tr);
        });

        // Add Handlers
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Are you sure you want to delete this property?")) {
                    const id = e.target.getAttribute('data-id');
                    if (window.supabaseClient && !fallbackAuthMode) {
                        await window.supabaseClient.from('properties').delete().eq('id', id);
                    } else {
                        memoryDB = memoryDB.filter(x => x.id !== id);
                    }
                    loadProperties();
                }
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const p = props.find(x => x.id == id);
                if (p) {
                    editingId = p.id;
                    formTitle.innerText = `Editing: ${p.title}`;
                    cancelEditBtn.style.display = 'inline-block';
                    document.getElementById('btn-submit-prop').innerText = "Update Property";
                    
                    document.getElementById('p-title').value = p.title;
                    document.getElementById('p-area').value = p.area;
                    document.getElementById('p-type').value = p.type;
                    document.getElementById('p-price').value = p.price;
                    document.getElementById('p-category').value = p.category || 'Standard';
                    document.getElementById('p-description').value = p.description || '';
                    
                    // In edit mode, if they don't pick new files, we keep the old
                    document.getElementById('p-image-file').required = false; 

                    switchView('add');
                }
            });
        });
    }

    // Add / Edit Form Logic
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-prop');
        const status = document.getElementById('add-status');
        
        btn.innerText = editingId ? 'Updating...' : 'Saving...';
        btn.disabled = true;

        const fileInput = document.getElementById('p-image-file');
        const files = fileInput.files;
        
        let imageUrls = []; 
        let hasNewFiles = files.length > 0;
        
        if (window.supabaseClient && !fallbackAuthMode && hasNewFiles) {
            try {
                // Loop through all uploaded files
                for (let i=0; i < files.length; i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${i}_img.${fileExt}`;
                    
                    const { error: uploadError } = await window.supabaseClient.storage
                        .from('properties')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data } = window.supabaseClient.storage.from('properties').getPublicUrl(fileName);
                    imageUrls.push(data.publicUrl);
                }
            } catch (err) {
                console.error("Upload error", err);
                status.style.color = '#ef4444';
                status.innerText = "Error uploading images: " + err.message;
                btn.innerText = editingId ? 'Update Property' : 'Save Property';
                btn.disabled = false;
                return;
            }
        } else if (fallbackAuthMode && hasNewFiles) {
            // Mock mode pseudo URLs
            for (let i=0; i < files.length; i++) {
                imageUrls.push('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&mock=' + Date.now() + i);
            }
        }

        const propertyDataObj = {
            title: document.getElementById('p-title').value,
            area: document.getElementById('p-area').value,
            type: document.getElementById('p-type').value,
            price: document.getElementById('p-price').value.toString(),
            category: document.getElementById('p-category').value,
            description: document.getElementById('p-description').value,
        };

        if (hasNewFiles) {
            propertyDataObj.images = imageUrls;
        }

        if (window.supabaseClient && !fallbackAuthMode) {
            let error;
            if (editingId) {
                // Update
                const res = await window.supabaseClient.from('properties')
                                .update(propertyDataObj)
                                .eq('id', editingId);
                error = res.error;
            } else {
                // Insert
                const res = await window.supabaseClient.from('properties')
                                .insert([propertyDataObj]);
                error = res.error;
            }

            if (error) {
                status.style.color = '#ef4444';
                status.innerText = "Error: " + error.message;
            } else {
                status.style.color = '#22c55e';
                status.innerText = editingId ? "Property updated successfully!" : "Property exactly added to database!";
                resetFormState();
            }
        } else {
            // Mock insert / update
            if (editingId) {
                let idx = memoryDB.findIndex(x => x.id == editingId);
                if(idx > -1) {
                    if(!hasNewFiles) propertyDataObj.images = memoryDB[idx].images; // Keep old
                    propertyDataObj.id = editingId;
                    propertyDataObj.created_at = memoryDB[idx].created_at;
                    memoryDB[idx] = propertyDataObj;
                }
            } else {
                propertyDataObj.id = Date.now().toString();
                propertyDataObj.created_at = new Date().toISOString();
                memoryDB.unshift(propertyDataObj);
            }
            
            status.style.color = '#22c55e';
            status.innerText = editingId ? "Property updated (Locally)." : "Property saved (Locally).";
            resetFormState();
        }

        btn.innerText = editingId ? 'Update Property' : 'Save Property';
        btn.disabled = false;
        
        setTimeout(() => { status.innerText = ''; }, 3000);
    });

    // Run check session on load
    setTimeout(checkSession, 500);
});
