import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import React, {useState, useEffect, useRef, useCallback} from 'react';
import * as Location from 'expo-location';
import MapView, {Marker, Circle, Polyline} from 'react-native-maps';
import axios from 'axios';
import {db} from '../../firebase';
import {ref, onValue, get, update} from 'firebase/database';
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
  const [conditionsMet, setConditionsMet] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    'Getting emergency and responder locations...',
  );
  const [isLoading, setIsLoading] = useState(true);
  const [noRoute, setNoRoute] = useState(false);

  const mapRef = useRef(null);

  useEffect(() => {
    if (marker1) {
      setConditionsMet(true);
    }
  }, [marker1]);

  // Calculate distance between markers
  const calculateDistance = useCallback(
    (lat1: Number, lon1: Number, lat2: Number, lon2: Number) => {
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
    },
    [],
  );

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
          setIsLoading(true);
          setLoadingMessage('Getting location of caller...');
          const data = snapshot.val();
          console.log('Caller data:', parseFloat(data.callerLatitude));
          setCallerLocation(data);
          setMarker2({
            latitude: parseFloat(data.callerLatitude),
            longitude: parseFloat(data.callerLongitude),
          });
          setIsLoading(false);
        } else {
          console.log('Caller data doesnt exist');
        }
      } catch (error) {
        console.log('Error fetching caller data', error);
      }
    };
    fetchCallerLocation();
  }, [user]);

  //   Zoom into emergency
  useEffect(() => {
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
  }, [deltaLat, deltaLng, marker1, marker2]);

  //   Get the responder locations
  useEffect(() => {
    const interval = setInterval(() => {
      // get responders
      const respondersRef = ref(db, 'responders');
      onValue(respondersRef, snapshot => {
        const data = snapshot.val();
        const locations = data ? Object.values(data) : [];
        setResponderLocations(locations);
      });
      console.log('responders:', responderLocations);
    }, 10000);
    return () => clearInterval(interval);
  });

  //   Filter responders based on distance
  useEffect(() => {
    const updateFilteredResponders = async filteredResponders => {
      const updates = {};
      filteredResponders.forEach(responder => {
        if (
          !('isNearEmergency' in responder) ||
          ('isNearEmergency' in responder &&
            responder.isNearEmergency !== 'responding')
        ) {
          updates[`responders/${responder.userId}/isNearEmergency`] = true;
          updates[
            `responders/${responder.userId}/dispatcherId`
          ] = `${user.currentUser?.uid}`;
        }
      });

      try {
        await update(ref(db), updates);
        console.log('Filtered responders updated successfully');
      } catch (error) {
        console.error('Error updating filtered responders:', error);
      }
    };
    const filterAndSetResponders = async () => {
      if (responderLocations.length > 0) {
        const filtered: React.SetStateAction<never[]> = [];
        for (const loc of responderLocations) {
          const dist = calculateDistance(
            marker2.latitude,
            marker2.longitude,
            loc.latitude,
            loc.longitude,
          );
          const responderRef = ref(db, `responders/${loc.userId}`);
          if (dist <= distance) {
            const snapshot = await get(responderRef);
            if (snapshot.exists()) {
              console.log('filter loc:', loc);
              const data = snapshot.val();
              if (
                'dispatcherId' in data &&
                data.dispatcherId === user.currentUser?.uid
              ) {
                filtered.push(loc);
              } else if (!('dispatcherId' in data)) {
                filtered.push(loc);
              }
            } else {
              filtered.push(loc);
            }
          } else {
            const snapshot = await get(responderRef);
            if (snapshot.exists()) {
              // responder is now too far from emergency
              const data = snapshot.val();
              if (data.dispatcherId === user.currentUser?.uid) {
                const updates = {};
                updates[`responders/${loc.userId}/dispatcherId`] = null;
                updates[`responders/${loc.userId}/isNearEmergency`] = null;
                try {
                  await update(ref(db), updates);
                  console.log('Successfully deleted the dispatcherId field');
                } catch (error) {
                  console.error(
                    'Error deleting the dispatcherId field:',
                    error,
                  );
                }
              }
            }
          }
        }
        setFilteredResponders(filtered);
        console.log('filtered responders', filtered);
        // Update database with filtered responders
        updateFilteredResponders(filtered);
        clearInterval(interval);
        setIsLoading(false);
      }
    };
    // Interval for subsequent executions
    const interval = setInterval(filterAndSetResponders, 10000);
    return () => clearInterval(interval);
  }, [responderLocations, marker2, distance, calculateDistance, user]);

  //   Get permission and get dispatcher (my) location
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
        const updates = {};
        updates[`/dispatchers/${user.currentUser?.uid}/latitude`] =
          location.coords.latitude;
        updates[`/dispatchers/${user.currentUser?.uid}/longitude`] =
          location.coords.longitude;
        try {
          await update(ref(db), updates);
          console.log('Sending dispatcher location to db');
        } catch (error) {
          console.error('Error sending dispatcher location to db:', error);
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          async newLocation => {
            setLocation(newLocation);
            setMarker1({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            const updates = {};
            updates[`/dispatchers/${user.currentUser?.uid}/latitude`] =
              newLocation.coords.latitude;
            updates[`/dispatchers/${user.currentUser?.uid}/longitude`] =
              newLocation.coords.longitude;
            try {
              await update(ref(db), updates);
              console.log('Sending dispatcher location to db');
            } catch (error) {
              console.error('Error sending dispatcher location to db:', error);
            }
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
  }, [marker1, marker2, calculateDistance]);

  //   Get route coordinates
  useEffect(() => {
    const fetchDirections = async () => {
      const interval = setInterval(async () => {
        if (marker1 && marker2) {
          try {
            console.log('getting route api');
            const token =
              '5b3ce3597851110001cf6248a9e9053d3f984724af7233d4c4c60f87';
            const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${token}&start=${marker1.longitude},${marker1.latitude}&end=${marker2.longitude},${marker2.latitude}`;

            console.log('url:', url);
            const response = await axios.get(url);
            const coords = response.data.features[0].geometry.coordinates;
            setRouteCoordinates(coords);
            console.log('route coords:', coords);
            clearInterval(interval);
          } catch (error) {
            console.log('Error fetching directions:', error);
          }
        }
      }, 15000);
      return () => clearInterval(interval);
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
      {conditionsMet && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: marker1.latitude,
            longitude: marker1.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
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
      )}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
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

export default DispatcherMapScreen;
