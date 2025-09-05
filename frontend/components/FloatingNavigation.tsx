import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingNavigationProps {
  currentScreen: 'search' | 'phones' | 'services';
}

export default function FloatingNavigation({ currentScreen }: FloatingNavigationProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const styles = createStyles(isDark, insets);

  const navigateToScreen = (screen: string) => {
    switch (screen) {
      case 'search':
        router.push('/');
        break;
      case 'phones':
        router.push('/phones');
        break;
      case 'services':
        router.push('/services');
        break;
    }
  };

  const getButtonStyle = (screen: string) => {
    return [
      styles.navButton,
      currentScreen === screen && styles.activeButton,
    ];
  };

  const getTextStyle = (screen: string) => {
    return [
      styles.buttonText,
      currentScreen === screen && styles.activeButtonText,
    ];
  };

  return (
    <View style={styles.container}>
      <View style={styles.navContainer}>
        {/* Search Button */}
        <TouchableOpacity
          style={getButtonStyle('search')}
          onPress={() => navigateToScreen('search')}
          activeOpacity={0.8}
        >
          <Text style={getTextStyle('search')}>ПОИСК</Text>
        </TouchableOpacity>

        {/* Phones Button */}
        <TouchableOpacity
          style={getButtonStyle('phones')}
          onPress={() => navigateToScreen('phones')}
          activeOpacity={0.8}
        >
          <Text style={getTextStyle('phones')}>НОМЕРА</Text>
        </TouchableOpacity>

        {/* Services Button */}
        <TouchableOpacity
          style={getButtonStyle('services')}
          onPress={() => navigateToScreen('services')}
          activeOpacity={0.8}
        >
          <Text style={getTextStyle('services')}>МЕСТА</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean, insets: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: isDark ? '#121212' : '#ffffff',
    borderTopWidth: 1,
    borderTopColor: isDark ? '#333333' : '#eeeeee',
    paddingBottom: 0, // Убираем отступ - кнопки к самому низу экрана
  },
  navContainer: {
    flexDirection: 'row',
    height: 60,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e1e1e' : '#f8f8f8',
    borderRightWidth: 1,
    borderRightColor: isDark ? '#333333' : '#eeeeee',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#ffffff' : '#333333',
    textAlign: 'center',
  },
  activeButtonText: {
    color: '#ffffff',
  },
});