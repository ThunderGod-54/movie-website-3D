export function playSelectionTick() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return

  const context = new window.AudioContext()
  const notes = [1046.5, 1318.5]

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime + index * 0.045

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.12, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11)
    oscillator.start(start)
    oscillator.stop(start + 0.12)
  })

  window.setTimeout(() => {
    void context.close()
  }, 250)
}
