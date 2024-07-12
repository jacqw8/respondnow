import {getAuth} from 'firebase/auth';
import React, {useState, useCallback, useEffect} from 'react';
import {View, StyleSheet, Text, Button} from 'react-native';
import {GiftedChat} from 'react-native-gifted-chat';
import {db} from '../firebase';
import {get, off, onValue, push, ref, set, update} from 'firebase/database';

const ChatScreen = () => {
  const user = getAuth();
  const [messages, setMessages] = useState([
    {
      _id: 1,
      text: `Hello! How can I help you today, ${user.currentUser?.displayName}?`,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Dispatcher',
        // avatar: '../imgs/emt1.png',
      },
    },
  ]);
  const [dispatcher, setDispatcher] = useState(null);
  const [chatroomId, setChatroomId] = useState(null);

  useEffect(() => {
    const checkAndCreateChatroom = async () => {
      const userRef = ref(db, `responders/${user.currentUser?.uid}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const data = snap.val();
        setDispatcher({name: data.name, userId: data.dispatcherId});
        console.log('Attempting to chat with dispatcher:', data.dispatcherId);

        const myRef = ref(
          db,
          `responders/${user.currentUser?.uid}/chatroom/${data.dispatcherId}`,
        );
        console.log('Attempting to get db');

        const snapshot = await get(myRef);

        if (snapshot.exists()) {
          console.log('Chatroom already exists');
          const myData = snapshot.val();
          setChatroomId(myData.chatroomId);
        } else {
          console.log('Chatroom does not exist yet', data.dispatcherId);

          const newChatroomRef = push(ref(db, 'chatrooms'), {
            responder: user.currentUser?.uid,
            dispatcher: data.dispatcherId,
            messages: [],
          });
          const newChatroomId = newChatroomRef.key;
          console.log('Added chatroom id', newChatroomId);

          await set(
            ref(
              db,
              `responders/${user.currentUser?.uid}/chatroom/${data.dispatcherId}`,
            ),
            {
              chatroomId: newChatroomId,
            },
          );
          console.log('updated responder chatroom');
          await set(
            ref(
              db,
              `dispatchers/${data.dispatcherId}/chatroom/${user.currentUser?.uid}`,
            ),
            {
              chatroomId: newChatroomId,
            },
          );
          console.log('updated dispatcher chatroom');

          setChatroomId(newChatroomId);
        }
      }
    };

    checkAndCreateChatroom();
  }, [user]);

  // load old messages
  useEffect(() => {
    const loadMsgs = async () => {
      const chatroom = await fetchMsgs();
      setMessages(renderMsgs(chatroom.messages));
    };
    loadMsgs();

    const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
    onValue(chatroomRef, snapshot => {
      const data = snapshot.val();
      setMessages(renderMsgs(data.messages));
    });
    return () => {
      off(chatroomRef);
    };
  }, [chatroomId, fetchMsgs, renderMsgs]);

  const renderMsgs = useCallback(
    msgs => {
      return msgs
        ? msgs.reverse().map((msg, idx) => ({
            ...msgs,
            _id: idx,
            user: {
              _id:
                msgs.sender === user.currentUser?.uid
                  ? user.currentUser?.uid
                  : dispatcher.userId,
              name:
                msgs.sender === user.currentUser?.uid
                  ? user.currentUser?.displayName
                  : dispatcher.name,
            },
          }))
        : [];
    },
    [user, dispatcher],
  );

  const fetchMsgs = useCallback(async () => {
    const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
    const snapshot = await get(chatroomRef);
    return snapshot.val();
  }, [chatroomId]);

  const onSend = useCallback(
    async (msg = []) => {
      // console.log('other user', dispatcher);
      // console.log('me', user);
      console.log('messages:', msg);
      // send message to other user
      const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
      const oldMsgs = await fetchMsgs();
      const lastMsgs = oldMsgs.messages || [];
      update(chatroomRef, {
        messages: [
          ...lastMsgs,
          {
            text: msg[0].text,
            sender: user.currentUser?.uid,
            createdAt: new Date(),
          },
        ],
      });
      setMessages(previousMessages => GiftedChat.append(previousMessages, msg));
    },
    [chatroomId, fetchMsgs, user.currentUser?.uid],
  );

  return (
    <GiftedChat
      messages={messages}
      onSend={msg => onSend(msg)}
      user={{
        _id: 1,
        name: 'Responder',
        // avatar: '../imgs/responder1.png',
      }}
      alwaysShowSend
    />
  );
};

const styles = StyleSheet.create({
  sendingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
});

export default ChatScreen;
