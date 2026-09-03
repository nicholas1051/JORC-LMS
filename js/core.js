'use strict';

// ═══════════════════════════════════════════════════════════════
    // 5. UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    function blankProgress() {
        return { '1':{score:0,passed:false,taken:false}, '2':{score:0,passed:false,taken:false},
                 '3':{score:0,passed:false,taken:false}, '4':{score:0,passed:false,taken:false},
                 '5':{score:0,passed:false,taken:false} };
    }

    function newStudent(name, code) {
        return { code, name, created_at: new Date().toISOString(), progress: blankProgress() };
    }

    function wp(weekNum) {
        if (!G.user || !G.user.progress) return {score:0,passed:false,taken:false};
        return G.user.progress[String(weekNum)] || {score:0,passed:false,taken:false};
    }

    // A week is accessible if it's week 1, the previous week was taken,
    // or an admin explicitly approved an advance (unlock) for it.
    function isUnlocked(weekNum) {
        if (!G.user || !G.user.progress) return weekNum === 1;
        if (weekNum === 1) return true;
        if (wp(weekNum - 1).taken) return true;
        const unlocks = (G.user.progress._unlocks || []);
        return unlocks.indexOf(weekNum) !== -1;
    }

    function fixProgress(user) {
        if (!user.progress) user.progress = blankProgress();
        for (let i = 1; i <= 5; i++) {
            const k = String(i);
            if (!user.progress[k]) user.progress[k] = {score:0,passed:false,taken:false};
            const p = user.progress[k];
            p.score  = Number(p.score)  || 0;
            p.passed = Boolean(p.passed);
            p.taken  = Boolean(p.taken);
        }
        return user;
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function t()   { return T[G.lang] || T.en; }
    function show(id) { document.getElementById(id).classList.remove('hidden'); }
    function hide(id) { document.getElementById(id).classList.add('hidden'); }
    function txt(id, val) { document.getElementById(id).innerText = val; }

    // ─── Sync status ──────────────────────────────────────────────
    function syncOK()  { document.getElementById('sync-status').innerHTML = '<i class="fa-solid fa-cloud text-green-400" title="Saved to Supabase"></i>'; }
    function syncNew() { document.getElementById('sync-status').innerHTML = '<i class="fa-solid fa-circle-check text-blue-400" title="New record created"></i>'; }
    function syncOff() { document.getElementById('sync-status').innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-400" title="Save failed — check connection"></i>'; }
    function syncSpin(){ document.getElementById('sync-status').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>'; }

    // ─── Cookies (only for form prefill) ──────────────────────────
    function ckSet(n,v,d) {
        document.cookie = n+'='+encodeURIComponent(v)+';expires='+new Date(Date.now()+d*864e5).toUTCString()+';path=/;SameSite=Lax';
    }
    function ckGet(n) {
        const m = document.cookie.split('; ').find(r => r.startsWith(n+'='));
        return m ? decodeURIComponent(m.split('=')[1]) : '';
    }
    function ckDel(n) { document.cookie = n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'; }

    // ─── Security helpers ─────────────────────────────────────────
    // Escape untrusted text before inserting into HTML
    function escapeHTML(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Sanitize a student name: letters, digits, spaces, and basic punctuation only
    function sanitizeName(str) {
        return String(str || '').replace(/[^A-Za-z0-9À-ÿ .'\-]/g, '').trim().slice(0, 80);
    }

    // Sanitize a student code: uppercase letters and digits only
    function sanitizeCode(str) {
        return String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 30);
    }

    // ─── Session idle lockout ─────────────────────────────────────
    const IDLE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
    function touchSession() {
        if (!G.user) return;
        localStorage.setItem('jorc_session_last_active', String(Date.now()));
    }
    function sessionExpired() {
        if (!G.user) return false;
        const last = parseInt(localStorage.getItem('jorc_session_last_active') || '', 10);
        if (!last) return false;
        return Date.now() - last > IDLE_LIMIT_MS;
    }
    // Mark activity on user interactions
    ['click', 'keydown', 'touchstart', 'mousemove', 'scroll'].forEach(evt => {
        document.addEventListener(evt, touchSession, { passive: true });
    });

    (function() {
        const cn = ckGet('jorc_name'), cc = ckGet('jorc_code');
        if (cn && cc) {
            document.getElementById('student-name').value  = cn;
            document.getElementById('student-code').value  = cc;
            document.getElementById('remember-me').checked = true;
        }

        // Check for active session to display resume prompt
        const actCode = localStorage.getItem('jorc_active_session_code');
        const actName = localStorage.getItem('jorc_active_session_name');
        if (actCode && actName) {
            document.getElementById('resume-session-name').innerText = actName + " (" + actCode + ")";
            document.getElementById('resume-session-box').classList.remove('hidden');
            document.getElementById('resume-session-divider').classList.remove('hidden');
        }
    })();

    window.resumeSession = function() {
        const actCode = localStorage.getItem('jorc_active_session_code');
        const actName = localStorage.getItem('jorc_active_session_name');
        if (actCode && actName) {
            document.getElementById('student-name').value = actName;
            document.getElementById('student-code').value = actCode;
            document.getElementById('btn-login').click();
        }
    };

    // ─── Copy/Paste prevention during assessment ──────────────────
    function inAssessment() {
        const el = document.getElementById('assessment-screen');
        return el && !el.classList.contains('hidden');
    }
    document.addEventListener('copy',    e => { if (inAssessment()) { e.preventDefault(); try { e.clipboardData.setData('text/plain',''); } catch(x){} } });
    document.addEventListener('cut',     e => { if (inAssessment()) e.preventDefault(); });
    document.addEventListener('keydown', e => {
        if (inAssessment() && (e.ctrlKey||e.metaKey) && 'caxusp'.includes((e.key||'').toLowerCase())) e.preventDefault();

        // Keyboard navigation shortcuts (ignore while typing in inputs)
        const tag = (e.target && e.target.tagName) || '';
        const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
        
        // Esc: go back / close overlays
        if (e.key === 'Escape') {
            const overlays = ['transcript-overlay','result-overlay','admin-edit-modal'];
            for (const id of overlays) {
                const el = document.getElementById(id);
                if (el && !el.classList.contains('hidden')) {
                    if (id === 'transcript-overlay') window.closeTranscript();
                    else if (id === 'result-overlay') window.closeResult();
                    else if (id === 'admin-edit-modal') window.closeEditModal();
                    return;
                }
            }
            if (inAssessment()) window.loadDashboard();
        }

        if (isTyping) return;

        // In assessment: Arrow keys + Enter for navigation
        if (inAssessment()) {
            const btnPrev = document.getElementById('btn-prev-step');
            const btnNext = document.getElementById('btn-next-step');
            const btnSub  = document.getElementById('btn-submit-assessment');
            
            if (e.key === 'ArrowRight' && btnNext && !btnNext.classList.contains('hidden')) {
                e.preventDefault(); window.nextStep();
            } else if (e.key === 'ArrowLeft' && btnPrev && !btnPrev.classList.contains('hidden')) {
                e.preventDefault(); window.prevStep();
            } else if ((e.key === 'Enter' || e.key.match(/^[0-9]$/)) && btnSub && !btnSub.classList.contains('hidden')) {
                if (e.key === 'Enter') { e.preventDefault(); document.getElementById('quiz-form').requestSubmit(); }
            }
        } else {
            // On dashboard, number keys 1-5 open modules
            const dash = document.getElementById('dashboard-screen');
            if (dash && !dash.classList.contains('hidden') && /^[1-5]$/.test(e.key)) {
                window.startWeek(parseInt(e.key));
            }
        }
    });

    // ─── Swipe gestures for assessment navigation ─────────────────
    document.addEventListener('touchstart', function(e) {
        if (!inAssessment()) return;
        const t = e.touches[0];
        window.__swipe = { x: t.clientX, y: t.clientY };
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
        if (!inAssessment() || !window.__swipe) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - window.__swipe.x;
        const dy = t.clientY - window.__swipe.y;
        window.__swipe = null;
        // Only horizontal swipes that are dominant (ignore vertical scroll swipes)
        if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 1.5) return;
        const btnPrev = document.getElementById('btn-prev-step');
        const btnNext = document.getElementById('btn-next-step');
        const btnSub  = document.getElementById('btn-submit-assessment');
        if (dx < 0) { // swipe left -> next
            if (btnNext && !btnNext.classList.contains('hidden')) window.nextStep();
        } else { // swipe right -> previous
            if (btnPrev && !btnPrev.classList.contains('hidden')) window.prevStep();
        }
    }, { passive: true });
