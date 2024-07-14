import React, {useState, useEffect, useCallback} from 'react';
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
import {NavigationProp, useNavigation} from '@react-navigation/native';
import ListScreen from './dispatcherscreens/ListScreen';
import ChatScreen from './dispatcherscreens/ChatScreen';

const Tab = createBottomTabNavigator();

const DispatcherScreen: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <AuthScreen />
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Home')}>
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <Tab.Navigator>
      <Tab.Screen name="Login" component={AuthScreen} />
      <Tab.Screen name="Info" component={InfoScreen} />
      <Tab.Screen name="Map" component={DispatcherMapScreen} />
      <Tab.Screen name="Chat" component={ListScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#e06565',
    width: 200,
    height: 50,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DispatcherScreen;
