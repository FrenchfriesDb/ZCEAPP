import Animated from 'react-native-reanimated';
import FluentEmoji from './FluentEmoji';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      <FluentEmoji name="wavingHand" size={28} />
    </Animated.View>
  );
}
