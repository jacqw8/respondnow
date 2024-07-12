import {GiftedChat} from 'react-native-gifted-chat';
import {getAuth} from 'firebase/auth';
import React, {useCallback, useEffect, useState} from 'react';
import {db} from '../firebase';
import {ref, get, onValue, off, update} from 'firebase/database';
import {Text, View} from 'react-native';
import ChatScreen from './ChatScreen';

const ChatroomScreen = () => {
  const user = getAuth();

  return (
    <View>
      <ChatScreen sender={user} />
    </View>
  );
};

export default ChatroomScreen;
