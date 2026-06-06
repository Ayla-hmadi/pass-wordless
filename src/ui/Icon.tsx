import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface IconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
