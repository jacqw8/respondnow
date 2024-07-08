import {View, Text, StyleSheet} from 'react-native';
import React, {useState, useEffect} from 'react';
import * as Location from 'expo-location';
import MapView, {Marker} from 'react-native-maps';

const DispatcherMapScreen: React.FC = () => {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [latitude, setLatitude] = useState<any>(0);
  const [longitude, setLongitude] = useState<any>(0);

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

  if (!location) {
    return (
      <View style={styles.container}>
        <MapView style={styles.map} />
      </View>
    );
  }

  // Define marker coordinates
  const marker1 = {latitude: latitude, longitude: longitude};
  const marker2 = {latitude: latitude + 0.01, longitude: longitude + 0.01}; // second marker placeholder

  // Calculate bounds
  const minLat = Math.min(marker1.latitude, marker2.latitude);
  const maxLat = Math.max(marker1.latitude, marker2.latitude);
  const minLng = Math.min(marker1.longitude, marker2.longitude);
  const maxLng = Math.max(marker1.longitude, marker2.longitude);

  // Calculate deltas to fit both markers within the map view
  const deltaLat = maxLat - minLat;
  const deltaLng = maxLng - minLng;
  const padding = 0.2;

  return (
    <View style={styles.container}>
      <Text>Dispatcher Screen</Text>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: deltaLat + padding * deltaLat,
          longitudeDelta: deltaLng + padding * deltaLng,
        }}>
        <Marker
          coordinate={{
            latitude: marker1.latitude,
            longitude: marker1.longitude,
          }}
          title="Dispatcher"
          description="This is your current location"
        />
        <Marker
          coordinate={{
                latitude: marker2.latitude,
                longitude: marker2.longitude,
          }}
          title="Caller"
          description="This is your current location"
        />
      </MapView>
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
export default DispatcherMapScreen;
