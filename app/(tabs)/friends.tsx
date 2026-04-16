import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useFriends } from '../../src/context/FriendsContext';
import { users } from '../../src/data/users';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { friends, addFriend, removeFriend } = useFriends();

  // 🔒 safety
  if (!user) return null;

  const [search, setSearch] = useState('');

  const filteredPeople = users.filter((person: any) => {
    const text = search.toLowerCase();

    return (
      person.name.toLowerCase().includes(text) ||
      person.group.toLowerCase().includes(text) ||
      person.year.includes(text)
    );
  });

  const friendIds = friends.map((f) => f.id);

  // ✅ VENNER
  const friendList = users
    .filter((p) => friendIds.includes(p.id))
    .map((p) => {
      const updated = friends.find((f) => f.id === p.id);
      return updated || p;
    });

  // ✅ FORSLAG
  const suggestions = filteredPeople.filter(
    (p) => !friendIds.includes(p.id)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Venner</Text>

      <TextInput
        placeholder="Søk navn, gruppe eller kull..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {friendList.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Dine venner</Text>

          <FlatList
            data={friendList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>

                  <View style={styles.tags}>
                    <Text style={styles.tag}>{item.group}</Text>
                    <Text style={styles.tag}>
                      Kull {item.year}
                    </Text>

                    {item.role === 'fadder' && (
                      <Text style={[styles.tag, styles.tagFadder]}>
                        Fadder
                      </Text>
                    )}

                    {item.role === 'admin' && (
                      <Text style={[styles.tag, styles.tagAdmin]}>
                        Faddersjef
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  style={styles.removeButton}
                  onPress={() => removeFriend(item.id)}
                >
                  <Text>Fjern</Text>
                </Pressable>
              </View>
            )}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>Forslag</Text>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>

              <View style={styles.tags}>
                <Text style={styles.tag}>{item.group}</Text>
                <Text style={styles.tag}>
                  Kull {item.year}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.button}
              onPress={() => addFriend(item as any)}
            >
              <Text style={{ color: '#fff' }}>Legg til</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },

  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },

  search: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    color: '#000',
  },

  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
  },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  name: { fontWeight: 'bold', marginBottom: 4 },

  tags: { flexDirection: 'row', gap: 6 },

  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 11,
  },

  tagAdmin: { backgroundColor: '#ffe066' },
  tagFadder: { backgroundColor: '#dbeafe' },

  button: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  removeButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
});