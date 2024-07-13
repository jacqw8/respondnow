import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {db} from '../../firebase';
import {get, ref} from 'firebase/database';
import {useNavigation} from '@react-navigation/native';
import ChatScreen from './ChatScreen';
import {getAuth} from 'firebase/auth';

const ListScreen = () => {
  const [responders, setResponders] = useState([]);
  const [changePage, setChangePage] = useState(false);
  const [other, setOther] = useState(null);
  const [filteredResponders, setFilteredResponders] = useState([]);
  const [distance, setDistance] = useState(null);
  const user = getAuth();

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

  const fetchResponders = useCallback(async () => {
    try {
      const respondersRef = ref(db, 'responders');
      const snapshot = await get(respondersRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const responderList = Object.keys(data).map(key => ({
          userId: key,
          ...data[key],
        }));
        setResponders(responderList);

        // Fetch current emergency details
        const snap = await get(ref(db, `emergency/${user.currentUser?.uid}`));
        if (snap.exists()) {
          const {callerLatitude, callerLongitude} = snap.val();
          const snap1 = await get(
            ref(db, `dispatchers/${user.currentUser?.uid}`),
          );
          const d = calculateDistance(
            callerLatitude,
            callerLongitude,
            snap1.val().latitude,
            snap1.val().longitude,
          );
          setDistance(d);

          // Filter responders and structure filteredResponders array
          const filtered = [];
          responderList.forEach(loc => {
            const dist = calculateDistance(
              callerLatitude,
              callerLongitude,
              loc.latitude,
              loc.longitude,
            );

            if (dist <= d) {
              filtered.push({loc: loc, distance: dist});
            }
          });

        // console.log('filtered', filtered);
          setFilteredResponders(filtered);
        }
      }
    } catch (error) {
      console.error('Error fetching responders:', error);
    }
  }, [calculateDistance, user]);

  useEffect(() => {
    fetchResponders();
    const intervalId = setInterval(fetchResponders, 10000);
    return () => clearInterval(intervalId);
  }, [fetchResponders]);

  const navigateToChat = useCallback(responder => {
        console.log('navigating with responder', responder);
    setChangePage(true);
    setOther(responder);
  }, []);

  const goBack = useCallback(() => {
    setChangePage(false);
  }, []);

  return (
    <View style={styles.container}>
      {!changePage ? (
        <>
          <Text style={styles.title}>Select responder</Text>
          <FlatList
            data={filteredResponders}
            keyExtractor={item => item.loc.userId}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  {
                    backgroundColor:
                      item.loc.isNearEmergency === 'responding'
                        ? '#e0ffe0'
                        : '#e1e7e8',
                  },
                ]}
                onPress={() => navigateToChat(item.loc)}>
                <View style={styles.itemContent}>
                  <Text style={styles.nameText}>{item.loc.name}</Text>
                  <Text style={styles.distanceText}>
                    {(item.distance * 0.621371).toFixed(2)} miles
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <ChatScreen responder={other} goBack={goBack} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 'auto',
  },
});

export default ListScreen;

// update ui (home, sign in, chat (back button), info screen)
// train another model including context
// speech to text
// spacy model

