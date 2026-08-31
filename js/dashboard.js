'use strict';

// ═══════════════════════════════════════════════════════════════
    // 8. DASHBOARD
    // ═══════════════════════════════════════════════════════════════
    function loadDashboard() {
        document.body.classList.add('is-logged-in');
        ['login-screen','assessment-screen','result-overlay'].forEach(hide);
        show('dashboard-screen'); show('user-display');
        txt('header-username', G.user.name);
        if (wp(5).taken) show('transcript-banner');
        else hide('transcript-banner');
        renderGamification();
        renderCards();
    }
    window.loadDashboard = loadDashboard;

    function renderCards() {
        const grid = document.getElementById('week-grid');
        grid.innerHTML = '';
        const tr = t();
        const ICONS  = ['🖥️','🌐','📝','🤖','🏆'];
        const COLORS = ['from-emerald-500 to-teal-600','from-blue-500 to-indigo-600',
                        'from-violet-500 to-purple-600','from-orange-500 to-amber-600','from-yellow-500 to-yellow-600'];
        const ICON_BG = ['bg-emerald-100','bg-blue-100','bg-violet-100','bg-orange-100','bg-yellow-100'];

        getWeeks().forEach(wk => {
            const p      = wp(wk.id);
            const prevOk = wk.id === 1 || wp(wk.id - 1).taken;
            const locked = !prevOk;
            const max    = wk.id === 5 ? 50 : 10;
            const isTaken = p.taken;

            let badge, btnTxt, btnCls, btnAttr = '';
            let progressClass = '';
            let progressWidth = 0;
            
            if (locked) {
                badge  = '<span class="text-xs font-bold uppercase px-3 py-1 rounded-full bg-gray-100 text-gray-400">'+tr.locked_btn+'</span>';
                btnTxt = '<i class="fa-solid fa-lock mr-2"></i>'+tr.locked_btn;
                btnCls = 'bg-gray-200 text-gray-400 cursor-not-allowed';
                btnAttr = 'disabled';
            } else if (isTaken) {
                if (p.passed) {
                    badge  = '<span class="text-xs font-bold uppercase px-3 py-1 rounded-full bg-green-100 text-green-700">'+(tr.passed_badge || 'PASSED')+' '+p.score+'/'+max+'</span>';
                    progressClass = 'success';
                    progressWidth = 100;
                } else {
                    badge  = '<span class="text-xs font-bold uppercase px-3 py-1 rounded-full bg-red-100 text-red-700">'+(tr.failed_badge || 'FAILED')+' '+p.score+'/'+max+'</span>';
                    progressClass = 'danger';
                    progressWidth = (p.score / max) * 100;
                }
                btnTxt = '<i class="fa-solid fa-check-double mr-2"></i>' + (tr.completed_action || 'Completed');
                btnCls = 'bg-gray-200 text-gray-500 cursor-not-allowed';
                btnAttr = 'disabled';
            } else {
                badge  = '<span class="text-xs font-bold uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-700">Available</span>';
                btnTxt = '<i class="fa-solid fa-play mr-2"></i>'+tr.start_assessment;
                btnCls = 'bg-brand hover:bg-brand-dark text-white shadow-lg';
                progressClass = 'warning';
                progressWidth = 0;
            }

            const cardLocked = (locked || isTaken) ? 'card-locked opacity-70 grayscale-[30%]' : '';
            
            grid.innerHTML += `
                <div class="dashboard-card glass-panel rounded-[2rem] overflow-hidden border-t-4 border-brand flex flex-col min-h-[320px] ${cardLocked}">
                    <div class="bg-gradient-to-br ${COLORS[wk.id-1]} p-6 flex items-center justify-between">
                        <div class="card-icon w-14 h-14 ${ICON_BG[wk.id-1]} rounded-2xl flex items-center justify-center shadow-lg">
                            <span class="text-3xl">${ICONS[wk.id-1]}</span>
                        </div>
                        <span class="text-6xl font-black text-white opacity-20">0${wk.id}</span>
                    </div>
                    <div class="p-6 flex flex-col flex-grow">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="text-lg font-bold text-gray-800 leading-tight flex-grow mr-2">${tr[wk.titleKey]}</h3>
                            ${badge}
                        </div>
                        <p class="text-gray-500 text-sm mb-4 flex-grow">${wk.goal}</p>
                        <div class="mb-4">
                            <div class="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                <span>Progress</span>
                                <span>${isTaken ? p.score + '/' + max : '0/' + max}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-bar-fill ${progressClass}" style="width: ${progressWidth}%"></div>
                            </div>
                        </div>
                        <button onclick="window.startWeek(${wk.id})" ${btnAttr}
                            class="w-full font-bold py-4 rounded-xl transition-all ${btnCls}">${btnTxt}</button>
                    </div>
                </div>`;
        });
    }

    window.changeLanguage = function(lang) {
        G.lang = lang;
        const tr = t();
        
        // Translate hardcoded interface elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const k = el.getAttribute('data-i18n');
            if (tr[k]) el.innerText = tr[k];
        });
        
        // Re-render currently visible components to pull localized data
        if (!document.getElementById('dashboard-screen').classList.contains('hidden')) {
            renderCards();
        }
        
        if (!document.getElementById('assessment-screen').classList.contains('hidden')) {
            // Update the quiz title and goal manually
            const wid = parseInt(document.getElementById('quiz-title').dataset.wid);
            const localizedWk = getWeeks().find(w => w.id === wid);
            if (localizedWk) {
                document.getElementById('quiz-title').innerText = tr[localizedWk.titleKey];
                document.getElementById('quiz-goal').innerText = localizedWk.goal;
            }
            renderWizard();
        }
    };
