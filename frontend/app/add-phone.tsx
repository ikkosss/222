import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';

interface Operator {
  id: string;
  name: string;
  logo_base64?: string;
}

export default function AddPhoneScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  
  const [phoneNumber, setPhoneNumber] = useState(params.number?.toString() || '');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOperators, setIsLoadingOperators] = useState(true);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const styles = createStyles(isDark);

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    setIsLoadingOperators(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/operators`);
      if (response.ok) {
        const operatorsData = await response.json();
        setOperators(operatorsData);
      } else {
        console.error('Failed to load operators:', response.status);
      }
    } catch (error) {
      console.error('Error loading operators:', error);
    } finally {
      setIsLoadingOperators(false);
    }
  };

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Ошибка', 'Введите номер телефона');
      return;
    }

    if (!selectedOperator) {
      Alert.alert('Ошибка', 'Выберите оператора');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/phones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: phoneNumber.trim(),
          operator_id: selectedOperator,
        }),
      });

      if (response.ok) {
        Alert.alert('Успех', 'Номер телефона добавлен', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else if (response.status === 409) {
        Alert.alert('Ошибка', 'Этот номер телефона уже существует');
      } else if (response.status === 404) {
        Alert.alert('Ошибка', 'Выбранный оператор не найден');
      } else {
        const errorData = await response.json();
        Alert.alert('Ошибка', errorData.detail || 'Не удалось добавить номер');
      }
    } catch (error) {
      console.error('Error creating phone:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при добавлении номера');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleAddOperator = () => {
    router.push('/add-operator');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#333333'} />
            </TouchableOpacity>
            <Text style={styles.title}>Добавление нового номера</Text>
          </View>

          <View style={styles.content}>
            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Номер телефона</Text>
              <TextInput
                style={styles.textInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Введите номер телефона"
                placeholderTextColor={isDark ? '#888888' : '#666666'}
                keyboardType="phone-pad"
                autoFocus={!params.number}
              />
            </View>

            {/* Operator Selection */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Оператор</Text>
                <TouchableOpacity 
                  onPress={handleAddOperator}
                  style={styles.addButton}
                  disabled={isLoadingOperators}
                >
                  <Ionicons name="add-circle" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              
              {isLoadingOperators ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Загрузка операторов...</Text>
                </View>
              ) : operators.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Нет доступных операторов</Text>
                  <TouchableOpacity onPress={handleAddOperator} style={styles.addOperatorButton}>
                    <Text style={styles.addOperatorText}>Добавить оператора</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedOperator}
                    onValueChange={(itemValue) => setSelectedOperator(itemValue)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item 
                      label="Выберите оператора" 
                      value="" 
                      color={isDark ? '#888888' : '#666666'}
                    />
                    {operators.map((operator) => (
                      <Picker.Item
                        key={operator.id}
                        label={operator.name}
                        value={operator.id}
                        color={isDark ? '#ffffff' : '#333333'}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSave}
              disabled={isLoading || !phoneNumber.trim() || !selectedOperator}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#eeeeee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
    marginBottom: 8,
  },
  addButton: {
    padding: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: isDark ? '#ffffff' : '#333333',
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#dddddd',
    borderRadius: 8,
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
  },
  picker: {
    color: isDark ? '#ffffff' : '#333333',
  },
  pickerItem: {
    color: isDark ? '#ffffff' : '#333333',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: isDark ? '#ffffff' : '#333333',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: isDark ? '#888888' : '#666666',
    marginBottom: 12,
  },
  addOperatorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addOperatorText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: isDark ? '#333333' : '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#888888',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});