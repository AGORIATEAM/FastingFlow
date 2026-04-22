import { Tabs } from 'expo-router';
import { Timer, BookOpen, BarChart2, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3DB4F2',
        tabBarInactiveTintColor: '#F5F7FA80',
        tabBarStyle: {
          backgroundColor: '#0A1F3D',
          borderTopColor: '#3DB4F220',
        },
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
