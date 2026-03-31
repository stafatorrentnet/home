// === GLOBAL STATE ===
let noises = [], currentNoise = null;
let noiseTimer = 0, noiseDuration = 0;

let effects = ['filter', 'distortion', 'reverb', 'delay'];
let currentEffect = null, lastFXUpdate = 0, fxUpdateInterval = 0;

let filter, distortion, reverb, delay;

let samples = [], sampleQueue = [];
let currentSample = null, lastSampleTime = 0, sampleChangeInterval = 0;

let glitchTime = 0, glitchDuration = 1000;
let flashTimer = 0, flashDuration = 200;
let lastHeartbeat = 0, watchdogInterval = 10000;
let lastRestartTime = 0, restartInterval = 180000;

let bgImage, kodamImage;
let customFont, blinkState = true, blinkInterval = 500;

// === SETUP ===
function preload() {
  bgImage = loadImage('SFNN.jpg');
  kodamImage = loadImage('kodamm.png');
  customFont = loadFont('PressStart2P-Regular.ttf');

  const files = ['azizi', 'skibidi', 'mistika', 'Biang', 'Amatir', 'warkop', 'hart', 'bunuh', 'emosi'];
  files.forEach(f => samples.push(loadSound(f + '.mp3')));
}

function setup() {
  setupResponsiveCanvas();
  userStartAudio();

  ['white', 'pink', 'brown', 'blue', 'violet', 'grey'].forEach(type => {
    let n = new p5.Noise(type);
    n.start();
    n.amp(0);
    noises.push(n);
  });

  filter = new p5.LowPass();
  distortion = new p5.Distortion();
  reverb = new p5.Reverb();
  delay = new p5.Distortion();

  glitchTime = millis();
  lastFXUpdate = millis();
  fxUpdateInterval = random(6000, 10000);
  lastSampleTime = millis();
  sampleChangeInterval = random(10000, 20000);
  noiseDuration = random(4000, 8000);
  shuffleSamples();

  setInterval(checkWatchdog, 5000);
  setInterval(checkRestart, 5000);
}

function setupResponsiveCanvas() {
  let aspectRatio = 16 / 9;
  let w = windowWidth;
  let h = windowWidth / aspectRatio;
  if (h > windowHeight) {
    h = windowHeight;
    w = h * aspectRatio;
  }
  const canvas = createCanvas(w, h);
  canvas.parent('canvas-container'); // Menempatkan canvas di dalam div dengan id canvas-container
}

function windowResized() {
  setupResponsiveCanvas();
}

// === DRAW LOOP ===
function draw() {
  safeRun(() => {
    image(bgImage, 0, 0, width, height);

    handleTimers();
    handleVisuals();
    displayDebugText();

  }, 'draw');

  heartbeat();
}

// === AUDIO + EFFECT LOGIC ===
function playRandomNoise() {
  if (currentNoise) currentNoise.amp(0);
  currentNoise = random(noises);
  currentNoise.amp(random(1, 2));
  currentNoise.pan(random(-0.5, 0.5));
  noiseTimer = millis();
  flashTimer = millis();
}

function updateEffect() {
  currentEffect = random(effects);
  noises.concat(samples).forEach(source => {
    if (!source) return;
    source.disconnect();

    switch (currentEffect) {
      case 'filter':
        source.connect(filter);
        filter.freq(random(500, 1000));
        filter.res(random(1, 10));
        break;
      case 'distortion':
        source.connect(distortion);
        distortion.set(random(0.5, 1));
        break;
      case 'reverb':
        source.connect(reverb);
        reverb.set(random(2, 8), random(2, 8));
        break;
      case 'delay':
        source.connect(delay);
        delay.process(source, random(0.1, 0.5), random(0.5, 0.9), 1500);
        break;
    }
  });
  flashTimer = millis();
}

function triggerRandomSample() {
  if (currentSample?.isPlaying()) currentSample.stop();
  if (sampleQueue.length === 0) shuffleSamples();

  currentSample = sampleQueue.pop();
  if (!currentSample?.isLoaded()) return;

  currentSample.rate(random(0.85, 1.15));
  currentSample.setVolume(random(0.6, 1.5));
  currentSample.pan(random(-0.4, 0.4));
  currentSample.play();

  setTimeout(() => {
    if (currentSample?.isPlaying()) currentSample.stop();
  }, random(5000, 200000));

  flashTimer = millis();
}

