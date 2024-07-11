import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import {db} from '../../firebase';
import {ref, get} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import {NavigationProp, useNavigation} from '@react-navigation/native';

import DispatcherMapScreen from './dispatcherscreens/DispatcherMapScreen';

const ResponderInfoScreen: React.FC = () => {
  const [dispatcherId, setDispatcherId] = useState(null);
  const [responder, setResponder] = useState(null);
  const [info, setInfo] = useState(null);
  const user = getAuth(); // dispatcher user

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const responderRef = ref(db, `responders/${user.currentUser?.uid}`);
        const snapshot = await get(responderRef);
        if (snapshot.exists()) {
          const responderData = snapshot.val();
          setResponder(responderData);
          setDispatcherId(responderData.dispatcherId);
          //     get info from dispatcher id
          const emergencyRef = ref(
            db,
            `emergency/${responderData.dispatcherId}`,
          );
          const emergencySnapshot = await get(emergencyRef);
          if (emergencySnapshot.exists()) {
            const info = emergencySnapshot.val();
            setInfo(info);
            console.log('Emergency info:', info);
          } else {
            console.log('No emergency data available');
          }
        } else {
          console.log('No responder data available');
        }
      } catch (error) {
        console.error('Error fetching info:', error);
      }
    };
    fetchInfo();
  }, [user]);

  return (
    <ScrollView style={styles.scrollContainer}>
      {info ? (
        <>
          <Text style={styles.header}>Responder Information</Text>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{info.address}</Text>
          <Text style={styles.label}>Symptoms:</Text>
          <Text style={styles.value}>{info.symptoms}</Text>
          <Text style={styles.label}>Context:</Text>
          <Text style={styles.value}>{info.context}</Text>
        </>
      ) : (
        <Text>Welcome {user.currentUser?.displayName}!</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    height: 100,
    backgroundColor: '#e5f5f1',
    width: 300,
    height: 50,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 20,
    width: 300,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ResponderInfoScreen;

// To-do:
// get caller info onto screen
// say if you're responding
// distance from caller
// caller info
//
