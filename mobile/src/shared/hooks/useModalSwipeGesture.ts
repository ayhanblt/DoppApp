import { useEffect, useRef } from 'react';
import { PanResponder, Platform, PanResponderInstance, BackHandler } from 'react-native';

/**
 * Creates a PanResponder that detects a left-to-right swipe from the left edge of the screen,
 * simulating the native iOS "back" gesture.
 * 
 * @param visible Boolean indicating if the modal is currently open.
 * @param onClose Callback to trigger when the swipe back gesture is detected.
 * @returns PanResponderInstance which should have its `panHandlers` spread onto the outermost View of a Modal.
 */
export function useModalSwipeGesture(visible: boolean, onClose: () => void): PanResponderInstance {
  // Android Back Button Handler
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backAction = () => {
        onClose();
        return true; // Olayı yakala ve uygulamanın kapanmasını engelle
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (Platform.OS !== 'ios') return false;

        // Yalnızca belirgin bir yatay kaydırma ise hareketi yakala
        const isHorizontalSwipe = gestureState.dx > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontalSwipe;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Hareketi bıraktığında, yeterince sağa kaydırıldıysa kapat
        if (gestureState.dx > 50) {
          onClose();
        }
      },
      // İç içe ScrollView'ların çalışabilmesi için
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return panResponder;
}
