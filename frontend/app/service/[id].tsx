import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import FloatingNavigation from '../../components/FloatingNavigation';

interface Service {
  id: string;
  name: string;
  logo_base64?: string;
}

interface Phone {
  id: string;
  number: string;
  operator_id: string;
}

interface Usage {
  id: string;
  phone_id: string;
  service_id: string;
  used_at: string;
}

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [allPhones, setAllPhones] = useState<Phone[]>([]);
  const [usedPhones, setUsedPhones] = useState<(Phone & { used_at: string })[]>([]);
  const [unusedPhones, setUnusedPhones] = useState<Phone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unusedExpanded, setUnusedExpanded] = useState(false);
  const [usedExpanded, setUsedExpanded] = useState(false);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const styles = createStyles(isDark);

  useEffect(() => {
    if (serviceId) {
      loadServiceData();
    }
  }, [serviceId]);

  const loadServiceData = async () => {
    setIsLoading(true);
    try {
      // Load service data
      const serviceResponse = await fetch(`${BACKEND_URL}/api/services/${serviceId}`);
      if (!serviceResponse.ok) {
        Alert.alert('Ошибка', 'Сервис не найден');
        router.back();
        return;
      }
      const serviceData = await serviceResponse.json();
      setService(serviceData);

      // Load all phones
      const phonesResponse = await fetch(`${BACKEND_URL}/api/phones`);
      if (phonesResponse.ok) {
        const phonesData = await phonesResponse.json();
        setAllPhones(phonesData);
      }

      // Load usage data
      const usageResponse = await fetch(`${BACKEND_URL}/api/usage`);
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        const serviceUsage = usageData.filter((usage: Usage) => usage.service_id === serviceId);
        
        // Separate used and unused phones
        const usedPhoneIds = serviceUsage.map((usage: Usage) => usage.phone_id);
        const used = phonesData
          .filter((phone: Phone) => usedPhoneIds.includes(phone.id))
          .map((phone: Phone) => {
            const usage = serviceUsage.find((u: Usage) => u.phone_id === phone.id);
            return { ...phone, used_at: usage?.used_at || '' };
          });
        
        const unused = phonesData.filter((phone: Phone) => !usedPhoneIds.includes(phone.id));
        
        setUsedPhones(used);
        setUnusedPhones(unused);
      }
    } catch (error) {
      console.error('Error loading service data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditService = () => {
    router.push(`/edit-service/${serviceId}`);
  };

  const handlePhonePress = async (phone: Phone, isUsed: boolean) => {
    if (isUsed) {
      // Mark as unused
      Alert.alert(
        'Пометить как не использованный?',
        `Номер ${phone.number} не был использован в ${service?.name}?`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Подтвердить', onPress: () => markAsUnused(phone) },
        ]
      );
    } else {
      // Mark as used
      Alert.alert(
        'Подтвердить использование',
        `Номер ${phone.number} был использован в ${service?.name}?`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Подтвердить', onPress: () => markAsUsed(phone) },
        ]
      );
    }
  };

  const markAsUsed = async (phone: Phone) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_id: phone.id,
          service_id: serviceId,
        }),
      });

      if (response.ok) {
        loadServiceData(); // Reload data
      } else if (response.status === 409) {
        Alert.alert('Ошибка', 'Использование уже записано');
      } else {
        Alert.alert('Ошибка', 'Не удалось записать использование');
      }
    } catch (error) {
      console.error('Error marking as used:', error);
      Alert.alert('Ошибка', 'Произошла ошибка');
    }
  };

  const markAsUnused = async (phone: Phone) => {
    try {
      // Find the usage record to delete
      const usageResponse = await fetch(`${BACKEND_URL}/api/usage`);
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        const usageRecord = usageData.find((usage: Usage) => 
          usage.phone_id === phone.id && usage.service_id === serviceId
        );

        if (usageRecord) {
          const deleteResponse = await fetch(`${BACKEND_URL}/api/usage/${usageRecord.id}`, {
            method: 'DELETE',
          });

          if (deleteResponse.ok) {
            loadServiceData(); // Reload data
          } else {
            Alert.alert('Ошибка', 'Не удалось удалить запись об использовании');
          }
        }
      }
    } catch (error) {
      console.error('Error marking as unused:', error);
      Alert.alert('Ошибка', 'Произошла ошибка');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderPhone = (phone: Phone, isUsed: boolean = false, usedAt?: string) => (
    <TouchableOpacity
      key={phone.id}
      style={styles.phoneItem}
      onPress={() => handlePhonePress(phone, isUsed)}
      onLongPress={() => handlePhonePress(phone, isUsed)}
    >
      <View style={styles.phoneContent}>
        <Text style={styles.phoneNumber}>{phone.number}</Text>
        {isUsed && usedAt && (
          <Text style={styles.usedDate}>— {formatDate(usedAt)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
        <FloatingNavigation currentScreen="services" />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Сервис не найден</Text>
        </View>
        <FloatingNavigation currentScreen="services" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
        </View>

        {/* Service Info */}
        <View style={styles.serviceHeader}>
          {service.logo_base64 && (
            <Image
              source={{ uri: `data:image/jpeg;base64,${service.logo_base64}` }}
              style={styles.serviceLogo}
              resizeMode="contain"
            />
          )}
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <TouchableOpacity onPress={handleEditService} style={styles.editButton}>
              <Ionicons name="pencil" size={20} color={isDark ? '#ffffff' : '#333333'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unused Phones Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setUnusedExpanded(!unusedExpanded)}
          >
            <Text style={styles.sectionTitle}>Не использован</Text>
            <Ionicons
              name={unusedExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={isDark ? '#ffffff' : '#333333'}
            />
          </TouchableOpacity>
          
          {unusedExpanded && (
            <View style={styles.sectionContent}>
              {unusedPhones.length === 0 ? (
                <Text style={styles.emptyText}>Все номера использованы</Text>
              ) : (
                <View style={styles.phonesList}>
                  {unusedPhones.map(phone => renderPhone(phone, false))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Used Phones Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setUsedExpanded(!usedExpanded)}
          >
            <Text style={styles.sectionTitle}>Использован</Text>
            <Ionicons
              name={usedExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={isDark ? '#ffffff' : '#333333'}
            />
          </TouchableOpacity>
          
          {usedExpanded && (
            <View style={styles.sectionContent}>
              {usedPhones.length === 0 ? (
                <Text style={styles.emptyText}>Номера не использовались</Text>
              ) : (
                <View style={styles.phonesList}>
                  {usedPhones.map(phone => renderPhone(phone, true, phone.used_at))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FloatingNavigation currentScreen="services" />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  serviceHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#eeeeee',
  },
  serviceLogo: {
    width: width * 0.85,
    height: width * 0.4,
    marginBottom: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
    textAlign: 'center',
  },
  editButton: {
    marginLeft: 12,
    padding: 8,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: isDark ? '#1e1e1e' : '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: isDark ? '#333333' : '#eeeeee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
  },
  sectionContent: {
    padding: 16,
  },
  phonesList: {
    gap: 8,
  },
  phoneItem: {
    backgroundColor: isDark ? '#333333' : '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#eeeeee',
  },
  phoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
  },
  usedDate: {
    fontSize: 14,
    color: isDark ? '#888888' : '#666666',
  },
  emptyText: {
    color: isDark ? '#888888' : '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: isDark ? '#ffffff' : '#333333',
  },
  bottomSpacing: {
    height: 100,
  },
});