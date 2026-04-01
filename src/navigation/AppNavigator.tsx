import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import HealthEmergencyScreen from '../screens/HealthEmergencyScreen';
import PoliceAlertScreen from '../screens/PoliceAlertScreen';
import HospitalsScreen from '../screens/HospitalsScreen';
import FirstAidScreen from '../screens/FirstAidScreen';
import FirstAidGuideScreen from '../screens/FirstAidGuideScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ResponderAlertScreen from '../screens/ResponderAlertScreen';
import BloodDonorScreen from '../screens/BloodDonorScreen';
import { colors } from '../constants/theme';

const Stack = createStackNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.emergencyRed} />
    </View>
  );
}

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
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="HealthEmergency" component={HealthEmergencyScreen} />
            <Stack.Screen name="PoliceAlert" component={PoliceAlertScreen} />
            <Stack.Screen name="Hospitals" component={HospitalsScreen} />
            <Stack.Screen name="FirstAid" component={FirstAidScreen} />
            <Stack.Screen name="FirstAidGuide">
              {(props) => <FirstAidGuideScreen {...(props as any)} />}
            </Stack.Screen>
            <Stack.Screen name="BloodDonor" component={BloodDonorScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ResponderAlert">
              {(props) => <ResponderAlertScreen {...(props as any)} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
