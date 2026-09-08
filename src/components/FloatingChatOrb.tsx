import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Image,
  PanResponder,
  StyleSheet,
} from 'react-native';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../styles/theme';
import { logoSource } from '../constants/storage';

interface FloatingChatOrbProps {
  onPress: () => void;
}

export const FloatingChatOrb: React.FC<FloatingChatOrbProps> = ({ onPress }) => {
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 76, y: SCREEN_HEIGHT - 200 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.floatingBotMovable,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          zIndex: 99999,
          elevation: 25,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.floatingBotInner}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Image source={logoSource} style={styles.floatingBotLogo} resizeMode="contain" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingBotMovable: {
    position: 'absolute',
    width: 48,
    height: 48,
    zIndex: 99,
  },
  floatingBotInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
  },
  floatingBotLogo: {
    width: 28,
    height: 28,
  },
});

export default FloatingChatOrb;
