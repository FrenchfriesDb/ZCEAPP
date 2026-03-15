import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  
  // Terminal lines animation values
  const terminalLines = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  // Cursor animation
  const cursorOpacity = useRef(new Animated.Value(0)).current;
  const [currentLine, setCurrentLine] = useState(0);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    // Logo fade in and scale animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo glow pulse after fade in
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(logoGlow, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(logoGlow, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
    }, 400);

    // Terminal sequence
    const terminalSequence = () => {
      let lineIndex = 0;
      
      const showNextLine = () => {
        if (lineIndex < 7) {
          // Fade in the line
          Animated.timing(terminalLines[lineIndex], {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();

          // Show cursor briefly
          setShowCursor(true);
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();

          setTimeout(() => {
            Animated.timing(cursorOpacity, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }).start();
            setShowCursor(false);
          }, 200);

          lineIndex++;
          setCurrentLine(lineIndex);

          if (lineIndex < 7) {
            setTimeout(showNextLine, 280);
          } else {
            // After final line, keep cursor blinking
            const blinkCursor = () => {
              Animated.sequence([
                Animated.timing(cursorOpacity, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(cursorOpacity, {
                  toValue: 0,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                if (currentLine === 7) {
                  setTimeout(blinkCursor, 400);
                }
              });
            };
            setTimeout(blinkCursor, 200);

            // Start fade out after pause
            setTimeout(() => {
              Animated.timing(containerOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }).start(() => {
                onFinish();
              });
            }, 400);
          }
        }
      };

      // Start terminal sequence after 300ms
      setTimeout(showNextLine, 300);
    };

    terminalSequence();
  }, []);

  const terminalTexts = [
    { text: "> Z.A.N.E. engine mounting...", color: 'rgba(255,255,255,0.4)' },
    { text: "> Biometrics synced.", color: 'rgba(255,255,255,0.4)' },
    { text: "> Aura protocols active.", color: 'rgba(0,212,255,0.7)' },
    { text: "> Weakness detection: online.", color: 'rgba(0,212,255,0.7)' },
    { text: "> No excuses loaded.", color: '#ff4444' },
    { text: "> Comfort: deleted.", color: '#ff4444' },
    { text: "> FRAME READY.", color: 'rgba(0,212,255,1.0)' },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image 
            source={require('../assets/images/ZCELOGO1.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Animated.Text
            style={[
              styles.logoText,
              {
                textShadowColor: logoGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,212,255,0)', 'rgba(0,212,255,1)'],
                }),
                textShadowRadius: logoGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
            ]}
          >
            Z.C.E
          </Animated.Text>
        </Animated.View>
        <Text style={styles.subtitle}>ZANE CONFIDENCE ENGINE</Text>
      </View>

      {/* Terminal Section */}
      <View style={styles.terminalSection}>
        {terminalTexts.map((item, index) => (
          <View key={index} style={styles.terminalLine}>
            <Animated.Text
              style={[
                styles.terminalText,
                { color: item.color, opacity: terminalLines[index] },
              ]}
            >
              {item.text}
            </Animated.Text>
            {showCursor && index === currentLine - 1 && (
              <Animated.Text
                style={[
                  styles.cursor,
                  { opacity: cursorOpacity, color: 'rgba(0,212,255,1)' },
                ]}
              >
                ▋
              </Animated.Text>
            )}
          </View>
        ))}
      </View>

      {/* Bottom Version Text */}
      <Text style={styles.versionText}>ZCE — Confidence Engine v2.0.1</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(0,212,255,0.5)',
    fontFamily: 'monospace',
  },
  terminalSection: {
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginBottom: 40,
  },
  terminalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  terminalText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  cursor: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginLeft: 2,
  },
  versionText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 10,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 2,
  },
});
