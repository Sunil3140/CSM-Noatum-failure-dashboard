const colors = {
    'Aux Engine Validation': '#0D9488',
    'SFOC out of range': '#2563EB',
    'SCOC below range': '#D97706',
    'Reporting Gap (Rule 7)': '#9333EA',
    'Other': '#64748B'
};

const badgeClasses = {
    'Aux Engine Validation': 'aux',
    'SFOC out of range': 'sfoc',
    'SCOC below range': 'scoc',
    'Reporting Gap (Rule 7)': 'rule7',
    'Other': 'other'
};

let rawData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            rawData = data;
            filteredData = [...rawData];
            initDashboard();
        })
        .catch(err => console.error("Failed to load data:", err));
});

function initDashboard() {
    populateShipFilter();
    renderSummaryCards();
    renderCharts();
    renderMatrix();
    renderTable();
    setupEventListeners();
}

function getWeeks() {
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
}

function renderSummaryCards() {
    const container = document.getElementById('summaryCardsContainer');
    container.innerHTML = '';
    const weeks = getWeeks();
    
    // Find the max failures to highlight the card
    let maxFailures = 0;
    const weekStats = weeks.map(w => {
        const data = rawData.filter(d => d.week === w);
        const ships = new Set(data.map(d => d.vessel)).size;
        const total = data.length;
        if (total > maxFailures) maxFailures = total;
        return { week: w, total, ships };
    });

    weekStats.forEach(stat => {
        const isHighlight = stat.total > 0 && stat.total === maxFailures; // highlight the worst week
        const card = document.createElement('div');
        card.className = 'summary-card' + (isHighlight ? ' highlight' : '');
        
        let warningHtml = isHighlight ? `
            <svg class="warning-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>` : '';

        card.innerHTML = `
            ${warningHtml}
            <div class="summary-week">${stat.week}</div>
            <div class="summary-records"><span>${stat.total}</span> records</div>
            <div class="summary-vessels">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                ${stat.ships} vessels affected
            </div>
        `;
        container.appendChild(card);
    });
}

