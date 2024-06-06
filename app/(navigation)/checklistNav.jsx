import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Checklist from '../(tabs)/checklist';
import Create from '../(checklist)/create';

const Stack = createStackNavigator();

const ChecklistNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Checklists" component={Checklist} options={{ headerShown: false }}/>
        <Stack.Screen name="Create" component={Create} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default ChecklistNavigation;

