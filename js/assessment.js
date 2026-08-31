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

    window.closeResult = function() {
        hide('result-overlay');
        hide('assessment-screen');
        loadDashboard();
    };
