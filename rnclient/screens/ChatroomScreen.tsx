import {GiftedChat} from 'react-native-gifted-chat';
import {getAuth} from 'firebase/auth';
import React, {useCallback, useEffect, useState} from 'react';
import {db} from '../firebase';
import {ref, get, onValue, off, update} from 'firebase/database';
import {Text, View} from 'react-native';
import ChatScreen from './responderscreens/ChatScreen';
import UsersScreen from './Users';

const ChatroomScreen = () => {
  const [userPage, setUserPage] = useState(true);
  const [selected, setSelected] = useState(null);
  const [persons, setPersons] = useState([]);

  const user = getAuth();

  const onClick = person => {
    setUserPage(false);
    setSelected(person);
  };

  // // create a chatroom if it doesn't exist
  //   // check if chatroom id exists
  //   console.log('attempting to chat', otherUser.id);
  //   const myRef = ref(
  //     db,
  //     `responders/${user.currentUser?.uid}/chatroom/${otherUser.id}`,
  //   );
  //   console.log('attempting to get db');
  //   // chatroom - dispatcherid, chatroomid
  //   const snapshot = await get(myRef);
  //   if (snapshot.exists()) {
  //     console.log('chatroom already exists');
  //     // if chatroom with dispatcher already exists, just get the chatroom id
  //     const myData = snapshot.val();
  //     setChatroomId(myData.chatroomId);
  //   } else {
  //     console.log('chatroom doesnt exist yet', otherUser.id);
  //     // chatroom with this dispatcher doesn't exist
  //     // make a new chatroom
  //     const newChatroomRef = push(ref(db, 'chatrooms'), {
  //       firstUser: user.currentUser?.uid,
  //       secondUser: otherUser.id,
  //       messages: [],
  //     });
  //     const newChatroomId = newChatroomRef.key;
  //     console.log('added chatroom id', newChatroomId);
  //     await set(ref(db, `responders/${user.currentUser?.uid}/chatroom`), {
  //       otherUser: otherUser.id,
  //       chatroomId: newChatroomId,
  //     });
  //     // set(ref(db), updates);
  //     setChatroomId(newChatroomId);
  //   }
  return (
    <View>{userPage ? 
    <UsersScreen 
    users={persons}
    onClick={onClick}
    /> : 
    <ChatScreen sender={user} />}</View>
  );
};

export default ChatroomScreen;
