import React from 'react';
import { View, Text, Image, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { logoSource } from '../constants/storage';

export const BootScreen: React.FC = () => {
  return (
    <View style={styles.bootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.bootCenter}>
        <Image source={logoSource} style={styles.bootLogo} resizeMode="contain" />
        <Text style={styles.bootTitle}>Guru · गुरु</Text>
        <ActivityIndicator size="small" color="#ffffff" style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootCenter: {
    alignItems: 'center',
    gap: 14,
  },
  bootLogo: {
    width: 68,
    height: 68,
    marginBottom: 6,
  },
  bootTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default BootScreen;
