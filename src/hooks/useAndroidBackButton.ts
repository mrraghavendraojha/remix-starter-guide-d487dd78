import { useEffect } from 'react';
import { App } from '@capacitor/app';

export const useAndroidBackButton = (onBackButton: () => boolean) => {
  useEffect(() => {
    let listenerHandle: any;

    const setupListener = async () => {
      listenerHandle = await App.addListener('backButton', ({ canGoBack }) => {
        // Call the callback - if it returns true, it handled the back action
        const handled = onBackButton();
        
        // If not handled and can't go back in browser history, exit the app
        if (!handled && !canGoBack) {
          App.exitApp();
        }
      });
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [onBackButton]);
};
