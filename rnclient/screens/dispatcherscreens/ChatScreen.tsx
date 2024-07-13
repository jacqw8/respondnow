import {getAuth} from 'firebase/auth';
import React, {useState, useCallback, useEffect} from 'react';
import {GiftedChat, Bubble, Send} from 'react-native-gifted-chat';
import {db} from '../../firebase';
import {get, off, onValue, push, ref, set, update} from 'firebase/database';
import {Button, Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const ChatScreen = ({responder, goBack}) => {
  const user = getAuth();
  const [messages, setMessages] = useState([]);
  const [chatroomId, setChatroomId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const checkAndCreateChatroom = async () => {
      console.log('Attempting to chat with responder:', responder.userId);
      const myRef = ref(
        db,
        `dispatchers/${user.currentUser?.uid}/chatroom/${responder.userId}`,
      );
      console.log('Attempting to get db');

      const snapshot = await get(myRef);
      if (snapshot.exists()) {
        console.log('Chatroom already exists');
        const myData = snapshot.val();
        setChatroomId(myData.chatroomId);
      } else {
        console.log('Chatroom does not exist yet', responder.userId);

        const newChatroomRef = push(ref(db, 'chatrooms'), {
          dispatcher: user.currentUser?.uid,
          responder: responder.userId,
          messages: [],
        });
        const newChatroomId = newChatroomRef.key;
        console.log('Added chatroom id', newChatroomId);

        await set(
          ref(
            db,
            `dispatchers/${user.currentUser?.uid}/chatroom/${responder.userId}`,
          ),
          {
            chatroomId: newChatroomId,
          },
        );
        console.log('updated responder chatroom');
        await set(
          ref(
            db,
            `responders/${responder.userId}/chatroom/${user.currentUser?.uid}`,
          ),
          {
            chatroomId: newChatroomId,
          },
        );
        console.log('updated dispatcher chatroom');

        setChatroomId(newChatroomId);
      }
    };
    if (user.currentUser) {
      checkAndCreateChatroom();
    }
  }, [responder.userId, user.currentUser]);

  useEffect(() => {
    if (chatroomId) {
      const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
      const handleNewMessages = snapshot => {
        const data = snapshot.val();
        if (data && data.messages) {
          setMessages(
            data.messages.reverse().map((msg, idx) => ({
              ...msg,
              _id: Math.round(Math.random() * 100000),
              user: {
                _id: msg.sender,
                name:
                  msg.sender === user.currentUser?.uid
                    ? user.currentUser?.displayName
                    : 'Dispatcher',
                avatar: '../../imgs/responder1.png',
              },
            })),
          );
        }
      };

      onValue(chatroomRef, handleNewMessages);
      return () => {
        off(chatroomRef, 'value', handleNewMessages);
      };
    }
  }, [chatroomId, user.currentUser]);

  const onSend = useCallback(
    async (msg = []) => {
      if (!chatroomId || !msg.length) {
        return;
      }

      const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
      const snapshot = await get(chatroomRef);
      const oldMsgs = snapshot.val().messages || [];

      const newMsg = {
        _id: new Date().getTime().toString(),
        text: msg[0].text,
        sender: user.currentUser?.uid,
        createdAt: new Date(),
      };

      const updatedMessages = [...oldMsgs, newMsg];

      update(chatroomRef, {
        messages: updatedMessages,
      });

      console.log('chatroom 2', chatroomId);
      setMessages(prevMsgs => GiftedChat.append(prevMsgs, msg));

      //       const newMsg = {
      //         _id: new Date().getTime().toString(),
      //         text: msg[0].text,
      //         sender: user.currentUser?.uid,
      //         createdAt: new Date().toISOString(),
      //         user: {

      //         }
      //       };

      //       const updatedMessages = [...oldMsgs, newMsg];

      //       update(chatroomRef, {
      //         messages: updatedMessages,
      //       });

      //       setMessages(prevMessages => GiftedChat.append(prevMessages, newMsg));
      //       setMessages(previousMessages =>
      //         GiftedChat.append(previousMessages, [
      //           {
      //             _id: newMsg._id,
      //             text: newMsg.text,
      //             createdAt: new Date(newMsg.createdAt),
      //             user: {
      //               _id: newMsg.sender,
      //               name: user.currentUser?.displayName,
      //             },
      //           },
      //         ]),
      //       );
    },
    [chatroomId, user.currentUser?.uid],
  );

  const renderSend = props => {
    return (
      <Send {...props}>
        <View style={styles.sendingContainer}>
          <Button title="send" color="#007AFF" />
        </View>
      </Send>
    );
  };

  return (
    <>
      <TouchableOpacity onPress={goBack} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <GiftedChat
        messages={messages}
        onSend={msg => onSend(msg)}
        user={{
          _id: user.currentUser?.uid,
          name: user.currentUser?.displayName,
        }}
        //       renderSend={renderSend}
        alwaysShowSend
      />
    </>
  );
};

const styles = StyleSheet.create({
  sendingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  back: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007BFF', // Button background color
    borderRadius: 10, // Rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // For Android shadow
  },
  backText: {
    color: '#fff', // Text color
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatScreen;
