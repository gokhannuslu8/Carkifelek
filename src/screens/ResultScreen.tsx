import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, useWindowDimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;
type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

interface ResultScreenProps {
  navigation: ResultScreenNavigationProp;
  route: ResultScreenRouteProp;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ navigation, route }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  
  const confettiRef = useRef<ConfettiCannon>(null);
  const winner = route.params?.winner || '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={[styles.popup, isLandscape && styles.popupLandscape]}>
        <Text style={[styles.title, isLandscape && styles.titleLandscape]}>Kazanan!</Text>
        <Text style={[styles.winner, isLandscape && styles.winnerLandscape]}>{winner}</Text>
        <TouchableOpacity style={[styles.button, isLandscape && styles.buttonLandscape]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Ana Ekrana Dön</Text>
        </TouchableOpacity>
      </View>
      <ConfettiCannon
        count={120}
        origin={{ x: screenWidth / 2, y: 0 }}
        autoStart={true}
        fadeOut={true}
        fallSpeed={3000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 40,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 20,
  },
  winner: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e67e22',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  popupLandscape: {
    padding: 20,
  },
  titleLandscape: {
    fontSize: 24,
  },
  winnerLandscape: {
    fontSize: 32,
  },
  buttonLandscape: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});

export default ResultScreen; 