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

  useEffect(() => {
    const fetchResponders = async () => {
      const respondersRef = ref(db, 'responders');
      const snapshot = await get(respondersRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const responderList = Object.keys(data).map(key => ({
          userId: key,
          ...data[key],
        }));
        setResponders(responderList);
        // console.log(responderList);
        if (responderList.length > 0) {
          const filtered: React.SetStateAction<never[]> = [];
          const filtered2: React.SetStateAction<never[]> = [];
          const snap = await get(ref(db, `emergency/${user.currentUser?.uid}`));
          if (snap.exists()) {
            // console.log(snap.val());
            const lat = snap.val().callerLatitude;
            const lng = snap.val().callerLongitude;
            const snap1 = await get(
              ref(db, `dispatchers/${user.currentUser?.uid}`),
            );
            const d = calculateDistance(
              lat,
              lng,
              snap1.val().latitude,
              snap1.val().longitude,
            );
        //     console.log('my dist', d);
            setDistance(d);
            for (const loc of responderList) {
              const dist = calculateDistance(
                lat,
                lng,
                loc.latitude,
                loc.longitude,
              );

              if (dist <= d) {
                filtered.push({loc: loc, distance: dist});
              }
            }
          }
          setFilteredResponders(filtered);
          
          //   console.log('responders:', responders);
          //   console.log('filtered', filtered);
        }
      }
    };

    fetchResponders();
    const intervalId = setInterval(fetchResponders, 10000);
    return () => clearInterval(intervalId);
  }, [calculateDistance, responders, user]);

  //   const renderItem = ({ item }) => {
  //         if (item.loc.isResponding) {
  //           return (
  //             <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
  //               <View>
  //                 <Text>{item.name} is responding to the emergency.</Text>
  //                 <Text>Distance: {item.distance} km</Text>
  //               </View>
  //               <Text>{item.distance} km</Text>
  //             </View>
  //           );
  //         } else {
  //           return (
  //             <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
  //               <View>
  //                 <Text>{item.loc.name} is available.</Text>
  //                 <Text>Distance: {item.distance} km</Text>
  //               </View>
  //               <Text>{item.distance} km</Text>
  //             </View>
  //           );
  //         }
  //       };

  const navigateToChat = responder => {
    console.log('list screen responder', responder);
    //     navigation.navigate('Chat', {responder});
    setChangePage(true);
    setOther(responder.loc);
  };

  const goBack = () => {
        setChangePage(false);
      };

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
                style={[styles.item, { backgroundColor: (item.loc.isNearEmergency === 'responding') ? '#e0ffe0' : '#e1e7e8' }]}
                onPress={() => navigateToChat(item)}>
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
        <ChatScreen responder={other} goBack={goBack}/>
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
  respondingText: {
    fontSize: 14,
    //     color: item.isResponding ? '#4CAF50' : '#F44336',
  },
});

export default ListScreen;
