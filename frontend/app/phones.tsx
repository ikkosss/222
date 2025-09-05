import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FloatingNavigation from '../components/FloatingNavigation';

interface Phone {
  id: string;
  number: string;
  operator_id: string;
  created_at: string;
}

export default function PhonesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [phones, setPhones] = useState<Phone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const styles = createStyles(isDark);

  useEffect(() => {
    loadPhones();
  }, []);

  const loadPhones = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/phones`);
      if (response.ok) {
        const phonesData = await response.json();
        setPhones(phonesData);
      } else {
        console.error('Failed to load phones:', response.status);
      }
    } catch (error) {
      console.error('Error loading phones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhonePress = (phone: Phone) => {
    router.push(`/phone/${phone.id}`);
  };

  const handlePhoneLongPress = (phone: Phone) => {
    Alert.alert(
      phone.number,
      'Выберите действие:',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Редактировать', onPress: () => editPhone(phone) },
        { text: 'Удалить', style: 'destructive', onPress: () => deletePhone(phone) },
      ]
    );
  };

  const editPhone = (phone: Phone) => {
    // Navigate to edit phone screen
    router.push(`/edit-phone/${phone.id}`);
  };

  const deletePhone = async (phone: Phone) => {
    Alert.alert(
      'Удалить номер',
      `Вы уверены, что хотите удалить номер ${phone.number}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/phones/${phone.id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                loadPhones(); // Reload the list
              } else {
                Alert.alert('Ошибка', 'Не удалось удалить номер');
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Произошла ошибка при удалении номера');
            }
          }
        },
      ]
    );
  };

  const renderPhone = ({ item }: { item: Phone }) => (
    <TouchableOpacity
      style={styles.phoneItem}
      onPress={() => handlePhonePress(item)}
      onLongPress={() => handlePhoneLongPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.phoneNumber}>{item.number}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Номера не найдены</Text>
      <Text style={styles.emptySubtitle}>
        Добавьте номера телефонов через поиск на главном экране
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ВСЕ НОМЕРА</Text>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загрузка...</Text>
          </View>
        ) : (
          <FlatList
            data={phones}
            renderItem={renderPhone}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={phones.length === 0 ? styles.emptyList : undefined}
          />
        )}
      </View>

      <FloatingNavigation currentScreen="phones" />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#eeeeee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  phoneItem: {
    backgroundColor: isDark ? '#1e1e1e' : '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDark ? '#333333' : '#eeeeee',
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#333333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyList: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: isDark ? '#cccccc' : '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});