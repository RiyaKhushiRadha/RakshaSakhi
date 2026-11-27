/**
 * tfjs-voice.js - on-device "help" keyword detection for RakshaSakhi.
 * Needs tf.min.js and speech-commands.min.js loaded BEFORE this file.
 */
const VoiceTrigger = (() => {
  // ---- Tunable settings ----
  const EXAMPLES_URL = '/assets/model/help-examples.bin';
  const KEYWORD = 'help';
  const THRESHOLD = 0.82;      // balanced sensitivity for reliable "help" detection
  const COOLDOWN_MS = 10000;   // ignore repeat triggers for this long
  const TRAIN_EPOCHS = 8;

  let transfer = null;
  let ready = false;
  let listening = false;
  let active = false;
  let runToken = 0;
  let lastFire = 0;
  let preparingPromise = null;
  const events = [];

  function withTimeout(promise, ms, label) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms);
      })
    ]).finally(() => clearTimeout(timer));
  }

  async function prepare(onStatus = () => {}) {
    if (ready) return;
    if (preparingPromise) return preparingPromise;

    preparingPromise = (async () => {
      try {
        await withTimeout((async () => {
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
        })(), 25000, 'Voice model preparation');
      } finally {
        preparingPromise = null;
      }
    })();

    return preparingPromise;
  }

  async function start({ onStatus = () => {}, onTrigger = () => {} } = {}) {
    const token = ++runToken;
    await prepare(onStatus);
    if (token !== runToken) return;
    if (listening) return;

    const labels = transfer.wordLabels();
    const keywordIdx = labels.indexOf(KEYWORD);
    if (keywordIdx < 0) {
      throw new Error('Label "' + KEYWORD + '" not found in saved examples');
    }

    active = true;
    await transfer.listen(result => {
      if (!active || !listening || token !== runToken) return;
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

    if (token !== runToken || !active) {
      try {
        if (transfer) transfer.stopListening();
      } catch (e) { }
      listening = false;
      return;
    }

    listening = true;
    onStatus('Listening for "' + KEYWORD + '"');
  }

  function stop() {
    runToken++;
    active = false;
    listening = false;
    try {
      if (transfer) transfer.stopListening();
    } catch (e) {
      console.warn('[VoiceTrigger] stopListening notice:', e);
    } finally {
      listening = false;
    }
  }

  return {
    preload: (onStatus = () => {}) => prepare(onStatus),
    start,
    stop,
    isListening: () => listening,
    isReady: () => ready,
    events
  };
})();