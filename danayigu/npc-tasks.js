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
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.012);
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
        tone(0, 0.16, 880, 880, 0.045, "triangle");
        tone(0.16, 0.22, 1175, 1175, 0.035, "triangle");
        tone(0.39, 0.08, 520, 850, 0.025);
        tone(0.50, 0.09, 660, 1000, 0.022);
      } else {
        tone(0, 0.24, 700, 180, 0.025);
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
