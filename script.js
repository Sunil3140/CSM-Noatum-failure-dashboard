const colors = {
    'Aux Engine Validation': '#0D9488',     // Teal
    'SFOC out of range': '#2563EB',        // Blue
    'Reporting Gap (Rule 7)': '#9333EA',   // Purple
    'SCOC below range': '#D97706',         // Amber/Yellow
    'SCOC above range': '#EA580C'          // Orange/Red
};

const badgeClasses = {
    'Aux Engine Validation': 'aux',
    'SFOC out of range': 'sfoc',
    'Reporting Gap (Rule 7)': 'rule7',
    'SCOC below range': 'scoc',
    'SCOC above range': 'scoc-above'
};

let rawData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

let isMonthly = false;
let chart1 = null;
let chart2 = null;
let chartDoughnut = null;

const weekLabels = {
    'Week 1': 'Week 1 (25 May–31 May)',
    'Week 2': 'Week 2 (01 Jun–07 Jun)',
    'Week 3': 'Week 3 (08 Jun–15 Jun)',
    'Week 4': 'Week 4 (16 Jun–22 Jun)',
    'Month 1': 'Month 1 (25 May–22 Jun)'
};

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
    populateVesselFilter();
    populateWeekFilter();
    setupEventListeners();
    updateDashboardView();
}

// Populate Week Filter options dynamically based on Weekly/Monthly view
function populateWeekFilter() {
    const weekFilter = document.getElementById('weekFilter');
    weekFilter.innerHTML = '';
    
    if (isMonthly) {
        weekFilter.innerHTML = `
            <option value="All">All Months</option>
            <option value="Month 1">Month 1</option>
        `;
    } else {
        weekFilter.innerHTML = `
            <option value="All">All Weeks</option>
            <option value="Week 1">Week 1</option>
            <option value="Week 2">Week 2</option>
            <option value="Week 3">Week 3</option>
            <option value="Week 4">Week 4</option>
        `;
    }
}

// Populate Vessel Filter options dynamically
function populateVesselFilter() {
    const ships = [...new Set(rawData.map(d => d.vessel))].sort();
    const shipFilter = document.getElementById('shipFilter');
    shipFilter.innerHTML = '<option value="All">All Vessels</option>';
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

    // View Toggle Button handlers
    const weeklyBtn = document.getElementById('weeklyToggleBtn');
    const monthlyBtn = document.getElementById('monthlyToggleBtn');

    weeklyBtn.addEventListener('click', () => {
        if (isMonthly) {
            isMonthly = false;
            weeklyBtn.classList.add('active');
            monthlyBtn.classList.remove('active');
            populateWeekFilter();
            applyFilters();
        }
    });

    monthlyBtn.addEventListener('click', () => {
        if (!isMonthly) {
            isMonthly = true;
            monthlyBtn.classList.add('active');
            weeklyBtn.classList.remove('active');
            populateWeekFilter();
            applyFilters();
        }
    });

    // Download PDF handler
    document.getElementById('downloadPdf').addEventListener('click', () => {
        generateFleetDeviationPDF(filteredData);
    });
}

