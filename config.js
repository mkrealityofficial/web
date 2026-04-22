// Global Configuration for MK Real Estate

window.MK_CONFIG = {
  // SUPABASE CONFIGURATION (Update these with your project details)
  SUPABASE_URL: 'https://pfsdhdomffsktjuhucop.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmc2RoZG9tZmZza3RqdWh1Y29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDc3MDIsImV4cCI6MjA5MTc4MzcwMn0.v7SHumbzsNvLSHClQ18z5FtYZC-nq_vuKf1Sqg875HQ',

  // RESEND API CONFIGURATION (Update this with your Resend API Key, 
  // though optimally this should be used on a backend to avoid exposing it)
  RESEND_API_KEY: 'YOUR_RESEND_API_KEY',

  // CONTACT INFO
  WHATSAPP_NUMBER: '919099761469',
  WHATSAPP_MESSAGE: 'Hello, I am interested in this property.',
  
  // LOGO PLACEHOLDER
  LOGO_URL: 'logo.png' 
};

// We will inject the Supabase library dynamically across all pages to ensure it's available
// Force synchronous evaluation by adding to document sequentially before DOM fully parses if possible, 
// but since this is an async operation in module land, we dispatch an event when ready.
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
supabaseScript.onload = () => {
    // Initialize Supabase Client globally if credentials are provided
    if (window.MK_CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' && window.MK_CONFIG.SUPABASE_URL !== '') {
        window.supabaseClient = supabase.createClient(
            window.MK_CONFIG.SUPABASE_URL,
            window.MK_CONFIG.SUPABASE_ANON_KEY
        );
        console.log("Supabase explicitly initialized");
        window.dispatchEvent(new Event('supabase_ready'));
    }
};
document.head.appendChild(supabaseScript);
