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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import FloatingNavigation from '../../components/FloatingNavigation';

interface Phone {
  id: string;
  number: string;
  operator_id: string;
  created_at: string;
}

interface Operator {
  id: string;
  name: string;
  logo_base64?: string;
}

interface Service {
  id: string;
  name: string;
  logo_base64?: string;
}

interface Usage {
  id: string;
  phone_id: string;
  service_id: string;
  used_at: string;
}

export default function PhoneDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const phoneId = params.id as string;

  const [phone, setPhone] = useState<Phone | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [usedServices, setUsedServices] = useState<(Service & { used_at: string })[]>([]);
  const [unusedServices, setUnusedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unusedExpanded, setUnusedExpanded] = useState(false);
  const [usedExpanded, setUsedExpanded] = useState(false);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const styles = createStyles(isDark);

  useEffect(() => {
    if (phoneId) {
      loadPhoneData();
    }
  }, [phoneId]);

  const loadPhoneData = async () => {
    setIsLoading(true);
    try {
      // Load phone data
      const phoneResponse = await fetch(`${BACKEND_URL}/api/phones/${phoneId}`);
      if (!phoneResponse.ok) {
        Alert.alert('Ошибка', 'Номер не найден');
        router.back();
        return;
      }
      const phoneData = await phoneResponse.json();
      setPhone(phoneData);

      // Load operator data
      const operatorResponse = await fetch(`${BACKEND_URL}/api/operators/${phoneData.operator_id}`);
      if (operatorResponse.ok) {
        const operatorData = await operatorResponse.json();
        setOperator(operatorData);
      }

      // Load all services
      const servicesResponse = await fetch(`${BACKEND_URL}/api/services`);
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setAllServices(servicesData);
      }

      // Load usage data
      const usageResponse = await fetch(`${BACKEND_URL}/api/usage`);
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        const phoneUsage = usageData.filter((usage: Usage) => usage.phone_id === phoneId);
        
        // Separate used and unused services
        const usedServiceIds = phoneUsage.map((usage: Usage) => usage.service_id);
        const used = servicesData
          .filter((service: Service) => usedServiceIds.includes(service.id))
          .map((service: Service) => {
            const usage = phoneUsage.find((u: Usage) => u.service_id === service.id);
            return { ...service, used_at: usage?.used_at || '' };
          });
        
        const unused = servicesData.filter((service: Service) => !usedServiceIds.includes(service.id));
        
        setUsedServices(used);
        setUnusedServices(unused);
      }
    } catch (error) {
      console.error('Error loading phone data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPhone = () => {
    router.push(`/edit-phone/${phoneId}`);
  };

  const handleServicePress = async (service: Service, isUsed: boolean) => {
    if (isUsed) {
      // Mark as unused
      Alert.alert(
        'Пометить как не использованный?',
        `Номер ${phone?.number} не был использован в ${service.name}?`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Подтвердить', onPress: () => markAsUnused(service) },
        ]
      );
    } else {
      // Mark as used
      Alert.alert(
        'Подтвердить использование',
        `Номер ${phone?.number} был использован в ${service.name}?`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Подтвердить', onPress: () => markAsUsed(service) },
        ]
      );
    }
  };

  const markAsUsed = async (service: Service) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_id: phoneId,
          service_id: service.id,
        }),
      });

      if (response.ok) {
        loadPhoneData(); // Reload data
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

  const markAsUnused = async (service: Service) => {
    try {
      // Find the usage record to delete
      const usageResponse = await fetch(`${BACKEND_URL}/api/usage`);
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        const usageRecord = usageData.find((usage: Usage) => 
          usage.phone_id === phoneId && usage.service_id === service.id
        );

        if (usageRecord) {
          const deleteResponse = await fetch(`${BACKEND_URL}/api/usage/${usageRecord.id}`, {
            method: 'DELETE',
          });

          if (deleteResponse.ok) {
            loadPhoneData(); // Reload data
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

  const renderService = (service: Service, isUsed: boolean = false, usedAt?: string) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceItem}
      onPress={() => handleServicePress(service, isUsed)}
      onLongPress={() => handleServicePress(service, isUsed)}
    >
      <View style={styles.serviceContent}>
        <View style={styles.serviceInfo}>
          <View style={styles.serviceLogo}>
            {service.logo_base64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${service.logo_base64}` }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderLogo}>
                <Text style={styles.placeholderText}>
                  {service.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.serviceTextContainer}>
            <Text style={styles.serviceName}>{service.name}</Text>
            {isUsed && usedAt && (
              <Text style={styles.usedDate}>— {formatDate(usedAt)}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
        <FloatingNavigation currentScreen="phones" />
      </SafeAreaView>
    );
  }

  if (!phone) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Номер не найден</Text>
        </View>
        <FloatingNavigation currentScreen="phones" />
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
          <View style={styles.phoneInfo}>
            {operator?.logo_base64 && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${operator.logo_base64}` }}
                style={styles.operatorLogo}
                resizeMode="contain"
              />
            )}
            <Text style={styles.phoneNumber}>{phone.number}</Text>
            <TouchableOpacity onPress={handleEditPhone} style={styles.editButton}>
              <Ionicons name="pencil" size={20} color={isDark ? '#ffffff' : '#333333'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unused Services Section */}
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
              {unusedServices.length === 0 ? (
                <Text style={styles.emptyText}>Все сервисы использованы</Text>
              ) : (
                <View style={styles.servicesGrid}>
                  {unusedServices.map(service => renderService(service, false))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Used Services Section */}
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
              {usedServices.length === 0 ? (
                <Text style={styles.emptyText}>Сервисы не использовались</Text>
              ) : (
                <View style={styles.servicesList}>
                  {usedServices.map(service => renderService(service, true, service.used_at))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FloatingNavigation currentScreen="phones" />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#eeeeee',
  },
  backButton: {
    marginBottom: 16,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  phoneNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
    flex: 1,
  },
  editButton: {
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    width: '22%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  serviceContent: {
    flex: 1,
    alignItems: 'center',
  },
  serviceInfo: {
    alignItems: 'center',
    flex: 1,
  },
  serviceLogo: {
    width: '80%',
    aspectRatio: 1,
    marginBottom: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: isDark ? '#444444' : '#dddddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
  },
  serviceTextContainer: {
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 12,
    color: isDark ? '#ffffff' : '#333333',
    textAlign: 'center',
    lineHeight: 14,
  },
  usedDate: {
    fontSize: 11,
    color: isDark ? '#888888' : '#666666',
    textAlign: 'center',
    marginTop: 2,
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