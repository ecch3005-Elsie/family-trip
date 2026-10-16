/* Read-only NPC dialogue. No data, network or game-state integration. */
(function () {
  "use strict";
  var opener = document.getElementById("npc-task-open");
  var dialog = document.getElementById("npc-task-dialog");
  var closeButton = document.getElementById("npc-task-close");
  var soundButton = document.getElementById("npc-task-sound");
  if (!opener || !dialog || !closeButton || !soundButton) return;
  var enabled = true;
  var audio = null;
  var voices = [];
  var savedScroll = 0;
  var previousOverflow = "";

  function silence() {
    voices.forEach(function (voice) { try { voice.stop(); } catch (ignore) {} });
    voices = [];
  }

  function sound(kind) {
    if (!enabled) return;
    try {
      var Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      if (audio.state === "suspended") {
        var resumed = audio.resume();
        if (resumed && resumed.catch) resumed.catch(function () {});
      }
      silence();
      var now = audio.currentTime;
      function tone(start, duration, from, to, volume, type) {
        var oscillator = audio.createOscillator();
        var gain = audio.createGain();
        oscillator.type = type || "sine";
        oscillator.frequency.setValueAtTime(from, now + start);
        oscillator.frequency.exponentialRampToValueAtTime(to, now + start + duration);
        // Gentle attack and fuller body: louder than v1 without a sharp transient.
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.025);
        gain.gain.linearRampToValueAtTime(volume * 0.65, now + start + duration * 0.55);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        voices.push(oscillator);
        oscillator.onended = function () {
          oscillator.disconnect(); gain.disconnect();
          var index = voices.indexOf(oscillator);
          if (index >= 0) voices.splice(index, 1);
        };
        oscillator.start(now + start);
        oscillator.stop(now + start + duration + 0.02);
      }
      if (kind === "open") {
        // Arrival: 1.35 seconds. Moderate pitches, peak voice gain capped at 0.16.
        tone(0, 0.38, 523.25, 523.25, 0.14, "triangle");
        tone(0.30, 0.38, 659.25, 659.25, 0.14, "triangle");
        tone(0.60, 0.38, 783.99, 783.99, 0.15, "triangle");
        tone(0.88, 0.45, 1046.5, 1046.5, 0.16, "triangle");
        // One dialogue cue: 0.65 seconds, after arrival; never tied to scrolling.
        tone(1.40, 0.14, 460, 720, 0.10);
        tone(1.60, 0.14, 550, 850, 0.10);
        tone(1.80, 0.23, 650, 980, 0.11);
      } else {
        // Closing: 0.77 seconds. New gestures cancel all pending old voices.
        tone(0, 0.75, 600, 160, 0.10);
      }
    } catch (ignore) { /* Audio is optional; the dialogue always works. */ }
  }

  opener.addEventListener("click", function () {
    if (dialog.open) return;
    savedScroll = window.scrollY;
    previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    closeButton.focus({ preventScroll: true });
    sound("open");
  });
  closeButton.addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("close", function () {
    document.documentElement.style.overflow = previousOverflow;
    opener.focus({ preventScroll: true });
    window.scrollTo(0, savedScroll);
    sound("close");
  });
  dialog.addEventListener("click", function (event) {
    if (event.target !== dialog) return;
    var rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  soundButton.addEventListener("click", function () {
    enabled = !enabled;
    soundButton.setAttribute("aria-pressed", enabled ? "true" : "false");
    soundButton.textContent = enabled ? "音效：開" : "音效：關";
    if (!enabled) silence();
  });
})();
