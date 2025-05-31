// Constants
const GRAVITY = 9.81; // m/s²
const WATER_DENSITY = 1000; // kg/m³

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
const headLossInput = document.getElementById('headLoss');
const fluidDensityInput = document.getElementById('fluidDensity');

// Display elements
const voltageValue = document.getElementById('voltageValue');
const currentValue = document.getElementById('currentValue');
const rpmValue = document.getElementById('rpmValue');
const headLossValue = document.getElementById('headLossValue');

// Status displays
const currentRpmDisplay = document.getElementById('currentRpmDisplay');
const currentPowerDisplay = document.getElementById('currentPowerDisplay');
const currentEfficiencyDisplay = document.getElementById('currentEfficiencyDisplay');
const temperatureDisplay = document.getElementById('temperatureDisplay');
const runtimeDisplay = document.getElementById('runtimeDisplay');

// Simulation state
let isSimulationRunning = false;
let animationFrameId = null;
let rotationAngle = 0;
let simulationStartTime = 0;
let results = [];
let currentTemperature = 25;
let runtimeSeconds = 0;
let performanceChart = null;
let powerChart = null;
let chartUpdateInterval = null;

// Data recording features
let isRecording = false;
let recordedData = [];
let recordingInterval = null;
let dataRecordingFrequency = 1000; // Record every 1 second
let sessionId = null;

// Chart data arrays
let timeData = [];
let efficiencyData = [];
let powerData = [];
let dischageData = [];

// Update display values when inputs change
voltageInput.addEventListener('input', () => {
    voltageValue.textContent = voltageInput.value + 'V';
    updateRealTimeDisplays();
});

currentInput.addEventListener('input', () => {
    currentValue.textContent = currentInput.value + 'A';
    updateRealTimeDisplays();
});

rpmInput.addEventListener('input', () => {
    rpmValue.textContent = rpmInput.value;
    updateRealTimeDisplays();
});

headLossInput.addEventListener('input', () => {
    headLossValue.textContent = headLossInput.value + 'm';
});

// Data recording functions
function generateSessionId() {
    return 'pump_session_' + new Date().toISOString().replace(/[:.]/g, '-');
}

function startDataRecording() {
    if (!isRecording) {
        isRecording = true;
        sessionId = generateSessionId();
        recordedData = [];
        
        // Update UI
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.textContent = '⏹️ Stop Recording';
            recordBtn.classList.remove('btn-primary');
            recordBtn.classList.add('btn-danger');
        }
        
        // Start recording interval
        recordingInterval = setInterval(recordDataPoint, dataRecordingFrequency);
        
        console.log('Data recording started - Session ID:', sessionId);
    }
}

function stopDataRecording() {
    if (isRecording) {
        isRecording = false;
        
        // Update UI
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.textContent = '🔴 Start Recording';
            recordBtn.classList.remove('btn-danger');
            recordBtn.classList.add('btn-primary');
        }
        
        // Stop recording interval
        if (recordingInterval) {
            clearInterval(recordingInterval);
            recordingInterval = null;
        }
        
        // Auto-save to localStorage
        saveDataToLocalStorage();
        
        console.log('Data recording stopped. Total data points:', recordedData.length);
    }
}

function recordDataPoint() {
    if (!isRecording) return;
    
    const timestamp = new Date().toISOString();
    const currentTime = isSimulationRunning ? Math.round((Date.now() - simulationStartTime) / 1000) : 0;
    
    const dataPoint = {
        timestamp,
        sessionId,
        simulationTime: currentTime,
        isSimulationRunning,
        voltage: parseFloat(voltageInput.value),
        current: parseFloat(currentInput.value),
        rpm: parseFloat(rpmInput.value),
        volume: parseFloat(volumeInput.value),
        duration: parseFloat(durationInput.value),
        headLoss: parseFloat(headLossInput.value),
        fluidDensity: parseFloat(fluidDensityInput.value),
        discharge: parseFloat(volumeInput.value) / parseFloat(durationInput.value),
        totalHead: 10 + parseFloat(headLossInput.value),
        inputPower: parseFloat(voltageInput.value) * parseFloat(currentInput.value),
        outputPower: (parseFloat(fluidDensityInput.value) * GRAVITY * (parseFloat(volumeInput.value) / parseFloat(durationInput.value) / 1000) * (10 + parseFloat(headLossInput.value))),
        efficiency: calculateCurrentEfficiency(),
        temperature: currentTemperature,
        runtimeSeconds
    };
    
    recordedData.push(dataPoint);
    
    // Update recording status
    updateRecordingStatus();
}

function updateRecordingStatus() {
    const statusElement = document.getElementById('recordingStatus');
    if (statusElement && isRecording) {
        statusElement.textContent = `Recording: ${recordedData.length} data points`;
        statusElement.style.color = '#ef4444';
    } else if (statusElement) {
        statusElement.textContent = 'Not recording';
        statusElement.style.color = '#6b7280';
    }
}

