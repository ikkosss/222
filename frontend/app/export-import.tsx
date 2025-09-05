import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import FloatingNavigation from '../components/FloatingNavigation';

export default function ExportImportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const styles = createStyles(isDark);

  const exportDatabase = async () => {
    setIsExporting(true);
    try {
      // Fetch all data
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

      // Create export data
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        data: {
          operators,
          services,
          phones,
          usage,
        },
      };

      // Save to file
      const fileName = `upn_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Экспорт базы данных UPN',
        });
      } else {
        Alert.alert('Успех', `База данных экспортирована в: ${fileName}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Ошибка', 'Не удалось экспортировать базу данных');
    } finally {
      setIsExporting(false);
    }
  };

  const importDatabase = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setIsImporting(true);

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importData = JSON.parse(fileContent);

      // Validate import data structure
      if (!importData.data || !importData.data.operators || !importData.data.services || 
          !importData.data.phones || !importData.data.usage) {
        throw new Error('Invalid backup file format');
      }

      // Import operators
      for (const operator of importData.data.operators) {
        try {
          await fetch(`${BACKEND_URL}/api/operators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: operator.name,
              logo_base64: operator.logo_base64,
            }),
          });
        } catch (error) {
          console.log(`Operator ${operator.name} already exists or failed to import`);
        }
      }

      // Import services
      for (const service of importData.data.services) {
        try {
          await fetch(`${BACKEND_URL}/api/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: service.name,
              logo_base64: service.logo_base64,
            }),
          });
        } catch (error) {
          console.log(`Service ${service.name} already exists or failed to import`);
        }
      }

      // Import phones
      for (const phone of importData.data.phones) {
        try {
          await fetch(`${BACKEND_URL}/api/phones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number: phone.number,
              operator_id: phone.operator_id,
            }),
          });
        } catch (error) {
          console.log(`Phone ${phone.number} already exists or failed to import`);
        }
      }

      Alert.alert(
        'Импорт завершен',
        'База данных была успешно импортирована. Некоторые записи могли быть пропущены, если они уже существовали.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Ошибка', 'Не удалось импортировать базу данных. Проверьте формат файла.');
    } finally {
      setIsImporting(false);
    }
  };

  const exportImages = async () => {
    Alert.alert(
      'Экспорт изображений',
      'Функция экспорта изображений в ZIP архив будет доступна в следующей версии.',
      [{ text: 'OK' }]
    );
  };

  const importImages = async () => {
    Alert.alert(
      'Импорт изображений',
      'Функция импорта изображений из ZIP архива будет доступна в следующей версии.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#333333'} />
        </TouchableOpacity>
        <Text style={styles.title}>Экспорт/Импорт</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Database Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server" size={24} color={isDark ? '#ffffff' : '#333333'} />
            <Text style={styles.sectionTitle}>База данных</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Экспорт/импорт всех данных: номеров, сервисов, операторов и истории использования
          </Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={exportDatabase}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="download" size={20} color="#ffffff" />
              )}
              <Text style={styles.exportButtonText}>
                {isExporting ? 'Экспорт...' : 'ЭКСПОРТ'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.importButton]}
              onPress={importDatabase}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="cloud-upload" size={20} color="#ffffff" />
              )}
              <Text style={styles.importButtonText}>
                {isImporting ? 'Импорт...' : 'ИМПОРТ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={24} color={isDark ? '#ffffff' : '#333333'} />
            <Text style={styles.sectionTitle}>Изображения</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Экспорт/импорт логотипов операторов и сервисов в ZIP архиве
          </Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={exportImages}
            >
              <Ionicons name="download" size={20} color="#ffffff" />
              <Text style={styles.exportButtonText}>ЭКСПОРТ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.importButton]}
              onPress={importImages}
            >
              <Ionicons name="cloud-upload" size={20} color="#ffffff" />
              <Text style={styles.importButtonText}>ИМПОРТ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={24} color={isDark ? '#ffffff' : '#333333'} />
            <Text style={styles.sectionTitle}>Статистика</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, styles.statsButton]}
            onPress={() => router.push('/statistics')}
          >
            <Ionicons name="analytics" size={20} color={isDark ? '#ffffff' : '#333333'} />
            <Text style={styles.statsButtonText}>Просмотр статистики</Text>
          </TouchableOpacity>
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
    backgroundColor: isDark ? '#1e1e1e' : '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: isDark ? '#cccccc' : '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  exportButton: {
    backgroundColor: '#007AFF',
  },
  importButton: {
    backgroundColor: '#34C759',
  },
  statsButton: {
    backgroundColor: isDark ? '#333333' : '#f0f0f0',
    borderWidth: 1,
    borderColor: isDark ? '#444444' : '#dddddd',
  },
  exportButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  importButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsButtonText: {
    color: isDark ? '#ffffff' : '#333333',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpacing: {
    height: 100,
  },
});