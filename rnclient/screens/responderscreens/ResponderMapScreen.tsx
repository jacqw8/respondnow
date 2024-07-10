import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
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
  const [ignored, setIgnored] = useState(false);
  const mapRef = useRef(null);
  const [dispatcher, setDispatcher] = useState<any>(null);
  const [alertShown, setAlertShown] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [noRoute, setNoRoute] = useState(false);

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
    const fetchEmergencyData = async () => {
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
              setDispatcher(data.dispatcherId);
              console.log('dispatcher id', data.dispatcherId);
              if (!alertShown) {
                Alert.alert(
                  'Emergency Alert',
                  'There is an emergency near you. What would you like to do?',
                  [
                    {
                      text: 'Ignore',
                      onPress: () => {
                        console.log('Ignore Pressed');
                        setIgnored(true);
                      },
                      style: 'cancel',
                    },
                    {
                      text: 'Respond',
                      onPress: () => {
                        console.log('Respond Pressed');
                        setIgnored(false);
                        setIsLoading(true);
                        setLoadingMessage('Getting location of emergency...');
                      },
                    },
                  ],
                  {cancelable: false},
                );
                setAlertShown(true);
              }
              clearInterval(interval);
            }
          }
        }
      } catch (error) {
        console.log('Error getting responder database:', error);
      }
      try {
        const callerRef = ref(db, `emergency/${dispatcher}`);
        const snapshot = await get(callerRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setMarker2({
            latitude: parseFloat(data.callerLatitude),
            longitude: parseFloat(data.callerLongitude),
            description: 'Emergency at this location',
          });
        } else {
          console.log('Caller data doesnt exist');
        }
      } catch (error) {
        console.log('Error fetching caller data', error);
      }
    };
    const interval = setInterval(() => {
      fetchEmergencyData();
      setIsLoading(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [alertShown, dispatcher, user]);

  useEffect(() => {
    const fetchDirections = async () => {
      const interval = setInterval(async () => {
        if (marker1 && marker2 && !noRoute) {
          setIsLoading(true);
          setLoadingMessage('Getting route coordinates...');
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
            clearInterval(interval);
            setIsLoading(false);
            setNoRoute(true);
          } catch (error) {
            console.error('Error fetching directions:', error);
          }
        }
      }, 15000);
      return () => clearInterval(interval);
    };
    fetchDirections();
  }, [marker1, marker2, routeCoordinates]);

  const handleViewEmergency = () => {
    setIgnored(false);
    console.log('Viewing emergency:', marker2);
    if (mapRef.current && marker2) {
      mapRef.current.animateToRegion(
        {
          latitude: (marker1.latitude + marker2.latitude) / 2,
          longitude: (marker1.longitude + marker2.longitude) / 2,
          latitudeDelta: deltaLat + padding * deltaLat,
          longitudeDelta: deltaLng + padding * deltaLng,
        },
        1000,
      ); // Duration in milliseconds
    }
  };

  useEffect(() => {
    if (marker2 && !ignored) {
      handleViewEmergency();
    }
  }, [marker2, ignored]);

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
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: marker1.latitude,
            longitude: marker1.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
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
          {marker2 && !ignored && (
            <Marker
              coordinate={{
                latitude: marker2.latitude,
                longitude: marker2.longitude,
              }}
              title="Emergency"
              description={marker2.description}
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
        </MapView>
      )}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}
      {/* {ignored && (
        <View style={{marginTop: 10}}>
          <TouchableOpacity
            title="View Emergency"
            onPress={handleViewEmergency}>
            <Text>View Emergency</Text>
          </TouchableOpacity>
        </View>
      )} */}
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
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '32%',
    transform: [{translateX: -50}, {translateY: -50}],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResponderMapScreen;

// To-do:
// show caller location on map
// respond to emergency -
// keep checking distance - if distance is too far, update the backend