// Data storage functions
function saveDataToLocalStorage() {
    try {
        const savedSessions = JSON.parse(localStorage.getItem('pumpSimulatorSessions') || '[]');
        
        const sessionData = {
            sessionId,
            startTime: recordedData.length > 0 ? recordedData[0].timestamp : new Date().toISOString(),
            endTime: recordedData.length > 0 ? recordedData[recordedData.length - 1].timestamp : new Date().toISOString(),
            dataPoints: recordedData.length,
            data: recordedData
        };
        
        savedSessions.push(sessionData);
        
        // Keep only last 10 sessions to prevent localStorage overflow
        if (savedSessions.length > 10) {
            savedSessions.splice(0, savedSessions.length - 10);
        }
        
        localStorage.setItem('pumpSimulatorSessions', JSON.stringify(savedSessions));
        
        // Update saved sessions list
        updateSavedSessionsList();
        
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    }
}

function loadSavedSessions() {
    try {
        return JSON.parse(localStorage.getItem('pumpSimulatorSessions') || '[]');
    } catch (error) {
        console.error('Error loading saved sessions:', error);
        return [];
    }
}

function updateSavedSessionsList() {
    const sessionsList = document.getElementById('savedSessionsList');
    if (!sessionsList) return;
    
    const sessions = loadSavedSessions();
    sessionsList.innerHTML = '';
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = '<p style="color: #6b7280; text-align: center;">No saved sessions</p>';
        return;
    }
    
    sessions.forEach((session, index) => {
        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'saved-session-item';
        sessionDiv.innerHTML = `
            <div class="session-info">
                <strong>${session.sessionId}</strong>
                <br>
                <small>Start: ${new Date(session.startTime).toLocaleString()}</small>
                <br>
                <small>Data Points: ${session.dataPoints}</small>
            </div>
            <div class="session-actions">
                <button class="btn-small btn-primary" onclick="exportSessionCSV(${index})">
                    <i class="fas fa-download"></i> CSV
                </button>
                <button class="btn-small btn-secondary" onclick="exportSessionJSON(${index})">
                    <i class="fas fa-file-code"></i> JSON
                </button>
                <button class="btn-small btn-danger" onclick="deleteSavedSession(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        sessionsList.appendChild(sessionDiv);
    });
}

function deleteSavedSession(index) {
    const sessions = loadSavedSessions();
    sessions.splice(index, 1);
    localStorage.setItem('pumpSimulatorSessions', JSON.stringify(sessions));
    updateSavedSessionsList();
}

// Data export functions
function exportCurrentDataAsCSV() {
    const data = recordedData.length > 0 ? recordedData : convertResultsToRecordedFormat();
    exportToCSV(data, sessionId || 'pump_data_' + new Date().toISOString().split('T')[0]);
}

function exportCurrentDataAsJSON() {
    const data = recordedData.length > 0 ? recordedData : convertResultsToRecordedFormat();
    exportToJSON(data, sessionId || 'pump_data_' + new Date().toISOString().split('T')[0]);
}

function exportSessionCSV(sessionIndex) {
    const sessions = loadSavedSessions();
    if (sessions[sessionIndex]) {
        exportToCSV(sessions[sessionIndex].data, sessions[sessionIndex].sessionId);
    }
}

function exportSessionJSON(sessionIndex) {
    const sessions = loadSavedSessions();
    if (sessions[sessionIndex]) {
        exportToJSON(sessions[sessionIndex].data, sessions[sessionIndex].sessionId);
    }
}

function convertResultsToRecordedFormat() {
    return results.map((result, index) => ({
        timestamp: new Date().toISOString(),
        sessionId: 'manual_export',
        simulationTime: index * parseFloat(durationInput.value),
        isSimulationRunning: false,
        voltage: result.voltage,
        current: result.current,
        rpm: parseFloat(rpmInput.value),
        volume: result.volume,
        duration: result.duration,
        headLoss: parseFloat(headLossInput.value),
        fluidDensity: parseFloat(fluidDensityInput.value),
        discharge: parseFloat(result.discharge),
        totalHead: parseFloat(result.head),
        inputPower: parseFloat(result.inputPower),
        outputPower: parseFloat(result.outputPower),
        efficiency: parseFloat(result.efficiency),
        temperature: result.temperature || 25,
        runtimeSeconds: index * parseFloat(durationInput.value)
    }));
}

function exportToCSV(data, filename) {
    if (data.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Create CSV headers
    const headers = [
        'Timestamp',
        'Session ID',
        'Simulation Time (s)',
        'Is Running',
        'Voltage (V)',
        'Current (A)',
        'RPM',
        'Volume (L)',
        'Duration (s)',
        'Head Loss (m)',
        'Fluid Density (kg/m³)',
        'Discharge (L/s)',
        'Total Head (m)',
        'Input Power (W)',
        'Output Power (W)',
        'Efficiency (%)',
        'Temperature (°C)',
        'Runtime (s)'
    ];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = [
            row.timestamp,
            row.sessionId,
            row.simulationTime,
            row.isSimulationRunning,
            row.voltage,
            row.current,
            row.rpm,
            row.volume,
            row.duration,
            row.headLoss,
            row.fluidDensity,
            row.discharge,
            row.totalHead,
            row.inputPower,
            row.outputPower,
            row.efficiency,
            row.temperature,
            row.runtimeSeconds
        ];
        csvContent += values.join(',') + '\n';
    });
    
    // Download file
    downloadFile(csvContent, filename + '.csv', 'text/csv');
}

function exportToJSON(data, filename) {
    if (data.length === 0) {
        alert('No data to export');
        return;
    }
    
    const exportData = {
        exportTimestamp: new Date().toISOString(),
        sessionId: sessionId,
        totalDataPoints: data.length,
        metadata: {
            simulator: 'Advanced Centrifugal Pump Simulator',
            version: '2.0',
            dataRecordingFrequency: dataRecordingFrequency
        },
        data: data
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, filename + '.json', 'application/json');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Import data function
function importDataFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.style.display = 'none';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                if (file.name.endsWith('.json')) {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (importedData.data && Array.isArray(importedData.data)) {
                        recordedData = importedData.data;
                        sessionId = importedData.sessionId || generateSessionId();
                        
                        // Update charts if simulation is not running
                        if (!isSimulationRunning) {
                            updateChartsFromImportedData();
                        }
                        
                        alert(`Successfully imported ${recordedData.length} data points from ${file.name}`);
                    } else {
                        alert('Invalid JSON format. Expected data array.');
                    }
                } else if (file.name.endsWith('.csv')) {
                    // Handle CSV import
                    alert('CSV import feature coming soon!');
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

function updateChartsFromImportedData() {
    if (recordedData.length === 0) return;
    
    timeData.length = 0;
    efficiencyData.length = 0;
    powerData.length = 0;
    dischageData.length = 0;
    
    recordedData.forEach(point => {
        timeData.push(point.simulationTime);
        efficiencyData.push(point.efficiency);
        powerData.push(point.inputPower);
        dischageData.push(point.discharge);
    });
    
    if (performanceChart) {
        performanceChart.update();
    }
    if (powerChart) {
        powerChart.update();
    }
}

// Update real-time displays
function updateRealTimeDisplays() {
    const voltage = parseFloat(voltageInput.value);
    const current = parseFloat(currentInput.value);
    const rpm = parseFloat(rpmInput.value);
    
    currentRpmDisplay.textContent = rpm;
    currentPowerDisplay.textContent = Math.round(voltage * current);
    
    // Calculate and display efficiency
    const efficiency = calculateCurrentEfficiency();
    currentEfficiencyDisplay.textContent = efficiency.toFixed(1);
}

// Calculate current efficiency
function calculateCurrentEfficiency() {
    const voltage = parseFloat(voltageInput.value);
    const current = parseFloat(currentInput.value);
    const volume = parseFloat(volumeInput.value);
    const duration = parseFloat(durationInput.value);
    const fluidDensity = parseFloat(fluidDensityInput.value);
    const headLoss = parseFloat(headLossInput.value);
    
    const discharge = volume / duration; // L/s
    const totalHead = 10 + headLoss; // Total dynamic head including losses
    const inputPower = voltage * current; // Watts
    const outputPower = (fluidDensity * GRAVITY * (discharge/1000) * totalHead); // Watts
    
    return inputPower > 0 ? (outputPower / inputPower) * 100 : 0;
}

// Initialize charts
function initializeCharts() {
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    const powerCtx = document.getElementById('powerChart').getContext('2d');
    
    // Performance Chart
    performanceChart = new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: timeData,
            datasets: [
                {
                    label: 'Efficiency (%)',
                    data: efficiencyData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Discharge (L/s)',
                    data: dischageData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time (s)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Efficiency (%)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Discharge (L/s)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
    
    // Power Chart
    powerChart = new Chart(powerCtx, {
        type: 'line',
        data: {
            labels: timeData,
            datasets: [
                {
                    label: 'Input Power (W)',
                    data: powerData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time (s)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Power (W)'
                    }
                }
            }
        }
    });
}

// Update charts with new data
function updateCharts() {
    if (!isSimulationRunning) return;
    
    const currentTime = Math.round((Date.now() - simulationStartTime) / 1000);
    const efficiency = calculateCurrentEfficiency();
    const voltage = parseFloat(voltageInput.value);
    const current = parseFloat(currentInput.value);
    const volume = parseFloat(volumeInput.value);
    const duration = parseFloat(durationInput.value);
    
    // Add new data points
    if (timeData.length === 0 || timeData[timeData.length - 1] !== currentTime) {
        timeData.push(currentTime);
        efficiencyData.push(efficiency);
        powerData.push(voltage * current);
        dischageData.push(volume / duration);
        
        // Limit data points to prevent memory issues
        const maxPoints = 100;
        if (timeData.length > maxPoints) {
            timeData.shift();
            efficiencyData.shift();
            powerData.shift();
            dischageData.shift();
        }
        
        // Update charts
        performanceChart.update('none');
        powerChart.update('none');
    }
}

// Simulate temperature based on operation
function updateTemperature() {
    if (isSimulationRunning) {
        const efficiency = calculateCurrentEfficiency();
        const powerLoss = parseFloat(voltageInput.value) * parseFloat(currentInput.value) * (1 - efficiency / 100);
        
        // Temperature increases based on power loss and efficiency
        const tempIncrease = (powerLoss / 1000) * 0.5; // Simplified thermal model
        currentTemperature = Math.min(currentTemperature + tempIncrease, 85); // Max 85°C
        
        temperatureDisplay.textContent = Math.round(currentTemperature);
        
        // Add visual warning if temperature is high
        if (currentTemperature > 70) {
            temperatureDisplay.style.color = '#ef4444';
        } else if (currentTemperature > 50) {
            temperatureDisplay.style.color = '#f59e0b';
        } else {
            temperatureDisplay.style.color = '#1f2937';
        }
    } else {
        // Cool down when not running
        currentTemperature = Math.max(currentTemperature - 0.2, 25);
        temperatureDisplay.textContent = Math.round(currentTemperature);
        temperatureDisplay.style.color = '#1f2937';
    }
}

// Enhanced pump drawing with better graphics
function drawPump() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Center point of the pump
    const centerX = 400;
    const centerY = 300;
    const scale = 1.6;
    
    // Draw pump base/foundation
    ctx.beginPath();
    ctx.fillStyle = '#374151';
    ctx.fillRect(centerX - 120 * scale, centerY + 120 * scale, 240 * scale, 20 * scale);
    ctx.fill();
    
    // Draw inlet pipe with gradient
    const inletGradient = ctx.createLinearGradient(centerX - 20 * scale, 0, centerX + 20 * scale, 0);
    inletGradient.addColorStop(0, '#6b7280');
    inletGradient.addColorStop(1, '#9ca3af');
    
    ctx.beginPath();
    ctx.fillStyle = inletGradient;
    ctx.fillRect(centerX - 15 * scale, centerY + 60 * scale, 30 * scale, 90 * scale);
    ctx.fill();
    
    // Draw outlet pipe with gradient
    const outletGradient = ctx.createLinearGradient(0, centerY - 20 * scale, 0, centerY + 20 * scale);
    outletGradient.addColorStop(0, '#6b7280');
    outletGradient.addColorStop(1, '#9ca3af');
    
    ctx.beginPath();
    ctx.fillStyle = outletGradient;
    ctx.fillRect(centerX + 85 * scale, centerY - 150 * scale, 30 * scale, 150 * scale);
    ctx.fill();
    
    // Draw volute casing with 3D effect
    const voluteGradient = ctx.createRadialGradient(centerX, centerY, 50 * scale, centerX, centerY, 120 * scale);
    voluteGradient.addColorStop(0, 'rgba(200, 220, 255, 0.8)');
    voluteGradient.addColorStop(1, 'rgba(100, 150, 255, 0.3)');
    
    ctx.beginPath();
    ctx.fillStyle = voluteGradient;
    ctx.arc(centerX, centerY, 100 * scale, Math.PI * 0.5, Math.PI * 2);
    ctx.lineTo(centerX + 100 * scale, centerY);
    ctx.lineTo(centerX + 100 * scale, centerY - 150 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Draw volute outline
    ctx.beginPath();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.arc(centerX, centerY, 100 * scale, Math.PI * 0.5, Math.PI * 2);
    ctx.lineTo(centerX + 100 * scale, centerY);
    ctx.lineTo(centerX + 100 * scale, centerY - 150 * scale);
    ctx.stroke();
    
    // Draw impeller housing (eye)
    ctx.beginPath();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.arc(centerX, centerY, 40 * scale, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw enhanced impeller
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    
    // Draw hub
    const hubGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 15);
    hubGradient.addColorStop(0, '#1f2937');
    hubGradient.addColorStop(1, '#374151');
    
    ctx.beginPath();
    ctx.fillStyle = hubGradient;
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw impeller blades with 3D effect
    const bladeGradient = ctx.createLinearGradient(-10, -10, 10, 10);
    bladeGradient.addColorStop(0, '#4b5563');
    bladeGradient.addColorStop(1, '#6b7280');
    
    ctx.strokeStyle = bladeGradient;
    ctx.lineWidth = 6;
    
    for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate(Math.PI / 4);
        
        // Draw curved blade
        ctx.beginPath();
        ctx.arc(25 * scale, 0, 35 * scale, Math.PI * 1.2, Math.PI * 1.7, false);
        ctx.stroke();
        
        // Add blade tip
        ctx.beginPath();
        ctx.fillStyle = '#374151';
        ctx.arc(55 * scale, -10 * scale, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    ctx.restore();
    
    // Draw enhanced labels with better styling
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    function drawEnhancedLabel(text, x, y, color = '#2563eb') {
        // Draw background
        const metrics = ctx.measureText(text);
        const padding = 8;
        const height = 28;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(x - metrics.width/2 - padding, y - height/2, metrics.width + padding * 2, height);
        
        // Draw border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - metrics.width/2 - padding, y - height/2, metrics.width + padding * 2, height);
        
        // Draw text
        ctx.fillStyle = color;
        ctx.fillText(text, x, y + 5);
    }
    
    drawEnhancedLabel('Suction', centerX, centerY + 180 * scale);
    drawEnhancedLabel('Discharge', centerX + 100 * scale, centerY - 180 * scale);
    drawEnhancedLabel('Volute', centerX + 80 * scale, centerY - 60 * scale);
    drawEnhancedLabel('Impeller', centerX - 80 * scale, centerY);
    
    // Draw performance indicators
    if (isSimulationRunning) {
        drawWaterFlow(centerX, centerY, scale);
        drawPerformanceIndicators(centerX, centerY, scale);
    } else {
        drawFlowDirectionArrows(centerX, centerY, scale);
    }
}

// Draw performance indicators
function drawPerformanceIndicators(centerX, centerY, scale) {
    const efficiency = calculateCurrentEfficiency();
    const rpm = parseFloat(rpmInput.value);
    
    // RPM indicator
    ctx.save();
    ctx.translate(centerX - 150 * scale, centerY - 100 * scale);
    
    // Draw RPM gauge background
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw RPM needle
    const rpmAngle = (rpm - 1000) / 2000 * Math.PI * 1.5 - Math.PI * 0.75;
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(rpmAngle) * 25, Math.sin(rpmAngle) * 25);
    ctx.stroke();
    
    // RPM label
    ctx.fillStyle = '#1f2937';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RPM', 0, 45);
    
    ctx.restore();
    
    // Efficiency indicator
    ctx.save();
    ctx.translate(centerX + 150 * scale, centerY - 100 * scale);
    
    // Draw efficiency gauge
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw efficiency arc
    const efficiencyAngle = efficiency / 100 * Math.PI * 1.5;
    ctx.beginPath();
    ctx.strokeStyle = efficiency > 70 ? '#10b981' : efficiency > 40 ? '#f59e0b' : '#ef4444';
    ctx.lineWidth = 4;
    ctx.arc(0, 0, 25, -Math.PI * 0.75, -Math.PI * 0.75 + efficiencyAngle);
    ctx.stroke();
    
    // Efficiency value
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(efficiency) + '%', 0, 3);
    ctx.font = '8px Arial';
    ctx.fillText('EFF', 0, 45);
    
    ctx.restore();
}

// Enhanced water flow animation
function drawWaterFlow(centerX, centerY, scale) {
    const time = Date.now() - simulationStartTime;
    const flowSpeed = parseFloat(rpmInput.value) / 1500; // Speed based on RPM
    
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8; // Set steady transparency
    
    // Animated inlet flow
    for (let y = centerY + 150 * scale; y > centerY + 60 * scale; y -= 25 * scale) {
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, y - 20 * scale);
        ctx.stroke();
        
        // Arrow heads
        ctx.beginPath();
        ctx.moveTo(centerX - 5 * scale, y - 10 * scale);
        ctx.lineTo(centerX, y - 20 * scale);
        ctx.lineTo(centerX + 5 * scale, y - 10 * scale);
        ctx.closePath();
        ctx.fill();
    }
    
    // Animated spiral flow in volute
    ctx.save();
    ctx.translate(centerX, centerY);
    
    for (let angle = 0; angle < Math.PI * 1.5; angle += Math.PI / 12) {
        const radius = (60 + angle * 25 / Math.PI) * scale;
        const flowAngle = angle + (time / (100 / flowSpeed)) * 0.01;
        const x = Math.cos(flowAngle) * radius;
        const y = Math.sin(flowAngle) * radius;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    
    // Animated outlet flow
    for (let y = centerY; y > centerY - 150 * scale; y -= 25 * scale) {
        ctx.beginPath();
        ctx.moveTo(centerX + 100 * scale, y);
        ctx.lineTo(centerX + 100 * scale, y - 20 * scale);
        ctx.stroke();
        
        // Arrow heads
        ctx.beginPath();
        ctx.moveTo(centerX + 95 * scale, y - 10 * scale);
        ctx.lineTo(centerX + 100 * scale, y - 20 * scale);
        ctx.lineTo(centerX + 105 * scale, y - 10 * scale);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.globalAlpha = 1.0; // Reset transparency
}

// Draw static flow direction arrows
function drawFlowDirectionArrows(centerX, centerY, scale) {
    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    
    // Inlet arrow
    ctx.beginPath();
    ctx.moveTo(centerX - 8 * scale, centerY + 120 * scale);
    ctx.lineTo(centerX, centerY + 100 * scale);
    ctx.lineTo(centerX + 8 * scale, centerY + 120 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Outlet arrow
    ctx.beginPath();
    ctx.moveTo(centerX + 92 * scale, centerY - 120 * scale);
    ctx.lineTo(centerX + 100 * scale, centerY - 140 * scale);
    ctx.lineTo(centerX + 108 * scale, centerY - 120 * scale);
    ctx.closePath();
    ctx.fill();
}

// Enhanced calculations with more parameters
function calculateResults() {
    const voltage = parseFloat(voltageInput.value);
    const current = parseFloat(currentInput.value);
    const duration = parseFloat(durationInput.value);
    const volume = parseFloat(volumeInput.value);
    const fluidDensity = parseFloat(fluidDensityInput.value);
    const headLoss = parseFloat(headLossInput.value);
    
    // Enhanced calculations
    const discharge = volume / duration; // L/s
    const totalHead = 10 + headLoss; // Total dynamic head including losses
    const inputPower = voltage * current; // Watts
    const outputPower = (fluidDensity * GRAVITY * (discharge/1000) * totalHead); // Watts
    const efficiency = (outputPower / inputPower) * 100;
    const temperature = Math.round(currentTemperature);
    
    return {
        voltage,
        current,
        duration,
        volume,
        discharge: discharge.toFixed(2),
        head: totalHead.toFixed(2),
        inputPower: inputPower.toFixed(2),
        outputPower: outputPower.toFixed(2),
        efficiency: efficiency.toFixed(2),
        temperature
    };
}

// Add result to table with enhanced styling
function addResultToTable(result) {
    const resultsBody = document.getElementById('resultsBody');
    const row = document.createElement('tr');
    row.style.opacity = '0';
    row.style.transform = 'translateY(20px)';
    
    const values = [
        result.voltage,
        result.current,
        result.duration,
        result.volume,
        result.discharge,
        result.head,
        result.inputPower,
        result.outputPower,
        result.efficiency,
        result.temperature
    ];
    
    values.forEach((value, index) => {
        const td = document.createElement('td');
        td.textContent = value;
        
        // Color coding for efficiency
        if (index === 8) { // Efficiency column
            const eff = parseFloat(value);
            if (eff > 70) td.style.color = '#10b981';
            else if (eff > 40) td.style.color = '#f59e0b';
            else td.style.color = '#ef4444';
            td.style.fontWeight = 'bold';
        }
        
        // Color coding for temperature
        if (index === 9) { // Temperature column
            const temp = parseFloat(value);
            if (temp > 70) td.style.color = '#ef4444';
            else if (temp > 50) td.style.color = '#f59e0b';
            else td.style.color = '#10b981';
        }
        
        row.appendChild(td);
    });
    
    resultsBody.appendChild(row);
    
    // Animate row appearance
    setTimeout(() => {
        row.style.transition = 'all 0.5s ease';
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
    }, 100);
    
    results.push(result);
}

// Enhanced animation loop
function animate() {
    const rpmSpeed = parseFloat(rpmInput.value);
    rotationAngle += (rpmSpeed / 60) * (Math.PI / 30);
    
    drawPump();
    
    if (isSimulationRunning) {
        // Update runtime
        runtimeSeconds = Math.round((Date.now() - simulationStartTime) / 1000);
        runtimeDisplay.textContent = runtimeSeconds;
        
        // Update temperature
        updateTemperature();
        
        // Update efficiency display
        const efficiency = calculateCurrentEfficiency();
        currentEfficiencyDisplay.textContent = efficiency.toFixed(1);
        
        // Add animation effects to pump diagram when running
        const pumpDiagram = document.getElementById('pumpDiagram');
        pumpDiagram.classList.add('simulation-running');
        
        animationFrameId = requestAnimationFrame(animate);
    } else {
        const pumpDiagram = document.getElementById('pumpDiagram');
        pumpDiagram.classList.remove('simulation-running');
    }
}

// Start simulation with enhanced features
function startSimulation() {
    isSimulationRunning = true;
    simulationStartTime = Date.now();
    runtimeSeconds = 0;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // Reset chart data
    timeData.length = 0;
    efficiencyData.length = 0;
    powerData.length = 0;
    dischageData.length = 0;
    
    // Start animation
    animate();
    
    // Start chart updates
    chartUpdateInterval = setInterval(updateCharts, 1000);
    
    // Auto-start recording if enabled
    if (document.getElementById('autoRecord')?.checked) {
        startDataRecording();
    }
    
    // Show success alert
    const alert = document.querySelector('.alert-info');
    if (alert) {
        alert.className = 'alert alert-success';
        alert.innerHTML = '<i class="fas fa-check-circle"></i><span>Simulation running successfully</span>';
    }
    
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
    
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
    }
    
    // Auto-stop recording
    if (isRecording) {
        stopDataRecording();
    }
    
    // Reset alert
    const alert = document.querySelector('.alert');
    if (alert) {
        alert.className = 'alert alert-info';
        alert.innerHTML = '<i class="fas fa-info-circle"></i><span>Adjust parameters and click Start to begin simulation</span>';
    }
}

// Reset simulation with enhanced features
function resetSimulation() {
    stopSimulation();
    rotationAngle = 0;
    currentTemperature = 25;
    runtimeSeconds = 0;
    
    // Reset displays
    runtimeDisplay.textContent = '0';
    temperatureDisplay.textContent = '25';
    temperatureDisplay.style.color = '#1f2937';
    
    // Clear results
    document.getElementById('resultsBody').innerHTML = '';
    results = [];
    
    // Reset chart data
    timeData.length = 0;
    efficiencyData.length = 0;
    powerData.length = 0;
    dischageData.length = 0;
    
    if (performanceChart) {
        performanceChart.update();
    }
    if (powerChart) {
        powerChart.update();
    }
    
    drawPump();
}

// Event listeners
startBtn.addEventListener('click', startSimulation);
stopBtn.addEventListener('click', stopSimulation);
resetBtn.addEventListener('click', resetSimulation);

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    updateRealTimeDisplays();
    updateSavedSessionsList();
    updateRecordingStatus();
drawPump(); 
});

// Initial draw and setup
updateRealTimeDisplays();
drawPump();

// Additional data management functions
function clearAllSavedSessions() {
    if (confirm('Are you sure you want to delete all saved sessions? This action cannot be undone.')) {
        localStorage.removeItem('pumpSimulatorSessions');
        updateSavedSessionsList();
        alert('All saved sessions have been cleared.');
    }
}

function exportAllSessionsAsZip() {
    const sessions = loadSavedSessions();
    if (sessions.length === 0) {
        alert('No sessions to export');
        return;
    }
    
    // For now, export as individual files
    sessions.forEach((session, index) => {
        setTimeout(() => {
            exportToJSON(session.data, `${session.sessionId}_session_${index + 1}`);
        }, index * 500); // Stagger downloads
    });
    
    alert(`Exporting ${sessions.length} sessions as individual JSON files...`);
}

function showDataStatistics() {
    const sessions = loadSavedSessions();
    const currentData = recordedData.length > 0 ? recordedData : convertResultsToRecordedFormat();
    
    let totalDataPoints = 0;
    let totalSessions = sessions.length;
    let oldestSession = null;
    let newestSession = null;
    
    sessions.forEach(session => {
        totalDataPoints += session.dataPoints;
        if (!oldestSession || new Date(session.startTime) < new Date(oldestSession.startTime)) {
            oldestSession = session;
        }
        if (!newestSession || new Date(session.startTime) > new Date(newestSession.startTime)) {
            newestSession = session;
        }
    });
    
    // Calculate statistics from current data
    let avgEfficiency = 0;
    let maxEfficiency = 0;
    let minEfficiency = 100;
    let avgPower = 0;
    let maxPower = 0;
    
    if (currentData.length > 0) {
        const efficiencies = currentData.map(d => d.efficiency);
        const powers = currentData.map(d => d.inputPower);
        
        avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
        maxEfficiency = Math.max(...efficiencies);
        minEfficiency = Math.min(...efficiencies);
        avgPower = powers.reduce((a, b) => a + b, 0) / powers.length;
        maxPower = Math.max(...powers);
    }
    
    const statisticsHTML = `
        <div class="data-statistics-modal" onclick="closeStatisticsModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-bar"></i> Data Statistics</h3>
                    <button class="modal-close" onclick="closeStatisticsModal()">&times;</button>
                </div>
                
                <div class="statistics-content">
                    <div class="stats-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-database"></i> Session Overview
                        </h4>
                        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div class="stat-card" style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${totalSessions}</div>
                                <div style="font-size: 0.9rem; color: #6b7280;">Total Sessions</div>
                            </div>
                            <div class="stat-card" style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--success-color);">${totalDataPoints}</div>
                                <div style="font-size: 0.9rem; color: #6b7280;">Total Data Points</div>
                            </div>
                            <div class="stat-card" style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning-color);">${currentData.length}</div>
                                <div style="font-size: 0.9rem; color: #6b7280;">Current Session</div>
                            </div>
                        </div>
                    </div>
                    
                    ${currentData.length > 0 ? `
                    <div class="stats-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-tachometer-alt"></i> Performance Statistics
                        </h4>
                        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div class="stat-card" style="background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.2rem; font-weight: bold; color: var(--success-color);">${avgEfficiency.toFixed(1)}%</div>
                                <div style="font-size: 0.9rem; color: #6b7280;">Avg Efficiency</div>
                            </div>
                            <div class="stat-card" style="background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.2rem; font-weight: bold; color: var(--success-color);">${maxEfficiency.toFixed(1)}%</div>
                                <div style="font-size: 0.9rem; color: #6b7280;">Max Efficiency</div>
                            </div>
                            <div class="stat-card" style="background: #fef3c7; padding: 12px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.2rem; font-weight: bold; color: var(--warning-color);">${avgPower.toFixed(0)}W</div>
                                <div style="font-size: 0.9rem; color: #6b7280;">Avg Power</div>
                            </div>
                            <div class="stat-card" style="background: #fef3c7; padding: 12px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.2rem; font-weight: bold; color: var(--warning-color);">${maxPower.toFixed(0)}W</div>
                                <div style="font-size: 0.9rem; color: #6b7280;">Max Power</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${oldestSession ? `
                    <div class="stats-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-clock"></i> Session Timeline
                        </h4>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                            <div style="margin-bottom: 10px;">
                                <strong>Oldest Session:</strong> ${new Date(oldestSession.startTime).toLocaleString()}
                                <br><small>${oldestSession.sessionId} (${oldestSession.dataPoints} points)</small>
                            </div>
                            <div>
                                <strong>Newest Session:</strong> ${new Date(newestSession.startTime).toLocaleString()}
                                <br><small>${newestSession.sessionId} (${newestSession.dataPoints} points)</small>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="stats-section">
                        <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                            <i class="fas fa-info-circle"></i> Storage Information
                        </h4>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                            <div style="margin-bottom: 10px;">
                                <strong>Local Storage Usage:</strong> ${getStorageUsage()}
                            </div>
                            <div>
                                <strong>Recording Frequency:</strong> ${dataRecordingFrequency / 1000} seconds
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-primary" onclick="closeStatisticsModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.querySelector('.data-statistics-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', statisticsHTML);
}

