import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  Dispatcher: undefined;
  Responder: undefined;
  Caller: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Dispatcher')}>
        <Text style={styles.buttonText}>Dispatcher</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Responder')}>
        <Text style={styles.buttonText}>Responder</Text>
      </TouchableOpacity>
      {/* maybe update this */}
      {/* <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Caller')}>
        <Text style={styles.buttonText}>Caller</Text>
      </TouchableOpacity> */}
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
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 20,
    width: 200,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default HomeScreen;
