// JARVIS HUD Controller, Web Audio Synthesizer & Canvas Renderer

document.addEventListener('DOMContentLoaded', () => {
  // Setup Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Setup Canvas Animations & Particles
  initParticles();
  initArcReactor();
  initRadar();

  // Diagnostics randomization simulation
  setInterval(updateDiagnostics, 3000);

  // Setup Themes & Protocol Buttons
  initThemesAndProtocols();

  // Setup Speech & Chat interaction
  initSpeechAndChat();
});

// Sound SFX State
let sfxEnabled = true;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Synthesize Sci-Fi Sound Effects using Web Audio API
function playSciFiSound(type) {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'activate') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    console.warn('Audio synthesis error:', e);
  }
}

// Clock & Date display
function updateClock() {
  const clockEl = document.getElementById('clock-display');
  const dateEl = document.getElementById('date-display');
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${hours}:${mins}:${secs}`;

  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  dateEl.textContent = `DATE: ${now.toLocaleDateString('en-US', options).toUpperCase()}`;
}

// Background Hologram Particle Animation
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.5 + 0.2
  }));

  function renderParticles() {
    ctx.clearRect(0, 0, width, height);

    const themeColor = getComputedStyle(document.body).getPropertyValue('--theme-primary').trim() || '#00f3ff';

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = themeColor;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(renderParticles);
  }

  renderParticles();
}

// Randomize Diagnostics for active HUD effect
function updateDiagnostics() {
  const cpuBar = document.getElementById('cpu-bar');
  const cpuVal = document.getElementById('cpu-val');
  const nnBar = document.getElementById('nn-bar');
  const nnVal = document.getElementById('nn-val');
  const ramBar = document.getElementById('ram-bar');
  const ramVal = document.getElementById('ram-val');

  const cpu = Math.floor(Math.random() * 30) + 35;
  const nn = Math.floor(Math.random() * 15) + 80;
  const ram = (Math.random() * 10 + 60).toFixed(1);

  if (cpuBar) cpuBar.style.width = `${cpu}%`;
  if (cpuVal) cpuVal.textContent = `${cpu}% // ${(3.8 + cpu * 0.02).toFixed(1)} GHz`;

  if (nnBar) nnBar.style.width = `${nn}%`;
  if (nnVal) nnVal.textContent = `${nn}% SYNAPSE FLUX`;

  if (ramBar) ramBar.style.width = `${ram}%`;
  if (ramVal) ramVal.textContent = `${ram} / 128 GB`;
}

// Themes & Protocols Controller
function initThemesAndProtocols() {
  const themeBtns = document.querySelectorAll('.theme-btn');
  const soundToggle = document.getElementById('sound-toggle');
  const protocolBtns = document.querySelectorAll('.protocol-btn');

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const themeVal = btn.getAttribute('data-theme-val');
      document.body.setAttribute('data-theme', themeVal);
      playSciFiSound('activate');
      addLogEntry('system', `[SYSTEM] Theme switched to protocol: ${themeVal.toUpperCase()}`);
    });
  });

  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      soundToggle.classList.toggle('active', sfxEnabled);
      if (sfxEnabled) playSciFiSound('beep');
    });
  }

  protocolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const protocol = btn.getAttribute('data-protocol');
      playSciFiSound('activate');
      executeProtocol(protocol);
    });
  });
}

