import React, {useState, useEffect, useCallback} from 'react';
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

  // useEffect(() => {
  //   const fetchInfo = async () => {
  //     try {
  //       console.log(user.currentUser?.displayName);
  //       const responderRef = ref(db, `responders/${user.currentUser?.uid}`);
  //       const snapshot = await get(responderRef);
  //       if (snapshot.exists()) {
  //         console.log(snapshot.val());
  //         const responderData = snapshot.val();
  //         setResponder(responderData);
  //         setDispatcherId(responderData.dispatcherId);
  //         //     get info from dispatcher id, but only if responder is responding
  //         if (responderData.isNearEmergency === 'responding') {
  //           const emergencyRef = ref(
  //             db,
  //             `emergency/${responderData.dispatcherId}`,
  //           );
  //           console.log('responding info');
  //           const emergencySnapshot = await get(emergencyRef);
  //           if (emergencySnapshot.exists()) {
  //             const inf = emergencySnapshot.val();
  //             setInfo(inf);
  //             console.log('Emergency info:', info);
  //           } else {
  //             console.log('No emergency data available');
  //           }
  //         }
  //       } else {
  //         console.log('No responder data available');
  //       }
  //     } catch (error) {
  //       console.error('Error fetching info:', error);
  //     }
  //   };
  //   fetchInfo();
  // }, [info, user]);
  const fetchInfo = async () => {
    try {
      console.log(user.currentUser?.displayName);
      const responderRef = ref(db, `responders/${user.currentUser?.uid}`);
      const snapshot = await get(responderRef);
      if (snapshot.exists()) {
        console.log(snapshot.val());
        const responderData = snapshot.val();
        setResponder(responderData);
        setDispatcherId(responderData.dispatcherId);
        //     get info from dispatcher id, but only if responder is responding
        if (responderData.isNearEmergency === 'responding') {
          const emergencyRef = ref(
            db,
            `emergency/${responderData.dispatcherId}`,
          );
          console.log('responding info');
          const emergencySnapshot = await get(emergencyRef);
          if (emergencySnapshot.exists()) {
            const inf = emergencySnapshot.val();
            setInfo(inf);
            console.log('Emergency info:', info);
          } else {
            console.log('No emergency data available');
          }
        }
      } else {
        console.log('No responder data available');
      }
    } catch (error) {
      console.error('Error fetching info:', error);
    }
  };

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
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
      <TouchableOpacity
              style={styles.button}
              title="Refresh"
              onPress={fetchInfo}>
              <Text style={styles.buttonText}>Refresh</Text>
            </TouchableOpacity>
            </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#000000',
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
    color: '#000000',
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

export default ResponderInfoScreen;

// To-do:
// distance from caller
// look into isochrones
