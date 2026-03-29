const AUDIO_SOURCES = {
  coin: {
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1d26d486f3.mp3?filename=coin-collect-6081.mp3',
    volume: 0.3,
    cooldownMs: 70,
    maxPlayMs: 180
  }
};

function createClip({ url, volume, cooldownMs, maxPlayMs }) {
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';

  return {
    audio,
    volume,
    cooldownMs,
    maxPlayMs,
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
  clip.stopTimeoutId = window.setTimeout(() => {
    clip.audio.pause();
    clip.audio.currentTime = 0;
    clip.stopTimeoutId = null;
  }, clip.maxPlayMs);
}

export function createAudioSystem() {
  let masterVolume = 0.72;
  let canPlay = false;

  const clips = {
    coin: createClip(AUDIO_SOURCES.coin)
  };

  const unlock = () => {
    canPlay = true;
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });

  for (const clip of Object.values(clips)) {
    clip.audio.load();
  }

  return {
    setVolume(nextVolume) {
      masterVolume = Math.max(0, Math.min(1, nextVolume));
    },
    playCoin() {
      if (!canPlay) return;
      playClip(clips.coin, masterVolume);
    },
    dispose() {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);

      for (const clip of Object.values(clips)) {
        if (clip.stopTimeoutId) {
          window.clearTimeout(clip.stopTimeoutId);
        }
        clip.audio.pause();
        clip.audio.currentTime = 0;
      }
    }
  };
}
