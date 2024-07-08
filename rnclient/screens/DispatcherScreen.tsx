import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import * as Location from 'expo-location';

const DispatcherScreen: React.FC = () => {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [latitude, setLatitude] = useState<any>(null);
  const [longitude, setLongitude] = useState<any>(null);

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

  return (
    <View style={styles.container}>
      <Text>Dispatcher Screen</Text>
      <Text>{latitude}</Text>
      <Text>{longitude}</Text>
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
});

export default DispatcherScreen;
