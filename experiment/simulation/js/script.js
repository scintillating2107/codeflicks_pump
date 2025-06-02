// Constants
const GRAVITY = 9.81; // m/s²
const WATER_DENSITY = 1000; // kg/m³

// Global chart variables
let efficiencyHeadChart;
let powerTimeChart;
let dischargeRpmChart;

// Welcome Modal
const modal = document.getElementById('welcomeModal');
const startSimulationBtn = document.getElementById('startSimulationBtn');

// Voice Assistant
const instructions = `To start this experiment you need to select some input parameter.
First select the voltage and current.
Then select the motor Rotations per minute.
Also select the Volume, Time and Head.
After this press Start to start the working of pump. After the working is completed, the pump will stop by itself and the output will be recorded which is visible in the result section table and also the graphs. You can also export PDF of the output by pressing Export PDF Button.`;

let speechSynthesis = window.speechSynthesis;
let speaking = false;
const voiceAssistBtn = document.getElementById('voiceAssistBtn');

function updateVoiceButton(isSpeaking) {
    if (isSpeaking) {
        voiceAssistBtn.classList.add('speaking');
        voiceAssistBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Stop Voice Assistant';
    } else {
        voiceAssistBtn.classList.remove('speaking');
        voiceAssistBtn.innerHTML = '<i class="fas fa-volume-up"></i> Start Voice Assistant';
    }
}

function speakInstructions() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        speaking = false;
        updateVoiceButton(false);
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(instructions);
    utterance.rate = 0.9; // Slightly slower rate for better clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Get available voices and select an English voice
    let voices = speechSynthesis.getVoices();
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
    if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
    }
    
    speechSynthesis.speak(utterance);
    speaking = true;
    updateVoiceButton(true);
    
    utterance.onend = () => {
        speaking = false;
        updateVoiceButton(false);
    };
}

// Initialize voice when voices are loaded
speechSynthesis.onvoiceschanged = () => {
    let voices = speechSynthesis.getVoices();
};

// Voice assistant button click handler
voiceAssistBtn.addEventListener('click', speakInstructions);

// Handle modal close
startSimulationBtn.addEventListener('click', () => {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        speaking = false;
        updateVoiceButton(false);
    }
    modal.style.display = 'none';
    // Initialize simulation after modal is closed
    initializeCharts();
    drawPump();
});

// Colors
const COLORS = {
    background: '#F8F9FA',
    pumpBody: '#FFFFFF',
    pumpStroke: '#212529',
    waterFlow: '#17A2B8',
    labelBg: '#FFFFFF',
    labelText: '#212529',
    labelBorder: '#DEE2E6',
    accent: '#007BFF',
    accentSecondary: '#17A2B8',
    buttonStart: '#28A745',
    tableHeader: '#E9ECEF'
};

