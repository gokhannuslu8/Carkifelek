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
  Modal,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPercentage, setEditPercentage] = useState('');
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [colorEditId, setColorEditId] = useState<string | null>(null);

  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3',
    '#e53e3e', '#fbbf24', '#10b981', '#6366f1', '#f472b6', '#f59e42', '#222b45', '#2d3748'
  ];

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

  const startEdit = (item: WheelOption) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditPercentage(String(item.percentage));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditPercentage('');
  };

  const saveEdit = async (id: string) => {
    const updatedOptions = options.map(option =>
      option.id === id ? { ...option, text: editText.trim(), percentage: parseFloat(editPercentage) } : option
    );
    setOptions(updatedOptions);
    await saveWheelOptions(updatedOptions);
    setEditingId(null);
    setEditText('');
    setEditPercentage('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openColorModal = (id: string) => {
    setColorEditId(id);
    setColorModalVisible(true);
  };

  const selectColor = async (color: string) => {
    if (!colorEditId) return;
    const updatedOptions = options.map(option =>
      option.id === colorEditId ? { ...option, color } : option
    );
    setOptions(updatedOptions);
    await saveWheelOptions(updatedOptions);
    setColorModalVisible(false);
    setColorEditId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderItem = ({ item }: { item: WheelOption }) => (
    <View style={[styles.optionCard, isLandscape && styles.optionCardLandscape]}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start'}}>
        <View style={styles.optionDetails}>
          <TouchableOpacity onPress={() => openColorModal(item.id)}>
            <View style={[styles.colorIndicator, { backgroundColor: item.color, borderWidth:1, borderColor:'#fff' }]} />
          </TouchableOpacity>
          {editingId === item.id ? (
            <TextInput
              style={[styles.textInput, {flex:1, marginBottom:0, marginRight:8}]}
              value={editText}
              onChangeText={setEditText}
              autoFocus
            />
          ) : (
            <Text style={[styles.optionText, isLandscape && styles.optionTextLandscape]} numberOfLines={1}>
              {item.text}
            </Text>
          )}
        </View>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          {editingId === item.id ? (
            <>
              <TouchableOpacity onPress={() => saveEdit(item.id)} style={{marginRight:8}}>
                <Text style={{fontSize:20}}>💾</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEdit}>
                <Text style={{fontSize:20}}>❌</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => startEdit(item)} style={{marginRight:8}}>
                <Text style={{fontSize:20}}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteOption(item.id)}>
                <Text style={{fontSize:20}}>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <View style={styles.optionActions}>
        {editingId === item.id ? (
          <TextInput
            style={[styles.optionProbabilityInput, {marginBottom:0}]}
            value={editPercentage}
            onChangeText={setEditPercentage}
            keyboardType="numeric"
          />
        ) : (
          <TextInput
            style={[styles.optionProbabilityInput, {marginBottom:0}]}
            value={String(item.percentage)}
            onChangeText={(text) => updatePercentage(item.id, text)}
            keyboardType="numeric"
            editable={editingId === null}
          />
        )}
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
        <TouchableOpacity style={{marginBottom:16, borderRadius:12, overflow:'hidden', elevation:3, shadowColor:'#667eea', shadowOpacity:0.3, shadowRadius:8}} onPress={autoDistribute}>
          <LinearGradient colors={['#667eea', '#5f27cd']} start={{x:0,y:0}} end={{x:1,y:1}} style={{padding:14, alignItems:'center'}}>
            <Text style={{color:'#fff',fontWeight:'bold',fontSize:17, letterSpacing:1}}>Otomatik Dağıt</Text>
          </LinearGradient>
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
        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>powered by Gökhan Uslu</Text>
          <Text style={styles.poweredByMail}>uslugokhn@gmail.com</Text>
        </View>
      </View>
      <Modal
        visible={colorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setColorModalVisible(false)}
      >
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:'#232b38',padding:20,borderRadius:20,alignItems:'center',maxWidth:320, minWidth:240, shadowColor:'#000', shadowOpacity:0.18, shadowRadius:16, shadowOffset:{width:0,height:4}}}>
            <Text style={{color:'#fff',fontWeight:'bold',fontSize:15,marginBottom:14}}>Renk Seç</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:0}}>
              {colorPalette.map((color, idx) => (
                <TouchableOpacity key={color} onPress={() => selectColor(color)} style={{margin:8}}>
                  <View style={{
                    width:32,
                    height:32,
                    borderRadius:16,
                    backgroundColor:color,
                    borderWidth: colorEditId && options.find(o=>o.id===colorEditId)?.color===color ? 3 : 2,
                    borderColor: colorEditId && options.find(o=>o.id===colorEditId)?.color===color ? '#fff' : '#444',
                    shadowColor:'#000',
                    shadowOpacity:0.10,
                    shadowRadius:4,
                    shadowOffset:{width:0,height:2},
                  }} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setColorModalVisible(false)} style={{marginTop:10}}>
              <Text style={{color:'#a0aec0',fontSize:13}}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#232b38',
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
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
    backgroundColor: '#232b38',
    borderRadius: 16,
    padding: 18,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#2d3748',
    color: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a5568',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  probabilityInput: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginLeft: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  optionCard: {
    backgroundColor: '#232b38',
    borderRadius: 14,
    padding: 18,
    marginVertical: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  optionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  optionText: {
    color: '#e2e8f0',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  optionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  optionProbabilityInput: {
    backgroundColor: '#2d3748',
    color: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a5568',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 28,
    elevation: 0,
    shadowOpacity: 0,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
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
  poweredByContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
    opacity: 0.35,
  },
  poweredByText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
    letterSpacing: 1,
  },
  poweredByMail: {
    fontSize: 13,
    color: '#e2e8f0',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});

export default AdminScreen; 