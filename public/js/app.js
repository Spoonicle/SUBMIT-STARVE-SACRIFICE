/* ==========================================================================
   LIVE ASCII STREAM ENGINE - FRONTEND CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core ASCII Engine
  const engine = new AsciiEngine('ascii-canvas');
  engine.render(performance.now());

  // Connect to Live Server-Sent Events (SSE) Stream (with automatic static fallback for GitHub Pages)
  let eventSource = null;
  let fallbackInterval = null;
  let connectionAttempts = 0;

  function startLocalFallbackStream() {
    if (fallbackInterval) return;
    let localTick = 0;
    const startTime = Date.now();
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const hex = '0123456789ABCDEFx0123456789abcdef';
    const symbols = '!@#$%^&*()_+-=[]{}|;:\'",.<>/?`~\\';

    function getRandomChunk(length, charSet) {
      let res = '';
      for (let i = 0; i < length; i++) {
        res += charSet[Math.floor(Math.random() * charSet.length)];
      }
      return res;
    }

    fallbackInterval = setInterval(() => {
      localTick++;
      engine.updateLiveServerData({
        tick: localTick,
        timestamp: Date.now(),
        serverUptime: Math.floor((Date.now() - startTime) / 1000),
        activeClients: 1,
        cpuUsage: (0.12 + Math.random() * 0.08).toFixed(2),
        asciiChunk: getRandomChunk(120, chars),
        hexChunk: getRandomChunk(60, hex),
        symbolsChunk: getRandomChunk(60, symbols)
      });
    }, 50);
  }

  function connectSseStream() {
    try {
      eventSource = new EventSource('/api/ascii-stream');

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
          engine.updateLiveServerData(data);
        } catch (err) {
          // Parse fallback
        }
      };

      eventSource.onerror = () => {
        connectionAttempts++;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (connectionAttempts >= 2) {
          // Fall back to local client-side ticker on static hosts (e.g. GitHub Pages)
          startLocalFallbackStream();
        } else {
          setTimeout(connectSseStream, 2000);
        }
      };
    } catch (e) {
      startLocalFallbackStream();
    }
  }

  connectSseStream();

  // 1. Current Looping Phrase & Speed Setup
  let currentLoopPhrase = " SUBMIT STARVE SACRIFICE  ";
  let currentLoopInterval = 1600; // Default 1.6s speed
  let phraseIndex = 0;
  let isStarted = true;
  let isFreeTypeUnlocked = false;
  let isPostInvertMode = false;
  let userCustomPhrase = "";
  let isCurrentlyLoopingUserPhrase = false;
  let sequenceTimer = null;
  let feastDisappearTimer = null;
  let loopStartTimer = null;

  // 2. Data-Driven Secret Phrases Registry
  const secretPhrasesRegistry = [
    {
      phrase: "TAKE MY FLESH",
      action: () => {
        isFreeTypeUnlocked = true;
      }
    },
    {
      phrase: "IM HUNGRY TOO",
      action: () => {
        currentLoopPhrase = " THEY EAT FIRST ";
        phraseIndex = 0;
        startSequenceTimer(400); // Accelerated speed (0.4s)
      }
    },
    {
      phrase: "I'M HUNGRY TOO",
      action: () => {
        currentLoopPhrase = " THEY EAT FIRST ";
        phraseIndex = 0;
        startSequenceTimer(400); // Accelerated speed (0.4s)
      }
    },
    {
      phrase: "WERE HUNGRY TOO",
      action: () => {
        currentLoopPhrase = " THEY EAT FIRST ";
        phraseIndex = 0;
        startSequenceTimer(400); // Accelerated speed (0.4s)
      }
    },
    {
      phrase: "WE'RE HUNGRY TOO",
      action: () => {
        currentLoopPhrase = " THEY EAT FIRST ";
        phraseIndex = 0;
        startSequenceTimer(400); // Accelerated speed (0.4s)
      }
    },
    {
      phrase: "FEAST",
      action: () => {
        isPostInvertMode = true;
        userCustomPhrase = "";
        isCurrentlyLoopingUserPhrase = false;
        engine.toggleInvertedMode();
        if (sequenceTimer) clearInterval(sequenceTimer);

        if (feastDisappearTimer) clearTimeout(feastDisappearTimer);
        feastDisappearTimer = setTimeout(() => {
          if (userCustomPhrase === "") {
            engine.setOutlineText('');
          }
          feastDisappearTimer = null;
        }, 500);
      }
    },
  ];

  // Initialize tracking indices for each secret phrase
  let phraseTrackers = secretPhrasesRegistry.map(item => ({
    ...item,
    currentIndex: 0
  }));

  function resetTrackers() {
    phraseTrackers.forEach(t => t.currentIndex = 0);
  }

  function updatePhraseCharacter() {
    if (isFreeTypeUnlocked && !isPostInvertMode) return;
    engine.isSequenceRunning = true;

    // Extract non-empty words from current phrase
    const words = currentLoopPhrase.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) {
      engine.setOutlineText('');
      return;
    }

    const currentWord = words[phraseIndex % words.length];
    engine.setOutlineText(currentWord);

    phraseIndex = (phraseIndex + 1) % words.length;
  }

  function startSequenceTimer(intervalMs = currentLoopInterval) {
    if (sequenceTimer) clearInterval(sequenceTimer);
    currentLoopInterval = intervalMs;
    updatePhraseCharacter();
    sequenceTimer = setInterval(updatePhraseCharacter, intervalMs);
  }

  // Autoplay phrase sequence immediately on load
  startSequenceTimer(1600);

  function resetApplicationState() {
    if (sequenceTimer) clearInterval(sequenceTimer);
    if (feastDisappearTimer) clearTimeout(feastDisappearTimer);
    if (loopStartTimer) clearTimeout(loopStartTimer);

    sequenceTimer = null;
    feastDisappearTimer = null;
    loopStartTimer = null;

    currentLoopPhrase = " SUBMIT STARVE SACRIFICE  ";
    currentLoopInterval = 1600;
    phraseIndex = 0;
    isStarted = true;
    isFreeTypeUnlocked = false;
    isPostInvertMode = false;
    userCustomPhrase = "";
    isCurrentlyLoopingUserPhrase = false;

    resetTrackers();
    engine.setTheme('white');
    document.body.classList.remove('theme-inverted');
    document.body.classList.add('theme-white');
    startSequenceTimer(1600);
  }

  // Global Keydown Listener
  window.addEventListener('keydown', (e) => {
    // Ignore input fields if focused
    const activeElem = document.activeElement;
    if (activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'SELECT' || activeElem.tagName === 'TEXTAREA')) {
      return;
    }

    if (e.key === 'Enter') {
      resetApplicationState();
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Delete') {
      engine.isSequenceRunning = false;
      if (feastDisappearTimer) {
        clearTimeout(feastDisappearTimer);
        feastDisappearTimer = null;
      }
      if (isPostInvertMode) {
        if (sequenceTimer) {
          clearInterval(sequenceTimer);
          sequenceTimer = null;
        }
        if (loopStartTimer) {
          clearTimeout(loopStartTimer);
          loopStartTimer = null;
        }
        isCurrentlyLoopingUserPhrase = false;

        if (e.key === 'Backspace') {
          userCustomPhrase = userCustomPhrase.slice(0, -1);
          const lastChar = userCustomPhrase.length > 0 ? userCustomPhrase[userCustomPhrase.length - 1] : '';
          engine.setOutlineText(lastChar);
        } else {
          userCustomPhrase = "";
          engine.setOutlineText('');
        }

        if (userCustomPhrase.length > 0) {
          loopStartTimer = setTimeout(() => {
            currentLoopPhrase = " " + userCustomPhrase + " ";
            phraseIndex = 0;
            startSequenceTimer(800);
            isCurrentlyLoopingUserPhrase = true;
            loopStartTimer = null;
          }, 600);
        } else {
          engine.setOutlineText('');
        }
        return;
      }

      if (isFreeTypeUnlocked) {
        engine.setOutlineText('');
      } else {
        // Step back active progress
        phraseTrackers.forEach(t => {
          if (t.currentIndex > 0) t.currentIndex--;
        });
        const activeItem = phraseTrackers.find(t => t.currentIndex > 0);
        const prevChar = activeItem ? activeItem.phrase[activeItem.currentIndex - 1] : '';
        engine.setOutlineText(prevChar);
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const typedChar = e.key.toUpperCase();

      if (isPostInvertMode) {
        if (feastDisappearTimer) {
          clearTimeout(feastDisappearTimer);
          feastDisappearTimer = null;
        }
        if (sequenceTimer) {
          clearInterval(sequenceTimer);
          sequenceTimer = null;
        }
        if (loopStartTimer) {
          clearTimeout(loopStartTimer);
          loopStartTimer = null;
        }

        if (isCurrentlyLoopingUserPhrase) {
          userCustomPhrase = typedChar;
          isCurrentlyLoopingUserPhrase = false;
        } else {
          userCustomPhrase += typedChar;
        }

        engine.setOutlineText(typedChar);

        loopStartTimer = setTimeout(() => {
          if (userCustomPhrase.length > 0) {
            currentLoopPhrase = " " + userCustomPhrase + " ";
            phraseIndex = 0;
            startSequenceTimer(800);
            isCurrentlyLoopingUserPhrase = true;
          }
          loopStartTimer = null;
        }, 600);
        return;
      }

      if (isFreeTypeUnlocked) {
        // Free typing unlocked: Outlines whatever letter is typed!
        engine.setOutlineText(typedChar);
        return;
      }

      // Pause automated sequence loop timer when user begins typing
      if (sequenceTimer) {
        clearInterval(sequenceTimer);
        sequenceTimer = null;
      }
      engine.isSequenceRunning = false;

      let isAnyMatched = false;

      phraseTrackers.forEach(t => {
        const expectedChar = t.phrase[t.currentIndex];
        if (typedChar === expectedChar) {
          t.currentIndex++;
          isAnyMatched = true;

          // Check if this secret phrase has been completed!
          if (t.currentIndex === t.phrase.length) {
            engine.setOutlineText(typedChar);
            t.action(); // Execute phrase action (e.g. unlock free type or switch phrase)
            resetTrackers();
          }
        }
      });

      if (isAnyMatched) {
        engine.setOutlineText(typedChar);
      } else {
        // Check if user started a phrase anew
        let isStartedNew = false;
        phraseTrackers.forEach(t => {
          if (typedChar === t.phrase[0]) {
            t.currentIndex = 1;
            isStartedNew = true;
          }
        });

        if (isStartedNew) {
          engine.setOutlineText(typedChar);
        }
        // Non-matching keys leave saved progress intact; wrong keys are suppressed
      }
    }
  });
});
