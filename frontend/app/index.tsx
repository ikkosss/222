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
    const lowerSearchText = searchText.toLowerCase().trim();
    if (lowerSearchText === 'база данных') {
      setSearchResults([]);
      showDatabaseOptions();
      setSearchText('');
    } else if (lowerSearchText === 'изображения') {
      setSearchResults([]);
      showImageOptions();
      setSearchText('');
    }
  }, [searchText]);

  const showDatabaseOptions = () => {
    Alert.alert(
      'База данных',
      'Выберите действие:',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'ЭКСПОРТ', onPress: () => router.push('/export-import') },
        { text: 'ИМПОРТ', onPress: () => router.push('/export-import') },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Изображения',
      'Выберите действие:',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'ЭКСПОРТ', onPress: () => router.push('/export-import') },
        { text: 'ИМПОРТ', onPress: () => router.push('/export-import') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
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

          {/* Centered Search Bar */}
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
            
            {/* Add links under search */}
            <View style={styles.addLinksContainer}>
              <TouchableOpacity
                style={styles.addLink}
                onPress={() => router.push('/add-phone')}
                activeOpacity={0.7}
              >
                <Text style={styles.addLinkText}>➕ Добавить новый номер</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addLink}
                onPress={() => router.push('/add-service')}
                activeOpacity={0.7}
              >
                <Text style={styles.addLinkText}>➕ Добавить новый сервис</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchContainer: {
    position: 'absolute',
    width: '70%',
    alignSelf: 'center',
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
  addLinksContainer: {
    marginTop: 24,
    width: '100%',
    gap: 16,
  },
  addLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  addLinkText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#333333',
  },
  resultsContainer: {
    position: 'absolute',
    top: 80, // Позиция под поисковой строкой
    left: '15%', // Центрировано как поле поиска
    right: '15%',
    bottom: 120, // Отступ от плавающих кнопок
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
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#333333',
  },
});