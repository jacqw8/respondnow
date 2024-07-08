/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
// import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import HomeScreen from './screens/HomeScreen';
import DispatcherScreen from './screens/DispatcherScreen';
import ResponderScreen from './screens/ResponderScreen';
import CallerScreen from './screens/CallerScreen';

const Stack = createNativeStackNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Dispatcher" component={DispatcherScreen} />
                <Stack.Screen name="Responder" component={ResponderScreen} />
                <Stack.Screen name="Caller" component={CallerScreen} />
            </Stack.Navigator>
        </NavigationContainer>
  );
};


export default App;
