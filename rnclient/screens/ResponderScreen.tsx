import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {auth, db} from '../firebase';
import {onAuthStateChanged, signOut} from 'firebase/auth';
import {ref, get} from 'firebase/database';

// Screens
import ResponderInfoScreen from './responderscreens/ResponderInfoScreen';
import ResponderMapScreen from './responderscreens/ResponderMapScreen';
import AuthScreen from './responderscreens/AuthScreen';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import ChatScreen from './responderscreens/ChatScreen';

const Tab = createBottomTabNavigator();

const ResponderScreen: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  // Function to check if the email belongs to a responder
  const isResponderEmail = async email => {
    try {
      // Check if the email belongs to a responder
      const dbRef = ref(db, 'responders');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        // Iterate through snapshot to check if email exists in responders
        const responders = snapshot.val();
        const responderEmails = Object.values(responders).map(
          responder => responder.email,
        );

        return responderEmails.includes(email);
      } else {
        console.log('No responders found in database');
        return false;
      }
    } catch (error) {
      console.error('Error checking user role:', error.message);
      return false;
    }
  };

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
      <Tab.Screen name="Info" component={ResponderInfoScreen} />
      <Tab.Screen name="Map" component={ResponderMapScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
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
    backgroundColor: '#0f7991',
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

export default ResponderScreen;
