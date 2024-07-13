import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import MapView, {Marker, Circle} from 'react-native-maps';
import axios from 'axios';
import {db} from '../../firebase';
import {ref, get, update, onValue} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import {useNavigation} from '@react-navigation/native';
import * as Location from 'expo-location';

const DispatcherMapScreen = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [marker1, setMarker1] = useState(null);
  const [marker2, setMarker2] = useState(null);
  const [distance, setDistance] = useState(0);
  const [deltaLat, setDeltaLat] = useState(null);
  const [deltaLng, setDeltaLng] = useState(null);
  const [filteredResponders, setFilteredResponders] = useState([]);
  const [callerLocation, setCallerLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [conditionsMet, setConditionsMet] = useState(false);

  const mapRef = useRef(null);
  const navigation = useNavigation();
  const user = getAuth().currentUser;

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []);

  const deg2rad = deg => {
    return deg * (Math.PI / 180);
  };

  useEffect(() => {
    const fetchCallerLocation = async () => {
      try {
        const callerRef = ref(db, `emergency/${user.uid}`);
        const snapshot = await get(callerRef);
        if (snapshot.exists()) {
          setLoadingMessage('Fetching locations...');
          const data = snapshot.val();
          setCallerLocation(data);
          setMarker2({
            latitude: parseFloat(data.callerLatitude),
            longitude: parseFloat(data.callerLongitude),
          });
        } else {
          console.log('Caller data does not exist');
        }
      } catch (error) {
        console.error('Error fetching caller data:', error);
      }
    };
    fetchCallerLocation();
  }, [user]);

  useEffect(() => {
    if (mapRef.current && marker1 && marker2) {
      mapRef.current.animateToRegion(
        {
          latitude: (marker1.latitude + marker2.latitude) / 2,
          longitude: (marker1.longitude + marker2.longitude) / 2,
          latitudeDelta: deltaLat + 0.03,
          longitudeDelta: deltaLng + 0.03,
        },
        1000,
      );
    }
  }, [mapRef, marker1, marker2, deltaLat, deltaLng]);

  useEffect(() => {
    const fetchResponderLocations = () => {
      const respondersRef = ref(db, 'responders');
      const unsubscribe = onValue(respondersRef, snapshot => {
        const data = snapshot.val();
        const locations = data ? Object.values(data) : [];
        setFilteredResponders(locations);
        setLoadingMessage('Fetching responder locations...');
        setIsLoading(false);
      });
      return unsubscribe;
    };
    const interval = setInterval(fetchResponderLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filterAndSetResponders = async () => {
      if (filteredResponders.length > 0 && marker2) {
        const updates = {};
        const updatedFilteredResponders = filteredResponders.map(responder => {
          const dist = calculateDistance(
            marker2.latitude,
            marker2.longitude,
            responder.latitude,
            responder.longitude,
          );

          if (dist <= distance) {
            if (responder.isNearEmergency !== 'responding') {
              updates[`responders/${responder.userId}/isNearEmergency`] = true;
              updates[`responders/${responder.userId}/dispatcherId`] =
                user?.uid;
                return {...responder, isNearEmergency: true};
            }
            return {...responder, isNearEmergency: 'responding'};
          } else {
            updates[`responders/${responder.userId}/isNearEmergency`] = null;
            updates[`responders/${responder.userId}/dispatcherId`] = null;
            return {...responder, isNearEmergency: null};
          }
        });

        try {
          await update(ref(db), updates);
          console.log('Filtered responders updated successfully');
        } catch (error) {
          console.error('Error updating filtered responders:', error);
        }

        setFilteredResponders(updatedFilteredResponders);
      }
    };

    const interval = setInterval(filterAndSetResponders, 5000);

    return () => clearInterval(interval);
  }, [filteredResponders, marker2, distance, calculateDistance, user]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission not granted');
        }
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        setMarker1({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        const updates = {};
        updates[`/dispatchers/${user.uid}/latitude`] = location.coords.latitude;
        updates[`/dispatchers/${user.uid}/longitude`] =
          location.coords.longitude;
        await update(ref(db), updates);
        console.log('Dispatcher location sent to database');
      } catch (error) {
        console.error('Error requesting location permission:', error);
        setErrorMsg('Error getting location');
      }
    };
    requestLocationPermission();
  }, [user]);

  useEffect(() => {
    if (marker1 && marker2) {
      const minLat = Math.min(marker1.latitude, marker2.latitude);
      const maxLat = Math.max(marker1.latitude, marker2.latitude);
      const minLng = Math.min(marker1.longitude, marker2.longitude);
      const maxLng = Math.max(marker1.longitude, marker2.longitude);
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
  //   useEffect(() => {
  //     const fetchDirections = async () => {
  //       const interval = setInterval(async () => {
  //         if (marker1 && marker2) {
  //           try {
  //             console.log('getting route api');
  //             const token =
  //               '5b3ce3597851110001cf6248a9e9053d3f984724af7233d4c4c60f87';
  //             const url = https://api.openrouteservice.org/v2/directions/driving-car?api_key=${token}&start=${marker1.longitude},${marker1.latitude}&end=${marker2.longitude},${marker2.latitude};

  //             console.log('url:', url);
  //             const response = await axios.get(url);
  //             const coords = response.data.features[0].geometry.coordinates;
  //             setRouteCoordinates(coords);
  //             console.log('route coords:', coords);
  //             clearInterval(interval);
  //           } catch (error) {
  //             console.log('Error fetching directions:', error);
  //           }
  //         }
  //       }, 15000);
  //       return () => clearInterval(interval);
  //     };
  //     fetchDirections();
  //   }, [marker1, marker2, routeCoordinates]);

  if (!location) {
    return (
      <View style={styles.container}>
        <MapView style={styles.map} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}>
        {marker1 && (
          <Marker
            coordinate={{
              latitude: marker1.latitude,
              longitude: marker1.longitude,
            }}
            title={`Dispatcher ${user?.displayName}`}
            description="This is your current location"
            image={require('../../imgs/emt.png')}
          />
        )}
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
        {marker2 && (
          <Marker
            coordinate={{
              latitude: marker2.latitude,
              longitude: marker2.longitude,
            }}
            title="Caller"
            description="This is the caller's current location"
            image={require('../../imgs/caller1.png')}
          />
        )}
        {marker2 && (
          <Circle
            center={marker2}
            radius={distance * 1000} // in meters
            fillColor="rgba(238, 67, 110, 0.48)"
            strokeColor="rgba(227, 49, 58, 0.8)"
          />
        )}
      </MapView>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignSelf: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DispatcherMapScreen;
