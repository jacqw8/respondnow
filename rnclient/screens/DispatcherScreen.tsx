import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import InfoScreen from './dispatcherscreens/InfoScreen';
import DispatcherMapScreen from './dispatcherscreens/DispatcherMapScreen'

const Tab = createBottomTabNavigator();

const DispatcherScreen: React.FC = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Info" component={InfoScreen} />
      <Tab.Screen name="Map" component={DispatcherMapScreen} />
    </Tab.Navigator>
  );
};

export default DispatcherScreen;
