import {View, Text, StyleSheet} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import * as Location from 'expo-location';
import MapView, {Marker, Circle, Polyline} from 'react-native-maps';
import polyline from '@mapbox/polyline';
import axios from 'axios';
import {db} from '../../firebase';
import {ref, onValue, get} from 'firebase/database';
import {getAuth} from 'firebase/auth';

const DispatcherMapScreen: React.FC = () => {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [marker1, setMarker1] = useState<any>(null);
  const [marker2, setMarker2] = useState<any>(null);
  const [distance, setDistance] = useState<number>(0);
  const [deltaLat, setDeltaLat] = useState<any>(null);
  const [deltaLng, setDeltaLng] = useState<any>(null);
  const padding = 1.2;
  const [responderLocations, setResponderLocations] = useState([]);
  const [filteredResponders, setFilteredResponders] = useState([]);
  const [callerLocation, setCallerLocation] = useState(null);
  const user = getAuth();

  // Calculate distance between markers
  const calculateDistance = (
    lat1: Number,
    lon1: Number,
    lat2: Number,
    lon2: Number,
  ) => {
    const R = 6371; // Radius of the Earth in km

    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // get location of caller/patient
  useEffect(() => {
    const fetchCallerLocation = async () => {
      try {
        const callerRef = ref(db, `emergency/${user.currentUser?.uid}`);
        const snapshot = await get(callerRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('Caller data:', parseFloat(data.callerLatitude));
          setCallerLocation(data);
          setMarker2({
            latitude: parseFloat(data.callerLatitude),
            longitude: parseFloat(data.callerLongitude),
          });
        } else {
          console.log('Caller data doesnt exist');
        }
      } catch (error) {
        console.log('Error fetching caller data', error);
      }
    };
    fetchCallerLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const respondersRef = ref(db, 'responders');
      onValue(respondersRef, snapshot => {
        const data = snapshot.val();
        const locations = data ? Object.values(data) : [];
        setResponderLocations(locations);
      });
      console.log('responders', responderLocations);
    }, 10000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (responderLocations.length > 0) {
        const filtered = responderLocations.filter(loc => {
          const dist = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            loc.latitude,
            loc.longitude,
          );
          return dist;
        });
        setFilteredResponders(filtered);
        console.log('filtered responders', filtered);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [responderLocations, location]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    const requestLocationPermission = async () => {
      try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission not granted');
          throw new Error('Location permission not granted');
        }
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        setMarker1({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          newLocation => {
            setLocation(newLocation);
            setMarker1({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
          },
        );
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };
    requestLocationPermission();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (marker1 && marker2) {
      // Calculate bounds
      const minLat = Math.min(marker1.latitude, marker2.latitude);
      const maxLat = Math.max(marker1.latitude, marker2.latitude);
      const minLng = Math.min(marker1.longitude, marker2.longitude);
      const maxLng = Math.max(marker1.longitude, marker2.longitude);

      // Calculate deltas to fit both markers within the map view
      setDeltaLat(maxLat - minLat);
      setDeltaLng(maxLng - minLng);

      setDistance(
        calculateDistance(
          marker1.latitude,
          marker1.longitude,
          marker2.latitude,
          marker2.longitude,
        ),
      );
    }
  }, [marker1, marker2]);

  useEffect(() => {
    const fetchDirections = async () => {
      //       console.log('marker1:', marker1);
      //       console.log('marker2:', marker2);
      if (marker1 && marker2 && routeCoordinates.length == 0) {
        try {
          console.log('getting route api');
          const token =
            '5b3ce3597851110001cf6248a9e9053d3f984724af7233d4c4c60f87';
          const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${token}&start=${marker1.longitude},${marker1.latitude}&end=${marker2.longitude},${marker2.latitude}`;

          console.log('url:', url);
          const response = await axios.get(url);
          const coords = response.data.features[0].geometry.coordinates;
          //   const latlng = coords.map((coord: Number) => ({
          //     latitude: coord[1],
          //     longitude: coord[0],
          //   }));
          setRouteCoordinates(coords);
          console.log('route coords:', routeCoordinates);
        } catch (error) {
          console.error('Error fetching directions:', error);
        }
      }
    };
    fetchDirections();
  }, [marker1, marker2, routeCoordinates]);

  if (!location) {
    return (
      <View style={styles.container}>
        <MapView style={styles.map} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {marker1 &&
      marker2 &&
      deltaLat !== null &&
      deltaLng !== null &&
      routeCoordinates.length > 0 ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude:
              marker1 && marker2
                ? (marker1.latitude + marker2.latitude) / 2
                : 0,
            longitude:
              marker1 && marker2
                ? (marker1.longitude + marker2.longitude) / 2
                : 0,
            latitudeDelta:
              marker1 && marker2 ? deltaLat + padding * deltaLat : 0,
            longitudeDelta:
              marker1 && marker2 ? deltaLng + padding * deltaLng : 0,
          }}>
          {/* Dispatcher marker */}
          {marker1 && (
            <Marker
              coordinate={{
                latitude: marker1.latitude,
                longitude: marker1.longitude,
              }}
              title={`Dispatcher ${user.currentUser?.displayName}`}
              description="This is your current location"
              image={require('../../imgs/emt.png')}
            />
          )}
          {/* Responder markers */}
          {filteredResponders.map((responder, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: responder.latitude,
                longitude: responder.longitude,
              }}
              title={`Responder ${responder.name}`}
              description="Responder location"
              image={require('../../imgs/responder1.png')}
            />
          ))}
          {/* Caller marker */}
          {marker2 && (
            <Marker
              draggable
              coordinate={{
                latitude: marker2.latitude,
                longitude: marker2.longitude,
              }}
              title="Caller"
              description="This is the caller's current location"
              image={require('../../imgs/caller1.png')}
            />
          )}
          {/* Render route */}

          <Polyline
            coordinates={routeCoordinates.map(c => ({
              latitude: c[1],
              longitude: c[0],
            }))}
            strokeColor="#FF0000"
            strokeWidth={3}
          />

          {/* Circle around the caller marker */}
          {marker2 && (
            <Circle
              center={marker2}
              radius={distance * 1000} // in meters
              fillColor="rgba(238, 67, 110, 0.48)"
              strokeColor="rgba(227, 49, 58, 0.8)"
            />
          )}
        </MapView>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: marker1 ? marker1.latitude : 37.78825,
            longitude: marker1 ? marker1.longitude : -122.4324,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>
          <Marker
              coordinate={{
                latitude: marker1 ? marker1.latitude : 37.78825,
                longitude: marker1 ? marker1.longitude : -122.4324,
              }}
              title={`Dispatcher ${user.currentUser?.displayName}`}
              description="This is your current location"
              image={require('../../imgs/emt1.png')}
            />
        </MapView>
      )}
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

// To-do:
// Change icons
// Set up backend and pull responder markers into this map