function executeProtocol(protocol) {
  const coreStatus = document.getElementById('core-status');
  const coreSubtext = document.getElementById('core-subtext');

  if (protocol === 'house-party') {
    if (coreStatus) coreStatus.textContent = 'HOUSE PARTY';
    if (coreSubtext) coreSubtext.textContent = 'ALL SUITS DEPLOYED';
    addLogEntry('jarvis', '[JARVIS] House Party Protocol initiated, Boss. Deploying all autonomous iron suits.');
    speakText('House Party Protocol initiated, Boss. Deploying all suits.');
  } else if (protocol === 'sentry') {
    if (coreStatus) coreStatus.textContent = 'SENTRY ACTIVE';
    if (coreSubtext) coreSubtext.textContent = 'PERIMETER DEFENSE ON';
    addLogEntry('jarvis', '[JARVIS] Sentry mode active. Thermal sensors and automated defense systems armed.');
    speakText('Sentry mode active. Perimeter scanning on full alert.');
  } else if (protocol === 'stealth') {
    document.body.setAttribute('data-theme', 'violet');
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-theme-val') === 'violet');
    });
    if (coreStatus) coreStatus.textContent = 'STEALTH MODE';
    if (coreSubtext) coreSubtext.textContent = 'CLOAKING ENGAGED';
    addLogEntry('jarvis', '[JARVIS] Stealth cloaking engaged. Signal emissions minimized.');
    speakText('Stealth mode engaged, Sir.');
  } else if (protocol === 'clean-slate') {
    document.body.setAttribute('data-theme', 'cyan');
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-theme-val') === 'cyan');
    });
    if (coreStatus) coreStatus.textContent = 'JARVIS ACTIVE';
    if (coreSubtext) coreSubtext.textContent = 'SYSTEM RESET COMPLETE';
    addLogEntry('jarvis', '[JARVIS] System diagnostics restored to default baseline.');
    speakText('System reset complete.');
  }
}

// Arc Reactor Canvas Renderer
function initArcReactor() {
  const canvas = document.getElementById('arc-reactor-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;

  let angle1 = 0;
  let angle2 = 0;
  let angle3 = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const themeColor = getComputedStyle(document.body).getPropertyValue('--theme-primary').trim() || '#00f3ff';
    const themeSecondary = getComputedStyle(document.body).getPropertyValue('--theme-secondary').trim() || '#0066ff';

    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = themeColor;

    // 1. Outer Ring (dashed)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle1);
    ctx.beginPath();
    ctx.arc(0, 0, 220, 0, Math.PI * 2);
    ctx.strokeStyle = themeColor;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 18]);
    ctx.stroke();

    // Outer ticks
    ctx.globalAlpha = 1.0;
    for (let i = 0; i < 36; i++) {
      ctx.rotate((Math.PI * 2) / 36);
      ctx.beginPath();
      ctx.moveTo(225, 0);
      ctx.lineTo(235, 0);
      ctx.strokeStyle = i % 3 === 0 ? themeColor : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = i % 3 === 0 ? 3 : 1;
      ctx.stroke();
    }
    ctx.restore();

    // 2. Middle Counter-rotating Ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-angle2);
    ctx.beginPath();
    ctx.arc(0, 0, 170, 0, Math.PI * 2);
    ctx.strokeStyle = themeSecondary;
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 20, 10, 20]);
    ctx.stroke();

    // Arc segments
    ctx.beginPath();
    ctx.arc(0, 0, 185, 0, Math.PI * 0.7);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 185, Math.PI, Math.PI * 1.7);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 3. Inner Rotating Gear / Nodes Ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle3);
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.stroke();

    // Triangular Core Blades
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.moveTo(0, -90);
      ctx.lineTo(25, -50);
      ctx.lineTo(-25, -50);
      ctx.closePath();
      ctx.fillStyle = themeColor;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // 4. Center Glowing Energy Core
    const pulseRadius = 35 + Math.sin(Date.now() * 0.005) * 6;
    const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, pulseRadius + 30);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, themeColor);
    gradient.addColorStop(0.7, themeSecondary);
    gradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius + 30, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Update Angles
    angle1 += 0.004;
    angle2 += 0.008;
    angle3 += 0.012;

    requestAnimationFrame(draw);
  }

  draw();
}

// Radar Scanner Canvas Renderer
function initRadar() {
  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  let sweepAngle = 0;
  const targets = [
    { x: cx + 40, y: cy - 30, size: 4 },
    { x: cx - 50, y: cy + 20, size: 5 },
    { x: cx + 20, y: cy + 40, size: 3 }
  ];

  function drawRadar() {
    ctx.clearRect(0, 0, w, h);
    const themeColor = getComputedStyle(document.body).getPropertyValue('--theme-primary').trim() || '#00f3ff';

    // Concentric Radar Circles
    ctx.strokeStyle = themeColor;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    [25, 50, 70].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 75, cy);
    ctx.lineTo(cx + 75, cy);
    ctx.moveTo(cx, cy - 70);
    ctx.lineTo(cx, cy + 70);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Sweep Line & Gradient
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sweepAngle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 70, 0, Math.PI * 0.25);
    ctx.lineTo(0, 0);
    const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 70);
    sweepGrad.addColorStop(0, themeColor);
    sweepGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sweepGrad;
    ctx.globalAlpha = 0.4;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(70, 0);
    ctx.strokeStyle = themeColor;
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Draw Targets
    targets.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff6600';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 102, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    sweepAngle += 0.03;
    requestAnimationFrame(drawRadar);
  }

  drawRadar();
}

