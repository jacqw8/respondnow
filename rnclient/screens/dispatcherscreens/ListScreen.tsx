import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {db} from '../../firebase';
import {get, ref} from 'firebase/database';
import {useNavigation} from '@react-navigation/native';
import ChatScreen from './ChatScreen';

const ListScreen = () => {
  const [responders, setResponders] = useState([]);
  const [changePage, setChangePage] = useState(false);
  const [other, setOther] = useState(null);
  const navigation = useNavigation();

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
      }
    };

    fetchResponders();
  }, []);

  const navigateToChat = responder => {
    console.log('list screen responder', responder);
    //     navigation.navigate('Chat', {responder});
    setChangePage(true);
    setOther(responder);
  };

  return (
    <View style={styles.container}>
      {!changePage ? (
        <>
          <Text style={styles.title}>Select responder</Text>
          <FlatList
            data={responders}
            keyExtractor={item => item.userId}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => navigateToChat(item)}>
                <Text style={styles.itemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <ChatScreen responder={other} />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 18,
  },
});

export default ListScreen;
