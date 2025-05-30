// Draw static pipe diagram
function drawStaticPipeDiagram() {
    const canvas = document.getElementById('staticPipeCanvas');
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    const centerY = canvas.height/2;
    
    // Draw pipe
    const pipeHeight = 60;
    const wallThickness = 4;
    
    // Get theme colors
    const style = getComputedStyle(document.documentElement);
    const bgColor = style.getPropertyValue('--static-diagram-bg').trim();
    const pipeWall = style.getPropertyValue('--static-pipe-wall').trim();
    const pipeWallDark = style.getPropertyValue('--static-pipe-wall-dark').trim();
    const waterColor = style.getPropertyValue('--static-water').trim();
    const tapColor = style.getPropertyValue('--static-tap-color').trim();
    const connectionColor = style.getPropertyValue('--static-connection').trim();
    
    // Clear canvas with theme background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pipe background
    ctx.beginPath();
    ctx.rect(50, centerY - pipeHeight/2, canvas.width - 100, pipeHeight);
    ctx.fillStyle = bgColor;
    ctx.fill();

    // Create water gradient
    const waterGradient = ctx.createLinearGradient(0, centerY - pipeHeight/2, 0, centerY + pipeHeight/2);
    waterGradient.addColorStop(0, waterColor);
    waterGradient.addColorStop(0.5, waterColor.replace(/[\d.]+\)$/, '0.4)'));
    waterGradient.addColorStop(1, waterColor);

    // Fill pipe with water gradient
    ctx.fillStyle = waterGradient;
    ctx.fill();
    
    // Draw pipe walls
    const gradient = ctx.createLinearGradient(
        0, centerY - pipeHeight/2 - wallThickness,
        0, centerY + pipeHeight/2 + wallThickness
    );
    gradient.addColorStop(0, pipeWall);
    gradient.addColorStop(0.5, pipeWallDark);
    gradient.addColorStop(1, pipeWall);
    
    // Top wall
    ctx.beginPath();
    ctx.rect(50, centerY - pipeHeight/2 - wallThickness, canvas.width - 100, wallThickness);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Bottom wall
    ctx.beginPath();
    ctx.rect(50, centerY + pipeHeight/2, canvas.width - 100, wallThickness);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw pipe ends
    ctx.beginPath();
    ctx.rect(50 - wallThickness, centerY - pipeHeight/2 - wallThickness, wallThickness, pipeHeight + wallThickness * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.rect(canvas.width - 50, centerY - pipeHeight/2 - wallThickness, wallThickness, pipeHeight + wallThickness * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw pressure taps
    drawStaticPressureTap(ctx, 150, centerY, pipeHeight, tapColor, connectionColor);
    drawStaticPressureTap(ctx, canvas.width - 150, centerY, pipeHeight, tapColor, connectionColor);
}

function drawStaticPressureTap(ctx, x, centerY, pipeHeight, tapColor, connectionColor) {
    const tapHeight = 30;
    
    // Draw tap pipe
    ctx.beginPath();
    ctx.moveTo(x, centerY - pipeHeight/2);
    ctx.lineTo(x, centerY - pipeHeight/2 - tapHeight);
    ctx.strokeStyle = tapColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw tap circle
    ctx.beginPath();
    ctx.arc(x, centerY - pipeHeight/2 - tapHeight, 6, 0, Math.PI * 2);
    ctx.fillStyle = tapColor;
    ctx.fill();
    
    // Draw connection point
    ctx.beginPath();
    ctx.arc(x, centerY - pipeHeight/2, 4, 0, Math.PI * 2);
    ctx.fillStyle = connectionColor;
    ctx.fill();
}

// Constants
const WATER_DENSITY = 998; // kg/m³
const WATER_VISCOSITY = 0.001; // Pa·s
const GRAVITY = 9.81; // m/s²

// Fluid properties
const FLUIDS = {
    water: { density: 998, viscosity: 0.001 },
    glycerin: { density: 1260, viscosity: 1.412 },
    oil: { density: 900, viscosity: 0.03 }
};

// Particle colors for different fluids
const PARTICLE_COLORS = {
    water: 'rgba(52, 152, 219, 0.8)',    // Blue
    oil: 'rgba(241, 196, 15, 0.8)',      // Yellow
    glycerin: 'rgba(255, 105, 180, 0.8)' // Pink
};

// Handle intro section transition
document.addEventListener('DOMContentLoaded', function() {
    // Draw the static pipe diagram
    drawStaticPipeDiagram();
    
    // Handle window resize for static diagram
    window.addEventListener('resize', drawStaticPipeDiagram);

    const startButton = document.getElementById('start-simulation');
    const introSection = document.getElementById('intro-section');
    const simulatorSection = document.getElementById('simulator-section');
    const popup = document.getElementById('input-parameter-popup');
    const popupOkBtn = document.getElementById('popup-ok-btn');

    startButton.addEventListener('click', function() {
        // Show popup
        popup.style.display = 'flex';
    });

    popupOkBtn.addEventListener('click', function() {
        // Hide popup and show simulator
        popup.style.display = 'none';
        introSection.style.display = 'none';
        simulatorSection.style.display = 'block';
        
        // Initialize and start simulator
        if (!window.simulator) {
            window.simulator = new PipeFlowSimulator();
        }
    });
});

class PipeFlowSimulator {
    constructor() {
        // Simulation state
        this.isRunning = false;
        this.needsUpdate = false;
        this.hasUserInput = false;
        
        // Initialize properties
        this.particles = [];
        this.headLossData = [];
        this.currentDiameter = 0.05;
        this.flowSpeed = 0;
        this.lastFrameTime = 0;
        this.simulationValues = {
            velocity: 0,
            headLoss: 0,
            frictionFactor: 0,
            reynolds: 0
        };
        
        // Get and setup canvas
        this.setupCanvas();
        
        // Setup inputs and chart
        this.setupInputs();
        this.setupChart();
        
        // Initialize particles but don't start moving them
        this.initializeParticles();
        
        // Start animation loop but particles won't move until input changes
        this.startSimulation();

        // Initial update to show zero values
        this.updateSimulation();
    }

    setupCanvas() {
        this.canvas = document.getElementById('pipeCanvas');
        if (!this.canvas) {
            console.error('Pipe canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize canvas size
        this.resizeCanvas();
        
        // Add resize listener
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    startSimulation() {
        console.log('Starting simulation...');
        this.isRunning = true;
        this.needsUpdate = true;
        this.updateSimulation();
        this.animate(0);
    }

    setupChart() {
        const ctx = document.getElementById('headLossGraph').getContext('2d');
        if (!ctx) return;

        // Get theme colors
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim();
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Head Loss vs Flow Velocity',
                    data: [],
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}33`,
                    tension: 0.4,
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Flow Velocity (m/s)',
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Head Loss (m)',
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
    }

    updateSimulation() {
        if (!this.isRunning) return;

        try {
            // Get current values
            const L = parseFloat(this.lengthInput.value) || 5;
            const D = parseFloat(this.diameterInput.value) || 0.05;
            const Q = parseFloat(this.flowRateInput.value) || 0;
            const fluid = FLUIDS[this.fluidSelect.value] || FLUIDS.water;
            
            // Store current diameter for visualization
            this.currentDiameter = D;
            
            // Calculate flow parameters
            const A = Math.PI * Math.pow(D/2, 2);
            const Q_m3s = Q / 1000; // Convert L/s to m³/s
            const v = Q_m3s / A;
            
            // Calculate Reynolds number
            const Re = (fluid.density * v * D) / fluid.viscosity;
            
            // Calculate friction factor
            let f;
            if (Re < 2300) {
                f = 64 / Re; // Laminar flow
            } else {
                f = 0.316 * Math.pow(Re, -0.25); // Turbulent flow
            }
            
            // Calculate head loss
            const hf = f * (L/D) * Math.pow(v, 2) / (2 * GRAVITY);
            
            // Store values
            this.simulationValues = {
                velocity: v,
                headLoss: hf,
                frictionFactor: f,
                reynolds: Re
            };
            
            // Update displays
            this.updateDisplays();
            
            // Update flow speed for particles
            this.flowSpeed = v;
            
            // Update graph if velocity is valid
            if (v > 0 && isFinite(v) && isFinite(hf)) {
                this.updateGraph(v, hf);
            }
            
            this.needsUpdate = false;
            
        } catch (error) {
            console.error('Error updating simulation:', error);
        }
    }

    updateDisplays() {
        const { velocity, headLoss, frictionFactor } = this.simulationValues;
        
        // Update value displays with animation
        this.animateValue('velocity', velocity, 3);
        this.animateValue('headLoss', headLoss, 3);
        this.animateValue('frictionFactor', frictionFactor, 4);
        
        // Calculate pressures
        const fluid = FLUIDS[this.fluidSelect.value] || FLUIDS.water;
        const p1 = fluid.density * GRAVITY * headLoss;
        const p2 = 0;

        // Update pressure readings and meter
        this.updatePressureGauge('pressure1', p1);
        this.updatePressureGauge('pressure2', p2);
        this.updatePressureMeter(p1);
    }

    updateGraph(velocity, headLoss) {
        if (!this.chart) return;

        // Add new data point
        this.headLossData.push({ v: velocity, h: headLoss });
        
        // Keep only last 50 points
        if (this.headLossData.length > 50) {
            this.headLossData.shift();
        }
        
        // Sort data by velocity
        this.headLossData.sort((a, b) => a.v - b.v);
        
        // Update chart
        this.chart.data.labels = this.headLossData.map(d => d.v.toFixed(2));
        this.chart.data.datasets[0].data = this.headLossData.map(d => d.h);
        this.chart.update('none'); // Update without animation for smoother updates
    }

    animate(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = this.lastFrameTime ? timestamp - this.lastFrameTime : 16;
        this.lastFrameTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw pipe
        this.drawPipe();
        
        // Update and draw particles if simulation is running
        if (this.isRunning) {
            this.updateParticles(deltaTime);
            this.drawParticles();
        }
        
        // Request next frame
        requestAnimationFrame((timestamp) => this.animate(timestamp));
    }

    setupInputs() {
        // Get input elements
        this.lengthInput = document.getElementById('pipeLength');
        this.diameterInput = document.getElementById('pipeDiameter');
        this.flowRateInput = document.getElementById('flowRate');
        this.fluidSelect = document.getElementById('fluid');
        this.flowRateValue = document.getElementById('flowRateValue');
        
        if (!this.lengthInput || !this.diameterInput || !this.flowRateInput || !this.fluidSelect) {
            console.error('Some input elements not found');
            return;
        }
        
        // Add event listeners
        const updateHandler = () => {
            this.hasUserInput = true;
            this.needsUpdate = true;
            requestAnimationFrame(() => this.updateSimulation());
        };

        // Update range slider filled track and value display
        const updateFlowRate = (e) => {
            const value = parseFloat(e.target.value);
            if (this.flowRateValue) {
                this.flowRateValue.textContent = value.toFixed(1);
            }
            this.flowSpeed = value;
            updateHandler();
        };

        this.lengthInput.addEventListener('input', updateHandler);
        this.diameterInput.addEventListener('input', updateHandler);
        this.flowRateInput.addEventListener('input', updateFlowRate);
        this.fluidSelect.addEventListener('change', updateHandler);

        // Initialize flow rate value display
        if (this.flowRateValue) {
            this.flowRateValue.textContent = (parseFloat(this.flowRateInput.value) || 0).toFixed(1);
        }
    }

    initializeParticles() {
        const particleCount = 200;
        this.particles = [];
        
        const centerY = this.canvas.height/2;
        const pipeHeight = Math.min(60 * (this.currentDiameter / 0.05), this.canvas.height * 0.6);
        const maxOffset = pipeHeight * 0.35;
        
        for (let i = 0; i < particleCount; i++) {
            const x = 70 + (i / particleCount) * (this.canvas.width - 140);
            this.particles.push({
                x: x,
                y: centerY + (Math.random() * 2 - 1) * maxOffset,
                size: 3.5,
                speed: 1 + Math.random() * 0.5,
                yOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    updateParticles(deltaTime) {
        if (!this.hasUserInput || this.flowSpeed === 0) return;
        
        const baseSpeed = Math.abs(this.flowSpeed) * 50;
        
        this.particles.forEach(particle => {
            particle.x += baseSpeed * particle.speed * (deltaTime / 16);
            particle.yOffset += deltaTime * 0.001;
            const oscillation = Math.sin(particle.yOffset) * 1;
            
            const pipeHeight = Math.min(60 * (this.currentDiameter / 0.05), this.canvas.height * 0.6);
            const maxOffset = pipeHeight * 0.35;
            const centerY = this.canvas.height / 2;
            
            particle.y += oscillation;
            particle.y = Math.max(
                centerY - maxOffset,
                Math.min(centerY + maxOffset, particle.y)
            );
            
            if (particle.x > this.canvas.width - 70) {
                particle.x = 70;
                particle.y = centerY + (Math.random() * 2 - 1) * maxOffset;
                particle.yOffset = Math.random() * Math.PI * 2;
            }
        });
    }
    
    drawPipe() {
        if (!this.ctx) return;
        
        const centerY = this.canvas.height/2;
        const pipeHeight = Math.min(60 * (this.currentDiameter / 0.05), this.canvas.height * 0.6);
        
        // Draw pipe background
        this.ctx.beginPath();
        this.ctx.rect(50, centerY - pipeHeight/2, this.canvas.width - 100, pipeHeight);
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pipe-color').trim();
        this.ctx.fill();

        // Create water gradient
        const waterBase = getComputedStyle(document.documentElement).getPropertyValue('--water-base').trim();
        const waterColor = waterBase.replace(/[\d.]+\)$/, '0.15)');
        const waterGradient = this.ctx.createLinearGradient(0, centerY - pipeHeight/2, 0, centerY + pipeHeight/2);
        waterGradient.addColorStop(0, waterColor);
        waterGradient.addColorStop(0.5, waterColor);
        waterGradient.addColorStop(1, waterColor);

        this.ctx.fillStyle = waterGradient;
        this.ctx.fill();
        
        // Draw pipe walls
        const wallThickness = 4;
        const gradient = this.ctx.createLinearGradient(
            0, centerY - pipeHeight/2 - wallThickness,
            0, centerY + pipeHeight/2 + wallThickness
        );
        const pipeWall = getComputedStyle(document.documentElement).getPropertyValue('--pipe-wall').trim();
        const pipeWallDark = getComputedStyle(document.documentElement).getPropertyValue('--pipe-wall-dark').trim();
        gradient.addColorStop(0, pipeWall);
        gradient.addColorStop(0.5, pipeWallDark);
        gradient.addColorStop(1, pipeWall);
        
        // Top wall
        this.ctx.beginPath();
        this.ctx.rect(50, centerY - pipeHeight/2 - wallThickness, this.canvas.width - 100, wallThickness);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Bottom wall
        this.ctx.beginPath();
        this.ctx.rect(50, centerY + pipeHeight/2, this.canvas.width - 100, wallThickness);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Draw pipe ends
        this.ctx.beginPath();
        this.ctx.rect(50 - wallThickness, centerY - pipeHeight/2 - wallThickness, wallThickness, pipeHeight + wallThickness * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.rect(this.canvas.width - 50, centerY - pipeHeight/2 - wallThickness, wallThickness, pipeHeight + wallThickness * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Draw pressure taps
        this.drawPressureTap(150, centerY, pipeHeight);
        this.drawPressureTap(this.canvas.width - 150, centerY, pipeHeight);

        // Store dimensions for particle animation
        this.pipeStartX = 50;
        this.pipeLength = this.canvas.width - 100;
    }
    
    drawPressureTap(x, centerY, pipeHeight) {
        const ctx = this.ctx;
        const tapHeight = 30;
        
        // Get theme colors
        const pipeWall = getComputedStyle(document.documentElement).getPropertyValue('--pipe-wall').trim();
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        
        // Draw tap pipe
        ctx.beginPath();
        ctx.moveTo(x, centerY - pipeHeight/2);
        ctx.lineTo(x, centerY - pipeHeight/2 - tapHeight);
        ctx.strokeStyle = pipeWall;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw tap circle
        ctx.beginPath();
        ctx.arc(x, centerY - pipeHeight/2 - tapHeight, 6, 0, Math.PI * 2);
        ctx.fillStyle = pipeWall;
        ctx.fill();
        
        // Draw connection point with accent color
        ctx.beginPath();
        ctx.arc(x, centerY - pipeHeight/2, 4, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
    }
    
    drawParticles() {
        if (!this.ctx || !this.isRunning) return;

        this.particles.forEach(particle => {
            const particleColor = 'rgba(52, 152, 219, 0.8)';
            const highlightColor = 'rgba(255, 255, 255, 0.4)';
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particleColor;
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x - particle.size/3, particle.y - particle.size/3, particle.size/3, 0, Math.PI * 2);
            this.ctx.fillStyle = highlightColor;
            this.ctx.fill();
        });
    }
    
    animateValue(elementId, newValue, decimals = 2) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with id ${elementId} not found`);
            return;
        }
        
        // Ensure the value is a valid number
        if (isNaN(newValue) || !isFinite(newValue)) {
            console.error(`Invalid value for ${elementId}:`, newValue);
            newValue = 0;
        }
        
        // Update the display
        element.textContent = newValue.toFixed(decimals);
        element.classList.remove('animate-value');
        void element.offsetWidth; // Trigger reflow
        element.classList.add('animate-value');
    }
    
    updatePressureGauge(gaugeId, pressure) {
        const gauge = document.getElementById(gaugeId);
        if (!gauge) return;
        
        const valueSpan = gauge.querySelector('span');
        if (!valueSpan) return;
        
        // Ensure pressure is a valid number
        pressure = isNaN(pressure) ? 0 : Math.round(pressure);
        
        // Update value with animation
        valueSpan.textContent = pressure;
        gauge.classList.remove('updating');
        void gauge.offsetWidth; // Trigger reflow
        gauge.classList.add('updating');
        
        // Remove existing state classes
        gauge.classList.remove('success', 'warning', 'danger');
        
        // Color code based on pressure
        if (gaugeId === 'pressure1') {
            if (pressure > 1000) {
                gauge.classList.add('danger');
            } else if (pressure > 500) {
                gauge.classList.add('warning');
            } else {
                gauge.classList.add('success');
            }
        }
    }

    updatePressureMeter(pressure) {
        const meterValue = document.getElementById('inlet-pressure-value');
        if (!meterValue) return;
        
        // Update the value display
        meterValue.textContent = Math.round(pressure);
        meterValue.classList.add('updating');
        
        // Update color based on pressure range
        const meterBody = document.querySelector('.meter-body');
        if (meterBody) {
            meterBody.classList.remove('low', 'medium', 'high');
            if (pressure > 7500) {
                meterBody.classList.add('high');
            } else if (pressure > 3750) {
                meterBody.classList.add('medium');
            } else {
                meterBody.classList.add('low');
            }
        }
        
        // Remove animation class after transition
        setTimeout(() => {
            meterValue.classList.remove('updating');
        }, 300);
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        this.canvas.width = container.offsetWidth;
        this.canvas.height = Math.max(200, container.offsetHeight);
        
        if (this.ctx) {
            this.drawPipe();
            this.drawParticles();
        }
    }
}

// Theme Toggle Functionality
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update visualizations if simulator exists
    if (window.simulator) {
        window.simulator.drawPipe();
        window.simulator.setupChart();
    }
}

// Initialize theme
initTheme();

// Add event listener to theme toggle button
document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

// Add theme change observer to redraw static diagram
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
            drawStaticPipeDiagram();
            if (window.simulator) {
                window.simulator.drawPipe();
                window.simulator.setupChart();
            }
        }
    });
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
}); 