import { Platform, PlatformIOSStatic } from 'react-native';
export const isIPad = Platform.OS === 'ios' && (Platform as PlatformIOSStatic).isPad;
