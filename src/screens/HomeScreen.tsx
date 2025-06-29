import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  useWindowDimensions,
  Platform,
  Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Text as SvgText } from 'react-native-svg';

import Wheel from '../components/Wheel';
import { RootStackParamList, WheelOption, WheelStats } from '../types';
import { loadWheelOptions, loadWheelStats, saveWheelStats, saveWheelOptions } from '../utils/storage';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const [options, setOptions] = useState<WheelOption[]>([]);
  const [stats, setStats] = useState<WheelStats>({ totalSpins: 0, lastSpinTime: Date.now(), optionStats: {} });
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const [lastWinner, setLastWinner] = useState<string>('');
  const soundRef = useRef<Audio.Sound | null>(null);
  const confettiRef = useRef<ConfettiCannon>(null);
  
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3'];

  const wheelSize = Math.min(screenWidth, screenHeight) * 0.75;

  // Sabit yay başlıklar için parametreler (wheelSize'dan sonra)
  const brandLeft = 'DÖRTYOL';
  const brandRight = 'MARKET';
  const brandColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#fbbf24', '#f472b6', '#10b981'
  ];
  const CENTER = wheelSize / 2;
  const RADIUS = CENTER - 10;
  const arcRadius = RADIUS + 18;
  // Sol yay (DÖRTYOL)
  const arcStartLeft = -Math.PI / 1.15;
  const arcEndLeft = -Math.PI / 1.60;
  const arcAngleLeft = arcEndLeft - arcStartLeft;
  const brandLeftLetters = brandLeft.split('');
  const letterAngleStepLeft = arcAngleLeft / (brandLeftLetters.length - 1);
  // Sağ yay (MARKET)
  const arcStartRight = Math.PI + Math.PI / 1.60;
  const arcEndRight = Math.PI + Math.PI / 1.15;
  const arcAngleRight = arcEndRight - arcStartRight;
  const brandRightLetters = brandRight.split('');
  const letterAngleStepRight = arcAngleRight / (brandRightLetters.length - 1);

  const loadSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
         require('../../assets/sounds/spin.mp3'),
         { shouldPlay: false, isLooping: true }
      );
      soundRef.current = sound;
    } catch (error) {
      console.log('Ses dosyası yüklenemedi. `assets/sounds/spin.mp3` dosyasının mevcut olduğundan emin olun.', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      loadSound();

      return () => {
        soundRef.current?.unloadAsync();
      };
    }, [])
  );

  const loadData = async () => {
    const [loadedOptions, loadedStats] = await Promise.all([
      loadWheelOptions(),
      loadWheelStats(),
    ]);
    setOptions(loadedOptions);
    setStats(loadedStats);
  };

  const spinWheel = async () => {
    if (isSpinning || options.length === 0) return;

    soundRef.current?.playFromPositionAsync(2000);
    setIsSpinning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 1. KAZANANI ÖNCEDEN BELİRLE
    const winner = selectWinnerByPercentage();

    // 2. KAZANAN İÇİN HEDEF AÇIYI HESAPLA (Derece olarak)
    const targetAngle = calculateAngleForWinner(winner);

    // 3. ANİMASYONU AYARLA
    const spinDuration = 8000; // 8 saniye
    const randomSpins = 8; // 8 tam tur + hedef açı

    // Mevcut rotasyonu da hesaba katarak, her zaman ileriye dönmesini sağlayan bir hedef belirle.
    const currentRotationDeg = (rotation.value * 180) / Math.PI;
    const finalTargetDeg = (randomSpins * 360) + targetAngle;
    
    // `withTiming` son değere animasyon yaptığı için, mevcut değerden büyük bir hedef belirliyoruz.
    // Bu, önceki dönüşlerin üzerine eklenerek devam etmesini sağlar.
    const newTargetRotation = rotation.value + ((finalTargetDeg - (currentRotationDeg % 360)) * Math.PI / 180);

    rotation.value = withTiming(newTargetRotation, {
      duration: spinDuration,
      easing: Easing.out(Easing.cubic),
    });

    // 4. SONUCU GÖSTER (Kazanan zaten belli)
    setTimeout(async () => {
      soundRef.current?.stopAsync();
      setIsSpinning(false);
      scale.value = withTiming(1, { duration: 300 });

      const newStats = {
        totalSpins: stats.totalSpins + 1,
        lastSpinTime: Date.now(),
        optionStats: {
          ...stats.optionStats,
          [winner.id]: (stats.optionStats[winner.id] || 0) + 1,
        },
      };
      setStats(newStats);
      await saveWheelStats(newStats);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Popup'ı göster
      setWinner(winner.text);
      setShowResultPopup(true);
      setLastWinner(winner.text);
    }, spinDuration);
  };

  const calculateAngleForWinner = (winner: WheelOption): number => {
    const index = options.findIndex(opt => opt.id === winner.id);
    if (index === -1) return 0;
    const sliceAngle = 360 / options.length;
    // Dilimin ortasını tepeye (270 derece) getirmek için gereken rotasyon
    const middleOfSlice = index * sliceAngle + sliceAngle / 2;
    const targetRotation = 270 - middleOfSlice;
    return targetRotation;
  };

  // Yüzdelik sisteme göre kazananı belirle (Bu fonksiyon doğru ve kalıyor)
  const selectWinnerByPercentage = (): WheelOption => {
    const totalPercentage = options.reduce((sum, option) => sum + option.percentage, 0);
    let random = Math.random() * totalPercentage;

    for (const option of options) {
      random -= option.percentage;
      if (random <= 0) {
        return option;
      }
    }

    return options[options.length - 1];
  };

  const closeResultPopup = () => {
    setShowResultPopup(false);
    setWinner('');
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}rad` }, { scale: scale.value }],
  }));

  return (
    <LinearGradient
      colors={['#2d3748', '#1a202c']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2d3748" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Admin')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Ana içerik */}
      <View style={styles.mainContent}>
        {/* Çark ve Pointer */}
        <View style={[styles.wheelContainer, { width: wheelSize, height: wheelSize }]}>
          {/* Sabit yay başlıklar */}
          <Svg width={wheelSize} height={wheelSize} style={{position:'absolute',top:0,left:0,pointerEvents:'none',zIndex:20}}>
            {/* Sol yay: DÖRTYOL */}
            {brandLeftLetters.map((char, i) => {
              const angle = arcStartLeft + i * letterAngleStepLeft;
              const x = CENTER + arcRadius * Math.cos(angle);
              const y = CENTER + arcRadius * Math.sin(angle) - 4;
              const rotate = (angle * 180) / Math.PI + 90;
              return (
                <SvgText
                  key={'left' + i}
                  x={x}
                  y={y}
                  fontSize={28}
                  fontWeight="bold"
                  fill={brandColors[i % brandColors.length]}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${rotate}, ${x}, ${y})`}
                  opacity={0.9}
                  letterSpacing={0.1}
                >
                  {char}
                </SvgText>
              );
            })}
            {/* Sağ yay: MARKET */}
            {brandRightLetters.map((char, i) => {
              const angle = arcStartRight + i * letterAngleStepRight;
              const x = CENTER + arcRadius * Math.cos(angle);
              const y = CENTER + arcRadius * Math.sin(angle) - 4;
              const rotate = (angle * 180) / Math.PI + 90;
              return (
                <SvgText
                  key={'right' + i}
                  x={x}
                  y={y}
                  fontSize={28}
                  fontWeight="bold"
                  fill={brandColors[(i + 7) % brandColors.length]}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${rotate}, ${x}, ${y})`}
                  opacity={0.9}
                  letterSpacing={0.5}
                >
                  {char}
                </SvgText>
              );
            })}
          </Svg>
          {options.length > 0 ? (
            <>
              <View style={styles.pointer} />
              <Animated.View style={animatedStyle}>
                <Wheel options={options} rotation={0} size={wheelSize} />
              </Animated.View>
              <TouchableOpacity
                style={[styles.centerSpinButton, { width: wheelSize * 0.25, height: wheelSize * 0.25, borderRadius: (wheelSize * 0.25) / 2 }]}
                onPress={spinWheel}
                disabled={isSpinning}
              >
                <Text style={styles.centerSpinButtonText}>ÇEVİR</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.emptyWheel, { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2}]}>
              <Text style={styles.emptyWheelText}>Seçenek ekleyin</Text>
            </View>
          )}
        </View>

        {/* İstatistikler */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Toplam Çevirme</Text>
            <Text style={styles.statValue}>{stats.totalSpins}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Son Kazanan</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {lastWinner || '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* Boş Durum Uyarısı */}
      {options.length === 0 && !isSpinning && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            Çarkı çevirmek için lütfen ayarlardan seçenek ekleyin.
          </Text>
        </View>
      )}

      {/* Sonuç Popup'ı */}
      <Modal
        visible={showResultPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={closeResultPopup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultPopup}>
            <Text style={styles.resultTitle}>Kazanan!</Text>
            <Text style={styles.resultWinner}>{winner}</Text>
            <TouchableOpacity style={styles.resultButton} onPress={closeResultPopup}>
              <Text style={styles.resultButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Konfeti */}
      {showResultPopup && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: screenWidth / 2, y: -10 }}
          autoStart={true}
          fadeOut={true}
          fallSpeed={3000}
          explosionSpeed={500}
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3']}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    padding: 10,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e2e8f0',
    letterSpacing: 1,
  },
  settingsButton: {
    padding: 10,
  },
  settingsIcon: {
    fontSize: 28,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 40,
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#e53e3e',
    position: 'absolute',
    top: -10,
    zIndex: 10,
    transform: [{ translateY: -12.5 }],
  },
  emptyWheel: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d3748',
    borderWidth: 5,
    borderColor: '#4a5568',
  },
  emptyWheelText: {
    color: '#a0aec0',
    fontSize: 18,
    fontWeight: '600',
  },
  centerSpinButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 20,
    borderWidth: 4,
    borderColor: '#4a5568',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  centerSpinButtonText: {
    color: '#1a202c',
    fontWeight: 'bold',
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#4a5568',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0aec0',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#48bb78',
  },
  emptyStateContainer: {
    position: 'absolute',
    bottom: 40,
    padding: 20,
  },
  emptyStateText: {
    color: '#a0aec0',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultPopup: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 40,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginHorizontal: 20,
    minWidth: 280,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 20,
  },
  resultWinner: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e67e22',
    marginBottom: 30,
    textAlign: 'center',
  },
  resultButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
  },
  resultButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 