    (function() {
        const DEFAULT_POINTS = [
            { label: "#1", value: 15 },
            { label: "#2", value: 13 },
            { label: "#3", value: 10 },
            { label: "#4", value: 8 },
            { label: "#5", value: 6 },
            { label: "#6", value: 4 },
            { label: "#7-10", value: 2 },
            { label: "#11-15", value: 1 },
        ];
        const KILL_VALUE = 1;

        let pointSettings = JSON.parse(JSON.stringify(DEFAULT_POINTS));
        let teams = ['Team 1', 'Team 2'];
        let matchCount = 2;

        function saveToStorage() {
            const data = {
                eventName: document.getElementById('eventName').value,
                eventDate: document.getElementById('eventDate').value,
                organizer: document.getElementById('organizer').value,
                creator: document.getElementById('creator').value,
                pointSettings,
                teams,
                matchCount: parseInt(document.getElementById('matchCount').value) || 2
            };
            localStorage.setItem('scorData', JSON.stringify(data));
        }

        function loadFromStorage() {
            const saved = localStorage.getItem('scorData');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    document.getElementById('eventName').value = data.eventName || 'WEEKLY SCRIM';
                    document.getElementById('eventDate').value = data.eventDate || '2025-04-10';
                    document.getElementById('organizer').value = data.organizer || 'SANN404';
                    document.getElementById('creator').value = data.creator || 'OPERATOR';
                    if (data.pointSettings) pointSettings = data.pointSettings;
                    if (data.teams && data.teams.length) teams = data.teams;
                    if (data.matchCount) document.getElementById('matchCount').value = data.matchCount;
                } catch (e) {}
            }
        }

        function renderPointPanel() {
            const panel = document.getElementById('pointPanel');
            panel.innerHTML = '';
            pointSettings.forEach((p, idx) => {
                const div = document.createElement('div');
                div.className = 'point-item';
                div.innerHTML = `<span>${p.label}</span> <input type="number" min="0" step="1" data-idx="${idx}" value="${p.value}" class="point-input">`;
                panel.appendChild(div);
            });
            const killNote = document.createElement('div');
            killNote.style.marginLeft = '10px'; killNote.style.fontFamily = 'monospace'; killNote.style.fontWeight = 'bold';
            killNote.innerText = '1 KILL = 1 POINT';
            panel.appendChild(killNote);

            document.querySelectorAll('.point-input').forEach(inp => {
                inp.addEventListener('change', function(e) {
                    const idx = this.dataset.idx;
                    pointSettings[idx].value = parseInt(this.value) || 0;
                    saveToStorage();
                });
            });
        }

        document.getElementById('resetPointsBtn').addEventListener('click', function() {
            pointSettings = JSON.parse(JSON.stringify(DEFAULT_POINTS));
            renderPointPanel();
            saveToStorage();
        });

        function renderTeams() {
            const container = document.getElementById('teamListContainer');
            container.innerHTML = '';
            teams.forEach((team, index) => {
                const row = document.createElement('div');
                row.className = 'team-row';
                row.innerHTML = `
                    <input type="text" value="${team.replace(/"/g, '&quot;')}" placeholder="Team name" data-index="${index}" class="team-name-input">
                    <button class="remove-team" data-index="${index}" ${teams.length <= 1 ? 'disabled style="opacity:0.3"' : ''}>✕</button>
                `;
                container.appendChild(row);
            });

            document.querySelectorAll('.team-name-input').forEach(inp => {
                inp.addEventListener('input', function(e) {
                    const idx = this.dataset.index;
                    teams[idx] = this.value || 'UNNAMED';
                    saveToStorage();
                    renderMatchTables();
                    });
            });

            document.querySelectorAll('.remove-team').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    if (teams.length <= 1) return;
                    const idx = this.dataset.index;
                    teams.splice(idx, 1);
                    saveToStorage();
                    renderTeams();
                    renderMatchTables();
                });
            });
        }

        document.getElementById('addTeamBtn').addEventListener('click', function() {
            teams.push(`Team ${teams.length+1}`);
            saveToStorage();
            renderTeams();
            renderMatchTables();
        });

        function renderMatchTables() {
            const container = document.getElementById('matchTablesArea');
            const count = parseInt(document.getElementById('matchCount').value) || 1;
            matchCount = count;
            container.innerHTML = '';

            if (teams.length === 0) {
                container.innerHTML = '<div class="error-toast">⚠️ ADD AT LEAST ONE TEAM</div>';
                return;
            }

            for (let m = 0; m < count; m++) {
                const matchDiv = document.createElement('div');
                matchDiv.className = 'match-card';
                matchDiv.innerHTML = `<div class="match-title">MATCH ${m+1}</div>`;
                const body = document.createElement('div');
                body.className = 'match-body';

                const table = document.createElement('table');
                const thead = document.createElement('thead');
                thead.innerHTML = '<tr><th>TEAM</th><th>POSITION</th><th>KILLS</th></tr>';
                table.appendChild(thead);
                const tbody = document.createElement('tbody');

                teams.forEach((team, tIdx) => {
                    const row = document.createElement('tr');
                    let positionOptions = '';
                    for (let pos = 1; pos <= 20; pos++) {
                        positionOptions += `<option value="${pos}">#${pos}</option>`;
                    }

                    const savedData = localStorage.getItem(`match_${m}_team_${tIdx}`);
                    const savedPos = savedData ? JSON.parse(savedData).pos : (tIdx+1);
                    const savedKill = savedData ? JSON.parse(savedData).kill : 0;

                    row.innerHTML = `
                        <td style="font-weight:bold;">${team}</td>
                        <td>
                            <select class="pos-select" data-match="${m}" data-team="${tIdx}">
                                ${positionOptions}
                            </select>
                        </td>
                        <td>
                            <input type="number" min="0" value="${savedKill}" class="kill-input" data-match="${m}" data-team="${tIdx}" style="width:80px;">
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                table.appendChild(tbody);
                body.appendChild(table);
                matchDiv.appendChild(body);
                container.appendChild(matchDiv);
            }

            for (let m = 0; m < count; m++) {
                teams.forEach((_, tIdx) => {
                    const select = document.querySelector(`.pos-select[data-match="${m}"][data-team="${tIdx}"]`);
                    const killInput = document.querySelector(`.kill-input[data-match="${m}"][data-team="${tIdx}"]`);
                    if (select && killInput) {
                        const saved = localStorage.getItem(`match_${m}_team_${tIdx}`);
                        let posVal = (tIdx + 1);
                        let killVal = 0;
                        if (saved) {
                            try { 
                                const parsed = JSON.parse(saved); 
                                posVal = parsed.pos; 
                                killVal = parsed.kill; 
                            } catch(e) {}
                        }
                        select.value = posVal;
                        killInput.value = killVal;

                        select.addEventListener('change', saveMatchData);
                        killInput.addEventListener('input', saveMatchData);
                    }
                });
            }
        }

        function saveMatchData(e) {
            const match = e.target.dataset.match;
            const teamIdx = e.target.dataset.team;
            if (match === undefined || teamIdx === undefined) return;

            const select = document.querySelector(`.pos-select[data-match="${match}"][data-team="${teamIdx}"]`);
            const killInp = document.querySelector(`.kill-input[data-match="${match}"][data-team="${teamIdx}"]`);
            if (select && killInp) {
                const data = { pos: parseInt(select.value) || 1, kill: parseInt(killInp.value) || 0 };
                localStorage.setItem(`match_${match}_team_${teamIdx}`, JSON.stringify(data));
            }
            saveToStorage();
        }

        function calculateResults() {
            const results = {};
            teams.forEach((team, idx) => { results[idx] = { name: team, totalPoints: 0, totalKills: 0 }; });

            const matches = matchCount;
            for (let m = 0; m < matches; m++) {
                for (let t = 0; t < teams.length; t++) {
                    const stored = localStorage.getItem(`match_${m}_team_${t}`);
                    if (!stored) continue;
                    try {
                        const data = JSON.parse(stored);
                        const pos = data.pos;
                        const kills = data.kill || 0;
                        let point = 0;
                        if (pos <= 1) point = pointSettings.find(p => p.label === "#1")?.value || 15;
                        else if (pos === 2) point = pointSettings.find(p => p.label === "#2")?.value || 13;
                        else if (pos === 3) point = pointSettings.find(p => p.label === "#3")?.value || 10;
                        else if (pos === 4) point = pointSettings.find(p => p.label === "#4")?.value || 8;
                        else if (pos === 5) point = pointSettings.find(p => p.label === "#5")?.value || 6;
                        else if (pos === 6) point = pointSettings.find(p => p.label === "#6")?.value || 4;
                        else if (pos >= 7 && pos <= 10) point = pointSettings.find(p => p.label === "#7-10")?.value || 2;
                        else if (pos >= 11 && pos <= 15) point = pointSettings.find(p => p.label === "#11-15")?.value || 1;
                        else point = 1;

                        results[t].totalPoints += point + (kills * KILL_VALUE);
                        results[t].totalKills += kills;
                    } catch (e) {}
                }
            }

            let resultArray = Object.values(results);
            resultArray.sort((a, b) => b.totalPoints - a.totalPoints);
            return resultArray;
        }

        function displayResults() {
            const area = document.getElementById('resultsArea');
            area.innerHTML = '<div class="loading-animation"></div>';

            setTimeout(() => {
                const ranked = calculateResults();
                let html = `
                    <div class="result-card">
                        <div class="result-header">
                            <span>🏆 FINAL RANKING</span>
                            <span class="result-badge">TOTAL SCOR</span>
                        </div>
                        <div class="result-body">
                            <table class="result-table">
                                <thead><tr><th>RANK</th><th>TEAM</th><th>TOTAL POINTS</th><th>TOTAL KILLS</th></tr></thead>
                                <tbody>
                `;
                if (ranked.length === 0) html += '<tr><td colspan="4" style="padding:20px; text-align:center;">Belum ada data match. Isi form dan hitung scor.</td></tr>';
                ranked.forEach((r, idx) => {
                    const rowStyle = idx === 0 ? ' style="background: var(--accent-secondary); font-weight:900;"' : '';
                    html += `<tr${rowStyle}><td><strong>#${idx+1}</strong></td><td>${r.name}</td><td>${r.totalPoints}</td><td>${r.totalKills}</td></tr>`;
                });
                html += '</tbody></table></div></div>';
                area.innerHTML = html;
            }, 150);
        }

        function exportToCsv() {
            const ranked = calculateResults();
            if (ranked.length === 0) {
                alert('No data to export. Please add matches and hit "HITUNG SCOR" first.');
                return;
            }

            let csvContent = "";
            
            const eventName = document.getElementById('eventName').value || 'Scrim Event';
            const date = document.getElementById('eventDate').value || 'unknown date';
            const organizer = document.getElementById('organizer').value || 'unknown';
            const creator = document.getElementById('creator').value || 'unknown';
            
            csvContent += `# SCOR POINT EXPORT - ${eventName}\n`;
            csvContent += `# Date: ${date} | Organizer: ${organizer} | Creator: ${creator}\n`;
            csvContent += `# Point settings: `;
            pointSettings.forEach(p => { csvContent += `${p.label}=${p.value} `; });
            csvContent += `| Kill = ${KILL_VALUE}\n`;
            csvContent += `# Teams: ${teams.join(', ')}\n`;
            csvContent += `# Matches: ${matchCount}\n`;
            csvContent += `# \n`;
            
            csvContent += "FINAL RANKING\n";
            csvContent += "Rank,Team,Total Points,Total Kills\n";
            
            ranked.forEach((r, idx) => {
                csvContent += `${idx+1},"${r.name}",${r.totalPoints},${r.totalKills}\n`;
            });
            
            csvContent += "\n";
            
            csvContent += "MATCH DETAILS\n";
            
            let headerDetail = "Team";
            for (let m = 0; m < matchCount; m++) {
                headerDetail += `,Match ${m+1} Position,Match ${m+1} Kills`;
            }
            csvContent += headerDetail + "\n";
            
            for (let t = 0; t < teams.length; t++) {
                let rowDetail = `"${teams[t]}"`;
                for (let m = 0; m < matchCount; m++) {
                    const stored = localStorage.getItem(`match_${m}_team_${t}`);
                    if (stored) {
                        try {
                            const data = JSON.parse(stored);
                            rowDetail += `,${data.pos},${data.kill}`;
                        } catch (e) {
                            rowDetail += ",,";
                        }
                    } else {
                        rowDetail += ",,";
                    }
                }
                csvContent += rowDetail + "\n";
            }
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `scor_${eventName.replace(/\s+/g,'_')}_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        window.addEventListener('load', function() {
            loadFromStorage();
            renderPointPanel();
            renderTeams();
            renderMatchTables();

            document.getElementById('matchCount').addEventListener('input', function() {
                matchCount = parseInt(this.value) || 1;
                saveToStorage();
                renderMatchTables();
            });

            document.getElementById('calculateBtn').addEventListener('click', function() {
                const matches = matchCount;
                for (let m = 0; m < matches; m++) {
                    teams.forEach((_, tIdx) => {
                        const select = document.querySelector(`.pos-select[data-match="${m}"][data-team="${tIdx}"]`);
                        const killInp = document.querySelector(`.kill-input[data-match="${m}"][data-team="${tIdx}"]`);
                        if (select && killInp) {
                            const data = { pos: parseInt(select.value) || 1, kill: parseInt(killInp.value) || 0 };
                            localStorage.setItem(`match_${m}_team_${tIdx}`, JSON.stringify(data));
                        }
                    });
                }
                saveToStorage();
                displayResults();
            });

            document.getElementById('exportCsvBtn').addEventListener('click', function() {
                exportToCsv();
            });

            ['eventName','eventDate','organizer','creator'].forEach(id => {
                document.getElementById(id).addEventListener('input', saveToStorage);
            });
        });
    })();