// Get DOM elements
const canvas = document.getElementById('pumpCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

// Input elements
const voltageInput = document.getElementById('voltage');
const currentInput = document.getElementById('current');
const rpmInput = document.getElementById('rpm');
const durationInput = document.getElementById('duration');
const volumeInput = document.getElementById('volume');
const headInput = document.getElementById('head');

// Display elements
const voltageValue = document.getElementById('voltageValue');
const currentValue = document.getElementById('currentValue');
const rpmValue = document.getElementById('rpmValue');
const headValue = document.getElementById('headValue');

// Simulation state
let isSimulationRunning = false;
let animationFrameId = null;
let rotationAngle = 0;
let simulationStartTime = 0;
let results = [];

// Update display values when inputs change
voltageInput.addEventListener('input', () => {
    voltageValue.textContent = voltageInput.value + 'V';
});

currentInput.addEventListener('input', () => {
    currentValue.textContent = currentInput.value + 'A';
});

rpmInput.addEventListener('input', () => {
    rpmValue.textContent = rpmInput.value + ' RPM';
});

headInput.addEventListener('input', () => {
    headValue.textContent = headInput.value + 'm';
});

// Draw pump components
function drawPump() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Center point of the pump
    const centerX = 400;
    const centerY = 300;
    const scale = 1.6;
    
    // Draw pump body
    ctx.strokeStyle = COLORS.pumpStroke;
    ctx.lineWidth = 4;
    
    // Draw inlet pipe with flange
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 60 * scale);
    ctx.lineTo(centerX, centerY + 150 * scale);
    ctx.stroke();
    
    // Draw inlet flange
    ctx.beginPath();
    ctx.moveTo(centerX - 25 * scale, centerY + 150 * scale);
    ctx.lineTo(centerX + 25 * scale, centerY + 150 * scale);
    ctx.stroke();
    
    // Draw outlet pipe with flange
    ctx.beginPath();
    ctx.moveTo(centerX + 100 * scale, centerY);
    ctx.lineTo(centerX + 100 * scale, centerY - 150 * scale);
    ctx.stroke();
    
    // Draw outlet flange
    ctx.beginPath();
    ctx.moveTo(centerX + 85 * scale, centerY - 150 * scale);
    ctx.lineTo(centerX + 115 * scale, centerY - 150 * scale);
    ctx.stroke();
    
    // Draw volute casing with gradient
    const gradient = ctx.createLinearGradient(
        centerX - 100 * scale,
        centerY - 100 * scale,
        centerX + 100 * scale,
        centerY + 100 * scale
    );
    gradient.addColorStop(0, COLORS.pumpBody);
    gradient.addColorStop(1, COLORS.labelBorder);
    
    ctx.beginPath();
    ctx.strokeStyle = COLORS.pumpStroke;
    ctx.fillStyle = gradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100 * scale, Math.PI * 0.5, Math.PI * 2);
    ctx.lineTo(centerX + 100 * scale, centerY);
    ctx.lineTo(centerX + 100 * scale, centerY - 150 * scale);
    ctx.stroke();
    ctx.fill();
    
    // Draw the eye (inlet)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40 * scale, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw impeller
    drawImpeller(centerX, centerY, scale);
    
    // Draw labels
    drawLabels(centerX, centerY, scale);
    
    // Draw water flow
    if (isSimulationRunning) {
        drawWaterFlow(centerX, centerY, scale);
    } else {
        drawFlowDirectionArrows(centerX, centerY, scale);
    }
}

// Draw impeller
function drawImpeller(centerX, centerY, scale) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    
    // Draw drive shaft
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.pumpStroke;
    ctx.fill();
    
    // Draw curved impeller vanes
    const vaneGradient = ctx.createLinearGradient(-45 * scale, 0, 45 * scale, 0);
    vaneGradient.addColorStop(0, COLORS.pumpStroke);
    vaneGradient.addColorStop(1, COLORS.labelBorder);
    ctx.strokeStyle = vaneGradient;
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.arc(30 * scale, 0, 45 * scale, Math.PI, Math.PI * 1.5, false);
        ctx.stroke();
    }
    ctx.restore();
}

// Draw labels
function drawLabels(centerX, centerY, scale) {
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    function drawLabel(text, x, y) {
        const metrics = ctx.measureText(text);
        const padding = 8;
        const height = 24;
        
        // Draw label background with rounded corners
        ctx.fillStyle = COLORS.labelBg;
        ctx.beginPath();
        ctx.roundRect(
            x - metrics.width/2 - padding,
            y - height/2,
            metrics.width + padding * 2,
            height,
            5
        );
        ctx.fill();
        
        // Draw label border
        ctx.strokeStyle = COLORS.labelBorder;
        ctx.beginPath();
        ctx.roundRect(
            x - metrics.width/2 - padding,
            y - height/2,
            metrics.width + padding * 2,
            height,
            5
        );
        ctx.stroke();
        
        // Draw text
        ctx.fillStyle = COLORS.labelText;
        ctx.fillText(text, x, y + 6);
    }
    
    drawLabel('Inlet/Suction', centerX, centerY + 170 * scale);
    drawLabel('Outlet/Discharge', centerX + 100 * scale, centerY - 170 * scale);
    drawLabel('Volute Chamber', centerX + 70 * scale, centerY - 50 * scale);
    drawLabel('Drive Shaft', centerX - 70 * scale, centerY);
    drawLabel('Eye', centerX, centerY + 80 * scale);
}

