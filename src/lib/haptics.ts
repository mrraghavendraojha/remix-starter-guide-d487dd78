/**
 * Provides haptic feedback on supported devices
 */
export const haptics = {
  /**
   * Light haptic feedback for subtle interactions
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium haptic feedback for button presses
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Strong haptic feedback for important actions
   */
  strong: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },

  /**
   * Success pattern for completed actions
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20]);
    }
  },

  /**
   * Error pattern for failed actions
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },
};
