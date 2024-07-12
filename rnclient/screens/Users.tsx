import {GiftedChat} from 'react-native-gifted-chat';
import {getAuth} from 'firebase/auth';
import React, {useCallback, useEffect, useState} from 'react';
import {db} from '../firebase';
import {ref, get, onValue, off, update} from 'firebase/database';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';

const UsersScreen = (persons, onClick) => {
  const user = getAuth();

  const renderPerson = ({person}) => {
        return (
                <TouchableOpacity onPress={() => onClick(person)}>
                        <Text>{person.name}</Text>
                </TouchableOpacity>
        );
  };

  return (
    <View>
        <FlatList
        data={persons}
        renderItem={renderPerson}
        />
    </View>
  );
};

export default UsersScreen;
