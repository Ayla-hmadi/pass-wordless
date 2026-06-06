import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricInfo {
  available: boolean;
  enrolled: boolean;
  label: string;
}

export async function getBiometricInfo(): Promise<BiometricInfo> {
  const available = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  let label = 'Biometrics';
  if (
    types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    )
  ) {
    label = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
  } else if (
    types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
  ) {
    label = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }

  return { available, enrolled, label };
}