// Draw water flow
function drawWaterFlow(centerX, centerY, scale) {
    const time = Date.now() - simulationStartTime;
    const flowOffset = (time / 100) % 20;
    
    ctx.strokeStyle = COLORS.waterFlow;
    ctx.fillStyle = COLORS.waterFlow;
    ctx.lineWidth = 4;
    
    // Apply flow animation
    ctx.globalAlpha = 0.6 + Math.sin(time / 500) * 0.4;
    
    // Draw inlet flow
    for (let y = centerY + 150 * scale; y > centerY + 60 * scale; y -= 20 * scale) {
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, y - 15 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX - 8 * scale, y);
        ctx.lineTo(centerX, y - 15 * scale);
        ctx.lineTo(centerX + 8 * scale, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw spiral flow
    ctx.save();
    ctx.translate(centerX, centerY);
    for (let angle = 0; angle < Math.PI * 1.5; angle += Math.PI / 8) {
        const radius = (60 + angle * 20 / Math.PI) * scale;
        const x = Math.cos(angle + flowOffset/50) * radius;
        const y = Math.sin(angle + flowOffset/50) * radius;
        
        const nextAngle = angle + 0.1;
        const nextRadius = (60 + nextAngle * 20 / Math.PI) * scale;
        const nextX = Math.cos(nextAngle + flowOffset/50) * nextRadius;
        const nextY = Math.sin(nextAngle + flowOffset/50) * nextRadius;
        
        const dx = nextX - x;
        const dy = nextY - y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const normalizedDx = dx / length * 20 * scale;
        const normalizedDy = dy / length * 20 * scale;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + normalizedDx, y + normalizedDy);
        ctx.stroke();
        
        const arrowSize = 7 * scale;
        const angle1 = Math.atan2(dy, dx) + Math.PI * 0.8;
        const angle2 = Math.atan2(dy, dx) - Math.PI * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(x + normalizedDx, y + normalizedDy);
        ctx.lineTo(x + normalizedDx + Math.cos(angle1) * arrowSize,
                  y + normalizedDy + Math.sin(angle1) * arrowSize);
        ctx.lineTo(x + normalizedDx + Math.cos(angle2) * arrowSize,
                  y + normalizedDy + Math.sin(angle2) * arrowSize);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    
    // Reset global alpha
    ctx.globalAlpha = 1;
    
    // Draw outlet flow
    for (let y = centerY; y > centerY - 150 * scale; y -= 20 * scale) {
        ctx.beginPath();
        ctx.moveTo(centerX + 100 * scale, y);
        ctx.lineTo(centerX + 100 * scale, y - 15 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 92 * scale, y);
        ctx.lineTo(centerX + 100 * scale, y - 15 * scale);
        ctx.lineTo(centerX + 108 * scale, y);
        ctx.closePath();
        ctx.fill();
    }
}

// Draw flow direction arrows
function drawFlowDirectionArrows(centerX, centerY, scale) {
    ctx.fillStyle = COLORS.waterFlow;
    
    // Inlet arrow
    ctx.beginPath();
    ctx.moveTo(centerX - 10 * scale, centerY + 120 * scale);
    ctx.lineTo(centerX, centerY + 100 * scale);
    ctx.lineTo(centerX + 10 * scale, centerY + 120 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Outlet arrow
    ctx.beginPath();
    ctx.moveTo(centerX + 90 * scale, centerY - 120 * scale);
    ctx.lineTo(centerX + 100 * scale, centerY - 140 * scale);
    ctx.lineTo(centerX + 110 * scale, centerY - 120 * scale);
    ctx.closePath();
    ctx.fill();
}

// Initialize charts
function initializeCharts() {
    // Clear any existing charts
    if (efficiencyHeadChart) efficiencyHeadChart.destroy();
    if (powerTimeChart) powerTimeChart.destroy();
    if (dischargeRpmChart) dischargeRpmChart.destroy();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: COLORS.labelBorder
                },
                ticks: {
                    color: COLORS.labelText
                }
            },
            x: {
                grid: {
                    color: COLORS.labelBorder
                },
                ticks: {
                    color: COLORS.labelText
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: COLORS.labelText
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                },
                padding: 10,
                cornerRadius: 6,
                displayColors: false
            }
        },
        interaction: {
            intersect: true,
            mode: 'nearest'
        }
    };

    // Initialize each chart with appropriate options
    efficiencyHeadChart = new Chart(
        document.getElementById('efficiencyHeadChart'),
        {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Efficiency vs Head',
                    data: [],
                    borderColor: COLORS.accent,
                    backgroundColor: COLORS.accent,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                ...chartOptions,
                scales: {
                    y: {
                        ...chartOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Efficiency (%)',
                            color: COLORS.labelText
                        }
                    },
                    x: {
                        ...chartOptions.scales.x,
                        title: {
                            display: true,
                            text: 'Head (m)',
                            color: COLORS.labelText
                        }
                    }
                },
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return `Head: ${context.parsed.x.toFixed(2)}m, Efficiency: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                }
            }
        }
    );

    powerTimeChart = new Chart(
        document.getElementById('powerTimeChart'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Output Power',
                    data: [],
                    borderColor: COLORS.buttonStart,
                    backgroundColor: COLORS.buttonStart,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                ...chartOptions,
                scales: {
                    y: {
                        ...chartOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Output Power (W)',
                            color: COLORS.labelText
                        }
                    },
                    x: {
                        ...chartOptions.scales.x,
                        title: {
                            display: true,
                            text: 'Time (s)',
                            color: COLORS.labelText
                        }
                    }
                },
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return `Time: ${context.label}s, Power: ${context.parsed.y.toFixed(2)}W`;
                            }
                        }
                    }
                }
            }
        }
    );

    dischargeRpmChart = new Chart(
        document.getElementById('dischargeRpmChart'),
        {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Discharge vs RPM',
                    data: [],
                    borderColor: COLORS.accentSecondary,
                    backgroundColor: COLORS.accentSecondary,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                ...chartOptions,
                scales: {
                    y: {
                        ...chartOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Discharge (L/s)',
                            color: COLORS.labelText
                        }
                    },
                    x: {
                        ...chartOptions.scales.x,
                        title: {
                            display: true,
                            text: 'RPM',
                            color: COLORS.labelText
                        }
                    }
                },
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return `RPM: ${context.parsed.x.toFixed(0)}, Discharge: ${context.parsed.y.toFixed(2)}L/s`;
                            }
                        }
                    }
                }
            }
        }
    );
}

// Calculate simulation results
function calculateResults() {
    const voltage = parseFloat(voltageInput.value);
    const current = parseFloat(currentInput.value);
    const duration = parseFloat(durationInput.value);
    const volume = parseFloat(volumeInput.value);
    const head = parseFloat(headInput.value);
    
    // Calculate parameters
    const discharge = volume / duration; // L/s
    const inputPower = voltage * current; // Watts
    const outputPower = WATER_DENSITY * GRAVITY * (discharge/1000) * head; // Watts
    const efficiency = (outputPower / inputPower) * 100;
    
    return {
        voltage,
        current,
        duration,
        volume,
        discharge: discharge.toFixed(2),
        head: head.toFixed(2),
        inputPower: inputPower.toFixed(2),
        outputPower: outputPower.toFixed(2),
        efficiency: efficiency.toFixed(2)
    };
}

// Add result to table and update charts
function addResultToTable(result) {
    const resultsBody = document.getElementById('resultsBody');
    const row = document.createElement('tr');
    
    const values = [
        result.voltage,
        result.current,
        result.duration,
        result.volume,
        result.discharge,
        result.head,
        result.inputPower,
        result.outputPower,
        result.efficiency
    ];
    
    values.forEach(value => {
        const td = document.createElement('td');
        td.textContent = value;
        row.appendChild(td);
    });
    
    resultsBody.appendChild(row);
    results.push(result);

    // Update charts with new data
    efficiencyHeadChart.data.datasets[0].data.push({
        x: parseFloat(result.head),
        y: parseFloat(result.efficiency)
    });
    efficiencyHeadChart.update();

    const timeLabels = powerTimeChart.data.labels;
    const currentTime = timeLabels.length > 0 ? 
        Math.max(...timeLabels) + parseInt(result.duration) : 
        parseInt(result.duration);
    
    powerTimeChart.data.labels.push(currentTime);
    powerTimeChart.data.datasets[0].data.push(parseFloat(result.outputPower));
    powerTimeChart.update();

    dischargeRpmChart.data.datasets[0].data.push({
        x: parseFloat(rpmInput.value),
        y: parseFloat(result.discharge)
    });
    dischargeRpmChart.update();
}

// Animation loop
function animate() {
    rotationAngle += (parseFloat(rpmInput.value) / 60) * (Math.PI / 30);
    drawPump();
    
    if (isSimulationRunning) {
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Start simulation
function startSimulation() {
    isSimulationRunning = true;
    simulationStartTime = Date.now();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // Start animation
    animate();
    
    // Set timeout to stop simulation after duration
    setTimeout(() => {
        stopSimulation();
        const result = calculateResults();
        addResultToTable(result);
    }, parseFloat(durationInput.value) * 1000);
}

// Stop simulation
function stopSimulation() {
    isSimulationRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// Reset simulation
function resetSimulation() {
    stopSimulation();
    rotationAngle = 0;
    drawPump();
    document.getElementById('resultsBody').innerHTML = '';
    results = [];

    // Reset charts
    efficiencyHeadChart.data.datasets[0].data = [];
    powerTimeChart.data.labels = [];
    powerTimeChart.data.datasets[0].data = [];
    dischargeRpmChart.data.datasets[0].data = [];
    
    efficiencyHeadChart.update();
    powerTimeChart.update();
    dischargeRpmChart.update();
}

// Export results to PDF
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Centrifugal Pump Simulation Report', pageWidth/2, 20, { align: 'center' });
    
    // Add timestamp
    doc.setFontSize(12);
    const timestamp = new Date().toLocaleString();
    doc.text(`Generated on: ${timestamp}`, pageWidth/2, 30, { align: 'center' });
    
    // Add results table
    doc.setFontSize(14);
    doc.text('Simulation Results', 14, 45);
    
    // Convert results array to format needed by autoTable
    const tableData = results.map(result => [
        result.voltage,
        result.current,
        result.duration,
        result.volume,
        result.discharge,
        result.head,
        result.inputPower,
        result.outputPower,
        result.efficiency
    ]);
    
    // Add table
    doc.autoTable({
        head: [[
            'Voltage (V)',
            'Current (A)',
            'Time (s)',
            'Volume (L)',
            'Discharge (L/s)',
            'Head (m)',
            'Input Power (W)',
            'Output Power (W)',
            'Efficiency (%)'
        ]],
        body: tableData,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [0, 123, 255] },
        styles: { fontSize: 8 },
        columnStyles: { 
            0: { cellWidth: 20 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 22 },
            5: { cellWidth: 20 },
            6: { cellWidth: 22 },
            7: { cellWidth: 22 },
            8: { cellWidth: 22 }
        }
    });
    
    // Add graphs
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Simulation Graphs', 14, 20);
    
    // Convert canvas elements to images
    const graphs = [
        'efficiencyHeadChart',
        'powerTimeChart',
        'dischargeRpmChart'
    ];
    
    let yOffset = 30;
    for (const graphId of graphs) {
        const canvas = document.getElementById(graphId);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 14, yOffset, 180, 70);
        yOffset += 90;
    }
    
    // Save the PDF
    doc.save('pump-simulation-report.pdf');
}

// Event listeners
startBtn.addEventListener('click', startSimulation);
stopBtn.addEventListener('click', stopSimulation);
resetBtn.addEventListener('click', resetSimulation);
document.getElementById('exportPdf').addEventListener('click', exportPDF);

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    drawPump();
}); 