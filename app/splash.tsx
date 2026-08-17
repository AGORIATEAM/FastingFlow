import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const TRACK_WIDTH = Dimensions.get('window').width - 64;
const NAVY = '#050F1D';
const SECONDARY = '#84cfff';
const TERTIARY = '#45dfa4';
const ON_SURFACE_VARIANT = '#c5c6ce';
const PRIMARY_CONTAINER = '#0a1f3d';

function FlameIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C10.5 5 8 8 8 11c0 .88.18 1.72.5 2.5C7.55 12.5 7 11 7 9.5c0 0-3 3-3 6.5C4 19.64 7.58 23 12 23s8-3.36 8-7c0-3.5-3-6.5-5-8C15 9 15 10.5 15 12c0 0-1-1.5-1.5-3.5C13 6 12 2 12 2z"
        fill={SECONDARY}
      />
      <Path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill={TERTIARY} />
    </Svg>
  );
}

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(progressWidth, {
          toValue: TRACK_WIDTH * 0.6,
          duration: 1800,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [opacity, logoScale, progressWidth]);

  return (
    <View style={styles.screen}>
      {/* Ambient glow */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.glow} />
      </View>

      {/* Top-left system indicator */}
      <Animated.View style={[styles.systemBadge, { opacity }]}>
        <View style={styles.systemDot} />
        <Text style={styles.systemText}>SYSTEM READY</Text>
      </Animated.View>

      {/* Centered logo block */}
      <Animated.View style={[styles.logoBlock, { opacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.iconContainer}>
          <FlameIcon />
        </View>
        <Text style={styles.brandName}>FastLife</Text>
        <Text style={styles.tagline}>PRÉCISION SCIENTIFIQUE</Text>
      </Animated.View>

      {/* Bottom progress */}
      <Animated.View style={[styles.progressSection, { opacity }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingLabel}>Initialisation du protocole...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    borderRadius: 999,
    backgroundColor: 'rgba(61, 180, 242, 0.06)',
  },
  systemBadge: {
    position: 'absolute',
    top: 52,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.25,
  },
  systemDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: TERTIARY },
  systemText: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#e4e2e5',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  logoBlock: { alignItems: 'center', gap: 8 },
  iconContainer: {
    marginBottom: 12,
    backgroundColor: PRIMARY_CONTAINER,
    padding: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: SECONDARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  brandName: { fontSize: 32, fontWeight: '700', letterSpacing: -1, color: SECONDARY },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3.5,
    color: ON_SURFACE_VARIANT,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  progressSection: {
    position: 'absolute',
    bottom: 52,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBar: { height: 2, backgroundColor: SECONDARY, borderRadius: 99 },
  loadingLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: `${ON_SURFACE_VARIANT}99`,
  },
});
