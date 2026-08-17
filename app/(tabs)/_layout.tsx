import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { BarChart2, BookOpen, Timer, User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/lib/theme';

/** deepBlue at ~72% opacity layered over the blur. */
const TAB_BAR_TINT = `${Colors.deepBlue}B8`;

function TabBarBackground() {
  return (
    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
    </BlurView>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.mutedText,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jeûne',
          tabBarIcon: ({ color, size }) => <Timer stroke={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Apprendre',
          tabBarIcon: ({ color, size }) => <BookOpen stroke={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart2 stroke={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User stroke={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tint: {
    backgroundColor: TAB_BAR_TINT,
  },
});
