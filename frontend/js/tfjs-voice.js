/**
 * tfjs-voice.js - on-device "help" keyword detection for RakshaSakhi.
 * Needs tf.min.js and speech-commands.min.js loaded BEFORE this file.
 */
const VoiceTrigger = (() => {
  // ---- Tunable settings ----
  const EXAMPLES_URL = '/assets/model/help-examples.bin';
  const KEYWORD = 'help';
  const THRESHOLD = 0.85;      // higher = fewer false triggers, more misses
  const COOLDOWN_MS = 10000;   // ignore repeat triggers for this long
  const TRAIN_EPOCHS = 25;

  let transfer = null;
  let ready = false;
  let listening = false;
  let lastFire = 0;
  const events = [];

  async function prepare(onStatus) {
    if (ready) return;
    onStatus('Loading voice model…');
    const base = speechCommands.create('BROWSER_FFT');
    await base.ensureModelLoaded();
    transfer = base.createTransfer('rakshasakhi-help');

    onStatus('Loading saved voice samples…');
    const res = await fetch(EXAMPLES_URL);
    if (!res.ok) {
      throw new Error('help-examples.bin not found at ' + EXAMPLES_URL);
    }
    transfer.loadExamples(await res.arrayBuffer(), false);

    onStatus('Training voice model… (a few seconds)');
    await transfer.train({ epochs: TRAIN_EPOCHS });
    ready = true;
  }

  async function start({ onStatus = () => {}, onTrigger = () => {} } = {}) {
    await prepare(onStatus);
    if (listening) return;

    const labels = transfer.wordLabels();
    const keywordIdx = labels.indexOf(KEYWORD);
    if (keywordIdx < 0) {
      throw new Error('Label "' + KEYWORD + '" not found in saved examples');
    }

    await transfer.listen(result => {
      const score = result.scores[keywordIdx];
      const now = Date.now();
      if (score >= THRESHOLD && now - lastFire > COOLDOWN_MS) {
        lastFire = now;
        const evt = { score: Number(score.toFixed(3)), time: new Date(now).toISOString() };
        events.push(evt);
        console.log('[VoiceTrigger] "' + KEYWORD + '" detected', evt);
        onTrigger(evt);
      }
    }, {
      probabilityThreshold: 0.5,
      overlapFactor: 0.5,
      invokeCallbackOnNoiseAndUnknown: true
    });

    listening = true;
    onStatus('Listening for "' + KEYWORD + '"');
  }

  function stop() {
    if (transfer && listening) transfer.stopListening();
    listening = false;
  }

  return { start, stop, isListening: () => listening, events };
})();