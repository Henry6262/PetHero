const SFX_KEYS = ['deploy', 'hit', 'shoot', 'explosion', 'tower-down', 'elixir', 'victory', 'defeat'] as const
export type SfxKey = (typeof SFX_KEYS)[number]

const MUTE_KEY = 'tw-muted'

/**
 * Plain HTMLAudio sound bus. Files are optional — anything that fails to load
 * is silently skipped. One instance per page.
 */
export class AudioBus {
  private available = new Set<string>()
  private music: HTMLAudioElement | null = null
  muted = window.localStorage.getItem(MUTE_KEY) === '1'

  constructor() {
    for (const key of SFX_KEYS) {
      const probe = new Audio(`/assets/audio/${key}.mp3`)
      probe.preload = 'auto'
      probe.addEventListener('canplaythrough', () => this.available.add(key), { once: true })
    }
    const music = new Audio('/assets/audio/battle-loop.mp3')
    music.preload = 'auto'
    music.loop = true
    music.volume = 0.3
    music.addEventListener('canplaythrough', () => { this.music = music }, { once: true })
  }

  play(key: SfxKey, volume = 0.5) {
    if (this.muted || !this.available.has(key)) return
    const a = new Audio(`/assets/audio/${key}.mp3`)
    a.volume = volume
    void a.play().catch(() => {})
  }

  startMusic() {
    if (this.muted || !this.music) return
    void this.music.play().catch(() => {})
  }

  stopMusic() {
    this.music?.pause()
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    window.localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0')
    if (this.muted) this.stopMusic()
    else this.startMusic()
    return this.muted
  }
}