function closeStatisticsModal(event) {
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.querySelector('.data-statistics-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

function getStorageUsage() {
    try {
        const sessionsData = localStorage.getItem('pumpSimulatorSessions') || '[]';
        const sizeInBytes = new Blob([sessionsData]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
        
        if (sizeInBytes < 1024) {
            return `${sizeInBytes} bytes`;
        } else if (sizeInBytes < 1024 * 1024) {
            return `${sizeInKB} KB`;
        } else {
            return `${sizeInMB} MB`;
        }
    } catch (error) {
        return 'Unable to calculate';
    }
}

// Enhanced recording button behavior
function updateRecordingButtonUI() {
    const recordBtn = document.getElementById('recordBtn');
    if (!recordBtn) return;
    
    if (isRecording) {
        recordBtn.textContent = '⏹️ Stop Recording';
        recordBtn.classList.remove('btn-primary');
        recordBtn.classList.add('btn-danger', 'recording');
    } else {
        recordBtn.textContent = '🔴 Start Recording';
        recordBtn.classList.remove('btn-danger', 'recording');
        recordBtn.classList.add('btn-primary');
    }
}

// Override the original functions to include UI updates
const originalStartRecording = startDataRecording;
const originalStopRecording = stopDataRecording;

startDataRecording = function() {
    originalStartRecording();
    updateRecordingButtonUI();
};

stopDataRecording = function() {
    originalStopRecording();
    updateRecordingButtonUI();
};

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl+R to start/stop recording
    if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        if (isRecording) {
            stopDataRecording();
        } else {
            startDataRecording();
        }
    }
    
    // Ctrl+E to export CSV
    if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        exportCurrentDataAsCSV();
    }
    
    // Ctrl+Shift+E to export JSON
    if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        exportCurrentDataAsJSON();
    }
});

// Add tooltips for keyboard shortcuts
document.addEventListener('DOMContentLoaded', function() {
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.title = 'Start/Stop Recording (Ctrl+R)';
    }
});

// Performance optimization for large datasets
function optimizeChartData() {
    const maxPoints = 50; // Reduce for better performance
    
    if (timeData.length > maxPoints) {
        const step = Math.ceil(timeData.length / maxPoints);
        const optimizedTimeData = [];
        const optimizedEfficiencyData = [];
        const optimizedPowerData = [];
        const optimizedDischargeData = [];
        
        for (let i = 0; i < timeData.length; i += step) {
            optimizedTimeData.push(timeData[i]);
            optimizedEfficiencyData.push(efficiencyData[i]);
            optimizedPowerData.push(powerData[i]);
            optimizedDischargeData.push(dischageData[i]);
        }
        
        timeData.length = 0;
        efficiencyData.length = 0;
        powerData.length = 0;
        dischageData.length = 0;
        
        timeData.push(...optimizedTimeData);
        efficiencyData.push(...optimizedEfficiencyData);
        powerData.push(...optimizedPowerData);
        dischageData.push(...optimizedDischargeData);
    }
} 
