'use strict';

// ═══════════════════════════════════════════════════════════════
    // 9. ASSESSMENT WIZARD
    // ═══════════════════════════════════════════════════════════════
    window.startWeek = function(id) {
        const p = wp(id);
        if (p.taken) {
            alert('You have already completed this module. Multiple attempts are not allowed.');
            return;
        }

        const wk = getWeeks().find(w => w.id === id);
        const tr = t();

        if (id === 5) {
            if (confirm(tr.submit_capstone)) {
                G.user.progress['5'] = {score:0, passed:false, taken:true};
                serverSave();
                showResult(5, 0, 50);
            }
            return;
        }

        hide('dashboard-screen');
        show('assessment-screen');
        document.getElementById('quiz-title').dataset.wid = id;
        txt('quiz-title', tr[wk.titleKey]);
        txt('quiz-goal',  wk.goal);

        const qIdx = shuffle(wk.questions.map((_,i) => i));
        const oIdx = {};
        qIdx.forEach((origQ, step) => { oIdx[step] = shuffle(wk.questions[origQ].opts.map((_,i)=>i)); });

        G.wizard = { step:0, total: wk.questions.length + 1, qOrder:qIdx, oOrder:oIdx, ans:{}, tasks:[] };
        renderWizard();
    };

    function renderWizard() {
        const wid  = parseInt(document.getElementById('quiz-title').dataset.wid);
        const wk   = getWeeks().find(w => w.id === wid);
        const tr   = t();
        const cont = document.getElementById('wizard-steps-container');
        cont.innerHTML = '';

        const isPartA = G.wizard.step < wk.questions.length;

        if (isPartA) {
            const step  = G.wizard.step;
            const origQ = G.wizard.qOrder[step];
            const q     = wk.questions[origQ];
            const oOrd  = G.wizard.oOrder[step];

            let opts = '';
            oOrd.forEach((origOpt, disp) => {
                const chk = G.wizard.ans[step] === disp;
                opts += `<label class="option-card cursor-pointer block mb-4">
                    <input type="radio" name="q${step}" value="${disp}" class="hidden" ${chk?'checked':''}
                        onchange="G.wizard.ans[${step}]=parseInt(this.value);renderWizard();">
                    <div class="flex items-center p-5 rounded-2xl border-2 transition-all ${chk ? 'border-brand bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}">
                        <div class="custom-radio w-6 h-6 rounded-full border-2 border-gray-300 mr-5 relative flex-shrink-0"></div>
                        <span class="text-gray-700 font-semibold text-lg">${q.opts[origOpt]}</span>
                    </div></label>`;
            });

            const scene = (step === 0 && wk.scenario)
                ? `<div class="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex gap-3">
                    <i class="fa-solid fa-lightbulb text-blue-500 mt-1 flex-shrink-0"></i>
                    <div><p class="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">${tr.part_a_title}</p>
                    <p class="text-blue-800 font-medium text-sm">${wk.scenario}</p></div></div>` : '';

            cont.innerHTML = `<div class="fade-in">${scene}
                <p class="text-xs font-bold text-brand uppercase tracking-widest mb-2">Question ${step+1} of ${wk.questions.length}</p>
                <h3 class="text-2xl font-black text-gray-800 mb-8 leading-tight">${q.q}</h3>${opts}</div>`;
        } else {
            let tasks = '';
            wk.tasks.forEach((txt2, i) => {
                const chk = !!G.wizard.tasks[i];
                tasks += `<label class="task-card cursor-pointer block mb-4">
                    <input type="checkbox" class="hidden" ${chk?'checked':''}
                        onchange="G.wizard.tasks[${i}]=this.checked;renderWizard();">
                    <div class="flex items-center p-5 rounded-2xl border-2 transition-all ${chk ? 'border-brand bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}">
                        <div class="custom-check w-8 h-8 rounded-lg border-2 ${chk ? 'bg-brand border-brand' : 'border-gray-300 bg-gray-50'} mr-5 flex-shrink-0 relative"></div>
                        <div><p class="text-xs font-bold text-gray-400 uppercase">Step ${i+1}</p>
                        <span class="text-gray-700 font-semibold text-base">${txt2}</span></div>
                    </div></label>`;
            });
            cont.innerHTML = `<div class="fade-in">
                <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex gap-3">
                    <i class="fa-solid fa-computer text-amber-500 mt-1 flex-shrink-0"></i>
                    <div><p class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">${tr.part_b_title}</p>
                    <p class="text-amber-800 font-medium text-sm">${tr.part_b_instr}</p></div></div>
                <h3 class="text-2xl font-black text-gray-800 mb-8">Complete on your computer:</h3>${tasks}</div>`;
        }

        const pct = (G.wizard.step / (G.wizard.total - 1)) * 100;
        document.getElementById('wizard-progress').style.width = Math.min(pct,100) + '%';
        document.getElementById('btn-prev-step').classList.toggle('hidden', G.wizard.step === 0);
        const last = G.wizard.step === G.wizard.total - 1;
        document.getElementById('btn-next-step').classList.toggle('hidden', last);
        document.getElementById('btn-submit-assessment').classList.toggle('hidden', !last);
    }
    window.renderWizard = renderWizard;

    window.nextStep = function() {
        const wid = parseInt(document.getElementById('quiz-title').dataset.wid);
        const wk  = getWeeks().find(w => w.id === wid);
        if (G.wizard.step < wk.questions.length && G.wizard.ans[G.wizard.step] === undefined) {
            alert(t().select_answer_error); return;
        }
        G.wizard.step++;
        renderWizard();
    };
    window.prevStep = function() { G.wizard.step--; renderWizard(); };

    window.submitAssessment = function(e) {
        e.preventDefault();
        const wid  = parseInt(document.getElementById('quiz-title').dataset.wid);
        const wk   = getWeeks().find(w => w.id === wid);
        let score  = 0;

        wk.questions.forEach((q, origQIdx) => {
            const step = G.wizard.qOrder.indexOf(origQIdx);
            if (step < 0) return;
            const disp = G.wizard.ans[step];
            if (disp === undefined) return;
            const origOpt = G.wizard.oOrder[step][disp];
            if (origOpt === q.ans) score++;
        });
        wk.tasks.forEach((_, i) => { if (G.wizard.tasks[i]) score++; });

        const max    = wk.questions.length + wk.tasks.length;
        // Pass Mark Updated to 50%
        const passed = score >= Math.ceil(max * 0.5);

        G.user.progress[String(wid)] = { score, passed, taken:true };
        serverSave();

        showResult(wid, score, max);
    };

    // ═══════════════════════════════════════════════════════════════
    // 10. RESULT OVERLAY
    // ═══════════════════════════════════════════════════════════════
    function showResult(wid, score, max) {
        const wk     = getWeeks().find(w => w.id === wid);
        const tr     = t();
        // Pass Mark Updated to 50%
        const passed = score >= Math.ceil(max * 0.5);

        if (passed) confetti({ particleCount:150, spread:70, origin:{y:0.6}, colors:['#10b981','#047857','#ffffff'] });

        txt('res-name',    G.user.name);
        txt('res-code',    G.user.code);
        txt('res-week',    tr[wk.titleKey]);
        txt('res-score',   score);
        txt('res-max',     '/ ' + max);
        txt('res-status',  passed ? (tr.passed_badge || 'PASSED ✓') : (tr.failed_badge || 'FAILED ✗'));
        txt('res-message', passed ? tr.excellent : tr.retake);
        document.getElementById('res-status').className = passed
            ? 'font-extrabold text-green-600 text-sm'
            : 'font-extrabold text-red-600 text-sm';

        // Animate score ring
        const circle = document.getElementById('score-ring-circle');
        const circumference = 2 * Math.PI * 52; // radius = 52
        const offset = circumference - (score / max) * circumference;
        circle.style.strokeDasharray = circumference;
        circle.classList.remove('passed', 'failed');
        circle.classList.add(passed ? 'passed' : 'failed');
        
        // Animate after a short delay
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 100);

        show('result-overlay');
    }

    window.shareResult = function(platform) {
        const name = document.getElementById('res-name').innerText;
        const week = document.getElementById('res-week').innerText;
        const score = document.getElementById('res-score').innerText;
        const max = document.getElementById('res-max').innerText.replace('/', '').trim();
        const status = document.getElementById('res-status').innerText;
        
        const text = `🎉 I just completed ${week} on JORC Digital Literacy LMS!\n\nScore: ${score}/${max}\nStatus: ${status}\n\n#JORC #DigitalLiteracy #Learning`;
        const url = window.location.href;
        
        let shareUrl;
        switch(platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    };

    window.closeResult = function() {
        hide('result-overlay');
        hide('assessment-screen');
        loadDashboard();
    };

    // ═══════════════════════════════════════════════════════════════
    // 10b. GAMIFICATION — points, badges, streaks, leaderboard
    // ═══════════════════════════════════════════════════════════════
    const BADGE_DEFS = [
        { id:'first-step',   icon:'fa-flag-checkered', color:'bg-blue-100 text-blue-600',       label:'First Step',        d:'Complete your first module' },
        { id:'perfect',      icon:'fa-bullseye',       color:'bg-emerald-100 text-emerald-600', label:'Sharpshooter',      d:'Score 100% on any module' },
        { id:'halfway',      icon:'fa-route',          color:'bg-violet-100 text-violet-600',   label:'Halfway There',     d:'Complete 3 modules' },
        { id:'high-achiever',icon:'fa-rocket',         color:'bg-orange-100 text-orange-600',   label:'High Achiever',     d:'Score 80% or more overall' },
        { id:'certified',    icon:'fa-medal',          color:'bg-yellow-100 text-yellow-600',   label:'Certified',         d:'Pass all 5 modules' }
    ];

    function gamiMeta() {
        if (!G.user) return null;
        if (!G.user.progress._meta) G.user.progress._meta = { points:0, badges:[], streak:0, bestStreak:0, lastActive:'' };
        return G.user.progress._meta;
    }

    function todayStr() {
        const n = new Date();
        return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
    }

    function maxFor(wid) { return wid === 5 ? 50 : 10; }

    // Compute total points from achieved scores (sum of all scores)
    function totalPoints() {
        let sum = 0;
        [1,2,3,4,5].forEach(n => { const w = (G.user.progress||{})[String(n)]; if (w && w.taken) sum += Number(w.score)||0; });
        return sum;
    }

    // Evaluate which badges the user has earned
    function earnedBadges() {
        const out = [];
        let anyTaken = false, perfect = false, takenCount = 0, passedAll = true, scoreSum = 0, scoreCnt = 0;
        [1,2,3,4,5].forEach(n => {
            const w = (G.user.progress||{})[String(n)];
            if (w && w.taken) {
                anyTaken = true; takenCount++;
                if (w.score >= maxFor(n)) perfect = true;
                if (w.passed) { scoreSum += Number(w.score)||0; scoreCnt++; } else { passedAll = false; }
            }
        });
        if (anyTaken) out.push('first-step');
        if (perfect) out.push('perfect');
        if (takenCount >= 3) out.push('halfway');
        const passedMax = scoreSum + (5 - scoreCnt) * 0; // passed scores only
        const pct = scoreCnt ? (scoreSum / (scoreCnt * 50)) : 0; // rough high-achiever check
        if (passedAll && takenCount === 5 && pct >= 0.8) out.push('high-achiever');
        if (passedAll && takenCount === 5) out.push('certified');
        return out;
    }

    // Update streak based on last active date
    function updateStreak() {
        const meta = gamiMeta();
        if (!meta) return;
        const today = todayStr();
        const last  = meta.lastActive;
        if (last === today) {
            // same day, no change
        } else if (last === '') {
            meta.streak = 1;
        } else {
            const lastD = new Date(last + 'T00:00:00');
            const yestD = new Date(Date.now() - 864e5);
            const yest  = yestD.getFullYear() + '-' + String(yestD.getMonth()+1).padStart(2,'0') + '-' + String(yestD.getDate()).padStart(2,'0');
            meta.streak = (last === yest) ? meta.streak + 1 : 1;
        }
        meta.lastActive = today;
        meta.bestStreak = Math.max(meta.bestStreak || 0, meta.streak);
    }

    // Refresh points/badges/streak stats on dashboard
    window.renderGamification = function() {
        if (!G.user) return;
        updateStreak();
        const meta = gamiMeta();
        const earned = earnedBadges();
        meta.badges = earned;

        txt('gami-points', totalPoints());
        txt('gami-streak', meta.streak);
        txt('gami-badges', earned.length);

        const holder = document.getElementById('gami-badges-holder');
        const row = document.getElementById('gami-badges-row');
        if (earned.length) {
            holder.innerHTML = BADGE_DEFS.filter(b => earned.includes(b.id)).map(b =>
                '<div title="'+b.d+'" class="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-2 pr-3 py-1.5 shadow-sm">' +
                '<span class="w-8 h-8 rounded-full '+b.color+' flex items-center justify-center"><i class="fa-solid '+b.icon+'"></i></span>' +
                '<span class="text-xs font-bold text-gray-700">'+b.label+'</span></div>').join('');
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }

        window.refreshLeaderboard();
    };

    // Fetch all students and render top-10 leaderboard by points
    window.refreshLeaderboard = async function() {
        const body = document.getElementById('leaderboard-body');
        try {
            const { data, error } = await db.from('students').select('*').limit(200);
            if (error) { body.innerHTML = '<div class="p-4 px-5 text-sm text-red-400 text-center">Could not load leaderboard.</div>'; return; }
            const list = (data||[]).map(s => fixProgress(s)).map(s => {
                const meta = s.progress._meta || {};
                const pt = meta.points != null ? meta.points : (() => {
                    let sum = 0; [1,2,3,4,5].forEach(n => { const w=s.progress[String(n)]; if(w&&w.taken) sum+=Number(w.score)||0; }); return sum;
                })();
                let taken = 0; [1,2,3,4,5].forEach(n => { const w=s.progress[String(n)]; if(w&&w.taken) taken++; });
                return { name:s.name||'—', code:s.code, points:pt, taken };
            }).filter(r => r.name !== '—' && r.code !== 'ADMINKEY')
              .sort((a,b) => b.points - a.points || b.taken - a.taken)
              .slice(0,10);

            if (!list.length) { body.innerHTML = '<div class="p-4 px-5 text-sm text-gray-400 italic">No students yet. Be the first on the leaderboard!</div>'; return; }

            const myCode = G.user ? G.user.code : null;
            body.innerHTML = list.map((r,i) => {
                const medal = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : (i+1);
                const mine = myCode === r.code;
                return '<div class="flex items-center gap-4 px-5 py-3 text-sm '+(mine?'bg-brand bg-opacity-10':'' )+'">' +
                    '<span class="w-8 text-center font-black text-gray-400 text-base">'+medal+'</span>' +
                    '<span class="flex-1 font-bold text-gray-800 truncate">'+r.name+(mine?' <span class="text-brand text-xs font-black">(You)</span>':'')+'</span>' +
                    '<span class="w-16 text-center font-black text-gray-700">'+r.points+'</span>' +
                    '<span class="w-20 text-center hidden sm:block text-gray-400 font-medium">'+r.taken+'/5</span></div>';
            }).join('');
        } catch(e) {
            body.innerHTML = '<div class="p-4 px-5 text-sm text-red-400 text-center">Leaderboard unavailable.</div>';
        }
    };
