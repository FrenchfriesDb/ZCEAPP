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
  brain: require('@/assets/fluent-emoji/brain.png'),
  brokenChain: require('@/assets/fluent-emoji/broken_chain.png'),
  closedBook: require('@/assets/fluent-emoji/closed_book.png'),
  crossMark: require('@/assets/fluent-emoji/cross_mark.png'),
  crystalBall: require('@/assets/fluent-emoji/crystal_ball.png'),
  door: require('@/assets/fluent-emoji/door.png'),
  elephant: require('@/assets/fluent-emoji/elephant.png'),
  email: require('@/assets/fluent-emoji/email.png'),
  flexedBiceps: require('@/assets/fluent-emoji/flexed_biceps.png'),
  fullMoonFace: require('@/assets/fluent-emoji/full_moon_face.png'),
  grimacingFace: require('@/assets/fluent-emoji/grimacing_face.png'),
  idButton: require('@/assets/fluent-emoji/id_button.png'),
  leftFacingFist: require('@/assets/fluent-emoji/left_facing_fist.png'),
  lightBulb: require('@/assets/fluent-emoji/light_bulb.png'),
  link: require('@/assets/fluent-emoji/link.png'),
  lipstick: require('@/assets/fluent-emoji/lipstick.png'),
  locked: require('@/assets/fluent-emoji/locked.png'),
  lyingFace: require('@/assets/fluent-emoji/lying_face.png'),
  megaphone: require('@/assets/fluent-emoji/megaphone.png'),
  mirror: require('@/assets/fluent-emoji/mirror.png'),
  noMobilePhones: require('@/assets/fluent-emoji/no_mobile_phones.png'),
  notebook: require('@/assets/fluent-emoji/notebook.png'),
  personStanding: require('@/assets/fluent-emoji/person_standing.png'),
  star: require('@/assets/fluent-emoji/star.png'),
  redHeart: require('@/assets/fluent-emoji/red_heart.png'),
  ring: require('@/assets/fluent-emoji/ring.png'),
  scroll: require('@/assets/fluent-emoji/scroll.png'),
  shushingFace: require('@/assets/fluent-emoji/shushing_face.png'),
  skullAndCrossbones: require('@/assets/fluent-emoji/skull_and_crossbones.png'),
  thumbsDown: require('@/assets/fluent-emoji/thumbs_down.png'),
  warning: require('@/assets/fluent-emoji/warning.png'),
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
  '🧠': 'brain',
  '⛓️‍💥': 'brokenChain',
  '📕': 'closedBook',
  '❌': 'crossMark',
  '🔮': 'crystalBall',
  '🚪': 'door',
  '🐘': 'elephant',
  '✉️': 'email',
  '💪': 'flexedBiceps',
  '🌕': 'fullMoonFace',
  '😬': 'grimacingFace',
  '🆔': 'idButton',
  '👊': 'leftFacingFist',
  '💡': 'lightBulb',
  '🔗': 'link',
  '💄': 'lipstick',
  '🔒': 'locked',
  '🤥': 'lyingFace',
  '📣': 'megaphone',
  '🪞': 'mirror',
  '📵': 'noMobilePhones',
  '📒': 'notebook',
  '🧍': 'personStanding',
  '⭐': 'star',
  '❤️': 'redHeart',
  '💍': 'ring',
  '📜': 'scroll',
  '🤫': 'shushingFace',
  '☠️': 'skullAndCrossbones',
  '👎': 'thumbsDown',
  '⚠️': 'warning',
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
