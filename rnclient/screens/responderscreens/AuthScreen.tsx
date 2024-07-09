import React, {useState, useEffect} from 'react';
import {View, StyleSheet, TextInput, Text, Button, Alert} from 'react-native';
import {auth} from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [user, setUser] = useState(null);
  const [errorMsg, setError] = useState('');

  useEffect(() => {
        const subscriber = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUser(user);
            console.log('User is signed in: ', user);
          } else {
            setUser(null);
            console.log('No user is signed in.');
          }
        });
        return subscriber; // unsubscribe on unmount
      }, []);

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      setUser(userCredential.user);
      const name = firstName + ' ' + lastName;
      await updateProfile(userCredential.user, {
        displayName: `${name}`,
      });
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', errorMsg);
    }
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      setUser(userCredential.user);
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', errorMsg);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <View>
       {user ? (
        <View>
          <Text>Welcome, {user.displayName}</Text>
          <Button title="Sign Out" onPress={handleSignOut} />
        </View>
      ) : (
        <View>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            placeholder="First Name (Sign up only)"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            placeholder="Last Name (Sign up only)"
            value={lastName}
            onChangeText={setLastName}
          />
          <Button title="Sign Up" onPress={handleSignUp} />
          <Button title="Log In" onPress={handleSignIn} />
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
  input: {
    height: 100,
    backgroundColor: '#e5f5f1',
    width: 300,
    height: 50,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 20,
    width: 300,
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

export default AuthScreen;
