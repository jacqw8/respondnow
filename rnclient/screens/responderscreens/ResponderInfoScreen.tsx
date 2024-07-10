import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import {db} from '../../firebase';
import {ref, set} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import {NavigationProp, useNavigation} from '@react-navigation/native';

import DispatcherMapScreen from './dispatcherscreens/DispatcherMapScreen';

const ResponderInfoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [callerLatitude, setCallerLatitude] = useState<any>(null);
  const [callerLongitude, setCallerLongitude] = useState<any>(null);
  const user = getAuth(); // dispatcher user

  //   Caller/patient info
  const [callerLocation, setCallerLocation] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [context, setContext] = useState('');


  return (
    <View style={styles.container}>
      {/* Location input */}
      <TextInput
        style={styles.input}
        placeholder="Caller Location"
        value={callerLocation}
        onChangeText={setCallerLocation}
      />
      {/* Symptoms input */}
      <TextInput
        style={styles.input}
        placeholder="Symptoms"
        value={symptoms}
        onChangeText={setSymptoms}
      />
      {/* Context input */}
      <TextInput
        style={styles.input}
        placeholder="Context"
        value={context}
        onChangeText={setContext}
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Send Alerts</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ResponderInfoScreen;

// To-do:
// get caller info onto screen
// say if you're responding
// distance from caller
// caller info 
// 
