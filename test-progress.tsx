import React from 'react';
import { View } from 'react-native';
import { ProgressBar } from './src/ui/ProgressBar';

export default function TestProgress() {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <ProgressBar currentStep={0} totalSteps={12} />
      <View style={{ height: 20 }} />
      <ProgressBar currentStep={5} totalSteps={12} />
      <View style={{ height: 20 }} />
      <ProgressBar currentStep={11} totalSteps={12} />
    </View>
  );
}
