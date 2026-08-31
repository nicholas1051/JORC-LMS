'use strict';

// ═══════════════════════════════════════════════════════════════
    // 11. TRANSCRIPT
    // ═══════════════════════════════════════════════════════════════
    window.showFinalTranscript = function() {
        const tr = t();
        txt('trans-name', G.user.name);
        txt('trans-code', G.user.code);
        txt('trans-date', new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}));

        const maxMap = {1:10,2:10,3:10,4:10,5:50};
        let total = 0, rows = '';
        getWeeks().forEach(wk => {
            const p   = wp(wk.id);
            const max = maxMap[wk.id];
            const sc  = p.taken ? p.score : 0;
            total += sc;
            const color = p.taken && p.passed ? '#047857' : (p.taken ? '#ef4444' : '#9ca3af');
            rows += `<tr style="border-bottom:1px solid #f3f4f6;">
                <td class="p-4 font-semibold text-gray-800">${tr[wk.titleKey]}</td>
                <td class="p-4 text-center font-black text-xl" style="color:${color}">${p.taken ? sc : '—'}</td>
                <td class="p-4 text-center font-semibold text-gray-400">${max}</td></tr>`;
        });
        document.getElementById('trans-table-body').innerHTML = rows;
        txt('trans-total', total);
        txt('trans-grade', total>=90?'A+':total>=80?'A':total>=70?'B':total>=60?'C':total>=50?'D':'F');

        // Generate Verification ID (deterministic per student + timestamp to keep stable within session)
        const grade = total>=90?'A+':total>=80?'A':total>=70?'B':total>=60?'C':total>=50?'D':'F';
        const verifyId = 'JORC-' + G.user.code + '-' + total + '-' + grade + '-' + new Date().toISOString().slice(0,10).replace(/-/g,'');
        txt('trans-verification-id', verifyId);

        // Generate QR Code containing verification data
        const qrCanvas = document.getElementById('transcript-qr');
        if (qrCanvas && window.QRCode) {
            qrCanvas.getContext('2d').clearRect(0, 0, qrCanvas.width, qrCanvas.height);
            try {
                new QRCode(qrCanvas, {
                    text: verifyId + '|' + G.user.name + '|' + total + '/100',
                    width: 84,
                    height: 84,
                    correctLevel: QRCode.CorrectLevel.M
                });
            } catch(e) {
                console.error('QR Generation failed:', e);
            }
        }

        show('transcript-overlay');
    };
    window.closeTranscript = function() { hide('transcript-overlay'); };

    // ═══════════════════════════════════════════════════════════════
    // 12. ADMIN PANEL
    // ═══════════════════════════════════════════════════════════════
    window.refreshAdmin = async function() {
        const tbody  = document.getElementById('admin-table-body');
        const loader = document.getElementById('admin-loading');
        tbody.innerHTML = '';
        loader.classList.remove('hidden');
        G.admin = {};

        try {
            const { data, error } = await db
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);

            const list = (data || []).map(s => fixProgress(s));

            if (!list.length) {
                tbody.innerHTML = '<tr><td colspan="10" class="p-8 text-center text-gray-400 italic">No student records found. Students will appear here once they log in.</td></tr>';
                return;
            }

            list.forEach(s => { G.admin[s.code] = s; });
            G.adminList = list;

            const getBadge = (s, n) => {
                const p = s.progress || {};
                const w = p[String(n)];
                if (!w || !w.taken) return '<span class="text-gray-300 font-bold">—</span>';
                const cls = w.passed ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600';
                return '<span class="' + cls + ' px-2 py-1 rounded-lg font-bold text-sm">' + w.score + '</span>';
            };

            // Compute stats overview
            const totalStudents = list.length;
            let graduates = 0, scoreSum = 0, scoreCount = 0, completions = 0;
            list.forEach(s => {
                const done = [1,2,3,4,5].every(n => { const p=s.progress||{}; const w=p[String(n)]; return w&&w.taken; });
                if (done) graduates++;
                let takenCnt = 0;
                [1,2,3,4,5].forEach(n => { const w=(s.progress||{})[String(n)]; if(w&&w.taken){ takenCnt++; scoreSum+=Number(w.score)||0; scoreCount++; } });
                if (takenCnt > 0) completions += takenCnt / 5;
            });
            document.getElementById('stat-total').innerText = totalStudents;
            document.getElementById('stat-graduates').innerText = graduates;
            document.getElementById('stat-avg').innerText = scoreCount ? (scoreSum/scoreCount).toFixed(1) : '0';
            document.getElementById('stat-rate').innerText = totalStudents ? Math.round((completions/totalStudents)*100) + '%' : '0%';

            const isGraduate = (s) => [1,2,3,4,5].every(n => { const p=s.progress||{}; const w=p[String(n)]; return w&&w.taken; });

            tbody.innerHTML = list.map(s => {
                const done = isGraduate(s);
                const status = done
                    ? '<span class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">GRADUATE</span>'
                    : '<span class="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">ACTIVE</span>';
                return `<tr class="border-b border-gray-100 hover:bg-brand hover:bg-opacity-5 transition-colors admin-row" data-status="${done?'graduate':'active'}" data-name="${(s.name||'').toLowerCase()}" data-code="${(s.code||'').toLowerCase()}">
                    <td class="p-4 text-center"><input type="checkbox" class="student-checkbox w-5 h-5 text-brand rounded border-gray-300 cursor-pointer" value="${s.code}"></td>
                    <td class="p-4 font-bold text-gray-800">${s.name||'—'}</td>
                    <td class="p-4"><span class="font-mono text-gray-500 bg-gray-50 rounded px-2 py-1">${s.code}</span></td>
                    <td class="p-4 text-center">${getBadge(s,1)}</td>
                    <td class="p-4 text-center">${getBadge(s,2)}</td>
                    <td class="p-4 text-center">${getBadge(s,3)}</td>
                    <td class="p-4 text-center">${getBadge(s,4)}</td>
                    <td class="p-4 text-center">${getBadge(s,5)}</td>
                    <td class="p-4 text-center">${status}</td>
                    <td class="p-4 text-center">
                        <div class="flex justify-center gap-2">
                            <button onclick="window.editStudent('${s.code}')" class="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition" title="Edit" aria-label="Edit ${s.name||s.code}">
                                <i class="fa-solid fa-pen"></i></button>
                            <button onclick="window.deleteStudent('${s.code}')" class="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition" title="Delete" aria-label="Delete ${s.name||s.code}">
                                <i class="fa-solid fa-trash"></i></button>
                        </div></td></tr>`;
            }).join('');

        } catch(err) {
            console.error('[JORC Admin] refreshAdmin error:', err);
            tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-red-500 text-center font-bold">⚠ Could not load from Supabase: ' + err.message + '</td></tr>';
        } finally {
            loader.classList.add('hidden');
        }
    };
    window.refreshAdminData = window.refreshAdmin;

    window.editStudent = function(code) {
        const s = G.admin[code];
        if (!s) { alert('Record not found. Click Refresh first.'); return; }
        document.getElementById('edit-name').value = s.name || '';
        document.getElementById('edit-code').value = s.code || '';
        [1,2,3,4,5].forEach(n => {
            const w = (s.progress || {})[String(n)] || {};
            document.getElementById('edit-w'+n).value = w.taken ? w.score : '';
        });
        document.getElementById('admin-edit-form').dataset.origCode = code;
        show('admin-edit-modal');
    };

    window.closeEditModal = function() { hide('admin-edit-modal'); };

    window.saveStudentEdit = async function(e) {
        e.preventDefault();
        const origCode = e.target.dataset.origCode;
        const newCode = document.getElementById('edit-code').value.trim().toUpperCase();
        const s = G.admin[origCode];
        
        if (!s) { alert('Record missing — refresh and try again.'); return; }
        if (!newCode) { alert('Student ID cannot be empty.'); return; }
        if (newCode === 'ADMINKEY') { alert('This code is reserved for administrators.'); return; }

        const btn  = e.target.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...';
        btn.disabled  = true;

        const newName = document.getElementById('edit-name').value.trim();
        let newProgress = {};

        [[1,10],[2,10],[3,10],[4,10],[5,50]].forEach(([n,mx]) => {
            const val = document.getElementById('edit-w'+n).value;
            const key = String(n);
            if (val === '') {
                newProgress[key] = {score:0, passed:false, taken:false};
            } else {
                const sc = Math.max(0, Math.min(parseInt(val)||0, mx));
                // Pass Mark Updated to 50%
                newProgress[key] = {score:sc, passed: sc >= Math.ceil(mx*0.5), taken:true};
            }
        });

        try {
            if (origCode !== newCode) {
                // Changing the Primary Key: Check if new code is taken
                const { data: existing } = await db.from('students').select('code').eq('code', newCode).maybeSingle();
                if (existing) {
                    throw new Error('Another student is already using the ID code: ' + newCode);
                }
                
                // Update record and primary key
                const { error } = await db
                    .from('students')
                    .update({ code: newCode, name: newName, progress: newProgress })
                    .eq('code', origCode);
                
                if (error) throw new Error(error.message);
            } else {
                // Just update the existing record
                const { error } = await db
                    .from('students')
                    .update({ name: newName, progress: newProgress })
                    .eq('code', origCode);
                if (error) throw new Error(error.message);
            }
            
            hide('admin-edit-modal');
            window.refreshAdmin();
        } catch(err) {
            alert('Save failed: ' + err.message);
        } finally {
            btn.innerHTML = orig;
            btn.disabled  = false;
        }
    };

    window.deleteStudent = async function(code) {
        const s = G.admin[code];
        const label = s ? '"' + s.name + '" (' + code + ')' : 'Code ' + code;
        if (!confirm('Permanently delete ' + label + '?\n\nThis cannot be undone.')) return;
        try {
            const { error } = await db.from('students').delete().eq('code', code);
            if (error) throw new Error(error.message);
        } catch(e) {
            alert('Delete failed: ' + e.message);
        }
        window.refreshAdmin();
    };

    window.toggleSelectAll = function(src) {
        document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = src.checked);
    };

    // Admin search & filter
    window.filterAdmin = function() {
        const q = (document.getElementById('admin-search').value || '').toLowerCase().trim();
        const status = document.getElementById('admin-status-filter').value;
        document.querySelectorAll('.admin-row').forEach(row => {
            let show = true;
            if (status !== 'all' && row.dataset.status !== status) show = false;
            if (show && q) {
                const hay = (row.dataset.name + ' ' + row.dataset.code);
                if (!hay.includes(q)) show = false;
            }
            row.style.display = show ? '' : 'none';
        });
    };

    // Bulk delete selected students
    window.bulkDelete = async function() {
        const checks = [...document.querySelectorAll('.student-checkbox:checked')];
        if (!checks.length) { alert('Select at least one student to delete.'); return; }
        const codes = checks.map(cb => cb.value);
        if (!confirm(`Permanently delete ${codes.length} selected student(s)?\n\nThis cannot be undone.`)) return;
        try {
            for (const code of codes) {
                await db.from('students').delete().eq('code', code);
                delete G.admin[code];
            }
            window.refreshAdmin();
        } catch(e) {
            alert('Bulk delete failed: ' + e.message);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // 13. EXPORTS (Excel / Word / PDF)
    // ═══════════════════════════════════════════════════════════════
    window.exportSelected = function(fmt) {
        const codes = [...document.querySelectorAll('.student-checkbox:checked')].map(cb => cb.value);
        if (!codes.length) { alert('Select at least one student to export.'); return; }

        const rows = codes.map(code => {
            const s  = G.admin[code];
            if (!s) return null;
            const g  = (n) => { const p=s.progress||{}; const w=p[String(n)]; return (w&&w.taken)?w.score:'N/A'; };
            const tot = [1,2,3,4,5].reduce((sum,n)=>{ const p=s.progress||{}; const w=p[String(n)]; return sum+(w&&w.taken?Number(w.score):0); },0);
            return {'Name':s.name,'ID':s.code,'Wk1(/10)':g(1),'Wk2(/10)':g(2),'Wk3(/10)':g(3),'Wk4(/10)':g(4),'Capstone(/50)':g(5),'Total(/100)':tot};
        }).filter(Boolean);

        const fn = 'JORC_Export_' + new Date().toISOString().slice(0,10);

        if (fmt === 'excel') {
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Scores');
            XLSX.writeFile(wb, fn + '.xlsx');
            return;
        }

        let trs = rows.map(r => `<tr><td>${r.Name}</td><td>${r.ID}</td><td>${r['Wk1(/10)']}</td><td>${r['Wk2(/10)']}</td><td>${r['Wk3(/10)']}</td><td>${r['Wk4(/10)']}</td><td>${r['Capstone(/50)']}</td><td><b>${r['Total(/100)']}</b></td></tr>`).join('');
        const html = `<div style="font-family:sans-serif;padding:40px"><h2 style="color:#047857">JORC LMS — Student Report</h2>
            <p style="color:#6b7280;font-size:12px">Generated: ${new Date().toLocaleString()}</p>
            <table border="1" style="border-collapse:collapse;width:100%;margin-top:16px;text-align:left">
            <tr style="background:#1f2937;color:#fff"><th style="padding:8px">Name</th><th>ID</th><th>Wk1</th><th>Wk2</th><th>Wk3</th><th>Wk4</th><th>Capstone</th><th>Total</th></tr>${trs}</table></div>`;

        if (fmt === 'word') {
            const a = document.createElement('a');
            a.href = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
            a.download = fn + '.doc'; a.click();
        } else {
            const pw = window.open('','_blank','width=960,height=700');
            pw.document.write(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{padding:20px;font-family:sans-serif}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px}@media print{body{padding:0}@page{size:A4 landscape;margin:10mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${html}</body></html>`);
            pw.document.close();
            setTimeout(() => { pw.focus(); pw.print(); }, 600);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // 14. PRINT SLIPS (Result & Transcript)
    // ═══════════════════════════════════════════════════════════════
    window.printSlip = function(elId) {
        let fn;
        if (elId === 'result-slip') {
            const candidateName = (document.getElementById('res-name').innerText || 'Student').replace(/\s+/g, '_');
            const weekLabel     = (document.getElementById('res-week').innerText  || 'Week').replace(/\s+/g, '_');
            fn = candidateName + '_' + weekLabel;
        } else {
            const candidateName = (document.getElementById('trans-name').innerText || 'Student').replace(/\s+/g, '_');
            fn = candidateName + '_Transcript';
        }
        let body = '';

        if (elId === 'result-slip') {
            const name   = document.getElementById('res-name').innerText;
            const code   = document.getElementById('res-code').innerText;
            const week   = document.getElementById('res-week').innerText;
            const score  = document.getElementById('res-score').innerText;
            const maxStr = document.getElementById('res-max').innerText.replace('/','').trim();
            const status = document.getElementById('res-status').innerText;
            const msg    = document.getElementById('res-message').innerText;
            const passed = status.includes('PASSED') || status.includes('MAÎTRISÉ') || status.includes('TI PARI') || status.includes('YEGE');

            body = `<div style="max-width:420px;margin:20px auto;font-family:Poppins,sans-serif;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.12)">
                <div style="background:linear-gradient(135deg,#047857,#064e3b);padding:32px 24px;text-align:center">
                    <div style="font-size:48px;margin-bottom:12px">🏅</div>
                    <h2 style="color:#fff;font-size:22px;font-weight:900;letter-spacing:2px;margin:0">MODULE RESULT</h2>
                    <p style="color:#a7f3d0;font-size:11px;font-weight:700;letter-spacing:3px;margin:6px 0 0">JORC Digital Literacy LMS</p></div>
                <div style="padding:24px;text-align:center;background:#fff">
                    <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px">Student</p>
                    <h3 style="font-size:20px;font-weight:900;color:#111827;margin:0 0 8px">${name}</h3>
                    <p style="color:#047857;font-family:monospace;font-size:15px;font-weight:700;background:#ecfdf5;display:inline-block;padding:3px 12px;border-radius:8px;margin-bottom:20px">${code}</p>
                    <div style="display:flex;gap:12px;margin-bottom:20px">
                        <div style="flex:1;background:#f9fafb;padding:12px;border-radius:10px;border:1px solid #e5e7eb">
                            <p style="color:#9ca3af;font-size:9px;font-weight:700;text-transform:uppercase;margin:0 0 3px">Module</p>
                            <p style="font-size:13px;font-weight:900;color:#111827;margin:0">${week}</p></div>
                        <div style="flex:1;background:#f9fafb;padding:12px;border-radius:10px;border:1px solid #e5e7eb">
                            <p style="color:#9ca3af;font-size:9px;font-weight:700;text-transform:uppercase;margin:0 0 3px">Status</p>
                            <p style="font-size:13px;font-weight:900;color:${passed?'#16a34a':'#dc2626'};margin:0">${status}</p></div></div>
                    <div style="width:110px;height:110px;border-radius:50%;border:7px solid #047857;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 20px;background:#fff">
                        <span style="color:${passed?'#047857':'#ef4444'};font-size:40px;font-weight:900;line-height:1">${score}</span>
                        <span style="color:#9ca3af;font-size:15px;font-weight:700">${maxStr}</span></div>
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:10px 16px;color:#4b5563;font-size:13px;margin-bottom:20px">${msg}</div>
                    <p style="color:#d1d5db;font-size:10px">JORC Digital Literacy LMS — Issued: ${new Date().toLocaleDateString()}</p></div></div>`;

        } else {
            const name  = document.getElementById('trans-name').innerText;
            const code  = document.getElementById('trans-code').innerText;
            const date  = document.getElementById('trans-date').innerText;
            const total = document.getElementById('trans-total').innerText;
            const grade = document.getElementById('trans-grade').innerText;
            const rows  = [...document.getElementById('trans-table-body').querySelectorAll('tr')].map(tr => {
                const cells = [...tr.querySelectorAll('td')];
                if (cells.length < 3) return '';
                const sv = parseFloat(cells[1].innerText), mv = parseFloat(cells[2].innerText);
                // Pass Mark Updated to 50%
                const ok = !isNaN(sv) && !isNaN(mv) && sv >= mv*0.5;
                return `<tr style="border-bottom:1px solid #f3f4f6">
                    <td style="padding:10px 14px;font-weight:600;color:#111827;font-size:13px">${cells[0].innerText}</td>
                    <td style="padding:10px 14px;text-align:center;font-weight:900;font-size:16px;color:${ok?'#047857':'#ef4444'}">${cells[1].innerText}</td>
                    <td style="padding:10px 14px;text-align:center;font-weight:600;color:#9ca3af;font-size:13px">${cells[2].innerText}</td></tr>`;
            }).join('');

            const verifyId = (document.getElementById('trans-verification-id')||{}).innerText || 'JORC';
            body = `<div style="max-width:680px;margin:20px auto;font-family:Poppins,sans-serif;padding:48px;box-sizing:border-box;border:10px double #e5e7eb;background:#fff">
                <div style="text-align:center;margin-bottom:32px">
                    <div style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:50%;margin-bottom:14px;overflow:hidden;border:4px solid #047857;background:#fff;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                        <img src="https://jonahotunlarc.com/email-assets/logo.png" alt="Logo" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    <h1 style="color:#111827;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:6px;margin:0 0 6px">Official Transcript</h1>
                    <p style="color:#047857;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0">JORC Digital Literacy LMS — Computer Basics for Beginners</p>
                    <div style="width:72px;height:3px;background:#047857;border-radius:4px;margin:14px auto 0"></div></div>
                <div style="display:flex;justify-content:space-between;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px 24px;margin-bottom:24px">
                    <div><p style="color:#9ca3af;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Student Name</p>
                    <p style="color:#111827;font-size:18px;font-weight:900;margin:0">${name}</p></div>
                    <div style="text-align:right"><p style="color:#9ca3af;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Student ID</p>
                    <p style="color:#047857;font-family:monospace;font-size:16px;font-weight:700;margin:0">${code}</p></div></div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #e5e7eb;overflow:hidden">
                    <thead><tr style="background:#1f2937">
                        <th style="padding:11px 14px;text-align:left;color:#fff;font-size:9px;text-transform:uppercase;letter-spacing:2px">Module</th>
                        <th style="padding:11px 14px;text-align:center;color:#fff;font-size:9px;text-transform:uppercase;letter-spacing:2px">Score</th>
                        <th style="padding:11px 14px;text-align:center;color:#fff;font-size:9px;text-transform:uppercase;letter-spacing:2px">Max</th></tr></thead>
                    <tbody>${rows}</tbody>
                    <tfoot><tr style="background:#d1fae5;border-top:4px solid #047857">
                        <td style="padding:12px 14px;text-align:right;font-weight:700;font-size:10px;text-transform:uppercase;color:#065f46">Final Total Score:</td>
                        <td style="padding:12px 14px;text-align:center;font-size:20px;font-weight:900;color:#047857">${total}</td>
                        <td style="padding:12px 14px;text-align:center;font-size:14px;font-weight:600;color:#6b7280">100</td></tr></tfoot></table>
                <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;padding-top:20px;border-top:1px solid #f3f4f6">
                    <div style="width:170px;text-align:center"><div style="border-bottom:2px solid #9ca3af;height:36px;margin-bottom:8px;display:flex;align-items:flex-end;justify-content:center;font-family:'Brush Script MT',cursive;font-size:22px;color:#6b7280">J. Otunla</div>
                    <p style="color:#9ca3af;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:2px">Instructor Signature</p></div>
                    <div style="text-align:center"><div style="width:100px;height:100px;border-radius:50%;border:4px solid #f59e0b;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto">
                        <span style="font-size:8px;font-weight:900;color:#9ca3af;text-transform:uppercase;display:block;margin-bottom:2px">Grade</span>
                        <span style="font-size:44px;font-weight:900;color:#111827;line-height:1">${grade}</span></div></div>
                    <div style="width:170px;text-align:center"><div style="border-bottom:2px solid #9ca3af;height:36px;margin-bottom:8px;display:flex;align-items:flex-end;justify-content:center;font-family:monospace;font-size:12px;color:#374151;padding-bottom:3px">${date}</div>
                    <p style="color:#9ca3af;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:2px">Date Issued</p></div></div>
                <div style="margin-top:28px;text-align:center;border-top:1px solid #f3f4f6;padding-top:14px">
                    <p style="color:#9ca3af;font-size:8px;font-weight:700">Verification ID: <span style="font-family:monospace">${verifyId}</span></p>
                    <p style="color:#d1d5db;font-size:9px">&copy; 2026 Jonah Otunla Resource Centre. All Rights Reserved.</p></div></div>`;
        }

        const pw = window.open('','_blank','width=900,height=750');
        pw.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fn}</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet">
            <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#e5e7eb;padding:20px;font-family:Poppins,sans-serif}
            @media print{body{background:#fff!important;padding:0}@page{margin:0;size:A4 portrait}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
        </head><body>${body}</body></html>`);
        pw.document.close();
        setTimeout(() => { pw.focus(); pw.print(); }, 900);
    };