function generateFleetDeviationPDF(filteredData) {
    console.log(window.jspdf);
    const { jsPDF } = window.jspdf;
    console.log(jsPDF);
    
    // Create a new document in landscape mode
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    console.log(doc);
    
    // Format date and time
    const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const datePart = new Date().toLocaleDateString('en-GB', dateOptions);
    const timePart = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const generatedStr = `Generated: ${datePart}, ${timePart}`;

    // Get filter values
    const searchVal = document.getElementById('searchInput').value.trim();
    const weekVal = document.getElementById('weekFilter').value;
    const shipVal = document.getElementById('shipFilter').value;
    const typeVal = document.getElementById('typeFilter').value;

    const activeFilters = [];
    if (searchVal) activeFilters.push(`Search: "${searchVal}"`);
    if (weekVal !== 'All') {
        const displayWeek = weekLabels[weekVal] || weekVal;
        activeFilters.push(`Week: ${displayWeek}`);
    }
    if (shipVal !== 'All') activeFilters.push(`Vessel: ${shipVal}`);
    if (typeVal !== 'All') activeFilters.push(`Deviation Type: ${typeVal}`);

    const filtersStr = `Filters: ${activeFilters.length > 0 ? activeFilters.join(' | ') : 'All records (no filters applied)'}`;
    const totalStr = `Total records: ${filteredData.length}`;

    // Draw Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.text("Fleet Deviation Tracker — CSM Noatum", 14, 16);

    // Draw Subtitle / Meta information
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // #475569
    doc.text(generatedStr, 14, 22);
    doc.text(filtersStr, 14, 26);
    doc.text(totalStr, 14, 30);

    // Draw horizontal divider line
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.setLineWidth(0.5);
    doc.line(14, 34, 283, 34);

    // Prepare table rows
    const tableRows = filteredData.length === 0 
        ? [['-', '-', '-', '-', '-', 'No records matching the selected filters found.']]
        : filteredData.map(d => {
            const weekText = isMonthly ? 'Month 1' : d.week;
            const ftypesText = (d.failure_types || []).join(', ');
            return [
                weekText,
                d.date,
                d.vessel,
                d.report_type,
                ftypesText,
                d.reason
            ];
        });

    // Generate table directly using jsPDF-AutoTable
    doc.autoTable({
        head: [['WEEK', 'DATE', 'VESSEL', 'REPORT TYPE', 'DEVIATION TYPES', 'REASON']],
        body: tableRows,
        startY: 38,
        margin: { top: 20, right: 14, bottom: 18, left: 14 },
        theme: 'striped',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            lineColor: [226, 232, 240], // #E2E8F0
            lineWidth: 0.1,
            valign: 'top',
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [26, 86, 173], // Professional blue #1A56AD
            textColor: [255, 255, 255],
            fontSize: 9.5,
            fontStyle: 'bold',
            cellPadding: 4
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // #F8FAFC
        },
        columnStyles: {
            0: { cellWidth: 22 }, // Week
            1: { cellWidth: 25 }, // Date
            2: { cellWidth: 38, fontStyle: 'bold' }, // Vessel
            3: { cellWidth: 30 }, // Report Type
            4: { cellWidth: 44 }, // Deviation Types
            5: { cellWidth: 'auto' } // Reason (takes remaining space)
        }
    });

    // Add footer on every page after table generation is complete
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // #94A3B8
        
        // Left footer
        doc.text("Fleet Optimization Deviation Tracker", 14, 202);
        
        // Right footer
        const pageText = `Page ${i} of ${totalPages}`;
        const textWidth = doc.getTextWidth(pageText);
        doc.text(pageText, 283 - textWidth, 202);
    }

    // Save PDF
    doc.save('Fleet_Deviation_Report.pdf');
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const weekVal = document.getElementById('weekFilter').value;
    const shipVal = document.getElementById('shipFilter').value;
    const typeVal = document.getElementById('typeFilter').value;

    filteredData = rawData.filter(d => {
        const matchSearch = d.vessel.toLowerCase().includes(search) || d.reason.toLowerCase().includes(search);
        
        let matchWeek = true;
        if (weekVal !== 'All') {
            if (isMonthly) {
                // If Monthly view and 'Month 1' selected, it matches all since they are Month 1
                matchWeek = true;
            } else {
                matchWeek = d.week === weekVal;
            }
        }
        
        const matchShip = shipVal === 'All' || d.vessel === shipVal;
        const matchType = typeVal === 'All' || (d.failure_types && d.failure_types.includes(typeVal));
        
        return matchSearch && matchWeek && matchShip && matchType;
    });

    currentPage = 1;
    updateDashboardView();
}

function updateDashboardView() {
    renderSummaryCards();
    renderCharts();
    renderMatrix();
    renderTable();
}

