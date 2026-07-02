import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer as typeof global.Buffer;
}
