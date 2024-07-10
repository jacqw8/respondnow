import {View, Text, StyleSheet, Alert} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import * as Location from 'expo-location';
import MapView, {Marker, Polyline} from 'react-native-maps';
import polyline from '@mapbox/polyline';
import axios from 'axios';
import {db} from '../../firebase';
import {ref, update, get} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import messaging from 'firebase/messaging';

const ResponderMapScreen: React.FC = () => {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [marker1, setMarker1] = useState<any>(null);
  const [marker2, setMarker2] = useState<any>(null);
  const [distance, setDistance] = useState<number>(0);
  const [deltaLat, setDeltaLat] = useState<any>(null);
  const [deltaLng, setDeltaLng] = useState<any>(null);
  const padding = 1.2;
  const user = getAuth();
  const [conditionsMet, setConditionsMet] = useState(false);

  useEffect(() => {
    if (marker1) {
      setConditionsMet(true);
    }
  }, [marker1]);

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
        // setMarker2({
        //   latitude: location.coords.latitude - 0.01,
        //   longitude: location.coords.longitude - 0.01,
        // });

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

  // get location of caller/patient - need to check if there is an emergency
  useEffect(() => {
    const fetchResponderData = async () => {
       // check responder data, if there is an emergency
      try {
        console.log('Attempting to access db');
        const responderRef = ref(db, `responders/${user.currentUser?.uid}`);
        const snapshot = await get(responderRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('Responder data:', data);
          if (data && 'isNearEmergency' in data) {
            if (data.isNearEmergency) {
              Alert.alert('Emergency near', 'Action needed');
              clearInterval(interval);
            }
          }
        }
      } catch (error) {
        console.log('Error getting responder database:', error);
      }
    };
    const interval = setInterval(() => {
      fetchResponderData();
    }, 10000); // Adjust interval time as needed
  
    // Clean up interval to avoid memory leaks
    return () => clearInterval(interval);
    // const fetchCallerLocation = async () => {
    //   try {
    //     const callerRef = ref(db, `emergency/${user.currentUser?.uid}`);
    //     const snapshot = await get(callerRef);
    //     if (snapshot.exists()) {
    //       const data = snapshot.val();
    //       console.log('Caller data:', parseFloat(data.callerLatitude));
    //       setCallerLocation(data);
    //       setMarker2({
    //         latitude: parseFloat(data.callerLatitude),
    //         longitude: parseFloat(data.callerLongitude),
    //       });
    //     } else {
    //       console.log('Caller data doesnt exist');
    //     }
    //   } catch (error) {
    //     console.log('Error fetching caller data', error);
    //   }
    // };
    // fetchCallerLocation();
  }, [user]);

  const sendLocToDb = async () => {
    if (!location || !user) {
      return;
    }
    console.log('Sending location to database:', {location});
    console.log('Current user:', user);
    const userId = user.currentUser?.uid;
    try {
      await update(ref(db, `responders/${userId}`), {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      });
      console.log('Updated user with location info');
    } catch (error) {
      console.log('Error sending location to db:', error);
    }
  };

  useEffect(() => {
    if (location) {
      console.log('sending loc to db');
      sendLocToDb();
      console.log('sent to db');
    }
  });

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

  // useEffect(() => {
  //   const fetchDirections = async () => {
  //     //       console.log('marker1:', marker1);
  //     //       console.log('marker2:', marker2);
  //     if (marker1 && marker2) {
  //       try {
  //         console.log('getting route api');
  //         const token =
  //           '5b3ce3597851110001cf6248a9e9053d3f984724af7233d4c4c60f87';
  //         const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${token}&start=${marker1.longitude},${marker1.latitude}&end=${marker2.longitude},${marker2.latitude}`;

  //         console.log('url:', url);
  //         const response = await axios.get(url);
  //         const coords = response.data.features[0].geometry.coordinates;
  //         //   const latlng = coords.map((coord: Number) => ({
  //         //     latitude: coord[1],
  //         //     longitude: coord[0],
  //         //   }));
  //         setRouteCoordinates(coords);
  //         console.log('route coords:', routeCoordinates);
  //       } catch (error) {
  //         console.error('Error fetching directions:', error);
  //       }
  //     }
  //   };
  //   const interval = setInterval(() => {
  //     fetchDirections();
  //   }, 15000);

  // }, [marker1, marker2, routeCoordinates]);

  if (!location) {
    return (
      <View style={styles.container}>
        <MapView style={styles.map} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>Dispatcher Screen</Text>
      {conditionsMet && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: marker1 ? marker1.latitude : 0,
            longitude: marker1 ? marker1.longitude : 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>
          {/* Dispatcher marker */}
          {marker1 && (
            <Marker
              coordinate={{
                latitude: marker1.latitude,
                longitude: marker1.longitude,
              }}
              title={`Responder ${user.currentUser?.displayName}`}
              description="This is your current location"
              image={require('../../imgs/responder1.png')}
            />
          )}
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

          {/* <Polyline
              coordinates={routeCoordinates.map(c => ({
                latitude: c[1],
                longitude: c[0],
              }))}
              strokeColor="#FF0000"
              strokeWidth={3}
            /> */}
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

export default ResponderMapScreen;
