import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';

export default function AddServiceScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  
  const [serviceName, setServiceName] = useState(params.name?.toString() || '');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const styles = createStyles(isDark);

  const handlePickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Ошибка', 'Необходимо разрешение для доступа к галерее');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLogoBase64(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const handleRemoveImage = () => {
    setLogoBase64(null);
  };

  const handleSave = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Ошибка', 'Введите название сервиса');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: serviceName.trim(),
          logo_base64: logoBase64,
        }),
      });

      if (response.ok) {
        Alert.alert('Успех', 'Сервис добавлен', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Ошибка', errorData.detail || 'Не удалось добавить сервис');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при добавлении сервиса');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
            <Text style={styles.title}>Добавление нового сервиса</Text>
          </View>

          <View style={styles.content}>
            {/* Service Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Название сервиса</Text>
              <TextInput
                style={styles.textInput}
                value={serviceName}
                onChangeText={setServiceName}
                placeholder="Введите название сервиса"
                placeholderTextColor={isDark ? '#888888' : '#666666'}
                autoFocus={!params.name}
              />
            </View>

            {/* Logo Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Логотип</Text>
              
              {logoBase64 ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${logoBase64}` }}
                    style={styles.selectedImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={handlePickImage}
                >
                  <Ionicons name="image" size={32} color={isDark ? '#888888' : '#666666'} />
                  <Text style={styles.imagePickerText}>
                    Выбрать изображение из галереи
                  </Text>
                </TouchableOpacity>
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
              disabled={isLoading || !serviceName.trim()}
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
    marginBottom: 8,
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
  imagePicker: {
    borderWidth: 2,
    borderColor: isDark ? '#444444' : '#dddddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: isDark ? '#1e1e1e' : '#f8f8f8',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: isDark ? '#888888' : '#666666',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    borderRadius: 12,
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