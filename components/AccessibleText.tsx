import React from 'react';
import { Text, TextProps } from 'react-native';

interface AccessibleTextProps extends TextProps {
  children: React.ReactNode;
  accessibilityRole?: 'header' | 'text' | 'button' | 'link';
  accessibilityLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function AccessibleText({ 
  children, 
  accessibilityRole = 'text',
  accessibilityLevel,
  ...props 
}: AccessibleTextProps) {
  const accessibilityProps: any = {
    accessible: true,
    accessibilityRole,
  };

  if (accessibilityRole === 'header' && accessibilityLevel) {
    accessibilityProps.accessibilityLevel = accessibilityLevel;
  }

  return (
    <Text {...props} {...accessibilityProps}>
      {children}
    </Text>
  );
}

interface HeadingProps extends Omit<AccessibleTextProps, 'accessibilityRole'> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({ level, children, ...props }: HeadingProps) {
  return (
    <AccessibleText
      {...props}
      accessibilityRole="header"
      accessibilityLevel={level}
    >
      {children}
    </AccessibleText>
  );
}
