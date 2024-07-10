import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Button,
  Alert,
  TouchableOpacity,
} from 'react-native';
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
    const subscriber = onAuthStateChanged(auth, async user => {
      if (user) {
        console.log('checking if correct group');
        const isDispatcher = await isDispatcherEmail(user.email);
        if (!isDispatcher) {
          console.log('incorrect group');
          handleSignOut();
          return;
        }
        setUser(user);
        console.log('User is signed in: ', user);
        setName(user.displayName);
        console.log('name is', user.displayName);
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
      set(ref(db, `dispatchers/${userId}`), {
        name: name,
        userId: userId,
        email: email,
        role: 'dispatcher',
      });
      setName(user.displayName);
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', errorMsg);
    }
  };

  // Function to check if the email belongs to a dispatcher
  const isDispatcherEmail = async email => {
    try {
      // Check if the email belongs to a dispatcher
      const dbRef = ref(db, 'dispatchers');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        // Iterate through snapshot to check if email exists in dispatchers
        const dispatchers = snapshot.val();
        const dispatcherEmails = Object.values(dispatchers).map(
          dispatcher => dispatcher.email,
        );

        return dispatcherEmails.includes(email);
      } else {
        console.log('No dispatchers found in database');
        return false;
      }
    } catch (error) {
      console.error('Error checking user role:', error.message);
      return false;
    }
  };

  const handleSignIn = async () => {
    // Check if the email belongs to a responder
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      setUser(userCredential.user);
      console.log('signed in');
      setName(user.displayName);
    } catch (error) {
      setUser(null);
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
    <View style={styles.container}>
      {user ? (
        <View>
          <Text>Welcome {name}!</Text>
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
          <TouchableOpacity
            style={styles.button}
            title="Sign Up"
            onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            title="Log In"
            onPress={handleSignIn}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
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
