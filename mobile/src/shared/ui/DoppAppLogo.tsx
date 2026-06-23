import React from 'react';
import { Image } from 'react-native';

export const DoppAppLogo = ({ width = 100, height = 28 }: { width?: number, height?: number, color?: string }) => {
  return (
    <Image 
      source={require('../../../assets/images/doppapp-logo.webp')}
      style={{ width, height, resizeMode: 'contain' }} 
    />
  );
};
