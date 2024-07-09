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

import ResponderInfoScreen from './responderscreens/ResponderInfoScreen';
import ResponderMapScreen from './responderscreens/ResponderMapScreen';

const Tab = createBottomTabNavigator();

const ResponderScreen: React.FC = () => {
  return (
    <Tab.Navigator>
      {/* <Tab.Screen name="Info" component={ResponderInfoScreen} /> */}
      <Tab.Screen name="Map" component={ResponderMapScreen} />
    </Tab.Navigator>
  );
};

export default ResponderScreen;
