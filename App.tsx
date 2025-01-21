import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Button,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

interface User {
  id: number;
  login: string;
  avatar_url: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get('https://api.github.com/search/users?q=followers:%3E10000+sort:followers&per_page=50')
      .then((response) => {
        setUsers(response.data.items);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const requestPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied!', 'You need to grant media permissions to download images.');
      return false;
    }
    return true;
  };

  const downloadImage = async (user: User) => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      // Fetch the image as binary data
      const response = await fetch(user.avatar_url);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Create a unique path to save the image
        const fileUri = FileSystem.documentDirectory + `${user.login}.jpg`;

        // Save the file to the document directory (local storage)
        await FileSystem.writeAsStringAsync(fileUri, base64Image, { encoding: FileSystem.EncodingType.Base64 });

        Alert.alert('Success', `Image for ${user.login} saved at ${fileUri}`);
      };

      reader.readAsDataURL(blob); // This starts the read
    } catch (err) {
      console.error('Failed to download image:', err);
      Alert.alert('Error', `Failed to download image for ${user.login}.`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>Welcome to the Coding Exercise</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            <Text style={styles.username}>{item.login}</Text>
            <Button title="Download Avatar" onPress={() => downloadImage(item)} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  navBar: {
    height: 60,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 4, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  navTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});