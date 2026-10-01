const test = require('node:test');
const assert = require('node:assert/strict');
global.document = { hidden: false, addEventListener() {} };
require('../js/audio.js');
const { Audio, MUSIC } = global.Pala;

test('four themes have distinct layered phrases and alternate endings', () => {
  const firstNotes = [];
  for (const scene of ['camp', 'battle', 'survival', 'boss']) {
    const track = MUSIC[scene];
    assert.equal(track.chords.length, 8);
    assert.equal(track.lead.length, 8);
    assert.ok(track.lead.every(bar => bar.length === 8));
    const sound = new Audio();
    sound.setScene(scene);
    const voices = [];
    const drums = [];
    sound._musicVoice = (note, _at, _length, _volume, role) => voices.push({ note, role });
    sound._drum = kind => drums.push(kind);
    for (let i = 0; i < 128; i++) sound._musicStep(i * 0.1);
    assert.ok(voices.filter(voice => voice.role === 'lead').length >= 40);
    assert.equal(voices.filter(voice => voice.role === 'pad').length, 24);
    assert.ok(voices.some(voice => voice.role === 'bass'));
    assert.ok(drums.length >= 16);
    firstNotes.push(voices.find(voice => voice.role === 'lead').note);
    const firstEnding = voices.filter(voice => voice.role === 'lead').slice(-14).map(voice => voice.note);
    voices.length = 0;
    for (let i = 128; i < 256; i++) sound._musicStep(i * 0.1);
    assert.notDeepEqual(voices.filter(voice => voice.role === 'lead').slice(-14).map(voice => voice.note), firstEnding);
  }
  assert.ok(new Set(firstNotes).size >= 3);
});

test('music scheduler starts after unlock, switches scene, and stops on mute', async t => {
  let starts = 0;
  class Parameter {
    constructor() { this.value = 1; }
    setValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
    linearRampToValueAtTime(value) { this.value = value; }
    setTargetAtTime(value) { this.value = value; }
    cancelScheduledValues() {}
  }
  const node = () => ({ connect() {}, disconnect() {} });
  class Context {
    constructor() { this.currentTime = 1; this.state = 'running'; this.sampleRate = 48000; this.destination = node(); }
    createGain() { return { ...node(), gain: new Parameter() }; }
    createOscillator() { return { ...node(), frequency: new Parameter(), start() { starts++; }, stop() {} }; }
    createBufferSource() { return { ...node(), start() { starts++; }, stop() {} }; }
    createBiquadFilter() { return { ...node(), frequency: new Parameter() }; }
    createBuffer() { return { getChannelData: () => new Float32Array(14400) }; }
  }
  global.AudioContext = Context;
  t.after(() => { delete global.AudioContext; });
  const sound = new Audio();
  t.after(() => sound.stopMusic());
  sound.setScene('battle');
  assert.equal(await sound.unlock(), true);
  sound.startMusic();
  assert.ok(sound.musicTimer !== null);
  assert.ok(sound.step > 0);
  assert.ok(starts > 0);
  sound.setScene('boss');
  assert.equal(sound.scene, 'boss');
  assert.equal(sound.step, 0);
  sound.setMuted(true);
  assert.equal(sound.musicTimer, null);
  sound.setMuted(false);
  assert.ok(sound.musicTimer !== null);
  sound.stopMusic();
  assert.equal(sound.musicTimer, null);
});
