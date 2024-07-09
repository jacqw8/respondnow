import React, {useState, useEffect} from 'react';
import {View, StyleSheet, TextInput, Text, Button, Alert} from 'react-native';
import {auth, db} from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {ref, set, child, get} from 'firebase/database';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [user, setUser] = useState(null);
  const [errorMsg, setError] = useState('');

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, user => {
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
      await updateProfile(userCredential.user, {
        displayName: `${name}`,
      });
      const userId = userCredential.user.uid;
      set(ref(db, `responders/${userId}`), {
        name: name,
        userId: userId,
        email: email,
        role: 'responder',
      });
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', errorMsg);
    }
  };

  // Function to check if the email belongs to a responder
  const isResponderEmail = async email => {
    try {
      // Check if the email belongs to a responder
      const dbRef = ref(db, 'responders');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        // Iterate through snapshot to check if email exists in responders
        const responders = snapshot.val();
        const responderEmails = Object.values(responders).map(
          responder => responder.email,
        );

        return responderEmails.includes(email);
      } else {
        console.log('No responders found in database');
        return false;
      }
    } catch (error) {
      console.error('Error checking user role:', error.message);
      return false;
    }
  };

  const handleSignIn = async () => {
    // Check if the email belongs to a responder
    const isResponder = await isResponderEmail(email);
    if (isResponder) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
      } catch (error) {
        setError(error.message);
        Alert.alert('Error', errorMsg);
      }
    } else {
        Alert.alert('Error', 'Not a responder!');
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
          <Text>Welcome!</Text>
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
            placeholder="Name (Sign up only)"
            value={name}
            onChangeText={setName}
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
