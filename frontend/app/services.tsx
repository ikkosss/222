import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FloatingNavigation from '../components/FloatingNavigation';

interface Service {
  id: string;
  name: string;
  logo_base64?: string;
  created_at: string;
}

export default function ServicesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const styles = createStyles(isDark);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/services`);
      if (response.ok) {
        const servicesData = await response.json();
        setServices(servicesData);
      } else {
        console.error('Failed to load services:', response.status);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServicePress = (service: Service) => {
    router.push(`/service/${service.id}`);
  };

  const handleServiceLongPress = (service: Service) => {
    Alert.alert(
      service.name,
      'Выберите действие:',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Редактировать', onPress: () => editService(service) },
        { text: 'Удалить', style: 'destructive', onPress: () => deleteService(service) },
      ]
    );
  };

  const editService = (service: Service) => {
    // Navigate to edit service screen
    router.push(`/edit-service/${service.id}`);
  };

  const deleteService = async (service: Service) => {
    Alert.alert(
      'Удалить сервис',
      `Вы уверены, что хотите удалить сервис ${service.name}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/services/${service.id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                loadServices(); // Reload the list
              } else {
                Alert.alert('Ошибка', 'Не удалось удалить сервис');
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Произошла ошибка при удалении сервиса');
            }
          }
        },
      ]
    );
  };

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => handleServicePress(item)}
      onLongPress={() => handleServiceLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.logoContainer}>
        {item.logo_base64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.logo_base64}` }}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderLogo}>
            <Text style={styles.placeholderText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.serviceName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Сервисы не найдены</Text>
      <Text style={styles.emptySubtitle}>
        Добавьте сервисы через поиск на главном экране
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ВСЕ МЕСТА</Text>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Загрузка...</Text>
          </View>
        ) : (
          <FlatList
            data={services}
            renderItem={renderService}
            keyExtractor={(item) => item.id}
            numColumns={5}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={services.length === 0 ? styles.emptyList : styles.servicesList}
            columnWrapperStyle={services.length > 0 ? styles.row : undefined}
          />
        )}
      </View>

      <FloatingNavigation currentScreen="services" />
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
  servicesList: {
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '18%',
    aspectRatio: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: isDark ? '#333333' : '#eeeeee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
  },
  serviceName: {
    fontSize: 12,
    color: isDark ? '#ffffff' : '#333333',
    textAlign: 'center',
    lineHeight: 14,
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