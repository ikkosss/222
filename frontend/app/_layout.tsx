import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="phones" />
        <Stack.Screen name="services" />
        <Stack.Screen name="add-phone" />
        <Stack.Screen name="add-service" />
        <Stack.Screen name="add-operator" />
        <Stack.Screen name="edit-phone/[id]" />
        <Stack.Screen name="edit-service/[id]" />
        <Stack.Screen name="phone/[id]" />
        <Stack.Screen name="service/[id]" />
        <Stack.Screen name="export-import" />
        <Stack.Screen name="statistics" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}