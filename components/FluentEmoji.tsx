import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const FLUENT_EMOJI_MAP = {
  crossedSwords: require('@/assets/fluent-emoji/crossed_swords.png'),
  bullseye: require('@/assets/fluent-emoji/bullseye.png'),
  highVoltage: require('@/assets/fluent-emoji/high_voltage.png'),
  crown: require('@/assets/fluent-emoji/crown.png'),
  dna: require('@/assets/fluent-emoji/dna.png'),
  openFileFolder: require('@/assets/fluent-emoji/open_file_folder.png'),
  blueBook: require('@/assets/fluent-emoji/blue_book.png'),
  camera: require('@/assets/fluent-emoji/camera.png'),
  gear: require('@/assets/fluent-emoji/gear.png'),
  bell: require('@/assets/fluent-emoji/bell.png'),
  microphone: require('@/assets/fluent-emoji/microphone.png'),
  studioMicrophone: require('@/assets/fluent-emoji/studio_microphone.png'),
} as const;

export type FluentEmojiName = keyof typeof FLUENT_EMOJI_MAP;

interface FluentEmojiProps {
  name: FluentEmojiName;
  size?: number;
  style?: StyleProp<ImageStyle>;
  opacity?: number;
}

export default function FluentEmoji({ name, size = 24, style, opacity = 1 }: FluentEmojiProps) {
  return (
    <Image
      source={FLUENT_EMOJI_MAP[name]}
      style={[{ width: size, height: size, opacity, resizeMode: 'contain' }, style]}
      fadeDuration={0}
    />
  );
}
