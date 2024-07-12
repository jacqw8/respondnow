import {GiftedChat} from 'react-native-gifted-chat';
import {getAuth} from 'firebase/auth';
import React, {useCallback, useEffect, useState} from 'react';
import {db} from '../firebase';
import {ref, get, onValue, off, update} from 'firebase/database';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const user = getAuth();
  const sender = { chatroomId: 1, displayName: 'Jack'}

  useEffect(() => {
    const loadMsgs = async () => {
      const chatroom = await getMessages();
      setMessages(showMsgs(chatroom.messages));
    };
    loadMsgs();
    const chatroomRef = ref(db, `chatrooms/${sender.chatroomId}`);
    onValue(chatroomRef, snapshot => {
      const data = snapshot.val();
      setMessages(showMsgs(data.messages));
    });

    return () => {
      off(chatroomRef);
    };
  }, [sender]);

  const showMsgs = useCallback(
    msgs => {
      return msgs
        ? msgs.reverse().map((msg, idx) => ({
            ...msgs,
            _id: idx,
            user: {
              _id:
                msgs.sender === user.currentUser?.displayName
                  ? user.currentUser?.displayName
                  : sender.displayName,
              name:
                msg.sender === user.currentUser?.displayName
                  ? user.currentUser?.displayName
                  : sender.displayName,
            },
          }))
        : [];
    },
    [sender, user],
  );

  const getMessages = useCallback(async () => {
    const chatroomRef = ref(db, `chatrooms/${sender.chatroomId}`);
    const snapshot = await get(chatroomRef);
    return snapshot.val();
  }, [sender.chatroomId]);

  const onSend = useCallback(
    async msg => {
      const chatroom = ref(db, `chatrooms/${sender.chatroomId}`);
      const currChat = await getMessages();
      const pastMsgs = currChat.messages || [];
      const updates = {
        messages: [
          ...pastMsgs,
          {
            text: msg[0].text,
            sender: user.currentUser?.displayName,
            createdAt: new Date(),
          },
        ],
      };
      update(chatroom, updates);
    },
    [getMessages, user, sender],
  );

  return (
    <GiftedChat
      messages={messages}
      onSend={newMsg => onSend(newMsg)}
      user={{
        _id: user.currentUser?.uid,
        name: user.currentUser?.displayName,
      }}
    />
  );
};

export default ChatScreen;
