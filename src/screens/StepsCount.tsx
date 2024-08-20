import React, {useState, useEffect} from 'react';
import {View, Text} from 'react-native';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {map, filter, scan} from 'rxjs/operators';

setUpdateIntervalForType(SensorTypes.accelerometer, 400);

const StepsCount = () => {
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    let lastAcceleration = 0;
    const STEP_THRESHOLD = 9;
    const STEP_COUNT_THRESHOLD = 3;

    const subscription = accelerometer
      .pipe(
        map(({x, y, z}) => Math.sqrt(x * x + y * y + z * z)),
        filter(acceleration => acceleration > STEP_THRESHOLD),
        scan((accum, acceleration) => {
          const diff = Math.abs(acceleration - lastAcceleration);
          if (diff > STEP_COUNT_THRESHOLD) {
            accum++;
            setStepCount(accum);
          }
          lastAcceleration = acceleration;
          return accum;
        }, 0),
      )
      .subscribe(
        () => {},
        error => {
          console.log('The sensor is not available');
        },
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
      <Text>Step Count: {stepCount}</Text>
    </View>
  );
};

export default StepsCount;
