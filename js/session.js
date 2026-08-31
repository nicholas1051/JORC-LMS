'use strict';

// ═══════════════════════════════════════════════════════════════
    // 6. SUPABASE DATA LAYER
    // ═══════════════════════════════════════════════════════════════
    async function dbLoad(code) {
        try {
            const { data, error } = await db
                .from('students')
                .select('*')
                .eq('code', code)
                .maybeSingle();
            if (error) { console.error('[JORC] dbLoad error:', error); return null; }
            if (!data)  return null;
            return fixProgress(data);
        } catch(e) {
            console.error('[JORC] dbLoad exception:', e);
            return null;
        }
    }

    async function serverSave() {
        if (!G.user) return;
        syncSpin();
        try {
            const payload = {
                code:       G.user.code,
                name:       G.user.name,
                created_at: G.user.created_at || new Date().toISOString(),
                progress:   G.user.progress
            };
            const { error } = await db
                .from('students')
                .upsert(payload, { onConflict: 'code' });
            if (error) { syncOff(); console.error('[JORC] serverSave error:', error); }
            else        syncOK();
        } catch(e) {
            syncOff();
            console.error('[JORC] serverSave exception:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. AUTH — LOGIN / LOGOUT
    // ═══════════════════════════════════════════════════════════════
    window.handleLogin = async function(e) {
        e.preventDefault();
        const name  = document.getElementById('student-name').value.trim();
        const raw   = document.getElementById('student-code').value.trim();
        const code  = raw.toUpperCase();
        const remem = document.getElementById('remember-me').checked;
        const btn   = document.getElementById('btn-login');

        if (name.length < 2)  { alert('Please enter your full name.'); return; }
        if (raw.length < 2)   { alert('Please enter your Student ID Code.'); return; }

        if (remem) { ckSet('jorc_name', name, 365); ckSet('jorc_code', raw, 365); }
        else        { ckDel('jorc_name'); ckDel('jorc_code'); }

        if (code === 'ADMINKEY') {
            document.body.classList.add('is-logged-in');
            localStorage.setItem('jorc_active_session_code', 'ADMINKEY');
            localStorage.setItem('jorc_active_session_name', 'Administrator');
            hide('login-screen'); show('admin-screen'); show('user-display');
            txt('header-username', 'Administrator');
            if (document.getElementById('admin-search')) document.getElementById('admin-search').value = '';
            if (document.getElementById('admin-status-filter')) document.getElementById('admin-status-filter').value = 'all';
            window.refreshAdmin();
            return;
        }

        const orig = btn.innerHTML;
        btn.innerHTML = '<div class="loader mr-3"></div><span class="font-bold">Connecting to Supabase...</span>';
        btn.disabled  = true;

        try {
            let record = await dbLoad(code);

            if (record) {
                G.user       = record;
                G.user.name  = name; 
                await serverSave();
                localStorage.setItem('jorc_active_session_code', G.user.code);
                localStorage.setItem('jorc_active_session_name', G.user.name);
                loadDashboard();
            } else {
                G.user = newStudent(name, code);
                const payload = {
                    code:       G.user.code,
                    name:       G.user.name,
                    created_at: G.user.created_at,
                    progress:   G.user.progress
                };
                const { data, error } = await db.from('students').insert(payload).select().single();
                if (error) throw new Error(error.message);
                G.user = fixProgress(data);
                syncNew();
                localStorage.setItem('jorc_active_session_code', G.user.code);
                localStorage.setItem('jorc_active_session_name', G.user.name);
                loadDashboard();
            }
        } catch(err) {
            console.error('[JORC] Login error:', err);
            alert('Could not connect to Supabase.\n\nError: ' + err.message + '\n\nPlease check your SUPABASE_URL and SUPABASE_ANON_KEY.');
        } finally {
            btn.innerHTML = orig;
            btn.disabled  = false;
        }
    };

    window.logout = function() {
        G.user = null;
        document.body.classList.remove('is-logged-in');
        localStorage.removeItem('jorc_active_session_code');
        localStorage.removeItem('jorc_active_session_name');
        
        hide('resume-session-box');
        hide('resume-session-divider');

        ['user-display','dashboard-screen','admin-screen','assessment-screen',
         'result-overlay','transcript-overlay'].forEach(hide);
        show('login-screen');
        
        document.getElementById('student-name').value  = ckGet('jorc_name') || '';
        document.getElementById('student-code').value  = ckGet('jorc_code') || '';
        document.getElementById('remember-me').checked = !!ckGet('jorc_code');
    };
