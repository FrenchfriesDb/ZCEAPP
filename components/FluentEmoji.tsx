import React from 'react';
import type { ImageStyle, StyleProp } from 'react-native';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';

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
  faceWithRaisedEyebrow: require('@/assets/fluent-emoji/face_with_raised_eyebrow.png'),
  smirkingFace: require('@/assets/fluent-emoji/smirking_face.png'),
  turtle: require('@/assets/fluent-emoji/turtle.png'),
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
  gameDie: require('@/assets/fluent-emoji/game_die.png'),
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
  foldedHands: require('@/assets/fluent-emoji/folded_hands.png'),
  chair: require('@/assets/fluent-emoji/chair.png'),
  slightlySmilingFace: require('@/assets/fluent-emoji/slightly_smiling_face.png'),
  redQuestionMark: require('@/assets/fluent-emoji/red_question_mark.png'),
  bomb: require('@/assets/fluent-emoji/bomb.png'),
  rightFacingFist: require('@/assets/fluent-emoji/right_facing_fist.png'),
  shoppingCart: require('@/assets/fluent-emoji/shopping_cart.png'),
  hourglassNotDone: require('@/assets/fluent-emoji/hourglass_not_done.png'),
  upArrow: require('@/assets/fluent-emoji/up_arrow.png'),
  windFace: require('@/assets/fluent-emoji/wind_face.png'),
  newMoonFace: require('@/assets/fluent-emoji/new_moon_face.png'),
  movieCamera: require('@/assets/fluent-emoji/movie_camera.png'),
  barChart: require('@/assets/fluent-emoji/bar_chart.png'),
  calendar: require('@/assets/fluent-emoji/calendar.png'),
  loudspeaker: require('@/assets/fluent-emoji/loudspeaker.png'),
  snail: require('@/assets/fluent-emoji/snail.png'),
  neutralFace: require('@/assets/fluent-emoji/neutral_face.png'),
  prohibited: require('@/assets/fluent-emoji/prohibited.png'),
  coldFace: require('@/assets/fluent-emoji/cold_face.png'),
  personInLotusPosition: require('@/assets/fluent-emoji/person_in_lotus_position.png'),
  wing: require('@/assets/fluent-emoji/wing.png'),
  infinity: require('@/assets/fluent-emoji/infinity.png'),
  alarmClock: require('@/assets/fluent-emoji/alarm_clock.png'),
  stopwatch: require('@/assets/fluent-emoji/stopwatch.png'),
  bustInSilhouette: require('@/assets/fluent-emoji/bust_in_silhouette.png'),
  ogre: require('@/assets/fluent-emoji/ogre.png'),
  artistPalette: require('@/assets/fluent-emoji/artist_palette.png'),
  faceBlowingAKiss: require('@/assets/fluent-emoji/face_blowing_a_kiss.png'),
  wastebasket: require('@/assets/fluent-emoji/wastebasket.png'),
  videoGame: require('@/assets/fluent-emoji/video_game.png'),
  bellhopBell: require('@/assets/fluent-emoji/bellhop_bell.png'),
  orangutan: require('@/assets/fluent-emoji/orangutan.png'),
  babyChick: require('@/assets/fluent-emoji/baby_chick.png'),
  catFace: require('@/assets/fluent-emoji/cat_face.png'),
  dizzy: require('@/assets/fluent-emoji/dizzy.png'),
} as const;

export type FluentEmojiName = keyof typeof FLUENT_EMOJI_MAP;

const FLUENT_EMOJI_SOURCES = Object.values(FLUENT_EMOJI_MAP);
const EMOJI_Y_OFFSET: Partial<Record<FluentEmojiName, number>> = {
  crown: -1,
};

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
  '🎲': 'gameDie',
  '📵': 'noMobilePhones',
  '📒': 'notebook',
  '📓': 'notebook',
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
  '🙏': 'foldedHands',
  '🪑': 'chair',
  '🙂': 'slightlySmilingFace',
  '😏': 'smirkingFace',
  '🤨': 'faceWithRaisedEyebrow',
  '❓': 'redQuestionMark',
  '💣': 'bomb',
  '🤜': 'rightFacingFist',
  '🛒': 'shoppingCart',
  '⏳': 'hourglassNotDone',
  '⬆️': 'upArrow',
  '🌬️': 'windFace',
  '🌑': 'newMoonFace',
  '🎥': 'movieCamera',
  '📊': 'barChart',
  '📅': 'calendar',
  '📢': 'loudspeaker',
  '🐌': 'snail',
  '🐢': 'turtle',
  '😐': 'neutralFace',
  '🚫': 'prohibited',
  '🥶': 'coldFace',
  '🧘': 'personInLotusPosition',
  '🪽': 'wing',
  '∞': 'infinity',
  '⏰': 'alarmClock',
  '⏱️': 'stopwatch',
  '👤': 'bustInSilhouette',
  '👹': 'ogre',
  '🎨': 'artistPalette',
  '🗑️': 'wastebasket',
  '🎮': 'videoGame',
  '🛎️': 'bellhopBell',
  '🦧': 'orangutan',
  '🐣': 'babyChick',
  '🐱': 'catFace',
  '💫': 'dizzy',
  '😘': 'faceBlowingAKiss',
};

export function resolveFluentEmojiName(value?: string | null): FluentEmojiName | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed in FLUENT_EMOJI_MAP) return trimmed as FluentEmojiName;
  if (EMOJI_ALIAS_MAP[trimmed]) return EMOJI_ALIAS_MAP[trimmed];

  // Normalize common unicode modifiers that can break exact emoji alias matching.
  const normalized = trimmed
    .replace(/[\uFE0E\uFE0F]/g, '')
    .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
    .replace(/\u200D/gu, '')
    .trim();

  if (EMOJI_ALIAS_MAP[normalized]) return EMOJI_ALIAS_MAP[normalized];

  for (const [emoji, name] of Object.entries(EMOJI_ALIAS_MAP)) {
    const aliasNormalized = emoji
      .replace(/[\uFE0E\uFE0F]/g, '')
      .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
      .replace(/\u200D/gu, '');

    if (aliasNormalized === normalized) {
      return name;
    }
  }

  return null;
}

export async function preloadFluentEmojiAssets(): Promise<void> {
  await Promise.allSettled(
    FLUENT_EMOJI_SOURCES.map((source) => Asset.fromModule(source).downloadAsync())
  );
}

interface FluentEmojiProps {
  name: FluentEmojiName;
  size?: number;
  style?: StyleProp<ImageStyle>;
  opacity?: number;
}

function FluentEmojiBase({ name, size = 24, style, opacity = 1 }: FluentEmojiProps) {
  const y = EMOJI_Y_OFFSET[name] || 0;
  return (
    <Image
      source={FLUENT_EMOJI_MAP[name]}
      style={[{ width: size, height: size, opacity, transform: [{ translateY: y }] }, style]}
      contentFit="contain"
      transition={0}
      cachePolicy="memory-disk"
    />
  );
}

const FluentEmoji = React.memo(FluentEmojiBase);
export default FluentEmoji;
