
// Use a shared AudioContext so we can prime it once and avoid the "first play" issue
let sharedAudioContext: AudioContext | null = null;

export const primeAudioContext = async () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  if (!sharedAudioContext) sharedAudioContext = new AudioContext();
  if (sharedAudioContext.state === 'suspended') {
    try {
      await sharedAudioContext.resume();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('AudioContext resume failed while priming (may require a user gesture):', err);
    }
  }
};

export const playAlertSound = async (type: 'warning' | 'end') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = sharedAudioContext || new AudioContext();
    if (!sharedAudioContext) sharedAudioContext = ctx;

    // On some browsers, the context starts in a suspended state and must be
    // resumed in response to a user gesture. If it's suspended, try to resume
    // (we await here so the oscillator is created and started only after the
    // resume resolves). If resume is rejected, we still attempt to create the
    // oscillator — playback may remain silent due to autoplay restrictions.
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        // Not fatal — just log. If resume fails because there wasn't a user
        // gesture, the sound will be blocked; subsequent user gestures can
        // resume the context and later calls will succeed.
        // eslint-disable-next-line no-console
        console.warn('AudioContext resume failed (may require a user gesture):', err);
      }
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    // Centralized configuration for alert sounds so we can tune them easily
    const WARNING_DURATION = 1.5; // seconds - must be less than END_DURATION
    const WARNING_FREQ = 880; // A5
    const WARNING_INITIAL_GAIN = 0.80; // increase volume for warning

    const END_DURATION = 1.8; // seconds
    const END_FREQ = 440; // A4
    const END_INITIAL_GAIN = 0.20;

    if (type === 'warning') {
      // Longer short beep, high pitch - 30s warning (still shorter than the end alert)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(WARNING_FREQ, now);
      // Start louder for better noticeability, then fade quickly but keep audible
      gain.gain.setValueAtTime(WARNING_INITIAL_GAIN, now);
      // Maintain a high volume for most of the beep, then fade towards the end
      gain.gain.linearRampToValueAtTime(WARNING_INITIAL_GAIN * 0.25, now + WARNING_DURATION * 0.75);
      gain.gain.linearRampToValueAtTime(0.01, now + WARNING_DURATION);
      osc.start(now);
      osc.stop(now + WARNING_DURATION);
    } else {

      // "Beep-Beep" (Double pulse) - Time up
      const GAP_START = 0.4; // First beep ends at 0.4s
      const GAP_END = 0.6;   // Second beep starts at 0.6s
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(END_FREQ, now);
      
      // -- First Beep --
      gain.gain.setValueAtTime(END_INITIAL_GAIN, now);
      // Hold volume until gap starts
      gain.gain.setValueAtTime(END_INITIAL_GAIN, now + GAP_START); 
      
      // -- The Silence (The Gap) --
      // Quickly drop to 0
      gain.gain.linearRampToValueAtTime(0, now + GAP_START + 0.05); 
      // Stay at 0 until GAP_END
      gain.gain.setValueAtTime(0, now + GAP_END); 
      
      // -- Second Beep --
      // Quickly jump back up
      gain.gain.linearRampToValueAtTime(END_INITIAL_GAIN, now + GAP_END + 0.05);
      // Sustain then fade out at the very end
      gain.gain.linearRampToValueAtTime(END_INITIAL_GAIN, now + END_DURATION - 0.5);
      gain.gain.linearRampToValueAtTime(0, now + END_DURATION);

      osc.start(now);
      osc.stop(now + END_DURATION);
    }
    
    // If we created a transient ctx (not the shared one), close it after
    // playback finishes to avoid leaking audio contexts (desktop browsers
    // limit the total number of contexts). If we used the shared context,
    // leave it open (it can be closed by the app/host if desired).
    if (ctx !== sharedAudioContext) {
      const cleanupDelay = Math.max(WARNING_DURATION, END_DURATION) * 1000 + 500;
      setTimeout(() => {
        if (ctx.state !== 'closed') ctx.close();
      }, cleanupDelay);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};
