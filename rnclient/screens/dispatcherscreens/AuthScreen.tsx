import React, {useState, useEffect, useCallback} from 'react';
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
      setName(userCredential.user.displayName);
    } catch (error) {
      setUser(null);
      setError(error.message);
      console.log('error signing in:', error.message);
      Alert.alert('Error', error.message);
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
        <View style={styles.signOut}>
        <Text style={styles.label}>Welcome {name}!</Text>
        <TouchableOpacity
          style={styles.button}
          title="Sign Out"
          onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Name (Sign up only)"
            value={name}
            onChangeText={setName}
          />
          <View style={styles.buttonContainer}>
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
  signOut: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: '#e8cdcd',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 20,
    justifyContent: 'center',
  },
  buttonContainer: {
    backgroundColor: '#e8cdcd',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    height: 100,
    backgroundColor: '#f9f5f5',
    marginBottom: 10,
    borderRadius: 5,
    width: 300,
    height: 50,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    backgroundColor: '#e06565',
    width: 200,
    height: 50,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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

export default AuthScreen;
