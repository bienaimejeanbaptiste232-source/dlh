import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RestaurantDetailScreen from './src/screens/RestaurantDetailScreen';
import { Config } from './src/constants/Config';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Config.colors.primary,
          tabBarInactiveTintColor: Config.colors.muted,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: Config.colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
          },
          tabBarIcon: ({ focused }) => {
            let icon = '🏠';
            if (route.name === 'Kay') icon = '🏠';
            else if (route.name === 'Kòmand') icon = '📋';
            else if (route.name === 'Pwofil') icon = '👤';
            return <Text style={{ fontSize: 20 }}>{icon}</Text>;
          },
        })}
      >
        <Tab.Screen name="Kay" component={HomeStack} />
        <Tab.Screen name="Kòmand" component={OrdersScreen} />
        <Tab.Screen name="Pwofil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
