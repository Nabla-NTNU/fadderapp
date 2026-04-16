import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <Image
            source={require('../../assets/nabla2.png')}
            style={{ width: 80, height: 60, marginRight: 10 }}
            resizeMode="contain"
          />
        ),
      }}
    >
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}