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
import {
  onAuthStateChanged,
} from 'firebase/auth';

// Screens
import ResponderInfoScreen from './responderscreens/ResponderInfoScreen';
import ResponderMapScreen from './responderscreens/ResponderMapScreen';
import AuthScreen from './responderscreens/AuthScreen';

const Tab = createBottomTabNavigator();

const ResponderScreen: React.FC = () => {
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
        <Tab.Screen name="Loging" component={AuthScreen} />
      {/* <Tab.Screen name="Info" component={ResponderInfoScreen} /> */}
      <Tab.Screen name="Map" component={ResponderMapScreen} />
    </Tab.Navigator>
  );
};

export default ResponderScreen;
