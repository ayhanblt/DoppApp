import React from 'react';
import { Text as RNText, TextProps, Platform } from 'react-native';

export function Text(props: TextProps) {
  return (
    <RNText
      allowFontScaling={true}
      maxFontSizeMultiplier={1.3}
      {...props}
      style={[
        { fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System' }, // Fallback
        { fontFamily: 'Geist-Regular' }, // Primary default
        Platform.OS === 'android' ? { includeFontPadding: false } : null,
        props.style,
      ]}
    />
  );
}
