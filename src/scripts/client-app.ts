/**
 * client-app.ts
 * Main client-side orchestrator connecting 3D Three.js rendering,
 * mechanical simulation physics, real-time charts, telemetry DOM, and interactive quiz.
 */

import { EnginePhysicsEngine } from './engine/EnginePhysics';
import { EngineSimulation } from './engine/EngineSimulation';
import { EngineScene } from './engine/EngineScene';
import { PVDiagramChart } from './charts/PVDiagram';
import { ValveTimingChart } from './charts/ValveTiming';
import { ENGINE_COMPONENTS } from './engine/ComponentData';
import { QUIZ_QUESTIONS } from './quiz/QuizData';
import { TRANSLATIONS, type LanguageCode } from '../i18n/translations';
import { DEFAULT_GEOMETRY, DEFAULT_VALVE_TIMING } from './engine/EngineConstants';

// Clean up any stale service workers from prior development sessions
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
}

export function initEngineApp(): void {
  const container = document.getElementById('webgl-container');

  // 1. Initialize Simulation and Physics
  const physics = new EnginePhysicsEngine(DEFAULT_GEOMETRY, DEFAULT_VALVE_TIMING);
  const simulation = new EngineSimulation(physics, 1200);

  // 2. Initialize Charts
  const pvCanvas = document.getElementById('pv-canvas') as HTMLCanvasElement | null;
  let pvChart: PVDiagramChart | null = null;
  if (pvCanvas) {
    pvChart = new PVDiagramChart({
      canvas: pvCanvas,
      geometry: physics.getGeometry(),
      mode: 'realistic',
    });
  }

  const vtCanvas = document.getElementById('vt-canvas') as HTMLCanvasElement | null;
  let vtChart: ValveTimingChart | null = null;
  if (vtCanvas) {
    vtChart = new ValveTimingChart({
      canvas: vtCanvas,
      timingSettings: physics.getValveTiming(),
    });
  }

  // 3. Initialize Three.js Scene if container exists
  let scene: EngineScene | null = null;
  if (container) {
    try {
      scene = new EngineScene({
        container,
        simulation,
        onComponentSelected: (compId) => updateInspector(compId),
        onStateUpdate: (state) => {
          updateTelemetryDOM(state);
          if (pvChart) pvChart.updateState(state);
          if (vtChart) vtChart.updateState(state);
        },
      });

      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => (loadingOverlay.style.display = 'none'), 300);
      }
    } catch (err) {
      console.error('Failed to initialize WebGL Scene:', err);
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      const errBox = document.getElementById('webgl-error');
      if (errBox) {
        errBox.style.display = 'flex';
        const msg = errBox.querySelector('p');
        if (msg && err instanceof Error) {
          msg.textContent = `WebGL Initialization Notice: ${err.message}. Please enable Hardware Acceleration in browser settings (chrome://settings/system).`;
        }
      }
    }
  }

  // Multilingual State Initialization
  let currentLang: LanguageCode = 'en';
  try {
    const saved = localStorage.getItem('engine_sim_lang') as LanguageCode | null;
    if (saved && TRANSLATIONS[saved]) {
      currentLang = saved;
    }
  } catch {}

  // Fallback animation loop for standalone diagrams or when WebGL is unavailable
  if (!scene) {
    if (pvCanvas || vtCanvas || document.getElementById('tel-crank-angle')) {
      let lastTime = performance.now();
      const fallbackTick = (timestamp: number) => {
        const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
        lastTime = timestamp;
        simulation.tick(dt);
        const state = simulation.getCurrentState();
        updateTelemetryDOM(state);
        if (pvChart) pvChart.updateState(state);
        if (vtChart) vtChart.updateState(state);
        requestAnimationFrame(fallbackTick);
      };
      requestAnimationFrame(fallbackTick);
    }
  }

  // 4. DOM Elements for Telemetry
  const elCrankAngle = document.getElementById('tel-crank-angle');
  const elCamAngle = document.getElementById('tel-cam-angle');
  const elPistonDisp = document.getElementById('tel-piston-disp');
  const elPistonVel = document.getElementById('tel-piston-vel');
  const elPistonAcc = document.getElementById('tel-piston-acc');
  const elMeanSpeed = document.getElementById('tel-mean-speed');
  const elCylVol = document.getElementById('tel-cyl-vol');
  const elPressure = document.getElementById('tel-pressure');
  const elTemp = document.getElementById('tel-temp');
  const elImep = document.getElementById('tel-imep');
  const elPower = document.getElementById('tel-power');
  const elTorque = document.getElementById('tel-torque');

  const elStrokeBadge = document.getElementById('stroke-name-badge');
  const elStrokeDesc = document.getElementById('stroke-dynamic-desc');
  const elCycleNeedle = document.getElementById('cycle-needle');
  const elSparkDot = document.getElementById('val-spark-dot');
  const elSparkText = document.getElementById('val-spark-text');
  const elIntakeDot = document.getElementById('val-intake-dot');
  const elIntakeText = document.getElementById('val-intake-text');
  const elExhaustDot = document.getElementById('val-exhaust-dot');
  const elExhaustText = document.getElementById('val-exhaust-text');
  const elPistonDir = document.getElementById('val-piston-dir');
  const elPistonDirIcon = document.getElementById('val-piston-dir-icon');

  function updateTelemetryDOM(state: any): void {
    const { kinematics, cycle, valves, thermo, rpm } = state;

    // Angle & Kinematics
    if (elCrankAngle) elCrankAngle.textContent = kinematics.thetaDeg.toFixed(1);
    if (elCamAngle) elCamAngle.textContent = cycle.camAngleDeg.toFixed(1);
    if (elPistonDisp) elPistonDisp.textContent = (kinematics.displacement * 1000).toFixed(2);
    if (elPistonVel) elPistonVel.textContent = kinematics.velocity.toFixed(2);
    if (elPistonAcc) elPistonAcc.textContent = kinematics.acceleration.toFixed(0);
    if (elMeanSpeed) elMeanSpeed.textContent = thermo.meanPistonSpeed.toFixed(2);

    // Thermodynamics
    if (elCylVol) elCylVol.textContent = thermo.currentVolumeCc.toFixed(1);
    if (elPressure) elPressure.textContent = thermo.pressureBar.toFixed(2);
    if (elTemp) elTemp.textContent = thermo.temperatureC.toFixed(0);
    if (elImep) elImep.textContent = thermo.imepBar.toFixed(2);
    if (elPower) elPower.textContent = `${thermo.brakePowerKw.toFixed(2)}`;
    if (elTorque) elTorque.textContent = thermo.brakeTorqueNm.toFixed(2);

    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    // Timeline Needle
    if (elCycleNeedle) {
      const pct = (kinematics.thetaDeg / 720) * 100;
      elCycleNeedle.style.left = `${pct}%`;
    }

    // Stroke badge and class
    if (elStrokeBadge) {
      const badges = ['badge-intake', 'badge-compression', 'badge-power', 'badge-exhaust'];
      badges.forEach((b) => elStrokeBadge.classList.remove(b));
      elStrokeBadge.classList.add(`badge-${cycle.stroke}`);
      const strokeKey = `stroke_${cycle.strokeIndex}`;
      const strokeName = dict[strokeKey] || `${cycle.strokeIndex}. ${cycle.strokeName.toUpperCase()}`;
      elStrokeBadge.textContent = strokeName;
    }

    // Stroke dynamic explanation
    if (elStrokeDesc) {
      const descKey = `stroke_${cycle.stroke}_desc`;
      elStrokeDesc.textContent = dict[descKey] || '';
    }

    // Spark Plug status
    if (elSparkDot && elSparkText) {
      if (cycle.isSparkActive) {
        elSparkDot.className = 'status-dot dot-spark';
        const firingText = dict.val_firing || 'FIRING';
        elSparkText.textContent = `${firingText} (${(cycle.sparkIntensity * 100).toFixed(0)}%)`;
        elSparkText.style.color = '#67e8f9';
      } else {
        elSparkDot.className = 'status-dot dot-inactive';
        elSparkText.textContent = dict.val_off || 'OFF';
        elSparkText.style.color = 'var(--text-main)';
      }
    }

    // Inlet Valve status
    if (elIntakeDot && elIntakeText) {
      if (valves.isIntakeOpen) {
        elIntakeDot.className = 'status-dot dot-active';
        const openText = dict.val_open || 'OPEN';
        elIntakeText.textContent = `${openText} (${valves.intakeLift.toFixed(1)} mm)`;
      } else {
        elIntakeDot.className = 'status-dot dot-inactive';
        const seatedText = dict.val_seated || 'SEATED';
        elIntakeText.textContent = `${seatedText} (0.0 mm)`;
      }
    }

    // Exhaust Valve status
    if (elExhaustDot && elExhaustText) {
      if (valves.isExhaustOpen) {
        elExhaustDot.className = 'status-dot dot-active';
        const openText = dict.val_open || 'OPEN';
        elExhaustText.textContent = `${openText} (${valves.exhaustLift.toFixed(1)} mm)`;
      } else {
        elExhaustDot.className = 'status-dot dot-inactive';
        const seatedText = dict.val_seated || 'SEATED';
        elExhaustText.textContent = `${seatedText} (0.0 mm)`;
      }
    }

    // Piston Direction
    if (elPistonDir && elPistonDirIcon) {
      if (Math.abs(kinematics.velocity) < 0.05) {
        elPistonDir.textContent = dict.piston_dead_centre || 'At Dead Centre';
        elPistonDirIcon.textContent = '⏸';
      } else if (kinematics.velocity > 0) {
        elPistonDir.textContent = dict.piston_down || 'Down (TDC→BDC)';
        elPistonDirIcon.textContent = '↓';
      } else {
        elPistonDir.textContent = dict.piston_up || 'Up (BDC→TDC)';
        elPistonDirIcon.textContent = '↑';
      }
    }
  }

  // 5. Controls Bindings
  const btnPlayPause = document.getElementById('btn-play-pause');
  const iconPause = document.getElementById('icon-pause');
  const iconPlay = document.getElementById('icon-play');
  const labelPlayPause = document.getElementById('label-play-pause');

  function updatePlayPauseBtn(isPlaying: boolean): void {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (isPlaying) {
      if (iconPause) iconPause.style.display = 'block';
      if (iconPlay) iconPlay.style.display = 'none';
      if (labelPlayPause) labelPlayPause.textContent = dict.ctrl_pause || 'Pause';
    } else {
      if (iconPause) iconPause.style.display = 'none';
      if (iconPlay) iconPlay.style.display = 'block';
      if (labelPlayPause) labelPlayPause.textContent = dict.ctrl_start || 'Start';
    }
  }

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      const isRunning = simulation.togglePlay();
      updatePlayPauseBtn(isRunning);
    });
  }

  const btnStepBack = document.getElementById('btn-step-back');
  if (btnStepBack) {
    btnStepBack.addEventListener('click', () => {
      simulation.step(-10);
      updatePlayPauseBtn(false);
    });
  }

  const btnStepFwd = document.getElementById('btn-step-fwd');
  if (btnStepFwd) {
    btnStepFwd.addEventListener('click', () => {
      simulation.step(10);
      updatePlayPauseBtn(false);
    });
  }

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      simulation.reset();
    });
  }

  // Speed multiplier buttons
  const speedButtons = document.querySelectorAll('.speed-btn');
  speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      speedButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const val = parseFloat((btn as HTMLElement).dataset.speed || '1.0');
      simulation.setSpeedMultiplier(val);
    });
  });

  // RPM Slider & Presets
  const rpmSlider = document.getElementById('rpm-slider') as HTMLInputElement | null;
  const rpmBadge = document.getElementById('rpm-display-badge');
  const rpmPresetBtns = document.querySelectorAll('.rpm-preset-pill');

  function setRpm(rpm: number): void {
    simulation.setRpm(rpm);
    if (rpmSlider) rpmSlider.value = rpm.toString();
    if (rpmBadge) rpmBadge.textContent = `${rpm} RPM`;
    rpmPresetBtns.forEach((btn) => {
      if (parseInt((btn as HTMLElement).dataset.rpm || '0') === rpm) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  if (rpmSlider) {
    rpmSlider.addEventListener('input', () => {
      const val = parseInt(rpmSlider.value, 10);
      setRpm(val);
    });
  }

  rpmPresetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const rpm = parseInt((btn as HTMLElement).dataset.rpm || '1200', 10);
      setRpm(rpm);
    });
  });

  // Camera presets
  const cameraBtns = document.querySelectorAll('.camera-btn');
  cameraBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      cameraBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const view = (btn as HTMLElement).dataset.view as any;
      if (scene) scene.setCameraView(view);
    });
  });

  // Transparency toggle
  const btnTransparent = document.getElementById('btn-toggle-transparent');
  let isTransp = false;
  if (btnTransparent && scene) {
    btnTransparent.addEventListener('click', () => {
      isTransp = !isTransp;
      scene.model.setTransparentMode(isTransp);
      btnTransparent.classList.toggle('btn-active', isTransp);
    });
  }

  // Exploded view slider
  const explodedSlider = document.getElementById('exploded-slider') as HTMLInputElement | null;
  const explodedVal = document.getElementById('exploded-val');
  if (explodedSlider && scene) {
    explodedSlider.addEventListener('input', () => {
      const val = parseInt(explodedSlider.value, 10);
      if (explodedVal) explodedVal.textContent = `${val}%`;
      scene.model.setExplodedFactor(val / 100);
    });
  }

  // Fullscreen button
  const btnFullscreen = document.getElementById('btn-fullscreen');
  if (btnFullscreen && container) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  // 6. Component Inspector
  const inspectorEmpty = document.getElementById('inspector-empty');
  const inspectorContent = document.getElementById('inspector-content');
  const btnIsolateComp = document.getElementById('btn-isolate-comp');
  const btnClearSelection = document.getElementById('btn-clear-selection');

  const compName = document.getElementById('comp-name');
  const compCategory = document.getElementById('comp-category');
  const compDef = document.getElementById('comp-def');
  const compFunc = document.getElementById('comp-func');
  const compMove = document.getElementById('comp-move');
  const compMat = document.getElementById('comp-mat');

  let activeComponentId: string | null = null;
  let isIsolated = false;

  function updateInspector(componentId: string | null): void {
    activeComponentId = componentId;
    isIsolated = false;
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (btnIsolateComp) {
      btnIsolateComp.textContent = dict.ctrl_isolate || 'Isolate Component';
      btnIsolateComp.classList.remove('btn-active');
    }

    if (!componentId || !ENGINE_COMPONENTS[componentId]) {
      if (inspectorEmpty) inspectorEmpty.style.display = 'flex';
      if (inspectorContent) inspectorContent.style.display = 'none';
      if (btnIsolateComp) btnIsolateComp.style.display = 'none';
      if (btnClearSelection) btnClearSelection.style.display = 'none';
      return;
    }

    const info = ENGINE_COMPONENTS[componentId];
    if (inspectorEmpty) inspectorEmpty.style.display = 'none';
    if (inspectorContent) inspectorContent.style.display = 'flex';
    if (btnIsolateComp) btnIsolateComp.style.display = 'inline-flex';
    if (btnClearSelection) btnClearSelection.style.display = 'inline-flex';

    const compKey = `comp_${componentId}`;
    const nameText = dict[compKey] || info.name;
    const catKey = `cat_${info.category}`;
    const catText = dict[catKey] || info.category.toUpperCase();
    const defText = dict[`${compKey}_def`] || info.definition;
    const funcText = dict[`${compKey}_func`] || info.function;
    const moveText = dict[`${compKey}_move`] || info.movement;
    const matText = dict[`${compKey}_mat`] || `${info.material} (${info.specifications})`;

    if (compName) compName.textContent = nameText;
    if (compCategory) compCategory.textContent = catText;
    if (compDef) compDef.textContent = defText;
    if (compFunc) compFunc.textContent = funcText;
    if (compMove) compMove.textContent = moveText;
    if (compMat) compMat.textContent = matText;
  }

  if (btnIsolateComp && scene) {
    btnIsolateComp.addEventListener('click', () => {
      isIsolated = !isIsolated;
      const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      if (isIsolated) {
        scene.model.isolateComponent(activeComponentId);
        btnIsolateComp.textContent = dict.ctrl_restore || 'Restore Assembly';
        btnIsolateComp.classList.add('btn-active');
      } else {
        scene.model.isolateComponent(null);
        btnIsolateComp.textContent = dict.ctrl_isolate || 'Isolate Component';
        btnIsolateComp.classList.remove('btn-active');
      }
    });
  }

  if (btnClearSelection && scene) {
    btnClearSelection.addEventListener('click', () => {
      scene.model.highlightComponent(null);
      scene.model.isolateComponent(null);
      updateInspector(null);
    });
  }

  // Quick inspect buttons
  const quickBtns = document.querySelectorAll('.comp-quick-btn');
  quickBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const compId = (btn as HTMLElement).dataset.comp;
      if (compId && scene) {
        scene.model.highlightComponent(compId);
        updateInspector(compId);
      }
    });
  });

  // 7. Chart Mode Toggles
  const pvModeBtns = document.querySelectorAll('.pv-mode-btn');
  pvModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      pvModeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = (btn as HTMLElement).dataset.mode as any;
      if (pvChart) pvChart.setMode(mode);
    });
  });

  const vtModeBtns = document.querySelectorAll('.vt-mode-btn');
  vtModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      vtModeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = (btn as HTMLElement).dataset.mode as any;
      physics.setValveTiming({ mode });
      if (vtChart) vtChart.setSettings(physics.getValveTiming());
    });
  });

  // 8. Quiz System
  let currentQuizIndex = 0;
  let quizScore = 0;
  let selectedOptionIndex: number | null = null;

  const quizProgress = document.getElementById('quiz-progress-text');
  const quizScoreNum = document.getElementById('quiz-score-num');
  const quizTotalAttempted = document.getElementById('quiz-total-attempted');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsList = document.getElementById('quiz-options-list');
  const quizFeedbackBox = document.getElementById('quiz-feedback-box');
  const quizFeedbackHeader = document.getElementById('quiz-feedback-header');
  const quizFeedbackText = document.getElementById('quiz-feedback-text');
  const btnQuizSubmit = document.getElementById('btn-quiz-submit') as HTMLButtonElement | null;
  const btnQuizNext = document.getElementById('btn-quiz-next');

  function renderQuizQuestion(index: number): void {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (index >= QUIZ_QUESTIONS.length) {
      if (quizQuestionText) {
        const compl = dict.quiz_complete || 'Quiz Complete! You scored';
        const ofStr = dict.quiz_progress_of || 'of';
        quizQuestionText.textContent = `${compl} ${quizScore} ${ofStr} ${QUIZ_QUESTIONS.length}.`;
      }
      if (quizOptionsList) quizOptionsList.innerHTML = '';
      if (btnQuizSubmit) btnQuizSubmit.style.display = 'none';
      if (btnQuizNext) {
        btnQuizNext.style.display = 'inline-flex';
        btnQuizNext.textContent = dict.quiz_restart || 'Restart Quiz ↺';
      }
      return;
    }

    selectedOptionIndex = null;
    const q = QUIZ_QUESTIONS[index];
    if (quizProgress) {
      const qPrefix = dict.quiz_progress_prefix || 'Question';
      const ofStr = dict.quiz_progress_of || 'of';
      quizProgress.textContent = `${qPrefix} ${index + 1} ${ofStr} ${QUIZ_QUESTIONS.length}`;
    }
    if (quizQuestionText) quizQuestionText.textContent = q.question;
    if (quizFeedbackBox) quizFeedbackBox.style.display = 'none';
    if (btnQuizSubmit) {
      btnQuizSubmit.style.display = 'inline-flex';
      btnQuizSubmit.disabled = true;
      btnQuizSubmit.textContent = dict.quiz_submit || 'Submit Answer';
    }
    if (btnQuizNext) {
      btnQuizNext.style.display = 'none';
      btnQuizNext.textContent = dict.quiz_next || 'Next Question →';
    }

    if (quizOptionsList) {
      quizOptionsList.innerHTML = '';
      q.options.forEach((opt, optIdx) => {
        const label = document.createElement('label');
        label.className = 'quiz-option-label';
        label.innerHTML = `
          <input type="radio" name="quiz-opt" value="${optIdx}" style="margin-right: 0.75rem;" />
          <span>${opt}</span>
        `;
        label.addEventListener('click', () => {
          document.querySelectorAll('.quiz-option-label').forEach((l) => l.classList.remove('selected'));
          label.classList.add('selected');
          selectedOptionIndex = optIdx;
          if (btnQuizSubmit) btnQuizSubmit.disabled = false;
        });
        quizOptionsList.appendChild(label);
      });
    }
  }

  if (btnQuizSubmit) {
    btnQuizSubmit.addEventListener('click', () => {
      if (selectedOptionIndex === null) return;
      const q = QUIZ_QUESTIONS[currentQuizIndex];
      const isCorrect = selectedOptionIndex === q.correctIndex;
      const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

      if (isCorrect) quizScore++;
      if (quizScoreNum) quizScoreNum.textContent = quizScore.toString();
      if (quizTotalAttempted) quizTotalAttempted.textContent = (currentQuizIndex + 1).toString();

      // Show highlighting on options
      const labels = document.querySelectorAll('.quiz-option-label');
      labels.forEach((lbl, idx) => {
        if (idx === q.correctIndex) {
          lbl.classList.add('correct');
        } else if (idx === selectedOptionIndex) {
          lbl.classList.add('incorrect');
        }
      });

      if (quizFeedbackBox && quizFeedbackHeader && quizFeedbackText) {
        quizFeedbackBox.style.display = 'flex';
        if (isCorrect) {
          quizFeedbackHeader.className = 'feedback-badge correct';
          quizFeedbackHeader.textContent = dict.quiz_correct_badge || 'Correct Answer!';
        } else {
          quizFeedbackHeader.className = 'feedback-badge incorrect';
          quizFeedbackHeader.textContent = dict.quiz_incorrect_badge || 'Incorrect Answer';
        }
        quizFeedbackText.textContent = q.explanation;
      }

      btnQuizSubmit.style.display = 'none';
      if (btnQuizNext) {
        btnQuizNext.style.display = 'inline-flex';
        btnQuizNext.textContent = dict.quiz_next || 'Next Question →';
      }
    });
  }

  if (btnQuizNext) {
    btnQuizNext.addEventListener('click', () => {
      if (currentQuizIndex >= QUIZ_QUESTIONS.length) {
        currentQuizIndex = 0;
        quizScore = 0;
        if (quizScoreNum) quizScoreNum.textContent = '0';
        if (quizTotalAttempted) quizTotalAttempted.textContent = '0';
      } else {
        currentQuizIndex++;
      }
      renderQuizQuestion(currentQuizIndex);
    });
  }

  // Initial question load
  renderQuizQuestion(0);

  // 9. Challenge Mode Logic
  let chStreak = 0;
  let chScore = 0;
  let chAttempts = 0;

  const chStreakEl = document.getElementById('ch-streak');
  const chScoreEl = document.getElementById('ch-score');
  const chAccuracyEl = document.getElementById('ch-accuracy');
  const chFeedbackEl = document.getElementById('ch-feedback');
  const chFeedbackIcon = document.getElementById('ch-feedback-icon');
  const chFeedbackMsg = document.getElementById('ch-feedback-msg');

  const chStrokeBtns = document.querySelectorAll('.ch-stroke-btn');
  chStrokeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const guessedStroke = (btn as HTMLElement).dataset.stroke;
      const curState = simulation.getCurrentState();
      const actualStroke = curState.cycle.stroke;
      chAttempts++;
      const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

      if (guessedStroke === actualStroke) {
        chStreak++;
        chScore += 100 * chStreak;
        if (chFeedbackEl && chFeedbackIcon && chFeedbackMsg) {
          chFeedbackEl.className = 'challenge-feedback correct';
          chFeedbackEl.style.display = 'flex';
          chFeedbackIcon.textContent = '✓';
          const strokeName = dict[`stroke_${actualStroke}`] || actualStroke.toUpperCase();
          chFeedbackMsg.textContent = `${dict.ch_correct || 'Spot on!'} (${strokeName}, +${100 * chStreak} pts)`;
        }
      } else {
        chStreak = 0;
        if (chFeedbackEl && chFeedbackIcon && chFeedbackMsg) {
          chFeedbackEl.className = 'challenge-feedback incorrect';
          chFeedbackEl.style.display = 'flex';
          chFeedbackIcon.textContent = '✗';
          const strokeName = dict[`stroke_${actualStroke}`] || actualStroke.toUpperCase();
          chFeedbackMsg.textContent = `${dict.ch_incorrect || 'Incorrect:'} (${strokeName})`;
        }
      }

      if (chStreakEl) chStreakEl.textContent = chStreak.toString();
      if (chScoreEl) chScoreEl.textContent = chScore.toString();
      if (chAccuracyEl) {
        const acc = ((chScore > 0 ? (chAttempts - (chAttempts - Math.floor(chScore / 100))) : 0) / chAttempts) * 100;
        chAccuracyEl.textContent = `${Math.min(100, Math.round((chScore / (chAttempts * 100)) * 100))}%`;
      }
    });
  });

  // Quiz tab switcher
  const tabQuizMcq = document.getElementById('tab-quiz-mcq');
  const tabQuizCh = document.getElementById('tab-quiz-challenge');
  const viewQuizMcq = document.getElementById('view-quiz-mcq');
  const viewQuizCh = document.getElementById('view-quiz-challenge');

  if (tabQuizMcq && tabQuizCh && viewQuizMcq && viewQuizCh) {
    tabQuizMcq.addEventListener('click', () => {
      tabQuizMcq.classList.add('active');
      tabQuizCh.classList.remove('active');
      viewQuizMcq.style.display = 'flex';
      viewQuizCh.style.display = 'none';
    });

    tabQuizCh.addEventListener('click', () => {
      tabQuizCh.classList.add('active');
      tabQuizMcq.classList.remove('active');
      viewQuizCh.style.display = 'flex';
      viewQuizMcq.style.display = 'none';
    });
  }

  // 10. Multilingual Selector Handler
  const langSelect = document.getElementById('language-select') as HTMLSelectElement | null;
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', () => {
      const lang = langSelect.value as LanguageCode;
      applyLanguage(lang);
    });
  }

  function applyLanguage(lang: LanguageCode): void {
    if (!TRANSLATIONS[lang]) lang = 'en';
    currentLang = lang;
    try {
      localStorage.setItem('engine_sim_lang', lang);
    } catch {}

    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    if (langSelect && langSelect.value !== lang) {
      langSelect.value = lang;
    }

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = (el as HTMLElement).dataset.i18n;
      if (key && dict[key]) {
        el.textContent = dict[key];
      }
    });

    updatePlayPauseBtn(simulation.isRunning());
    if (activeComponentId) {
      updateInspector(activeComponentId);
    }
    updateTelemetryDOM(simulation.getCurrentState());
    renderQuizQuestion(currentQuizIndex);
  }

  // Apply active/saved language across all DOM elements immediately
  applyLanguage(currentLang);

  // 11. Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.code === 'Space') {
      e.preventDefault();
      const isRunning = simulation.togglePlay();
      updatePlayPauseBtn(isRunning);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      simulation.step(10);
      updatePlayPauseBtn(false);
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      simulation.step(-10);
      updatePlayPauseBtn(false);
    } else if (e.code === 'KeyR') {
      simulation.reset();
    }
  });
}

// Auto initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngineApp);
  } else {
    initEngineApp();
  }
}

