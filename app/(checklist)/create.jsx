import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Create = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Item Checklist</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    padding: 15,
  },
});

export default Create;