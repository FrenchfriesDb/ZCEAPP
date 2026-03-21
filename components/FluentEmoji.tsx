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
  fire: require('@/assets/fluent-emoji/fire.png'),
  eyes: require('@/assets/fluent-emoji/eyes.png'),
  gemStone: require('@/assets/fluent-emoji/gem_stone.png'),
  faceWithTearsOfJoy: require('@/assets/fluent-emoji/face_with_tears_of_joy.png'),
  ice: require('@/assets/fluent-emoji/ice.png'),
  label: require('@/assets/fluent-emoji/label.png'),
  speechBalloon: require('@/assets/fluent-emoji/speech_balloon.png'),
  memo: require('@/assets/fluent-emoji/memo.png'),
  zipperMouthFace: require('@/assets/fluent-emoji/zipper_mouth_face.png'),
  performingArts: require('@/assets/fluent-emoji/performing_arts.png'),
  shield: require('@/assets/fluent-emoji/shield.png'),
  clipboard: require('@/assets/fluent-emoji/clipboard.png'),
  trophy: require('@/assets/fluent-emoji/trophy.png'),
  ghost: require('@/assets/fluent-emoji/ghost.png'),
  speakingHead: require('@/assets/fluent-emoji/speaking_head.png'),
  repeatButton: require('@/assets/fluent-emoji/repeat_button.png'),
  wavingHand: require('@/assets/fluent-emoji/waving_hand.png'),
} as const;

export type FluentEmojiName = keyof typeof FLUENT_EMOJI_MAP;

const EMOJI_ALIAS_MAP: Record<string, FluentEmojiName> = {
  '⚔️': 'crossedSwords',
  '🎯': 'bullseye',
  '⚡': 'highVoltage',
  '👑': 'crown',
  '🧬': 'dna',
  '📂': 'openFileFolder',
  '📖': 'blueBook',
  '📷': 'camera',
  '⚙️': 'gear',
  '🔔': 'bell',
  '🎤': 'microphone',
  '🎙️': 'studioMicrophone',
  '🔥': 'fire',
  '👀': 'eyes',
  '👁️': 'eyes',
  '💎': 'gemStone',
  '😂': 'faceWithTearsOfJoy',
  '🧊': 'ice',
  '🏷️': 'label',
  '💬': 'speechBalloon',
  '📝': 'memo',
  '🤐': 'zipperMouthFace',
  '🎭': 'performingArts',
  '🛡️': 'shield',
  '📋': 'clipboard',
  '🏆': 'trophy',
  '👻': 'ghost',
  '🗣️': 'speakingHead',
  '🔄': 'repeatButton',
  '👋': 'wavingHand',
};

export function resolveFluentEmojiName(value?: string | null): FluentEmojiName | null {
  if (!value) return null;
  if (value in FLUENT_EMOJI_MAP) return value as FluentEmojiName;
  return EMOJI_ALIAS_MAP[value] ?? null;
}

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
