const AUDIO_SOURCES = {
  background: {
    url: '/audio/space-travel.mp3',
    volume: 0.24,
    loop: true
  },
  death: {
    url: '/audio/death-hit.mp3',
    volume: 0.46,
    cooldownMs: 180,
    maxPlayMs: 900
  },
  coin: {
    url: '/audio/coin-collect.wav',
    volume: 0.32,
    cooldownMs: 70,
    maxPlayMs: 220
  }
};

function createClip({ url, volume, cooldownMs = 0, maxPlayMs = 0, loop = false }) {
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.loop = loop;

  return {
    audio,
    volume,
    cooldownMs,
    maxPlayMs,
    loop,
    stopTimeoutId: null,
    lastPlayedAt: -Infinity
  };
}

function playClip(clip, masterVolume, playbackRate = 1) {
  const now = performance.now();
  if (now - clip.lastPlayedAt < clip.cooldownMs) return;

  clip.lastPlayedAt = now;
  if (clip.stopTimeoutId) {
    window.clearTimeout(clip.stopTimeoutId);
    clip.stopTimeoutId = null;
  }

  clip.audio.pause();
  clip.audio.currentTime = 0;
  clip.audio.playbackRate = playbackRate;
  clip.audio.volume = Math.min(1, clip.volume * masterVolume);
  clip.audio.play().catch(() => {});

  if (!clip.loop && clip.maxPlayMs > 0) {
    clip.stopTimeoutId = window.setTimeout(() => {
      clip.audio.pause();
      clip.audio.currentTime = 0;
      clip.stopTimeoutId = null;
    }, clip.maxPlayMs);
  }
}

function stopClip(clip) {
  if (clip.stopTimeoutId) {
    window.clearTimeout(clip.stopTimeoutId);
    clip.stopTimeoutId = null;
  }

  clip.audio.pause();
  clip.audio.currentTime = 0;
}

function preloadClip(clip, onLoaded) {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (didLoad) => {
      if (settled) return;
      settled = true;
      cleanup();
      onLoaded();
      resolve(didLoad);
    };

    const cleanup = () => {
      clip.audio.removeEventListener('canplaythrough', handleReady);
      clip.audio.removeEventListener('loadeddata', handleReady);
      clip.audio.removeEventListener('error', handleError);
    };

    const handleReady = () => finish(true);
    const handleError = () => finish(false);

    clip.audio.addEventListener('canplaythrough', handleReady, { once: true });
    clip.audio.addEventListener('loadeddata', handleReady, { once: true });
    clip.audio.addEventListener('error', handleError, { once: true });
    clip.audio.load();

    if (clip.audio.readyState >= 2) {
      finish(true);
    }
  });
}

export function createAudioSystem() {
  let masterVolume = 0.72;
  let canPlay = false;
  let loadedCount = 0;
  let readyPromise = null;
  const progressListeners = new Set();

  const clips = {
    background: createClip(AUDIO_SOURCES.background),
    death: createClip(AUDIO_SOURCES.death),
    coin: createClip(AUDIO_SOURCES.coin)
  };

  const totalClips = Object.keys(clips).length;

  const emitProgress = () => {
    const progress = totalClips > 0 ? loadedCount / totalClips : 1;
    for (const listener of progressListeners) {
      listener(progress);
    }
  };

  const onClipLoaded = () => {
    loadedCount += 1;
    emitProgress();
  };

  const unlock = () => {
    canPlay = true;
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });

  emitProgress();

  return {
    ready() {
      if (!readyPromise) {
        readyPromise = Promise.all(Object.values(clips).map((clip) => preloadClip(clip, onClipLoaded))).then((results) =>
          results.every(Boolean)
        );
      }

      return readyPromise;
    },
    onLoadProgress(callback) {
      progressListeners.add(callback);
      callback(totalClips > 0 ? loadedCount / totalClips : 1);
      return () => progressListeners.delete(callback);
    },
    unlock() {
      unlock();
    },
    setVolume(nextVolume) {
      masterVolume = Math.max(0, Math.min(1, nextVolume));
      clips.background.audio.volume = Math.min(1, clips.background.volume * masterVolume);
    },
    startBackground() {
      if (!canPlay) return;
      clips.background.audio.volume = Math.min(1, clips.background.volume * masterVolume);
      if (!clips.background.audio.paused) return;
      clips.background.audio.play().catch(() => {});
    },
    stopBackground() {
      stopClip(clips.background);
    },
    playCoin() {
      if (!canPlay) return;
      playClip(clips.coin, masterVolume);
    },
    playHit() {
      if (!canPlay) return;
      playClip(clips.death, masterVolume);
    },
    dispose() {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);

      for (const clip of Object.values(clips)) {
        stopClip(clip);
      }
    }
  };
}