// Speech Recognition & TTS Integration
function initSpeechAndChat() {
  const micBtn = document.getElementById('mic-btn');
  const micText = document.getElementById('mic-text');
  const commandForm = document.getElementById('command-form');
  const commandInput = document.getElementById('command-input');
  const coreStatus = document.getElementById('core-status');

  let isListening = false;
  let recognition = null;

  // Web Speech Recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add('listening');
      micText.textContent = 'LISTENING...';
      if (coreStatus) coreStatus.textContent = 'LISTENING';
      playSciFiSound('beep');
      addLogEntry('system', '[SYSTEM] Voice recognition active. Listening...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      addLogEntry('user', `[BOSS] ${transcript}`);
      processCommand(transcript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      addLogEntry('system', `[SYSTEM] Voice input error: ${event.error}`);
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };
  } else {
    micBtn.addEventListener('click', () => {
      addLogEntry('system', '[SYSTEM] Web Speech Recognition API not supported in this browser. Please use text input below.');
      speakText('Web speech recognition is unavailable in this browser, Boss. Please use the text command input.');
    });
  }

  function stopListening() {
    isListening = false;
    micBtn.classList.remove('listening');
    micText.textContent = 'START VOICE LISTEN';
    if (coreStatus) coreStatus.textContent = 'JARVIS ACTIVE';
  }

  if (recognition) {
    micBtn.addEventListener('click', () => {
      if (!isListening) {
        recognition.start();
      } else {
        recognition.stop();
      }
    });
  }

  // Text Form Submission
  commandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = commandInput.value.trim();
    if (!query) return;

    playSciFiSound('beep');
    addLogEntry('user', `[BOSS] ${query}`);
    commandInput.value = '';
    processCommand(query);
  });

  // JARVIS AI Process & Response Engine
  function processCommand(input) {
    const lower = input.toLowerCase();
    let response = "";

    if (lower.includes('status') || lower.includes('diagnostic') || lower.includes('system')) {
      response = "All systems are operating at 100% capacity, Boss. Quantum encryption is active and arc reactor output is nominal.";
    } else if (lower.includes('weather') || lower.includes('temperature') || lower.includes('outside')) {
      response = "Current weather in Malibu is 22 degrees Celsius with clear skies. Perfect conditions for a flight.";
    } else if (lower.includes('mark') || lower.includes('suit') || lower.includes('armor')) {
      response = "Mark 85 armor is fully charged, prepped, and standing by in the main vault.";
    } else if (lower.includes('who are you') || lower.includes('name') || lower.includes('jarvis')) {
      response = "I am J.A.R.V.I.S., Just A Rather Very Intelligent System. At your service, Sir.";
    } else if (lower.includes('house party')) {
      executeProtocol('house-party');
      return;
    } else if (lower.includes('sentry')) {
      executeProtocol('sentry');
      return;
    } else if (lower.includes('stealth')) {
      executeProtocol('stealth');
      return;
    } else if (lower.includes('reset') || lower.includes('clean slate')) {
      executeProtocol('clean-slate');
      return;
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      response = "Greetings, Boss. Ready for your command.";
    } else {
      response = `Command "${input}" received and executed. Processing neural request algorithms now, Boss.`;
    }

    addLogEntry('jarvis', `[JARVIS] ${response}`);
    speakText(response);
  }
}

// Log Entry Handler
function addLogEntry(type, text) {
  const terminalLog = document.getElementById('terminal-log');
  if (!terminalLog) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = text;
  terminalLog.appendChild(entry);
  terminalLog.scrollTop = terminalLog.scrollHeight;
}

// Text-To-Speech Output
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.95;
    utterance.rate = 1.0;

    // Select British/English voice if available
    const voices = window.speechSynthesis.getVoices();
    const jarvisVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('Daniel') || v.name.includes('Google UK English Male'));
    if (jarvisVoice) {
      utterance.voice = jarvisVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}