function renderCharts() {
    const weeks = getWeeks();
    
    // Process data for Chart 1: Total Failures & Unique Ships
    const totalFailures = weeks.map(w => rawData.filter(d => d.week === w).length);
    const uniqueShips = weeks.map(w => {
        const ships = rawData.filter(d => d.week === w).map(d => d.vessel);
        return new Set(ships).size;
    });

    const ctx1 = document.getElementById('barChart1').getContext('2d');
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: weeks,
            datasets: [
                {
                    label: 'Total Failures',
                    data: totalFailures,
                    backgroundColor: '#3B82F6',
                    borderRadius: 4
                },
                {
                    label: 'Unique Ships',
                    data: uniqueShips,
                    backgroundColor: '#EF4444',
                    type: 'line',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    pointBackgroundColor: '#EF4444',
                    pointRadius: 4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#2D3748' }, ticks: { color: '#A0AEC0' } },
                y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#A0AEC0' } },
                x: { grid: { display: false }, ticks: { color: '#A0AEC0' } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#E2E8F0', boxWidth: 12 } }
            }
        }
    });

    // Process data for Chart 2: Stacked Failure Types
    const fTypes = Object.keys(colors);
    const datasets2 = fTypes.map(type => {
        return {
            label: type,
            data: weeks.map(w => rawData.filter(d => d.week === w && d.failure_type === type).length),
            backgroundColor: colors[type],
            stacked: true
        };
    });

    const ctx2 = document.getElementById('barChart2').getContext('2d');
    new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: weeks,
            datasets: datasets2
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: '#A0AEC0' } },
                y: { stacked: true, beginAtZero: true, grid: { color: '#2D3748' }, ticks: { color: '#A0AEC0' } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#E2E8F0', boxWidth: 12 } }
            }
        }
    });

    // Process data for Doughnut Chart
    const typeCounts = {};
    fTypes.forEach(t => typeCounts[t] = 0);
    rawData.forEach(d => {
        if(typeCounts[d.failure_type] !== undefined) typeCounts[d.failure_type]++;
    });

    const dData = fTypes.map(t => typeCounts[t]);
    const totalRecords = rawData.length;
    document.getElementById('aggregateSubtitle').innerText = `All 4 weeks combined (${totalRecords} records)`;

    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: fTypes,
            datasets: [{
                data: dData,
                backgroundColor: fTypes.map(t => colors[t]),
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Build Custom Doughnut Legend
    const legendContainer = document.getElementById('doughnutLegend');
    fTypes.forEach(t => {
        if (typeCounts[t] > 0) {
            const pct = Math.round((typeCounts[t] / totalRecords) * 100);
            legendContainer.innerHTML += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${colors[t]}"></div>
                    <span style="flex: 1">${t}</span>
                    <span style="font-weight: 600">${pct}%</span>
                </div>
            `;
        }
    });
}

function renderMatrix() {
    const weeks = getWeeks();
    const shipStats = {};

    rawData.forEach(d => {
        if (!shipStats[d.vessel]) {
            shipStats[d.vessel] = { total: 0 };
            weeks.forEach(w => shipStats[d.vessel][w] = 0);
        }
        shipStats[d.vessel][d.week]++;
        shipStats[d.vessel].total++;
    });

    const sortedShips = Object.keys(shipStats).sort((a, b) => shipStats[b].total - shipStats[a].total);

    const tbody = document.querySelector('#matrixTable tbody');
    tbody.innerHTML = '';

    sortedShips.forEach(ship => {
        const row = document.createElement('tr');
        let html = `<td>${ship}</td>`;
        
        weeks.forEach(w => {
            const val = shipStats[ship][w];
            let bg = 'transparent';
            let displayVal = '-';
            
            if (val > 0) {
                displayVal = val;
                if (val >= 6) bg = 'var(--matrix-extreme)';
                else if (val >= 4) bg = 'var(--matrix-high)';
                else if (val >= 2) bg = 'var(--matrix-med)';
                else bg = 'var(--matrix-low)';
            }
            
            html += `<td style="background-color: ${bg}" class="matrix-cell">${displayVal}</td>`;
        });
        
        html += `<td>${shipStats[ship].total}</td>`;
        row.innerHTML = html;
        tbody.appendChild(row);
    });
}

function populateShipFilter() {
    const ships = [...new Set(rawData.map(d => d.vessel))].sort();
    const shipFilter = document.getElementById('shipFilter');
    ships.forEach(ship => {
        const option = document.createElement('option');
        option.value = ship;
        option.textContent = ship;
        shipFilter.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('weekFilter').addEventListener('change', applyFilters);
    document.getElementById('shipFilter').addEventListener('change', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('weekFilter').value = 'All';
        document.getElementById('shipFilter').value = 'All';
        document.getElementById('typeFilter').value = 'All';
        applyFilters();
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / rowsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderTable();
        }
    });
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const week = document.getElementById('weekFilter').value;
    const ship = document.getElementById('shipFilter').value;
    const type = document.getElementById('typeFilter').value;

    filteredData = rawData.filter(d => {
        const matchSearch = d.vessel.toLowerCase().includes(search) || d.reason.toLowerCase().includes(search);
        const matchWeek = week === 'All' || d.week === week;
        const matchShip = ship === 'All' || d.vessel === ship;
        const matchType = type === 'All' || d.failure_type === type;
        return matchSearch && matchWeek && matchShip && matchType;
    });

    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = document.querySelector('#logTable tbody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    pageData.forEach(d => {
        const row = document.createElement('tr');
        const badgeClass = badgeClasses[d.failure_type] || 'other';
        
        row.innerHTML = `
            <td>${d.week}</td>
            <td>${d.date}</td>
            <td style="font-weight: 600">${d.vessel}</td>
            <td>${d.report_type}</td>
            <td><span class="badge ${badgeClass}">${d.failure_type}</span></td>
            <td style="max-width: 400px; color: var(--text-muted)">${d.reason}</td>
        `;
        tbody.appendChild(row);
    });

    updatePagination();
}

function updatePagination() {
    const total = filteredData.length;
    const maxPage = Math.ceil(total / rowsPerPage) || 1;
    
    if (currentPage > maxPage) currentPage = maxPage;
    
    const start = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, total);

    document.getElementById('pageInfo').textContent = `Showing ${start} to ${end} of ${total} records`;
    document.getElementById('pageNumber').textContent = `${currentPage} / ${maxPage}`;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === maxPage;
}
