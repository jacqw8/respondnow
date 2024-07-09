import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {auth} from '../firebase';
import {onAuthStateChanged} from 'firebase/auth';

// Screens
import InfoScreen from './dispatcherscreens/InfoScreen';
import DispatcherMapScreen from './dispatcherscreens/DispatcherMapScreen';
import AuthScreen from './dispatcherscreens/AuthScreen';

const Tab = createBottomTabNavigator();

const DispatcherScreen: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (!isLoggedIn) {
    return <AuthScreen />;
  }
  return (
    <Tab.Navigator>
      <Tab.Screen name="Login" component={AuthScreen} />
      <Tab.Screen name="Info" component={InfoScreen} />
      <Tab.Screen name="Map" component={DispatcherMapScreen} />
    </Tab.Navigator>
  );
};

export default DispatcherScreen;
