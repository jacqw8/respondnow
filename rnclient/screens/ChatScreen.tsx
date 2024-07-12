import { getAuth } from 'firebase/auth';
import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { db } from '../firebase';
import { get, off, onValue, push, ref, set, update } from 'firebase/database';

const ChatScreen = () => {
  const user = getAuth();
  const [messages, setMessages] = useState([]);
  const [dispatcher, setDispatcher] = useState(null);
  const [chatroomId, setChatroomId] = useState(null);

  useEffect(() => {
    const checkAndCreateChatroom = async () => {
      const userRef = ref(db, `responders/${user.currentUser?.uid}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const data = snap.val();
        setDispatcher({ userId: data.dispatcherId });
        console.log('Attempting to chat with dispatcher:', data.dispatcherId);

        const myRef = ref(
          db,
          `responders/${user.currentUser?.uid}/chatroom/${data.dispatcherId}`
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
              `responders/${user.currentUser?.uid}/chatroom/${data.dispatcherId}`
            ),
            {
              chatroomId: newChatroomId,
            }
          );
          console.log('updated responder chatroom');
          await set(
            ref(
              db,
              `dispatchers/${data.dispatcherId}/chatroom/${user.currentUser?.uid}`
            ),
            {
              chatroomId: newChatroomId,
            }
          );
          console.log('updated dispatcher chatroom');

          setChatroomId(newChatroomId);
        }
      }
    };

    if (user.currentUser) {
      checkAndCreateChatroom();
    }
  }, [user.currentUser]);

  useEffect(() => {
    if (chatroomId) {
      const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
      const handleNewMessages = snapshot => {
        const data = snapshot.val();
        if (data && data.messages) {
          setMessages(
            data.messages.reverse().map((msg, idx) => ({
              ...msg,
              _id: idx,
              user: {
                _id: msg.sender === user.currentUser?.uid ? user.currentUser?.uid : dispatcher.userId,
                name: msg.sender === user.currentUser?.uid ? user.currentUser?.displayName : 'Dispatcher',
              },
            }))
          );
        }
      };

      onValue(chatroomRef, handleNewMessages);
      return () => {
        off(chatroomRef, 'value', handleNewMessages);
      };
    }
  }, [chatroomId, user.currentUser, dispatcher]);

  const onSend = useCallback(
    async (msg = []) => {
      if (!chatroomId || !msg.length) return;

      const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
      const snapshot = await get(chatroomRef);
      const oldMsgs = (snapshot.val() && snapshot.val().messages) || [];

      const newMsg = {
        text: msg[0].text,
        sender: user.currentUser?.uid,
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...oldMsgs, newMsg];

      update(chatroomRef, {
        messages: updatedMessages,
      });

      setMessages(previousMessages => GiftedChat.append(previousMessages, [newMsg]));
    },
    [chatroomId, user.currentUser?.uid]
  );

  return (
    <GiftedChat
      messages={messages}
      onSend={msg => onSend(msg)}
      user={{
        _id: user.currentUser?.uid,
        name: user.currentUser?.displayName,
      }}
      alwaysShowSend
    />
  );
};

export default ChatScreen;
