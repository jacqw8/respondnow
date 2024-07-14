import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

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
      <Text style={styles.title}>RespondNow!</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#e06565' }]}
        onPress={() => navigation.replace('Dispatcher')}>
        <Text style={styles.buttonText}>Dispatcher</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#0f7991' }]}
        onPress={() => navigation.replace('Responder')}>
        <Text style={styles.buttonText}>Responder</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    width: 200,
    height: 50,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
