import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import FloatingNavigation from '../components/FloatingNavigation';

interface Statistics {
  totalPhones: number;
  totalServices: number;
  totalOperators: number;
  totalUsageRecords: number;
  mostUsedServices: Array<{ name: string; count: number }>;
  leastUsedPhones: Array<{ number: string; count: number }>;
  recentActivity: Array<{ phone: string; service: string; date: string }>;
}

export default function StatisticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const styles = createStyles(isDark);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      // Fetch all data for statistics
      const [operatorsRes, servicesRes, phonesRes, usageRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/operators`),
        fetch(`${BACKEND_URL}/api/services`),
        fetch(`${BACKEND_URL}/api/phones`),
        fetch(`${BACKEND_URL}/api/usage`),
      ]);

      if (!operatorsRes.ok || !servicesRes.ok || !phonesRes.ok || !usageRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const operators = await operatorsRes.json();
      const services = await servicesRes.json();
      const phones = await phonesRes.json();
      const usage = await usageRes.json();

      // Calculate statistics
      const serviceUsageCount: { [key: string]: { name: string; count: number } } = {};
      const phoneUsageCount: { [key: string]: { number: string; count: number } } = {};

      // Count service usage
      services.forEach((service: any) => {
        const count = usage.filter((u: any) => u.service_id === service.id).length;
        serviceUsageCount[service.id] = { name: service.name, count };
      });

      // Count phone usage
      phones.forEach((phone: any) => {
        const count = usage.filter((u: any) => u.phone_id === phone.id).length;
        phoneUsageCount[phone.id] = { number: phone.number, count };
      });

      // Get top services and least used phones
      const mostUsedServices = Object.values(serviceUsageCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const leastUsedPhones = Object.values(phoneUsageCount)
        .sort((a, b) => a.count - b.count)
        .slice(0, 5);

      // Get recent activity (last 10 records)
      const recentActivity = usage
        .slice(-10)
        .reverse()
        .map((u: any) => {
          const phone = phones.find((p: any) => p.id === u.phone_id);
          const service = services.find((s: any) => s.id === u.service_id);
          return {
            phone: phone?.number || 'Unknown',
            service: service?.name || 'Unknown',
            date: new Date(u.used_at).toLocaleDateString('ru-RU'),
          };
        });

      setStatistics({
        totalPhones: phones.length,
        totalServices: services.length,
        totalOperators: operators.length,
        totalUsageRecords: usage.length,
        mostUsedServices,
        leastUsedPhones,
        recentActivity,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon }: { title: string; value: number; icon: string }) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon as any} size={24} color="#007AFF" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
          <Text style={styles.title}>Статистика</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка статистики...</Text>
        </View>
        <FloatingNavigation currentScreen="search" />
      </SafeAreaView>
    );
  }

  if (!statistics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#333333'} />
          </TouchableOpacity>
          <Text style={styles.title}>Статистика</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Не удалось загрузить статистику</Text>
        </View>
        <FloatingNavigation currentScreen="search" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#333333'} />
        </TouchableOpacity>
        <Text style={styles.title}>Статистика</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Обзор</Text>
          <View style={styles.statsGrid}>
            <StatCard title="Номеров" value={statistics.totalPhones} icon="call" />
            <StatCard title="Сервисов" value={statistics.totalServices} icon="heart" />
            <StatCard title="Операторов" value={statistics.totalOperators} icon="business" />
            <StatCard title="Использований" value={statistics.totalUsageRecords} icon="stats-chart" />
          </View>
        </View>

        {/* Most Used Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Популярные сервисы</Text>
          <View style={styles.listContainer}>
            {statistics.mostUsedServices.length === 0 ? (
              <Text style={styles.emptyText}>Нет данных об использовании</Text>
            ) : (
              statistics.mostUsedServices.map((service, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{service.name}</Text>
                    <Text style={styles.listItemCount}>{service.count} использований</Text>
                  </View>
                  <View style={styles.listItemBadge}>
                    <Text style={styles.listItemBadgeText}>#{index + 1}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Least Used Phones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Малоиспользуемые номера</Text>
          <View style={styles.listContainer}>
            {statistics.leastUsedPhones.length === 0 ? (
              <Text style={styles.emptyText}>Нет данных о номерах</Text>
            ) : (
              statistics.leastUsedPhones.map((phone, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{phone.number}</Text>
                    <Text style={styles.listItemCount}>
                      {phone.count === 0 ? 'Не использовался' : `${phone.count} использований`}
                    </Text>
                  </View>
                  <View style={[styles.listItemBadge, phone.count === 0 && styles.unusedBadge]}>
                    <Text style={styles.listItemBadgeText}>{phone.count}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Последняя активность</Text>
          <View style={styles.listContainer}>
            {statistics.recentActivity.length === 0 ? (
              <Text style={styles.emptyText}>Нет последней активности</Text>
            ) : (
              statistics.recentActivity.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityPhone}>{activity.phone}</Text>
                      {' использован в '}
                      <Text style={styles.activityService}>{activity.service}</Text>
                    </Text>
                    <Text style={styles.activityDate}>{activity.date}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FloatingNavigation currentScreen="search" />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#ffffff',
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e1e1e' : '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
  },
  statIcon: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#333333',
  },
  statTitle: {
    fontSize: 14,
    color: isDark ? '#cccccc' : '#666666',
    marginTop: 2,
  },
  listContainer: {
    backgroundColor: isDark ? '#1e1e1e' : '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#eeeeee',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
  },
  listItemCount: {
    fontSize: 14,
    color: isDark ? '#cccccc' : '#666666',
    marginTop: 2,
  },
  listItemBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unusedBadge: {
    backgroundColor: '#ff4444',
  },
  listItemBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#eeeeee',
  },
  activityIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: isDark ? '#ffffff' : '#333333',
    lineHeight: 20,
  },
  activityPhone: {
    fontWeight: '600',
    color: '#007AFF',
  },
  activityService: {
    fontWeight: '600',
    color: '#34C759',
  },
  activityDate: {
    fontSize: 12,
    color: isDark ? '#888888' : '#666666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: isDark ? '#888888' : '#666666',
    fontStyle: 'italic',
    paddingVertical: 20,
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