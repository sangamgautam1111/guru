import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, BookOpen, Heart } from 'lucide-react-native';
import { TabState } from '../types';

interface BottomTabBarProps {
  activeTab: TabState;
  onTabChange: (tab: TabState) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('home')}>
        <Home size={20} color={activeTab === 'home' ? '#ffffff' : '#71717a'} />
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('revision')}>
        <BookOpen size={20} color={activeTab === 'revision' ? '#ffffff' : '#71717a'} />
        <Text style={[styles.tabLabel, activeTab === 'revision' && styles.tabLabelActive]}>Browse</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('donate')}>
        <Heart size={20} color={activeTab === 'donate' ? '#ffffff' : '#71717a'} />
        <Text style={[styles.tabLabel, activeTab === 'donate' && styles.tabLabelActive]}>Guru Dakshina</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 52 : 26,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 9.5,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default BottomTabBar;
