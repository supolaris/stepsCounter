import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import BackgroundService from 'react-native-background-actions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sleep = (time: any) =>
  new Promise(resolve => setTimeout(() => resolve(), time));

const counterTask = async (taskDataArguments: any) => {
  const {delay, updateCounter} = taskDataArguments;
  let counter = 0;

  try {
    await new Promise(async resolve => {
      for (; BackgroundService.isRunning(); ) {
        console.log(`Counter: ${counter}`);
        updateCounter(counter);
        counter++;
        AsyncStorage.setItem('Counter', JSON.stringify(counter));
        await sleep(delay);
      }
    });
  } catch (error) {
    console.error('Background task error:', error);
  }
};

const options = {
  taskName: 'Counter',
  taskTitle: 'Counter Task',
  taskDesc: 'Counting in the background',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'yourSchemeHere://counter',
  parameters: {
    delay: 1000,
  },
};

const CounterApp = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [counter, setCounter] = useState(0);
  const [counterValue, setCounterValue] = useState(0);

  useEffect(() => {
    const checkIfTaskIsRunning = async () => {
      const running = await BackgroundService.isRunning();
      setIsRunning(running);
    };
    getValue();
    checkIfTaskIsRunning();
  }, [counter]);

  const getValue = async () => {
    const value = await AsyncStorage.getItem('Counter');
    setCounterValue(value);
  };

  const startCounter = async () => {
    try {
      if (!isRunning) {
        setIsRunning(true);
        const taskOptions = {
          ...options,
          parameters: {
            delay: 1000,
            updateCounter: setCounter,
          },
        };
        await BackgroundService.start(counterTask, taskOptions);
      } else {
        Alert.alert('Counter is already running!');
      }
    } catch (error) {
      console.error('Failed to start counter:', error);
      Alert.alert('Error', 'Failed to start the counter');
      setIsRunning(false);
    }
  };

  const stopCounter = async () => {
    try {
      if (isRunning) {
        await BackgroundService.stop();
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to stop counter:', error);
      Alert.alert('Error', 'Failed to stop the counter');
    }
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 20, marginBottom: 20}}>Background Counter</Text>
      <Text style={{fontSize: 36, marginBottom: 20}}>{counter}</Text>
      <Text>val: {counterValue}</Text>
      <TouchableOpacity onPress={startCounter} style={{marginBottom: 20}}>
        <Text>Start Counter</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={stopCounter}>
        <Text>Stop Counter</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CounterApp;
