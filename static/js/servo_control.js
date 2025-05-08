document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const angleSlider = document.getElementById('angle-slider');
    const angleDisplay = document.getElementById('angle-display');
    const forwardBtn = document.getElementById('forward-btn');
    const reverseBtn = document.getElementById('reverse-btn');
    const statusIndicator = document.getElementById('status-indicator');
    const connectionLog = document.getElementById('connection-log');
    
    // ESP32 Configuration
    const ESP32_IP = '192.168.4.1';
    const ESP32_URL = `http://${ESP32_IP}`;
    
    // Current angle state
    let currentAngle = 0;
    
    // Initialize the UI
    updateAngleDisplay(currentAngle);
    
    // Function to log messages with timestamp
    function logMessage(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        if (isError) {
            logEntry.classList.add('text-danger');
        }
        
        connectionLog.prepend(logEntry);
        
        // Limit the number of log entries
        if (connectionLog.children.length > 10) {
            connectionLog.removeChild(connectionLog.lastChild);
        }
    }
    
    // Function to update the angle display
    function updateAngleDisplay(angle) {
        currentAngle = angle;
        angleDisplay.textContent = `${angle}°`;
        angleSlider.value = angle;
        
        // Add animation effect
        angleDisplay.classList.add('angle-updated');
        setTimeout(() => {
            angleDisplay.classList.remove('angle-updated');
        }, 300);
    }
    
    // Function to update connection status
    function updateConnectionStatus(connected) {
        if (connected) {
            statusIndicator.textContent = 'Connected';
            statusIndicator.classList.remove('bg-secondary', 'bg-danger');
            statusIndicator.classList.add('bg-success');
        } else {
            statusIndicator.textContent = 'Disconnected';
            statusIndicator.classList.remove('bg-secondary', 'bg-success');
            statusIndicator.classList.add('bg-danger');
        }
    }
    
    // Function to send angle to ESP32
    async function sendAngle(angle) {
        try {
            updateConnectionStatus(false);
            const response = await fetch(`${ESP32_URL}/set?angle=${angle}`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            updateConnectionStatus(true);
            updateAngleDisplay(data.angle || angle);
            logMessage(`Angle set to ${data.angle || angle}°`);
            return true;
        } catch (error) {
            updateConnectionStatus(false);
            logMessage(`Failed to set angle: ${error.message}`, true);
            return false;
        }
    }
    
    // Function to move servo in a direction
    async function moveServo(direction) {
        try {
            updateConnectionStatus(false);
            const response = await fetch(`${ESP32_URL}/move?dir=${direction}`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            updateConnectionStatus(true);
            updateAngleDisplay(data.angle || currentAngle);
            logMessage(`Moved ${direction}: now at ${data.angle || currentAngle}°`);
            return true;
        } catch (error) {
            updateConnectionStatus(false);
            logMessage(`Failed to move ${direction}: ${error.message}`, true);
            return false;
        }
    }
    
    // Event Listeners
    angleSlider.addEventListener('input', function() {
        updateAngleDisplay(parseInt(this.value));
    });
    
    angleSlider.addEventListener('change', function() {
        const angle = parseInt(this.value);
        sendAngle(angle);
    });
    
    forwardBtn.addEventListener('click', function() {
        // Client-side validation to keep within bounds
        const newAngle = Math.min(currentAngle + 10, 180);
        updateAngleDisplay(newAngle);
        moveServo('forward');
    });
    
    reverseBtn.addEventListener('click', function() {
        // Client-side validation to keep within bounds
        const newAngle = Math.max(currentAngle - 10, 0);
        updateAngleDisplay(newAngle);
        moveServo('reverse');
    });
    
    // Check initial connection
    async function checkConnection() {
        try {
            updateConnectionStatus(false);
            const response = await fetch(`${ESP32_URL}/set?angle=${currentAngle}`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            updateConnectionStatus(true);
            updateAngleDisplay(data.angle || 0);
            logMessage('Successfully connected to ESP32');
            return true;
        } catch (error) {
            updateConnectionStatus(false);
            logMessage(`Connection error: ${error.message}. Make sure ESP32 is powered on and connected to the same network.`, true);
            return false;
        }
    }
    
    // Try to connect initially
    checkConnection();
    
    // Add error handling for CORS issues
    window.addEventListener('error', function(e) {
        if (e.message.includes('CORS') || e.message.includes('NetworkError')) {
            logMessage('CORS error: Make sure ESP32 allows cross-origin requests', true);
        }
    });
});
