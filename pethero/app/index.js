import { registerRootComponent } from "expo";
import App from "./App";

// Voice assistant is disabled in Expo Go because @elevenlabs/react-native
// requires custom native code. Re-enable the ConversationProvider wrapper
// once you switch to a development build or re-integrate the mic feature.
registerRootComponent(App);
