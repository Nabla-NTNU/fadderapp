import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

import { Alert } from 'react-native';



export default function FeedScreen() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  const [filter, setFilter] = useState<
    'all' | 'event' | 'post' | 'public' | 'group'
  >('all');
  const [creating, setCreating] = useState(false);

  const [content, setContent] = useState('');
  const [type, setType] = useState<'post' | 'event'>('post');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'group'>('group');

  const [isOfficial, setIsOfficial] = useState(false);
  const [pinned, setPinned] = useState(false);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    setPosts(data || []);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    setComments(data || []);
  };

  useEffect(() => {
    fetchPosts();
    fetchComments();

    supabase.getChannels().forEach((ch) => supabase.removeChannel(ch));

    const channel = supabase
      .channel('realtime-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        fetchPosts
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        fetchComments
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  if (!user) return null;

  const createPost = async () => {
    if (!content) return;

    await supabase.from('posts').insert([
      {
        content,
        author: user.name,
        type,
        date: type === 'event' ? date : null,
        location: type === 'event' ? location : null,
        visibility,
        group: visibility === 'group' ? user.group : null,
        is_official: user.role === 'admin' ? isOfficial : false,
        pinned:
          user.role === 'admin' || user.role === 'fadder'
            ? pinned
            : false,
      },
    ]);

    setCreating(false);
    setContent('');
    setDate('');
    setLocation('');
    setPinned(false);
    setIsOfficial(false);

    fetchPosts();
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === 'all') return true;

    if (filter === 'post') return post.type === 'post';

    if (filter === 'public') return post.visibility === 'public';

    if (filter === 'group')
      return post.visibility === 'group' && post.group === user.group;

    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.pinned) return -1;
    if (b.pinned) return 1;
    if (a.is_official) return -1;
    if (b.is_official) return 1;
    return 0;
  });

  return (
    <View style={styles.container}>


      <View style={styles.header}>
        <Text style={styles.miniLabel}>Velkommen, {user.name}!</Text>
        <Text style={styles.title}>Feed</Text>
        <Text style={styles.miniLabel}>Alt samlet på ett sted</Text>
      </View>


      <Pressable
        style={styles.createButton}
        onPress={() => setCreating(!creating)}
      >
        <Text style={{ color: '#fff' }}>+ Lag innlegg</Text>
      </Pressable>


      {creating && (
        <View style={styles.box}>
          <TextInput
            placeholder="Hva skjer?"
            placeholderTextColor={'#666'}
            value={content}
            onChangeText={setContent}
            style={styles.input}
            selectionColor={"#000"}
          />

          <View style={styles.row}>
            <Pressable
              onPress={() => setType('post')}
              style={[
                styles.select,
                type === 'post' && styles.activeSelect,
              ]}
            >
              <Text style={{ color: type === 'post' ? '#fff' : '#000' }}>
                Post
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setType('event')}
              style={[
                styles.select,
                type === 'event' && styles.activeSelect,
              ]}
            >
              <Text style={{ color: type === 'event' ? '#fff' : '#000' }}>
                Event
              </Text>
            </Pressable>
          </View>

          {type === 'event' && (
            <>
              <TextInput
                placeholder="Tid"
                placeholderTextColor={'#666'}
                value={date}
                onChangeText={setDate}
                style={styles.input}
                selectionColor={"rgb(0, 0, 0)"}
                autoCorrect={false}
              />
              <TextInput
                placeholder="Sted"
                placeholderTextColor={'#666'}
                value={location}
                onChangeText={setLocation}
                style={styles.input}
                selectionColor={"rgb(0, 0, 0)"}
              />
            </>
          )}

          <View style={styles.row}>
            <Pressable
              onPress={() => setVisibility('group')}
              style={[
                styles.select,
                visibility === 'group' && styles.activeSelect,
              ]}
            >
              <Text style={{ color: visibility === 'group' ? '#fff' : '#000' }}>
                Gruppe
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setVisibility('public')}
              style={[
                styles.select,
                visibility === 'public' && styles.activeSelect,
              ]}
            >
              <Text style={{ color: visibility === 'public' ? '#fff' : '#000' }}>
                Offentlig
              </Text>
            </Pressable>
          </View>

          {(user.role === 'admin' || user.role === 'fadder') && (
            <Pressable onPress={() => setPinned(!pinned)}>
              <Text>Pinned: {pinned ? 'Ja' : 'Nei'}</Text>
            </Pressable>
          )}

          {user.role === 'admin' && (
            <Pressable onPress={() => setIsOfficial(!isOfficial)}>
              <Text>Offisiell: {isOfficial ? 'Ja' : 'Nei'}</Text>
            </Pressable>
          )}

          <Pressable style={styles.createButton} onPress={createPost}>
            <Text style={{ color: '#fff' }}>Publiser</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.filters}>
        <Pressable onPress={() => setFilter('all')}>
          <Text style={[styles.filter, filter === 'all' && styles.activeFilter]}>
            Alle
          </Text>
        </Pressable>

        <Pressable onPress={() => setFilter('post')}>
          <Text style={[styles.filter, filter === 'post' && styles.activeFilter]}>
            📝Posts
          </Text>
        </Pressable>

        <Pressable onPress={() => setFilter('public')}>
          <Text style={[styles.filter, filter === 'public' && styles.activeFilter]}>
            🌍 Offentlig
          </Text>
        </Pressable>

        <Pressable onPress={() => setFilter('group')}>
          <Text style={[styles.filter, filter === 'group' && styles.activeFilter]}>
            🔒 Min gruppe
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={sortedPosts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              item.pinned && styles.pinnedCard,
              item.is_official && styles.importantCard,
            ]}
          >
            <View style={styles.row}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/100' }}
                style={styles.avatar}
              />

              <View style={{ flex: 1 }}>
                {item.pinned && (
                  <Text style={styles.pinnedBadge}>PINNED</Text>
                )}

                {item.is_official && (
                  <Text style={styles.badge}>OFFISIELT</Text>
                )}

                <Text style={styles.author}>{item.author}</Text>
                <Text>{item.content}</Text>
                {(user.role === 'admin' || user.role === 'fadder') && (
                  <Pressable
                    onPress={async () => {
                      Alert.alert(
                        'Slett kommentar?',
                        'Dette kan ikke angres',
                        [
                          { text: 'Avbryt', style: 'cancel' },
                          {
                            text: 'Slett',
                            style: 'destructive',
                            onPress: async () => {
                              await supabase
                                .from('posts')
                                .delete()
                                .eq('id', item.id);

                              fetchPosts(); // 🔥 refresh
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: 'red', marginTop: 6 }}>
                      🗑️ Slett innlegg
                    </Text>
                  </Pressable>
                )}

                {item.type === 'event' && (
                  <Text style={styles.eventInfo}>
                    {item.date} • {item.location}
                  </Text>
                )}
                <View style={styles.tagsRow}>
                  <Text style={styles.tag}>
                    {item.type === 'event' ? '📅 Event' : '📝 Post'}
                  </Text>

                  <Text style={styles.tag}>
                    {item.visibility === 'public'
                      ? '🌍 Offentlig'
                      : `🔒 ${item.group}`}
                  </Text>
                </View>

                {comments
                  .filter(
                    (c) => String(c.post_id) === String(item.id)
                  )
                  .map((c) => (
                    <View key={c.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.comment}>
                        <Text style={{ fontWeight: 'bold' }}>
                          {c.author}:{' '}
                        </Text>
                        {c.content}
                      </Text>

                      {(user.role === 'admin' || user.role === 'fadder') && (
                        <Pressable
                          onPress={() => {
                            Alert.alert(
                              'Slett kommentar?',
                              'Dette kan ikke angres',
                              [
                                { text: 'Avbryt', style: 'cancel' },
                                {
                                  text: 'Slett',
                                  style: 'destructive',
                                  onPress: async () => {
                                    await supabase
                                      .from('comments')
                                      .delete()
                                      .eq('id', c.id);
                                  
                                    fetchComments();
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Text style={{ color: 'red' }}>❌</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}

  
                <View style={styles.commentRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newComment[item.id] || ''}
                    onChangeText={(text) =>
                      setNewComment((prev) => ({
                        ...prev,
                        [item.id]: text,
                      }))
                    }
                  />

                  <Pressable
                    style={styles.sendButton}
                    onPress={async () => {
                      if (!newComment[item.id]) return;

                      await supabase.from('comments').insert([
                        {
                          post_id: String(item.id),
                          author: user.name,
                          content: newComment[item.id],
                        },
                      ]);

                      setNewComment((prev) => ({
                        ...prev,
                        [item.id]: '',
                      }));
                    }}
                  >
                    <Text style={{ color: '#fff' }}>Send</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },

  logo: {
    width: 120,
    height: 40,
  },

  header: { marginBottom: 12 },
  miniLabel: { color: '#888', fontSize: 12 },
  title: { fontSize: 20, fontWeight: 'bold' },

  createButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },

  box: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },

  input: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    color: '#000',
  },

  row: { flexDirection: 'row', gap: 10 },

  select: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 8,
  },

  activeSelect: {
    backgroundColor: '#000',
  },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },

  pinnedCard: {
    borderWidth: 1,
    borderColor: '#3b82f6',
  },

  importantCard: {
    borderWidth: 1,
    borderColor: '#ff4d4d',
  },

  pinnedBadge: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },

  badge: {
    color: '#ff4d4d',
    fontWeight: 'bold',
  },

  author: { fontWeight: 'bold' },

  eventInfo: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },

  comment: {
    fontSize: 12,
    marginTop: 4,
  },

  commentRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },

  sendButton: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 1,
    marginBottom: 9,
  },

  filter: {
    backgroundColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  activeFilter: {
    backgroundColor: '#000',
    color: '#fff',
  },
  visibility: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },

  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    color: '#333',
  },
});


