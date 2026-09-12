/**
 * UIU Smart Campus Digital Twin - Interactive Frontend Logic
 */

// Quick Demo Login Auto-Filler
function fillDemoAccount(role) {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!emailInput || !passwordInput) return;

    switch(role) {
        case 'admin':
            emailInput.value = 'admin@uiu.ac.bd';
            passwordInput.value = 'admin123';
            break;
        case 'teacher':
            emailInput.value = 'teacher@uiu.ac.bd';
            passwordInput.value = 'teacher123';
            break;
        case 'student':
            emailInput.value = 'student@uiu.ac.bd';
            passwordInput.value = 'student123';
            break;
        case 'security':
            emailInput.value = 'security@uiu.ac.bd';
            passwordInput.value = 'security123';
            break;
    }

    // Add glowing visual feedback
    emailInput.classList.add('glow-input');
    passwordInput.classList.add('glow-input');
    setTimeout(() => {
        emailInput.classList.remove('glow-input');
        passwordInput.classList.remove('glow-input');
    }, 600);
}

// Password Peek Toggle
function togglePasswordVisibility(inputId, btnElement) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        btnElement.innerHTML = 'Hide';
    } else {
        input.type = 'password';
        btnElement.innerHTML = 'Show';
    }
}

// Tab Switching on Login Page
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginFormContainer');
    const registerForm = document.getElementById('registerFormContainer');
    const loginTabBtn = document.getElementById('tabBtnLogin');
    const registerTabBtn = document.getElementById('tabBtnRegister');

    if (!loginForm || !registerForm) return;

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginTabBtn.classList.remove('active');
        registerTabBtn.classList.add('active');
    }
}

// Live Digital Twin Telemetry Poller (Updates every 4 seconds)
function startLiveTelemetryUpdates() {
    setInterval(() => {
        fetch('/api/campus/telemetry')
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    const t = data.data;
                    updateElementText('liveActiveStudents', t.activeStudents);
                    updateElementText('liveOccupiedRooms', t.occupiedRooms + ' / ' + t.totalRooms);
                    updateElementText('livePowerKW', t.powerConsumptionKW + ' kW');
                    updateElementText('liveActiveBuses', t.activeBuses + ' Active');
                    updateElementText('livePendingComplaints', t.pendingComplaints);
                }
            })
            .catch(err => console.debug('Telemetry sync:', err));
    }, 4000);
}

function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = text;
    }
}

// AOOP Syllabus Interactive Demonstrations
function triggerAdminUndo() {
    fetch('/api/campus/admin/undo', { method: 'POST' })
        .then(res => res.json())
        .then(res => {
            alert(res.message);
            location.reload();
        })
        .catch(err => alert('Error: ' + err));
}

function triggerProcessComplaint() {
    fetch('/api/campus/complaint/process-next', { method: 'POST' })
        .then(res => res.json())
        .then(res => {
            alert(res.message);
            location.reload();
        })
        .catch(err => alert('Error: ' + err));
}

function triggerGateCheckIn() {
    const studentId = prompt('Enter UIU Student ID for Set Check-In:', '011211001');
    if (!studentId) return;

    fetch('/api/campus/gate/checkin?studentId=' + encodeURIComponent(studentId), { method: 'POST' })
        .then(res => res.json())
        .then(res => alert(res.message))
        .catch(err => alert('Error: ' + err));
}

function triggerBackupCampusState() {
    fetch('/api/campus/backup/save', { method: 'POST' })
        .then(res => res.json())
        .then(res => alert(res.message))
        .catch(err => alert('Error: ' + err));
}

function triggerRestoreCampusState() {
    fetch('/api/campus/backup/restore')
        .then(res => res.json())
        .then(res => {
            if (res.data) {
                alert('Restored CampusState: ' + JSON.stringify(res.data, null, 2));
            } else {
                alert(res.message);
            }
        })
        .catch(err => alert('Error: ' + err));
}

function triggerBusSocketTest() {
    const busId = prompt('Enter Bus ID:', 'BUS-01');
    const location = prompt('Enter Live Location:', 'Near UIU Main Entrance');
    if (!busId || !location) return;

    fetch(`/api/campus/bus/transmit?busId=${encodeURIComponent(busId)}&location=${encodeURIComponent(location)}`, { method: 'POST' })
        .then(res => res.json())
        .then(res => alert(res.message))
        .catch(err => alert('Error: ' + err));
}

// Auto initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    startLiveTelemetryUpdates();
});
