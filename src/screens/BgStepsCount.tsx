import React, {useState, useEffect} from 'react';
import {View, Text, Alert} from 'react-native';
import BackgroundService from 'react-native-background-actions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {map, filter, scan} from 'rxjs/operators';

setUpdateIntervalForType(SensorTypes.accelerometer, 400);

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const stepCounterTask = async taskDataArguments => {
  const {delay} = taskDataArguments;
  let stepCount = 0;
  let lastAcceleration = 0;
  const STEP_THRESHOLD = 5;
  const STEP_COUNT_THRESHOLD = 3;

  try {
    const subscription = accelerometer
      .pipe(
        map(({x, y, z}) => Math.sqrt(x * x + y * y + z * z)),
        filter(acceleration => acceleration > STEP_THRESHOLD),
        scan((accum, acceleration) => {
          const diff = Math.abs(acceleration - lastAcceleration);
          if (diff > STEP_COUNT_THRESHOLD) {
            accum++;
          }
          lastAcceleration = acceleration;
          return accum;
        }, stepCount),
      )
      .subscribe(
        steps => {
          stepCount = steps;
          AsyncStorage.setItem('StepCount', JSON.stringify(stepCount));
        },
        error => console.log('The sensor is not available', error),
      );

    while (BackgroundService.isRunning()) {
      await sleep(delay);
    }

    subscription.unsubscribe();
  } catch (error) {
    console.error('Background task error:', error);
  }
};

const options = {
  taskName: 'StepCounter',
  taskTitle: 'Step Counter Task',
  taskDesc: 'Counting steps in the background',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'yourSchemeHere://stepcounter',
  parameters: {
    delay: 1000,
  },
};

const StepsApp = () => {
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    const startBackgroundTask = async () => {
      try {
        const isRunning = await BackgroundService.isRunning();
        if (!isRunning) {
          const taskOptions = {
            ...options,
            parameters: {
              delay: 1000,
            },
          };
          await BackgroundService.start(stepCounterTask, taskOptions);
        }
      } catch (error) {
        console.error('Failed to start step counter:', error);
        Alert.alert('Error', 'Failed to start the step counter');
      }
    };

    const fetchStepCount = async () => {
      const value = await AsyncStorage.getItem('StepCount');
      if (value !== null) {
        setStepCount(parseInt(value, 10));
      }
    };

    fetchStepCount();
    startBackgroundTask();
  }, []);

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 20, marginBottom: 20}}>Step Counter</Text>
      <Text style={{fontSize: 36, marginBottom: 20}}>{stepCount}</Text>
    </View>
  );
};

export default StepsApp;
