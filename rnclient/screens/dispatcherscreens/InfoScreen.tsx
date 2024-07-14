import React, {useState, useEffect, constructor} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import {db} from '../../firebase';
import {ref, set} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import {NavigationProp, useNavigation} from '@react-navigation/native';

const InfoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [errorMsg, setErrorMsg] = useState('');
  const [callerLatitude, setCallerLatitude] = useState<any>(null);
  const [callerLongitude, setCallerLongitude] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const user = getAuth(); // dispatcher user

  //   Caller/patient info
  const [callerLocation, setCallerLocation] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [context, setContext] = useState('');
  
  const [recordedText, setRecordedText] = useState(
    'Speech to Text app created using React Native',
  );
  const [isRecording, setIsRecording] = useState(false);
  
  //   convert an address to coords
  const addressToCoords = async (address: string) => {
    console.log(
      'geocoding this:',
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
        return {
          lat: response.data[0].lat,
          lon: response.data[0].lon,
          address: response.data[0].display_name,
        };
      } else {
        throw new Error('No results found');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  };

  const sendToResponder = async () => {
    console.log('Sending to responder:', {callerLocation, symptoms, context});
    const {lat, lon, address} = await addressToCoords(callerLocation);
    console.log('Coordinates:', {lat, lon, address});
    const userId = user.currentUser?.uid;
    await set(ref(db, `emergency/${userId}`), {
      address: address,
      callerLatitude: parseFloat(lat),
      callerLongitude: parseFloat(lon),
      symptoms: symptoms,
      context: context,
    });
    navigation.navigate('Map');
    console.log('updated emergency to db');
  };

  // Record speech

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
  speechButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#28a745', // Button background color
    borderRadius: 10, // Rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // For Android shadow
    marginTop: 20, // Space between buttons
  },
  speechButtonActive: {
    backgroundColor: '#dc3545', // Active button background color
  },
  speechButtonText: {
    color: '#fff', // Text color
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InfoScreen;

// To-do:
// Be able to message the responders
