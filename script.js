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

// Display elements
const voltageValue = document.getElementById('voltageValue');
const currentValue = document.getElementById('currentValue');
const rpmValue = document.getElementById('rpmValue');

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

// Draw pump components
function drawPump() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Center point of the pump
    const centerX = 400;  // Middle of 800
    const centerY = 300;  // Middle of 600
    
    // Scale factor for the larger canvas
    const scale = 1.6;  // Increase size by 60%
    
    // Draw inlet pipe with flange
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;  // Increased line width
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
    
    // Draw volute casing
    ctx.beginPath();
    ctx.fillStyle = 'rgba(200, 220, 255, 0.2)';
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
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    
    // Draw drive shaft
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);  // Slightly larger shaft
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Draw curved impeller vanes
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.arc(30 * scale, 0, 45 * scale, Math.PI, Math.PI * 1.5, false);
        ctx.stroke();
    }
    ctx.restore();
    
    // Draw labels with larger font
    ctx.font = '16px Arial';  // Increased font size
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    
    function drawLabel(text, x, y) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const metrics = ctx.measureText(text);
        const height = 24;  // Increased height
        ctx.fillRect(x - metrics.width/2 - 5, y - height/2, metrics.width + 10, height);
        ctx.fillStyle = '#333';
        ctx.fillText(text, x, y + 6);
    }
    
    drawLabel('Inlet/Suction', centerX, centerY + 170 * scale);
    drawLabel('Outlet/Discharge', centerX + 100 * scale, centerY - 170 * scale);
    drawLabel('Volute Chamber', centerX + 70 * scale, centerY - 50 * scale);
    drawLabel('Drive Shaft', centerX - 70 * scale, centerY);
    drawLabel('Eye', centerX, centerY + 80 * scale);
    
    // Draw water flow animation if simulation is running
    if (isSimulationRunning) {
        drawWaterFlow(centerX, centerY, scale);
    } else {
        drawFlowDirectionArrows(centerX, centerY, scale);
    }
}

// Update water flow animation for new scale
function drawWaterFlow(centerX, centerY, scale) {
    const time = Date.now() - simulationStartTime;
    const flowOffset = (time / 100) % 20;
    
    ctx.strokeStyle = '#4a90e2';
    ctx.fillStyle = '#4a90e2';
    ctx.lineWidth = 4;  // Increased line width
    
    // Inlet flow (vertical, moving upward)
    for (let y = centerY + 150 * scale; y > centerY + 60 * scale; y -= 20 * scale) {
        // Draw water flow segments
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, y - 15 * scale);
        ctx.stroke();
        
        // Draw small directional arrows pointing upward
        ctx.beginPath();
        ctx.moveTo(centerX - 8 * scale, y);
        ctx.lineTo(centerX, y - 15 * scale);
        ctx.lineTo(centerX + 8 * scale, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Spiral flow in volute
    ctx.save();
    ctx.translate(centerX, centerY);
    for (let angle = 0; angle < Math.PI * 1.5; angle += Math.PI / 8) {
        const radius = (60 + angle * 20 / Math.PI) * scale;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        const nextAngle = angle + 0.1;
        const nextRadius = (60 + nextAngle * 20 / Math.PI) * scale;
        const nextX = Math.cos(nextAngle) * nextRadius;
        const nextY = Math.sin(nextAngle) * nextRadius;
        
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
    
    // Outlet flow (moving upward)
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

// Update static flow direction arrows for new scale
function drawFlowDirectionArrows(centerX, centerY, scale) {
    ctx.fillStyle = '#4a90e2';
    
    // Inlet arrow (pointing upward)
    ctx.beginPath();
    ctx.moveTo(centerX - 10 * scale, centerY + 120 * scale);
    ctx.lineTo(centerX, centerY + 100 * scale);
    ctx.lineTo(centerX + 10 * scale, centerY + 120 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Outlet arrow (pointing upward)
    ctx.beginPath();
    ctx.moveTo(centerX + 90 * scale, centerY - 120 * scale);
    ctx.lineTo(centerX + 100 * scale, centerY - 140 * scale);
    ctx.lineTo(centerX + 110 * scale, centerY - 120 * scale);
    ctx.closePath();
    ctx.fill();
}

// Calculate simulation results
function calculateResults() {
    const voltage = parseFloat(voltageInput.value);
    const current = parseFloat(currentInput.value);
    const duration = parseFloat(durationInput.value);
    const volume = parseFloat(volumeInput.value);
    
    // Calculate parameters
    const discharge = volume / duration; // L/s
    const head = 10; // Assumed constant head for simplicity
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

// Add result to table
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
}

// Event listeners
startBtn.addEventListener('click', startSimulation);
stopBtn.addEventListener('click', stopSimulation);
resetBtn.addEventListener('click', resetSimulation);

// Initial draw
drawPump(); 