function getActiveWeeks() {
    return isMonthly ? ['Month 1'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
}

function getProcessedFilteredData() {
    if (!isMonthly) return filteredData;
    return filteredData.map(d => ({ ...d, week: 'Month 1' }));
}

function renderSummaryCards() {
    const container = document.getElementById('summaryCardsContainer');
    container.innerHTML = '';
    const weeks = getActiveWeeks();
    const dataToUse = getProcessedFilteredData();

    weeks.forEach(w => {
        const dataForWeek = dataToUse.filter(d => d.week === w);
        
        // Count unique reports based on original row_id
        const uniqueReports = new Set(dataForWeek.map(d => d.row_id)).size;
        
        // Count unique vessels affected
        const uniqueVessels = new Set(dataForWeek.map(d => d.vessel)).size;

        const card = document.createElement('div');
        card.className = 'summary-card';
        
        card.innerHTML = `
            <div class="summary-week">${weekLabels[w] || w}</div>
            <div class="summary-records"><span>${uniqueReports}</span> records</div>
            <div class="summary-vessels">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21h20M19.3 14.8C21.1 13.5 22 11.7 22 10c0-1.7-.9-3.5-2.7-4.8L12 1.3 4.7 5.2C2.9 6.5 2 8.3 2 10c0 1.7.9 3.5 2.7 4.8L12 19.7z"/></svg>
                ${uniqueVessels} vessels affected
            </div>
        `;
        container.appendChild(card);
    });
}

function renderCharts() {
    if (chart1) chart1.destroy();
    if (chart2) chart2.destroy();
    if (chartDoughnut) chartDoughnut.destroy();

    const weeks = getActiveWeeks();
    const dataToUse = getProcessedFilteredData();

    // Chart 1: Fleet_Deviations(Bar) vs Unique Ships (Line) - calculated from unique reports (row_id)
    const barData1 = weeks.map(w => {
        const dataForWeek = dataToUse.filter(d => d.week === w);
        return new Set(dataForWeek.map(d => d.row_id)).size;
    });

    const lineData1 = weeks.map(w => {
        const dataForWeek = dataToUse.filter(d => d.week === w);
        return new Set(dataForWeek.map(d => d.vessel)).size;
    });

    const ctx1 = document.getElementById('barChart1').getContext('2d');
    chart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: weeks.map(w => w === 'Month 1' ? 'Month 1' : w),
            datasets: [
                {
                    label: 'Total Deviations',
                    data: barData1,
                    backgroundColor: '#3B82F6',
                    borderRadius: 4,
                    order: 2
                },
                {
                    label: 'Unique Ships',
                    data: lineData1,
                    type: 'line',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    pointBackgroundColor: '#EF4444',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2D3748' },
                    ticks: { color: '#A0AEC0', font: { family: 'Inter' } },
                    title: { display: true, text: 'No. of deviations', color: '#A0AEC0', font: { family: 'Inter', size: 11 } }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#A0AEC0', font: { family: 'Inter' } },
                    title: { display: true, text: 'No. of ships', color: '#A0AEC0', font: { family: 'Inter', size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#A0AEC0', font: { family: 'Inter' } },
                    title: { display: true, text: 'No. of vessels', color: '#A0AEC0', font: { family: 'Inter', size: 11 } }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: '#E2E8F0',
                        font: { family: 'Inter', size: 11 },
                        boxWidth: 10,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            const label = context[0].label;
                            return weekLabels[label] || label;
                        },
                        label: function(context) {
                            return `${context.dataset.label} : ${context.raw}`;
                        }
                    }
                }
            }
        }
    });

    // Chart 2: Stacked Deviation Types - calculated from unsplit records containing each type
    const fTypes = Object.keys(colors);
    const datasets2 = fTypes.map(type => {
        return {
            label: type,
            data: weeks.map(w => {
                let count = 0;
                dataToUse.filter(d => d.week === w).forEach(d => {
                    if (d.failure_types && d.failure_types.includes(type)) {
                        count++;
                    }
                });
                return count;
            }),
            backgroundColor: colors[type],
            stacked: true
        };
    });

    const ctx2 = document.getElementById('barChart2').getContext('2d');
    chart2 = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: weeks.map(w => w === 'Month 1' ? 'Month 1' : w),
            datasets: datasets2
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: '#A0AEC0', font: { family: 'Inter' } },
                    title: { display: true, text: 'No. of vessels', color: '#A0AEC0', font: { family: 'Inter', size: 11 } }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: '#2D3748' },
                    ticks: { color: '#A0AEC0', font: { family: 'Inter' } },
                    title: { display: true, text: 'No. of deviations', color: '#A0AEC0', font: { family: 'Inter', size: 11 } }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: '#E2E8F0',
                        font: { family: 'Inter', size: 10 },
                        boxWidth: 10
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            const label = context[0].label;
                            return weekLabels[label] || label;
                        },
                        label: function(context) {
                            return `${context.dataset.label} : ${context.raw}`;
                        }
                    }
                }
            }
        }
    });

    // Chart 3: Doughnut Chart (Aggregate Profile)
    const typeCounts = {};
    fTypes.forEach(t => typeCounts[t] = 0);
    dataToUse.forEach(d => {
        if (d.failure_types) {
            d.failure_types.forEach(t => {
                if (typeCounts[t] !== undefined) {
                    typeCounts[t]++;
                }
            });
        }
    });

    const dData = fTypes.map(t => typeCounts[t]);
    const totalRecords = dataToUse.length;
    document.getElementById('aggregateSubtitle').innerText = `All 4 weeks combined (${totalRecords} records)`;

    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    chartDoughnut = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: fTypes,
            datasets: [{
                data: dData,
                backgroundColor: fTypes.map(t => colors[t]),
                borderWidth: 0,
                cutout: '75%'
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
    legendContainer.innerHTML = '';
    
    fTypes.forEach(t => {
        const count = typeCounts[t];
        const pct = totalRecords === 0 ? 0 : Math.round((count / totalRecords) * 100);
        
        legendContainer.innerHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${colors[t]}"></div>
                <span style="flex: 1">${t}</span>
                <span style="font-weight: 600; text-align: right; min-width: 35px;">${pct}%</span>
            </div>
        `;
    });
}

function renderMatrix() {
    const weeks = getActiveWeeks();
    const dataToUse = getProcessedFilteredData();
    const shipStats = {};

    // Calculate unsplit records (unique reports by row_id) per vessel per week
    dataToUse.forEach(d => {
        if (!shipStats[d.vessel]) {
            shipStats[d.vessel] = { total: 0, rowIdsByWeek: {} };
            weeks.forEach(w => shipStats[d.vessel].rowIdsByWeek[w] = new Set());
        }
        shipStats[d.vessel].rowIdsByWeek[d.week].add(d.row_id);
    });

    // Populate total unsplit records per vessel
    Object.keys(shipStats).forEach(ship => {
        let totalUnsplit = 0;
        weeks.forEach(w => {
            totalUnsplit += shipStats[ship].rowIdsByWeek[w].size;
        });
        shipStats[ship].total = totalUnsplit;
    });

    const sortedShips = Object.keys(shipStats).sort((a, b) => shipStats[b].total - shipStats[a].total);

    const tbody = document.querySelector('#matrixTable tbody');
    const theadRow = document.querySelector('#matrixTable thead tr');
    
    // Update header row dynamically based on weeks
    theadRow.innerHTML = '<th>VESSEL</th>' + weeks.map(w => `<th>${w}</th>`).join('') + '<th>TOTAL</th>';
    
    tbody.innerHTML = '';

    sortedShips.forEach(ship => {
        const row = document.createElement('tr');
        let html = `<td>${ship}</td>`;
        
        weeks.forEach(w => {
            const val = shipStats[ship].rowIdsByWeek[w].size;
            let bg = 'transparent';
            let displayVal = '-';
            
            if (val > 0) {
                displayVal = val;
                if (val >= 8) bg = 'var(--matrix-extreme)';
                else if (val >= 6) bg = 'var(--matrix-high)';
                else if (val >= 3) bg = 'var(--matrix-med)';
                else bg = 'var(--matrix-low)';
            }
            
            html += `<td style="background-color: ${bg}" class="matrix-cell">${displayVal}</td>`;
        });
        
        html += `<td style="font-weight: 600; background-color: rgba(255,255,255,0.02);">${shipStats[ship].total}</td>`;
        row.innerHTML = html;
        tbody.appendChild(row);
    });
}

function renderTable() {
    const tbody = document.querySelector('#logTable tbody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    pageData.forEach(d => {
        const row = document.createElement('tr');
        
        // Render all Deviation Type badges in a row
        const badgesHtml = (d.failure_types || []).map(t => {
            const badgeClass = badgeClasses[t] || 'other';
            return `<span class="badge ${badgeClass}">${t}</span>`;
        }).join('');
        
        row.innerHTML = `
            <td>${isMonthly ? 'Month 1' : d.week}</td>
            <td>${d.date}</td>
            <td style="font-weight: 600; color: #FFFFFF;">${d.vessel}</td>
            <td>${d.report_type}</td>
            <td><div style="display: flex; flex-wrap: wrap; gap: 4px;">${badgesHtml}</div></td>
            <td style="max-width: 450px; color: var(--text-muted); line-height: 1.4;">${d.reason}</td>
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
