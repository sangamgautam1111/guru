import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import { User, GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { UserProfile } from '../types';
import { logoSource } from '../constants/storage';

interface OnboardingScreenProps {
  user: UserProfile | null;
  onRegister: (profile: UserProfile, isEditing: boolean) => void;
  onBackToApp?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  user,
  onRegister,
  onBackToApp,
}) => {
  const isEditing = !!user?.name;
  const [name, setName] = useState(user?.name || '');
  const [school, setSchool] = useState(user?.school || '');

  const handleContinue = () => {
    if (!name.trim()) return;
    onRegister(
      {
        name: name.trim(),
        school: school.trim() || 'Community School',
      },
      isEditing
    );
  };

  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView
        style={styles.darkContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.onboardingContent} showsVerticalScrollIndicator={false}>
          {/* Top Navigation Back Button if Editing */}
          {isEditing && onBackToApp && (
            <View style={{ width: '100%', marginBottom: 12 }}>
              <TouchableOpacity
                style={styles.editProfileBackBtn}
                activeOpacity={0.8}
                onPress={onBackToApp}
              >
                <ArrowLeft size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.editProfileBackText}>Back to App</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.brandHero}>
            <Image source={logoSource} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.brandTitle}>Guru</Text>
            <Text style={styles.brandSub}>
              {isEditing ? 'Edit Student Profile' : 'Offline AI Tutor'}
            </Text>
          </View>

          <View style={styles.formCard}>
            {/* 1. Full Name */}
            <View style={styles.formItem}>
              <View style={styles.inputLabelRow}>
                <User size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>Student Full Name</Text>
              </View>
              <TextInput
                style={styles.darkInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sangam Gautam"
                placeholderTextColor="#71717a"
              />
            </View>

            {/* 2. School Name */}
            <View style={styles.formItem}>
              <View style={styles.inputLabelRow}>
                <GraduationCap size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>School Name</Text>
              </View>
              <TextInput
                style={styles.darkInput}
                value={school}
                onChangeText={setSchool}
                placeholder="e.g. Shree Secondary School"
                placeholderTextColor="#71717a"
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.primaryButton, !name.trim() && styles.primaryButtonDisabled]}
              disabled={!name.trim()}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <ArrowRight size={19} color="#000000" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  onboardingContent: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 36 : 60,
    paddingBottom: 40,
  },
  editProfileBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  editProfileBackText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandLogo: {
    width: 76,
    height: 76,
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a1a1aa',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  formCard: {
    backgroundColor: '#121215',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#27272a',
    gap: 18,
  },
  formItem: {
    gap: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  darkInput: {
    height: 54,
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#27272a',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#ffffff',
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.35,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
});

export default OnboardingScreen;
