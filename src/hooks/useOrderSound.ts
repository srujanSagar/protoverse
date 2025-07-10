import { useCallback } from 'react';

export const useOrderSound = () => {
  const playOrderSound = useCallback(() => {
    try {
      // Create audio context for better browser compatibility
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant notification sound using Web Audio API
      const createBeep = (frequency: number, duration: number, delay: number = 0) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        oscillator.type = 'sine';
        
        // Create a smooth envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };
      
      // Play a pleasant two-tone chime
      createBeep(800, 0.2, 0);    // First tone
      createBeep(1000, 0.3, 0.15); // Second tone (slightly delayed)
      
    } catch (error) {
      // Fallback to system beep if Web Audio API fails
      console.warn('Web Audio API not supported, using fallback sound');
      
      // Try to use a simple audio element as fallback
      try {
        // Create a data URL for a simple beep sound
        const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        const audio = new Audio(audioData);
        audio.volume = 0.3;
        audio.play().catch(() => {
          // If all else fails, just log the success
          console.log('Order completed successfully!');
        });
      } catch (fallbackError) {
        console.log('Order completed successfully!');
      }
    }
  }, []);

  return { playOrderSound };
};