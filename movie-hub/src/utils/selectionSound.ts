let sharedAudioContext: AudioContext | null = null

export function playSelectionTick() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return

  try {
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new window.AudioContext()
    }
    if (sharedAudioContext.state === 'suspended') {
      void sharedAudioContext.resume()
    }

    const context = sharedAudioContext
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
  } catch {
    // Fail silently if AudioContext is blocked or unavailable
  }
}
