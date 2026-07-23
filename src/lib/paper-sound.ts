export class PaperSoundEngine {
  private context: AudioContext | null = null
  private noise: AudioBuffer | null = null
  private lastRustleAt = 0
  private lastSettleAt = 0

  async prime() {
    const context = this.getContext()
    if (context?.state === "suspended") await context.resume()
  }

  playRustle() {
    const context = this.getContext()
    if (!context) return
    if (context.state === "suspended") {
      void context.resume().then(() => this.playRustle())
      return
    }
    if (context.state !== "running") return

    const nowInMs = performance.now()
    if (nowInMs - this.lastRustleAt < 180) return
    this.lastRustleAt = nowInMs

    const now = context.currentTime
    const source = context.createBufferSource()
    const highpass = context.createBiquadFilter()
    const bandpass = context.createBiquadFilter()
    const gain = context.createGain()
    const panner = context.createStereoPanner()

    source.buffer = this.getNoise(context)
    source.playbackRate.value = 0.92 + Math.random() * 0.12
    highpass.type = "highpass"
    highpass.frequency.value = 260
    bandpass.type = "bandpass"
    bandpass.frequency.setValueAtTime(1450, now)
    bandpass.frequency.exponentialRampToValueAtTime(2450, now + 0.48)
    bandpass.Q.value = 0.58
    panner.pan.value = (Math.random() - 0.5) * 0.34

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.038, now + 0.045)
    gain.gain.exponentialRampToValueAtTime(0.014, now + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.026, now + 0.33)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.64)

    source.connect(highpass).connect(bandpass).connect(gain).connect(panner)
    panner.connect(context.destination)
    source.start(now, Math.random() * 0.1, 0.66)
    source.stop(now + 0.67)
  }

  playSettle() {
    const context = this.getContext()
    if (!context) return
    if (context.state === "suspended") {
      void context.resume().then(() => this.playSettle())
      return
    }
    if (context.state !== "running") return

    const nowInMs = performance.now()
    if (nowInMs - this.lastSettleAt < 180) return
    this.lastSettleAt = nowInMs

    const now = context.currentTime
    const source = context.createBufferSource()
    const lowpass = context.createBiquadFilter()
    const contactGain = context.createGain()
    const body = context.createOscillator()
    const bodyGain = context.createGain()

    source.buffer = this.getNoise(context)
    lowpass.type = "lowpass"
    lowpass.frequency.value = 780
    contactGain.gain.setValueAtTime(0.022, now)
    contactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

    body.type = "sine"
    body.frequency.setValueAtTime(108, now)
    body.frequency.exponentialRampToValueAtTime(72, now + 0.095)
    bodyGain.gain.setValueAtTime(0.012, now)
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)

    source.connect(lowpass).connect(contactGain).connect(context.destination)
    body.connect(bodyGain).connect(context.destination)
    source.start(now, Math.random() * 0.08, 0.13)
    source.stop(now + 0.14)
    body.start(now)
    body.stop(now + 0.12)
  }

  async close() {
    const context = this.context
    this.context = null
    this.noise = null
    if (context && context.state !== "closed") await context.close()
  }

  private getContext() {
    if (typeof window === "undefined") return null
    if (this.context) return this.context

    this.context = new AudioContext()
    return this.context
  }

  private getNoise(context: AudioContext) {
    if (this.noise) return this.noise

    const buffer = context.createBuffer(
      1,
      context.sampleRate,
      context.sampleRate
    )
    const samples = buffer.getChannelData(0)
    let previous = 0

    for (let index = 0; index < samples.length; index += 1) {
      const white = Math.random() * 2 - 1
      previous = white * 0.72 + previous * 0.28
      samples[index] = previous
    }

    this.noise = buffer
    return buffer
  }
}
