import AsyncStorage from '@react-native-async-storage/async-storage';
import { WheelOption, WheelStats } from '../types';

const STORAGE_KEYS = {
  WHEEL_OPTIONS: 'wheel_options',
  WHEEL_STATS: 'wheel_stats',
};

// Eski veri yapısını yeni sisteme dönüştürme fonksiyonu
const migrateOldData = (oldData: any): WheelOption[] => {
  if (!Array.isArray(oldData)) return [];
  
  return oldData.map((item: any) => ({
    id: item.id,
    text: item.text,
    percentage: item.frequency || item.probability || 20, // Eski değerleri yüzdeye dönüştür
    color: item.color,
  }));
};

export const saveWheelOptions = async (options: WheelOption[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WHEEL_OPTIONS, JSON.stringify(options));
  } catch (error) {
    console.error('Error saving wheel options:', error);
  }
};

export const loadWheelOptions = async (): Promise<WheelOption[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WHEEL_OPTIONS);
    if (!data) return [];
    
    const parsedData = JSON.parse(data);
    
    // Eski veri yapısını kontrol et ve dönüştür
    if (parsedData.length > 0 && (parsedData[0].hasOwnProperty('probability') || parsedData[0].hasOwnProperty('frequency'))) {
      console.log('Migrating old data structure to new percentage system...');
      const migratedData = migrateOldData(parsedData);
      await saveWheelOptions(migratedData); // Yeni formatı kaydet
      return migratedData;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error loading wheel options:', error);
    return [];
  }
};

export const saveWheelStats = async (stats: WheelStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WHEEL_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving wheel stats:', error);
  }
};

export const loadWheelStats = async (): Promise<WheelStats> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WHEEL_STATS);
    if (!data) {
      return { totalSpins: 0, lastSpinTime: Date.now(), optionStats: {} };
    }
    
    const parsedData = JSON.parse(data);
    
    // Eski veri yapısını kontrol et ve dönüştür
    if (parsedData.hasOwnProperty('lastWinner')) {
      console.log('Migrating old stats structure to new system...');
      return { 
        totalSpins: parsedData.totalSpins || 0, 
        lastSpinTime: Date.now(), 
        optionStats: {} 
      };
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error loading wheel stats:', error);
    return { totalSpins: 0, lastSpinTime: Date.now(), optionStats: {} };
  }
}; 