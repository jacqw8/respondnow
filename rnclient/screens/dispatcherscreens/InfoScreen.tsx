import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';

const InfoScreen: React.FC = () => {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [latitude, setLatitude] = useState<any>(null);
  const [longitude, setLongitude] = useState<any>(null);

  //   Caller/patient info
  const [callerLocation, setCallerLocation] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission not granted');
          throw new Error('Location permission not granted');
        }
        const location = await Location.getCurrentPositionAsync({});
        console.log('Current location:', location);
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
        setLocation(location);
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };
    console.log('use effect request location');
    requestLocationPermission();
  }, []);

  let text = 'Waiting for location...';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  const sendToResponder = () => {
    console.log('Sending to responder:', {callerLocation, symptoms, context});
  };

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
      <TouchableOpacity style={styles.button} onPress={sendToResponder}>
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

export default InfoScreen;
