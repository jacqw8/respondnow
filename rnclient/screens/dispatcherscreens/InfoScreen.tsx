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

const key1 = 'AIzaSy';
const key2 = 'BQMZyEJ3krGmHOo';
const key3 = 'YO4L1IF7XKlg3tlDqA';
const GOOGLE_MAPS_API_KEY = key1 + key2 + key3;

const InfoScreen: React.FC = () => {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [callerLatitude, setCallerLatitude] = useState<any>(null);
  const [callerLongitude, setCallerLongitude] = useState<any>(null);

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

  //   convert an address to coords
  const addressToCoords = async (address: string) => {
    console.log(
      'sending this:',
      `https://nominatim.openstreetmap.org/search.php?q=${address}&format=jsonv2`,
    );
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search.php?q=${address}&format=jsonv2`,
      );
      if (response.data) {
        console.log('response:', response.data);
        // example data [{"addresstype": "place", "boundingbox": ["37.7785470", "37.7786470", "-122.4184050", "-122.4183050"], 
        // "category": "place", "display_name": "1, Polk Street, Civic Center, San Francisco, California, 94102, United States", 
        // "importance": 0.00000999999999995449, "lat": "37.778597", "licence": "Data © OpenStreetMap contributors, ODbL 1.0. 
        // http://osm.org/copyright", "lon": "-122.418355", "name": "", "osm_id": 706533481, "osm_type": "way", 
        // "place_id": 344025875, "place_rank": 30, "type": "house"}]
        // console.log('response lat:', response.data[0].lat);
        setCallerLatitude(response.data[0].lat);
        setCallerLongitude(response.data[0].lon);
        return;
      } else {
        throw new Error('No results found');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  };


  const sendToResponder = () => {
    console.log('Sending to responder:', {callerLocation, symptoms, context});
    addressToCoords(callerLocation);
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
