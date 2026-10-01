(function () {
  'use strict';
  const Pala = globalThis.Pala = globalThis.Pala || {};

  // Eight-bar original themes. Each has a different ending every other pass.
  const music = {
    camp: {
      bpm: 96, wave: 'triangle', drums: 'light',
      chords: [[48, 55, 60, 64], [47, 55, 59, 62], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55], [41, 48, 53, 57], [43, 50, 55, 59]],
      lead: [[72, 76, 79, 76, 74, 72, null, null], [71, 74, 79, 74, 72, 71, null, null], [69, 72, 76, 72, 69, 67, null, null], [65, 69, 72, 74, 72, 69, null, null], [67, 71, 74, 79, 74, 71, null, null], [64, 67, 71, 76, 74, 71, null, null], [69, 72, 77, 76, 72, 69, null, null], [71, 74, 79, 76, 74, 72, null, null]],
      ending: [[72, 77, 81, 79, 77, 76, 72, null], [74, 79, 83, 79, 76, 74, 72, null]]
    },
    battle: {
      bpm: 122, wave: 'square', drums: 'march',
      chords: [[50, 57, 62, 65], [46, 53, 58, 62], [53, 60, 65, 69], [48, 55, 60, 64], [43, 50, 55, 58], [50, 57, 62, 65], [46, 53, 58, 62], [45, 52, 57, 61]],
      lead: [[74, 77, 81, 77, 74, 72, 69, null], [70, 74, 77, 74, 70, 69, 65, null], [69, 72, 77, 79, 77, 72, 69, null], [67, 72, 76, 79, 76, 72, 67, null], [70, 74, 79, 77, 74, 70, 67, null], [69, 74, 77, 81, 77, 74, 72, null], [70, 74, 77, 82, 77, 74, 70, null], [69, 73, 76, 81, 76, 73, 69, null]],
      ending: [[77, 82, 86, 82, 79, 77, 74, null], [76, 81, 85, 81, 76, 73, 74, null]]
    },
    survival: {
      bpm: 132, wave: 'sawtooth', drums: 'drive',
      chords: [[52, 59, 64, 67], [48, 55, 60, 64], [45, 52, 57, 60], [47, 54, 59, 63], [52, 59, 64, 67], [50, 57, 62, 65], [48, 55, 60, 64], [47, 54, 59, 63]],
      lead: [[76, 79, 83, 79, 76, 74, 71, null], [72, 76, 79, 76, 72, 71, 67, null], [69, 72, 76, 79, 76, 72, 69, null], [71, 75, 78, 83, 78, 75, 71, null], [76, 79, 83, 86, 83, 79, 76, null], [74, 77, 81, 77, 74, 72, 69, null], [72, 76, 79, 84, 79, 76, 72, null], [71, 75, 78, 83, 78, 75, 76, null]],
      ending: [[79, 84, 88, 84, 79, 76, 72, null], [78, 83, 87, 83, 78, 75, 76, null]]
    },
    boss: {
      bpm: 140, wave: 'square', drums: 'drive',
      chords: [[48, 55, 60, 63], [44, 51, 56, 60], [41, 48, 53, 56], [43, 50, 55, 59], [48, 55, 60, 63], [46, 53, 58, 62], [44, 51, 56, 60], [43, 50, 55, 59]],
      lead: [[72, 75, 79, 84, 79, 75, 72, null], [68, 72, 75, 80, 75, 72, 68, null], [65, 68, 72, 77, 72, 68, 65, null], [67, 71, 74, 79, 74, 71, 67, null], [72, 75, 79, 87, 84, 79, 75, null], [70, 74, 77, 82, 77, 74, 70, null], [68, 72, 75, 80, 84, 80, 75, null], [67, 71, 74, 79, 83, 79, 72, null]],
      ending: [[80, 84, 87, 84, 80, 75, 72, null], [79, 83, 86, 83, 79, 74, 72, null]]
    }
  };
  const frequency = note => 440 * Math.pow(2, (note - 69) / 12);

  // All sounds are synthesized here; no recordings or third-party assets are used.
  class Audio {
    constructor() {
      this.context = null;
      this.master = null;
      this.musicBus = null;
      this.noiseBuffer = null;
      this.muted = false;
      this.musicWanted = false;
      this.musicTimer = null;
      this.scene = 'camp';
      this.step = 0;
      this.nextNoteTime = 0;
      this.lastSounds = Object.create(null);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this._stopTimer();
          if (this.context && this.context.state === 'running') this.context.suspend().catch(() => {});
        } else if (this.context) {
          this.context.resume().then(() => this._beginMusic()).catch(() => {});
        }
      });
    }

    async unlock() {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return false;
      try {
        if (!this.context) {
          this.context = new Context();
          this.master = this.context.createGain();
          this.master.gain.value = this.muted ? 0 : 0.16;
          this.master.connect(this.context.destination);
          this.musicBus = this.context.createGain();
          this.musicBus.gain.value = 0.78;
          this.musicBus.connect(this.master);
          this.noiseBuffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 0.3), this.context.sampleRate);
          const noise = this.noiseBuffer.getChannelData(0);
          let seed = 1701;
          for (let i = 0; i < noise.length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            noise[i] = seed / 2147483648 - 1;
          }
        }
        if (this.context.state === 'suspended') await this.context.resume();
        this._beginMusic();
        return this.context.state === 'running';
      } catch (_) {
        return false;
      }
    }

    setMuted(value) {
      this.muted = !!value;
      if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.16, this.context.currentTime, 0.025);
      if (this.muted) this._stopTimer();
      else this._beginMusic();
    }

    setScene(scene) {
      if (!music[scene] || this.scene === scene) return;
      this.scene = scene;
      this.step = 0;
      if (this.context) {
        const now = this.context.currentTime;
        this.nextNoteTime = now + 0.12;
        this.musicBus.gain.cancelScheduledValues(now);
        this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, now);
        this.musicBus.gain.linearRampToValueAtTime(0.04, now + 0.09);
        this.musicBus.gain.linearRampToValueAtTime(this.musicWanted && !this.muted ? 0.78 : 0.0001, now + 0.5);
      }
    }

    _tone(frequency, duration, volume, wave, delay, endFrequency) {
      const ctx = this.context;
      if (!ctx || ctx.state !== 'running' || this.muted || document.hidden) return;
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      const at = ctx.currentTime + (delay || 0);
      oscillator.type = wave || 'triangle';
      oscillator.frequency.setValueAtTime(frequency, at);
      if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.exponentialRampToValueAtTime(volume, at + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(envelope);
      envelope.connect(this.master);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(at);
      oscillator.stop(at + duration + 0.02);
    }

    play(type) {
      if (!this.context || this.context.state !== 'running' || this.muted) return;
      const now = this.context.currentTime;
      const minimumGap = type === 'hit' ? 0.14 : type === 'kill' ? 0.12 : 0.045;
      if (now - (this.lastSounds[type] ?? -Infinity) < minimumGap) return;
      this.lastSounds[type] = now;
      switch (type) {
        case 'summon':
          this._tone(392, 0.12, 0.2, 'triangle');
          this._tone(587, 0.18, 0.16, 'triangle', 0.075);
          break;
        case 'cast':
          this._tone(330, 0.24, 0.16, 'sine', 0, 990);
          this._tone(660, 0.28, 0.1, 'triangle', 0.07, 1320);
          break;
        case 'hit':
          this._tone(105, 0.055, 0.085, 'triangle', 0, 55);
          break;
        case 'kill':
          this._tone(220, 0.12, 0.09, 'triangle', 0, 95);
          break;
        case 'wave':
          this._tone(196, 0.23, 0.16, 'triangle');
          this._tone(294, 0.28, 0.13, 'triangle', 0.15);
          break;
        case 'win':
          [392, 494, 587, 784].forEach((note, index) => this._tone(note, 0.42, 0.22, 'triangle', index * 0.13));
          break;
        case 'lose':
          [330, 294, 247, 196].forEach((note, index) => this._tone(note, 0.35, 0.17, 'triangle', index * 0.16));
          break;
        case 'click':
          this._tone(740, 0.045, 0.09, 'sine');
          break;
      }
    }

    startMusic() {
      this.musicWanted = true;
      this._beginMusic();
    }

    stopMusic() {
      this.musicWanted = false;
      this._stopTimer();
      if (this.musicBus) {
        const now = this.context.currentTime;
        this.musicBus.gain.cancelScheduledValues(now);
        this.musicBus.gain.setTargetAtTime(0.0001, now, 0.12);
      }
    }

    _stopTimer() {
      if (this.musicTimer !== null) clearInterval(this.musicTimer);
      this.musicTimer = null;
      this.nextNoteTime = 0;
    }

    _musicVoice(note, at, length, volume, role, wave) {
      const ctx = this.context;
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      oscillator.type = role === 'pad' ? 'sine' : role === 'bass' ? 'triangle' : role === 'pluck' ? 'sine' : wave;
      oscillator.frequency.setValueAtTime(frequency(note), at);
      const attack = role === 'pad' ? 0.16 : 0.006;
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.exponentialRampToValueAtTime(volume, at + attack);
      if (role === 'pad') envelope.gain.setValueAtTime(volume * 0.72, at + Math.max(attack, length - 0.2));
      else envelope.gain.exponentialRampToValueAtTime(volume * (role === 'pluck' ? 0.18 : 0.48), at + Math.max(0.08, length * 0.55));
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
      if (oscillator.type === 'square' || oscillator.type === 'sawtooth') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = role === 'lead' ? 1800 : 1100;
        oscillator.connect(filter);
        filter.connect(envelope);
        oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); envelope.disconnect(); };
      } else {
        oscillator.connect(envelope);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
      }
      envelope.connect(this.musicBus);
      oscillator.start(at);
      oscillator.stop(at + length + 0.02);
    }

    _drum(kind, at) {
      const ctx = this.context;
      const length = kind === 'kick' ? 0.19 : kind === 'snare' ? 0.13 : 0.055;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.exponentialRampToValueAtTime(kind === 'kick' ? 0.19 : kind === 'snare' ? 0.045 : 0.022, at + 0.004);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
      envelope.connect(this.musicBus);
      if (kind === 'kick') {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(145, at);
        oscillator.frequency.exponentialRampToValueAtTime(48, at + length);
        oscillator.connect(envelope);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
        oscillator.start(at);
        oscillator.stop(at + length + 0.02);
      } else {
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        source.buffer = this.noiseBuffer;
        filter.type = kind === 'hat' ? 'highpass' : 'bandpass';
        filter.frequency.value = kind === 'hat' ? 5800 : 1450;
        source.connect(filter);
        filter.connect(envelope);
        source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
        source.start(at);
        source.stop(at + length);
      }
    }

    _musicStep(at) {
      const track = music[this.scene];
      const beat = 60 / track.bpm;
      const sixteenth = beat / 4;
      const inBar = this.step % 16;
      const bar = Math.floor(this.step / 16) % track.chords.length;
      const alternate = Math.floor(this.step / (16 * track.chords.length)) % 2 === 1;
      const chord = track.chords[bar];
      if (inBar === 0) {
        for (const note of chord.slice(1)) this._musicVoice(note, at, beat * 3.6, track.drums === 'light' ? 0.035 : 0.024, 'pad', track.wave);
      }
      if (inBar === 0 || inBar === 8 || (track.drums !== 'light' && inBar === 12)) {
        this._musicVoice(chord[0] - 12, at, beat * (track.drums === 'light' ? 1.7 : 0.9), track.drums === 'light' ? 0.1 : 0.12, 'bass', track.wave);
      }
      if (inBar % 2 === 0) {
        const phrase = alternate && bar >= 6 ? track.ending[bar - 6] : track.lead[bar];
        const note = phrase[inBar / 2];
        if (note !== null) this._musicVoice(note, at, sixteenth * 1.72, track.drums === 'light' ? 0.11 : 0.095, 'lead', track.wave);
      }
      if (track.drums === 'light' ? inBar % 4 === 3 : inBar % 2 === 1) {
        const arpeggio = [1, 2, 3, 2][Math.floor(inBar / 4)];
        this._musicVoice(chord[arpeggio] + 12, at, sixteenth * 1.4, track.drums === 'light' ? 0.032 : 0.022, 'pluck', track.wave);
      }
      if (alternate && (inBar === 4 || inBar === 12)) this._musicVoice(chord[2] + 12, at, beat * 0.65, 0.024, 'pluck', track.wave);
      if (inBar === 0 || (track.drums !== 'light' && inBar === 8) || (track.drums === 'drive' && (inBar === 6 || inBar === 14))) this._drum('kick', at);
      if (track.drums !== 'light' && (inBar === 4 || inBar === 12)) this._drum('snare', at);
      if (inBar % (track.drums === 'light' ? 8 : 2) === (track.drums === 'light' ? 4 : 0)) this._drum('hat', at);
      this.step++;
    }

    _beginMusic() {
      if (!this.musicWanted || this.musicTimer !== null || this.muted || document.hidden || !this.context || this.context.state !== 'running') return;
      const now = this.context.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setTargetAtTime(0.78, now, 0.12);
      this.nextNoteTime = now + 0.08;
      const schedule = () => {
        const context = this.context;
        if (this.nextNoteTime < context.currentTime - 0.3) {
          this.step = Math.ceil(this.step / 16) * 16;
          this.nextNoteTime = context.currentTime + 0.05;
        }
        while (this.nextNoteTime < context.currentTime + 0.22) {
          const scene = this.scene;
          this._musicStep(this.nextNoteTime);
          this.nextNoteTime += 60 / music[scene].bpm / 4;
        }
      };
      schedule();
      this.musicTimer = setInterval(schedule, 70);
    }
  }

  Pala.Audio = Audio;
  Pala.MUSIC = music;
})();
