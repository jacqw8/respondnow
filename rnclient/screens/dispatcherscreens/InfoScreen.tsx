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

  // Recording
  const [recordedText, setRecordedText] = useState(
    'Emergency at 100 Larkin St San Francisco. The patient is experiencing intense abdominal pain and nausea. They are on the first floor of the building. Patient is an elderly woman',
  );
  const [isRecording, setIsRecording] = useState(false);
  const example = {
    address: '100 larkin st san francisco',
    symptoms: 'intense abdominal pain, nausea',
    context: 'first floor, elderly woman',
  };

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
  const startRecording = async () => {
    setIsRecording(true);
    console.log('start recording');
  };

  const stopRecording = () => {
    setIsRecording(false);
    console.log('stop recording');
    setCallerLocation(example.address);
    setSymptoms(example.symptoms);
    setContext(example.context);
  };

  const clearFields = () => {
    setCallerLocation('');
    setSymptoms('');
    setContext('');
  };

  return (
    <View style={styles.container}>
      {/* Location input */}
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Caller Location"
        value={callerLocation}
        onChangeText={setCallerLocation}
      />
      {/* Symptoms input */}
      <Text style={styles.label}>Symptoms</Text>
      <TextInput
        style={styles.input}
        placeholder="Symptoms"
        value={symptoms}
        onChangeText={setSymptoms}
      />
      {/* Context input */}
      <Text style={styles.label}>Context</Text>
      <TextInput
        style={styles.input}
        placeholder="Context"
        value={context}
        onChangeText={setContext}
      />
      {/* Send Alerts button */}
      <TouchableOpacity style={styles.button} onPress={sendToResponder}>
        <Text style={styles.buttonText}>Send Alerts</Text>
      </TouchableOpacity>
      {/* Clear button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearFields}>
        <Text style={styles.clearButtonText}>Clear Fields</Text>
      </TouchableOpacity>
      {/* Speech recording button */}
      <TouchableOpacity
        style={isRecording ? styles.speechButtonActive : styles.speechButton}
        onPress={isRecording ? stopRecording : startRecording}>
        <Text style={styles.speechButtonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
      {/* Display recorded text or example transcript */}
      <Text style={styles.transcriptText}>{isRecording ? recordedText : 'Example transcript'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  input: {
    height: 50,
    backgroundColor: '#f9f5f5',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#e06565',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  speechButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#28a745',
    borderRadius: 10,
    marginTop: 20,
  },
  speechButtonActive: {
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  speechButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transcriptText: {
    marginTop: 20,
    fontSize: 16,
    fontStyle: 'italic',
    color: '#888',
  },
  clearButton: {
    backgroundColor: '#f0ad4e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    justifyContent: 'center',
    alignItems: 'center'
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default InfoScreen;

// To-do:
// Be able to message the responders
