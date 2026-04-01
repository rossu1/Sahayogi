import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import HealthEmergencyScreen from '../screens/HealthEmergencyScreen';
import PoliceAlertScreen from '../screens/PoliceAlertScreen';
import HospitalsScreen from '../screens/HospitalsScreen';
import HospitalFinderScreen from '../screens/HospitalFinderScreen';
import HospitalDetailScreen from '../screens/HospitalDetailScreen';
import FirstAidScreen from '../screens/FirstAidScreen';
import FirstAidGuideScreen from '../screens/FirstAidGuideScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ResponderAlertScreen from '../screens/ResponderAlertScreen';
import BloodDonorScreen from '../screens/BloodDonorScreen';
import { colors } from '../constants/theme';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.emergencyRed} />
    </View>
  );
}

// ── Bottom tab navigator (main app tabs) ──────────────────────────────────────
function MainTabs() {
  const { language } = useLanguage();
  const isNe = language === 'ne';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: isNe ? 'होम' : 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="HospitalFinder"
        component={HospitalFinderScreen}
        options={{
          tabBarLabel: isNe ? 'अस्पताल' : 'Hospital',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="FirstAid"
        component={FirstAidScreen}
        options={{
          tabBarLabel: isNe ? 'उपचार' : 'First Aid',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🩺</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: isNe ? 'सेटिङ' : 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root stack navigator ──────────────────────────────────────────────────────
export default function AppNavigator() {
  const { session, user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  const isOnboarded = session && user?.full_name;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={() => {
                  // AuthContext refresh handles re-render
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            {/* Main tab layout */}
            <Stack.Screen name="Main" component={MainTabs} />

            {/* Full-screen stack screens (navigated to from any tab) */}
            <Stack.Screen name="HealthEmergency" component={HealthEmergencyScreen} />
            <Stack.Screen name="PoliceAlert" component={PoliceAlertScreen} />
            <Stack.Screen name="Hospitals" component={HospitalsScreen} />
            <Stack.Screen name="BloodDonor" component={BloodDonorScreen} />
            <Stack.Screen name="HospitalDetail">
              {(props) => <HospitalDetailScreen {...(props as any)} />}
            </Stack.Screen>
            <Stack.Screen name="FirstAidGuide">
              {(props) => <FirstAidGuideScreen {...(props as any)} />}
            </Stack.Screen>
            <Stack.Screen name="ResponderAlert">
              {(props) => <ResponderAlertScreen {...(props as any)} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
