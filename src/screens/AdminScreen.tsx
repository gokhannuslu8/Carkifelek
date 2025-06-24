import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  FlatList,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { RootStackParamList, WheelOption } from '../types';
import { loadWheelOptions, saveWheelOptions } from '../utils/storage';
import { getColorByIndex } from '../utils/colors';

// State'i kendi içinde yöneten, odak kaybını önleyen form bileşeni
const AddOptionForm = ({ onAddOption, isLandscape }: { onAddOption: (text: string, percentage: number) => void; isLandscape: boolean }) => {
    const [text, setText] = useState('');
    const [percentage, setPercentage] = useState('20');

    const handleAdd = () => {
        if (!text.trim()) {
            Alert.alert('Hata', 'Lütfen seçenek metni girin.');
            return;
        }
        const percentValue = parseFloat(percentage);
        if (isNaN(percentValue) || percentValue <= 0 || percentValue > 100) {
            Alert.alert('Hata', 'Lütfen 0-100 arası bir yüzde değeri girin.\n\nÖrnek: 20 = %20 şans');
            return;
        }

        onAddOption(text, percentValue);
        setText('');
        setPercentage('20');
    };

    return (
        <View style={[styles.addSection, isLandscape && styles.addSectionLandscape]}>
            <TextInput
                style={[styles.textInput, isLandscape && styles.textInputLandscape]}
                placeholder="Yeni seçenek ekle..."
                placeholderTextColor="#718096"
                value={text}
                onChangeText={setText}
            />
            <View style={[styles.row, isLandscape && styles.rowLandscape]}>
                <TextInput
                    style={[styles.textInput, styles.probabilityInput, isLandscape && styles.probabilityInputLandscape]}
                    placeholder="Yüzde (%)"
                    placeholderTextColor="#718096"
                    value={percentage}
                    onChangeText={setPercentage}
                    keyboardType="numeric"
                />
                <TouchableOpacity style={[styles.addButton, isLandscape && styles.addButtonLandscape]} onPress={handleAdd}>
                    <Text style={styles.addButtonText}>Ekle</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

type AdminScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Admin'>;

interface AdminScreenProps {
  navigation: AdminScreenNavigationProp;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  
  const [options, setOptions] = useState<WheelOption[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const loadedOptions = await loadWheelOptions();
    setOptions(loadedOptions);
  };

  const addOption = async (text: string, percentage: number) => {
    const newOption: WheelOption = {
      id: Date.now().toString(),
      text: text.trim(),
      percentage,
      color: getColorByIndex(options.length),
    };
    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);
    await saveWheelOptions(updatedOptions);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteOption = async (id: string) => {
    const updatedOptions = options.filter(option => option.id !== id);
    setOptions(updatedOptions);
    await saveWheelOptions(updatedOptions);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const clearAllOptions = async () => {
    setOptions([]);
    await saveWheelOptions([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const updatePercentage = async (id: string, newPercentage: string) => {
    const percentage = parseFloat(newPercentage);
    const updatedOptions = options.map(option =>
      option.id === id ? { ...option, percentage: isNaN(percentage) ? 0 : percentage } : option
    );
    setOptions(updatedOptions);
    await saveWheelOptions(updatedOptions);
  };

  const autoDistribute = async () => {
    if (options.length === 0) return;
    const equalPercent = +(100 / options.length).toFixed(2);
    const updatedOptions = options.map(option => ({ ...option, percentage: equalPercent }));
    setOptions(updatedOptions);
    await saveWheelOptions(updatedOptions);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderItem = ({ item }: { item: WheelOption }) => (
    <View style={[styles.optionCard, isLandscape && styles.optionCardLandscape]}>
      <View style={styles.optionDetails}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        <Text style={[styles.optionText, isLandscape && styles.optionTextLandscape]} numberOfLines={1}>
          {item.text}
        </Text>
      </View>
      <View style={[styles.optionActions, isLandscape && styles.optionActionsLandscape]}>
        <TextInput
          style={[styles.textInput, styles.optionProbabilityInput, isLandscape && styles.optionProbabilityInputLandscape]}
          value={String(item.percentage)}
          onChangeText={(text) => updatePercentage(item.id, text)}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.deleteButton, isLandscape && styles.deleteButtonLandscape]}
          onPress={() => deleteOption(item.id)}
        >
          <Text style={styles.deleteButtonText}>SİL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, isLandscape && styles.containerLandscape]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a202c" />
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isLandscape && styles.titleLandscape]}>Seçenekleri Yönet</Text>
        <TouchableOpacity onPress={clearAllOptions}>
          <Text style={styles.clearButtonText}>Tümünü Sil</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.contentContainer, isLandscape && styles.contentContainerLandscape]}>
        <TouchableOpacity style={{backgroundColor:'#667eea',padding:10,borderRadius:10,alignItems:'center',marginBottom:10}} onPress={autoDistribute}>
          <Text style={{color:'#fff',fontWeight:'bold',fontSize:16}}>Otomatik Dağıt</Text>
        </TouchableOpacity>
        <AddOptionForm onAddOption={addOption} isLandscape={isLandscape} />
        <FlatList
          data={options}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Henüz seçenek eklenmedi.</Text>
          }
          style={styles.list}
          contentContainerStyle={[styles.listContent, isLandscape && styles.listContentLandscape]}
          keyboardShouldPersistTaps="handled"
          numColumns={isLandscape ? 2 : 1}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#2d3748',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 10,
    marginHorizontal: -10,
  },
  backButtonText: {
    color: '#e2e8f0',
    fontSize: 24,
  },
  clearButtonText: {
      color: '#e53e3e',
      fontSize: 14,
      fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  addSection: {
    backgroundColor: '#2d3748',
    borderRadius: 15,
    padding: 20,
    marginVertical: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#4a5568',
    color: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  probabilityInput: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#48bb78',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    height: 48,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionCard: {
    backgroundColor: '#2d3748',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  optionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '500',
  },
  optionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionProbabilityInput: {
    flex: 1,
    marginRight: 15,
    marginBottom: 0,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  addSectionLandscape: {
    padding: 15,
  },
  textInputLandscape: {
    paddingHorizontal: 10,
  },
  rowLandscape: {
    justifyContent: 'space-between',
  },
  probabilityInputLandscape: {
    flex: 1,
    marginRight: 10,
  },
  addButtonLandscape: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  containerLandscape: {
    flex: 1,
  },
  headerLandscape: {
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
  },
  titleLandscape: {
    fontSize: 20,
  },
  contentContainerLandscape: {
    paddingHorizontal: 15,
  },
  listContentLandscape: {
    paddingBottom: 10,
  },
  optionCardLandscape: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  optionTextLandscape: {
    fontSize: 16,
  },
  optionActionsLandscape: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  optionProbabilityInputLandscape: {
    marginRight: 0,
    marginBottom: 10,
  },
  deleteButtonLandscape: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});

export default AdminScreen; 