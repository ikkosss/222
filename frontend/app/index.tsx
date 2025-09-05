import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  useColorScheme,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import FloatingNavigation from '../components/FloatingNavigation';

interface SearchResult {
  type: 'phone' | 'service';
  id: string;
  display_text: string;
}

export default function MainScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  const styles = createStyles(isDark);

  // Search function with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim().length > 0) {
        performSearch(searchText.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        console.error('Search failed:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    if (searchText.trim() && searchResults.length === 0) {
      // No results found, offer to add new item
      if (isPhoneNumber(searchText.trim())) {
        showAddPhoneDialog(searchText.trim());
      } else {
        showAddServiceDialog(searchText.trim());
      }
    }
  };

  const isPhoneNumber = (text: string): boolean => {
    // Check if text looks like a phone number (contains mostly digits)
    const digitCount = text.replace(/\D/g, '').length;
    return digitCount >= 7; // At least 7 digits to be considered a phone number
  };

  const showAddPhoneDialog = (phoneNumber: string) => {
    Alert.alert(
      'Добавить номер',
      `Добавить номер ${phoneNumber}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Добавить', onPress: () => navigateToAddPhone(phoneNumber) },
      ]
    );
  };

  const showAddServiceDialog = (serviceName: string) => {
    Alert.alert(
      'Добавить сервис',
      `Добавить ${serviceName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Добавить', onPress: () => navigateToAddService(serviceName) },
      ]
    );
  };

  const navigateToAddPhone = (phoneNumber: string) => {
    // Navigate to add phone screen with pre-filled number
    router.push(`/add-phone?number=${encodeURIComponent(phoneNumber)}`);
  };

  const navigateToAddService = (serviceName: string) => {
    // Navigate to add service screen with pre-filled name
    router.push(`/add-service?name=${encodeURIComponent(serviceName)}`);
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'phone') {
      router.push(`/phone/${result.id}`);
    } else {
      router.push(`/service/${result.id}`);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
    >
      <Ionicons 
        name={item.type === 'phone' ? 'call' : 'heart'} 
        size={20} 
        color={isDark ? '#ffffff' : '#333333'} 
        style={styles.resultIcon}
      />
      <Text style={styles.resultText}>{item.display_text}</Text>
    </TouchableOpacity>
  );

  // Handle special search terms
  useEffect(() => {
    if (searchText.toLowerCase() === 'база данных') {
      showDatabaseOptions();
    } else if (searchText.toLowerCase() === 'изображения') {
      showImageOptions();
    }
  }, [searchText]);

  const showDatabaseOptions = () => {
    Alert.alert(
      'База данных',
      'Выберите действие:',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'ЭКСПОРТ', onPress: () => exportDatabase() },
        { text: 'ИМПОРТ', onPress: () => importDatabase() },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Изображения',
      'Выберите действие:',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'ЭКСПОРТ', onPress: () => exportImages() },
        { text: 'ИМПОРТ', onPress: () => importImages() },
      ]
    );
  };

  const exportDatabase = () => {
    // TODO: Implement database export
    Alert.alert('Экспорт', 'Функция экспорта базы данных будет реализована в следующих версиях');
  };

  const importDatabase = () => {
    // TODO: Implement database import
    Alert.alert('Импорт', 'Функция импорта базы данных будет реализована в следующих версиях');
  };

  const exportImages = () => {
    // TODO: Implement image export
    Alert.alert('Экспорт', 'Функция экспорта изображений будет реализована в следующих версиях');
  };

  const importImages = () => {
    // TODO: Implement image import
    Alert.alert('Импорт', 'Функция импорта изображений будет реализована в следующих версиях');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons 
                name="search" 
                size={20} 
                color={isDark ? '#888888' : '#666666'} 
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Номер телефона или название сервиса"
                placeholderTextColor={isDark ? '#888888' : '#666666'}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons 
                    name="close-circle" 
                    size={20} 
                    color={isDark ? '#888888' : '#666666'} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                style={styles.resultsList}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Поиск...</Text>
            </View>
          )}

          {/* Welcome message when no search */}
          {!searchText && !isLoading && (
            <View style={styles.welcomeContainer}>
              <Ionicons 
                name="search" 
                size={64} 
                color={isDark ? '#444444' : '#cccccc'} 
                style={styles.welcomeIcon}
              />
              <Text style={styles.welcomeTitle}>UPN - Трекер номеров</Text>
              <Text style={styles.welcomeSubtitle}>
                Отслеживайте использование номеров телефонов в различных сервисах
              </Text>
              <Text style={styles.welcomeHint}>
                Начните поиск или используйте навигацию внизу
              </Text>
            </View>
          )}
        </View>

        <FloatingNavigation currentScreen="search" />
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#333333' : '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: isDark ? '#ffffff' : '#333333',
  },
  clearButton: {
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#eeeeee',
  },
  resultIcon: {
    marginRight: 12,
  },
  resultText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#333333',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#333333',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeIcon: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: isDark ? '#cccccc' : '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  welcomeHint: {
    fontSize: 14,
    color: isDark ? '#888888' : '#999999',
    textAlign: 'center',
  },
});