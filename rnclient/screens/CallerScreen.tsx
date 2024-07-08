import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
// import {NativeStackNavigationProp} from '@react-navigation/native-stack';
// import {useNavigation} from '@react-navigation/native';

// type RootStackParamList = {
//   Home: undefined;
//   Dispatcher: undefined;
//   Responder: undefined;
//   Caller: undefined;
// };

// type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dispatcher'>;

const CallerScreen: React.FC = () => {
        // const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text>Caller Screen</Text>
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
});

export default CallerScreen;