function shuffleSamples() {
  sampleQueue = shuffle([...samples]);
}

// === WATCHDOG / RESTART ===
function checkWatchdog() {
  if (millis() - lastHeartbeat > watchdogInterval) {
    console.warn("Watchdog triggered: Reloading...");
    location.reload();
  }
}

function checkRestart() {
  if (millis() - lastRestartTime > restartInterval) {
    console.warn("Restarting program after interval...");
    restartProgram();
  }
}

function restartProgram() {
  noises.forEach(n => n.stop());
  samples.forEach(s => s.stop());

  glitchTime = millis();
  lastFXUpdate = millis();
  fxUpdateInterval = random(6000, 10000);
  lastSampleTime = millis();
  sampleChangeInterval = random(10000, 20000);
  noiseDuration = random(4000, 8000);
  shuffleSamples();
  location.reload();
}

// === VISUALS ===
function handleVisuals() {
  if (millis() % 2000 < 500) {
    tint(random(100, 255), random(100, 255), random(100, 255));
  } else {
    noTint();
  }

  let imgRatio = kodamImage.width / kodamImage.height;
  let imgHeight = height * 0.6;
  let imgWidth = imgHeight * imgRatio;

  image(kodamImage, 0, 0, width, height);

  if (millis() % blinkInterval < blinkInterval / 2) {
    drawOutlinedText("A Z A B _ P R O M P T E R _ L A K N A T", width / 2, height - 20);
  }
}

function drawOutlinedText(txt, x, y) {
  const fontSize = height / 32;
  const lineSpacing = height * 0.01;
  textFont(customFont);
  textSize(fontSize);
  textAlign(CENTER);

  stroke(0);
  strokeWeight(height * 0.01);
  fill(0, 255, 0);
  text(txt, x, y);

  noStroke();
}

function displayDebugText() {
  let headerY = height * 0.08;
  drawOutlinedText("GENERATING_AZAB_STAFATORRENTNET", width / 2, headerY);
  drawOutlinedText(`fx ${currentEffect}, ~${currentNoise?.getType() || 'none'}~noise ${nf((millis() - noiseTimer) / 1000, 1, 2)}hz`, width / 2, headerY + 20);
  drawOutlinedText(`fx~int ${nf(fxUpdateInterval / 1000, 1, 2)}s, smpl~int ${nf(sampleChangeInterval / 1000, 1, 2)}s`, width / 2, headerY + 40);
}

// === UTILITY ===
function heartbeat() {
  lastHeartbeat = millis();
}

function handleTimers() {
  if (millis() - glitchTime > glitchDuration) {
    glitchTime = millis();
    playRandomNoise();
  }

  if (millis() - lastFXUpdate > fxUpdateInterval) {
    safeRun(updateEffect, 'updateEffect');
    lastFXUpdate = millis();
    fxUpdateInterval = random(6000, 10000);
  }

  if (millis() - lastSampleTime > sampleChangeInterval) {
    safeRun(triggerRandomSample, 'triggerRandomSample');
    lastSampleTime = millis();
    sampleChangeInterval = random(10000, 20000);
  }

  if (currentNoise && millis() - noiseTimer > noiseDuration) {
    currentNoise.amp(0);
    currentNoise = null;
    noiseDuration = random(4000, 8000);
  }
}

function safeRun(fn, label = 'safeRun') {
  try {
    fn();
  } catch (e) {
    console.error(`[${label}]`, e);
  }
}

// === GLOBAL ERROR HANDLING ===
window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.error("Caught error:", msg, "at", lineNo, ":", columnNo);
  setTimeout(() => {
    console.log("Reloading after error...");
    location.reload();
  }, 200000);
  return false;
};

window.addEventListener('unhandledrejection', function (event) {
  console.error("Unhandled rejection:", event.reason);
  setTimeout(() => {
    console.log("Reloading after unhandled rejection...");
    location.reload();
  }, 1000);
});
