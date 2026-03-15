import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

interface SwipeSliderProps {
  onSwipeComplete: () => void;
  label: string;
  width?: number;
  height?: number;
}

export default function SwipeSlider({ onSwipeComplete, label, width = 320, height = 60 }: SwipeSliderProps) {
  const [dragX] = useState(new Animated.Value(0));
  const [isComplete, setIsComplete] = useState(false);
  const knobWidth = height - 10; // Make knob circular based on height
  
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: dragX } }],
    { useNativeDriver: false }
  );
  
  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const maxDrag = width - knobWidth;
      
      if (translationX >= maxDrag * 0.8) {
        // Swipe completed
        setIsComplete(true);
        onSwipeComplete();
      } else {
        // Snap back with spring animation
        Animated.spring(dragX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };
  
  const knobStyle = {
    transform: [
      {
        translateX: dragX.interpolate({
          inputRange: [0, width - knobWidth],
          outputRange: [0, width - knobWidth],
          extrapolate: 'clamp',
        }),
      },
    ],
  };
  
  const labelOpacity = dragX.interpolate({
    inputRange: [0, width - knobWidth],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  return (
    <View style={[styles.container, { width, height }]}>
      {/* Track */}
      <View style={styles.track}>
        {/* Label */}
        <Animated.Text style={[styles.label, { opacity: labelOpacity }]}>
          {label}
        </Animated.Text>
        
        {/* Knob */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View style={[styles.knob, knobStyle, { width: knobWidth, height: knobWidth }]}>
            <View style={styles.knobInner}>
              <Text style={styles.knobText}>→</Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  knob: {
    position: 'absolute',
    left: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  knobInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    margin: 3,
  },
  knobText: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
