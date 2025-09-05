import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const getIconColor = (screen: string) => {
    if (currentScreen === screen) {
      return '#ffffff';
    }
    return isDark ? '#ffffff' : '#333333';
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
          <Ionicons 
            name="search" 
            size={24} 
            color={getIconColor('search')} 
          />
        </TouchableOpacity>

        {/* Phones Button */}
        <TouchableOpacity
          style={getButtonStyle('phones')}
          onPress={() => navigateToScreen('phones')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="call" 
            size={24} 
            color={getIconColor('phones')} 
          />
        </TouchableOpacity>

        {/* Services Button */}
        <TouchableOpacity
          style={getButtonStyle('services')}
          onPress={() => navigateToScreen('services')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="heart" 
            size={24} 
            color={getIconColor('services')} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean, insets: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: insets.bottom + 20,
    right: 20,
    zIndex: 1000,
  },
  navContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: isDark ? '#333333' : '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
});