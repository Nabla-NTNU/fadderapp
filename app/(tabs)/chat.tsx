import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useFriends } from '../../src/context/FriendsContext';

export default function ChatScreen() {
  const { friends, addFriend } = useFriends();
  const { user } = useAuth();

  const groupNames: { [key: string]: string } = {
    'Gruppe 1': 'Bånn Gauss ⚡',
    'Gruppe 2': 'Fluxus Fellen 😎',
    'Gruppe 3': 'Epsilon > Full 🧠',
  };

  const [groups, setGroups] = useState<any[]>([]);
  const [messages, setMessages] = useState<any>({});
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [assigning, setAssigning] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [selectedFadders, setSelectedFadders] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleAssignUser = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const toggleAdmin = (id: string) => {
    setSelectedAdmins(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleFadder = (id: string) => {
    setSelectedFadders(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 👥 AUTO GROUPS
  const groupChatsMap: { [key: string]: any } = {};

  friends.forEach(f => {
    if (!f.group) return;

    if (!groupChatsMap[f.group]) {
      groupChatsMap[f.group] = {
        id: `fadder-${f.group}`,
        name: `${groupNames[f.group] || f.group}`,
        isGroup: true,
        members: [],
      };
    }

    groupChatsMap[f.group].members.push(f);
  });

  const allGroupChats = Object.values(groupChatsMap);

  const groupChats =
    user.role === 'admin'
      ? allGroupChats
      : allGroupChats.filter((g: any) =>
          g.members.some((m: any) => m.id === user.id)
        );

  const chats = [
    ...groupChats,
    ...groups.map(g => ({
      id: g.id,
      name: g.name,
      isGroup: true,
      members: g.members || [],
    })),
    ...friends.map(f => ({
      id: f.id,
      name: f.name,
      group: f.group,
      year: f.year,
      role: f.role,
    })),
  ];

  const flatListRef = useRef<FlatList>(null);
  const currentMessages = messages[selectedChat || ''] || [];

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [currentMessages]);

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        {!selectedChat ? (
          <>
            <Text style={styles.title}>Chat</Text>

            <Pressable
              style={styles.newGroupButton}
              onPress={() => {
                setCreatingGroup(!creatingGroup);
                setAssigning(false);
              }}
            >
              <Text style={styles.newGroupText}>+ Ny gruppe</Text>
            </Pressable>

            {user.role === 'admin' && (
              <Pressable
                style={styles.newGroupButton}
                onPress={() => {
                  setAssigning(!assigning);
                  setCreatingGroup(false);
                }}
              >
                <Text style={styles.newGroupText}>Sett faddergruppe</Text>
              </Pressable>
            )}
            {/* CREATE GROUP */}
            {creatingGroup && (
              <View style={styles.createGroupBox}>
                <TextInput
                  placeholder="Gruppenavn..."
                  placeholderTextColor="#666"
                  value={groupName}
                  onChangeText={setGroupName}
                  style={styles.groupInput}
                />

                {friends.map((f) => (
                  <Pressable key={f.id} onPress={() => toggleMember(f.id)}>
                    <Text
                      style={[
                        styles.member,
                        selectedMembers.includes(f.id) && styles.memberSelected,
                      ]}
                    >
                      {f.name}
                    </Text>
                  </Pressable>
                ))}

                <Pressable
                  style={styles.createButton}
                  onPress={() => {
                    if (!groupName.trim()) return;
                  
                    setGroups([
                      ...groups,
                      {
                        id: Date.now().toString(),
                        name: groupName,
                        members: friends.filter((f) =>
                          selectedMembers.includes(f.id)
                        ),
                      },
                    ]);
                  
                    setGroupName('');
                    setSelectedMembers([]);
                    setCreatingGroup(false);
                  }}
                >
                  <Text style={{ color: '#fff' }}>Opprett</Text>
                </Pressable>
              </View>
            )}
            
            {/* ASSIGN */}
            {assigning && (
              <View style={styles.createGroupBox}>
                <Text>Velg gruppe:</Text>
            
                {['Gruppe 1', 'Gruppe 2', 'Gruppe 3'].map((g) => (
                  <Pressable key={g} onPress={() => setSelectedGroup(g)}>
                    <Text
                      style={[
                        styles.member,
                        selectedGroup === g && styles.memberSelected,
                      ]}
                    >
                      {groupNames[g]}
                    </Text>
                  </Pressable>
                ))}

                <Text>Studenter ⚪:</Text>
              
                {friends.map((f) => (
                  <Pressable key={f.id} onPress={() => toggleAssignUser(f.id)}>
                    <Text
                      style={[
                        styles.member,
                        selectedUsers.includes(f.id) && styles.memberSelected,
                      ]}
                    >
                      {f.name}
                    </Text>
                  </Pressable>
                ))}

                <Text>Faddersjefer 🟡:</Text>
              
                {friends.filter(f => f.role === 'admin').map((f) => (
                  <Pressable key={f.id} onPress={() => toggleAdmin(f.id)}>
                    <Text
                      style={[
                        styles.member,
                        selectedAdmins.includes(f.id) && styles.memberSelected,
                      ]}
                    >
                      {f.name}
                    </Text>
                  </Pressable>
                ))}

                <Text>Faddere 🔵:</Text>
              
                {friends.filter(f => f.role === 'fadder').map((f) => (
                  <Pressable key={f.id} onPress={() => toggleFadder(f.id)}>
                    <Text
                      style={[
                        styles.member,
                        selectedFadders.includes(f.id) && styles.memberSelected,
                      ]}
                    >
                      {f.name}
                    </Text>
                  </Pressable>
                ))}

                <Pressable
                  style={styles.createButton}
                  onPress={() => {
                    if (!selectedGroup) return;
                  
                    friends.forEach((f) => {
                      if (selectedUsers.includes(f.id)) {
                        addFriend({ ...f, group: selectedGroup } as any);
                      }
                      if (selectedAdmins.includes(f.id)) {
                        addFriend({ ...f, role: 'admin' } as any);
                      }
                      if (selectedFadders.includes(f.id)) {
                        addFriend({ ...f, role: 'fadder' } as any);
                      }
                    });
                  
                    setAssigning(false);
                    setSelectedUsers([]);
                    setSelectedAdmins([]);
                    setSelectedFadders([]);
                  }}
                >
                  <Text style={{ color: '#fff' }}>Lagre</Text>
                </Pressable>
              </View>
            )}
            {/* CHAT LIST */}
            <FlatList
              data={chats}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.chatItem}
                  onPress={() => setSelectedChat(item.id)}
                >
                  <View>
                    <Text style={styles.chatName}>{item.name}</Text>

                    <Text style={styles.lastMessage}>
                      {messages[item.id]?.slice(-1)[0]?.text ||
                        'Ingen meldinger enda'}
                    </Text>
                  </View>

                  {/* GROUP */}
                  {item.isGroup && (
                    <>
                      <Text style={styles.memberCount}>
                        {(item.members || []).length > 20
                          ? '20+ medlemmer'
                          : `${(item.members || []).length} medlemmer`}
                      </Text>

                      <View style={styles.tags}>
                        {(item.members || []).map((m: any) => (
                          <Text
                            key={m.id}
                            style={[
                              styles.tag,
                              m.role === 'admin' && styles.tagAdmin,
                              m.role === 'fadder' && styles.tagFadder,
                            ]}
                          >
                            {m.name}
                          </Text>
                        ))}
                      </View>
                    </>
                  )}

                  {/* FRIEND */}
                  {!item.isGroup && (
                    <View style={styles.tags}>
                      <Text style={styles.tag}>{item.group}</Text>
                      <Text style={styles.tag}>Kull {item.year}</Text>

                      {item.role === 'admin' && (
                        <Text style={[styles.tag, styles.tagAdmin]}>
                          Faddersjef
                        </Text>
                      )}

                      {item.role === 'fadder' && (
                        <Text style={[styles.tag, styles.tagFadder]}>
                          Fadder
                        </Text>
                      )}
                    </View>
                  )}
                </Pressable>
              )}
            />
          </>
        ) : (
          <>
            {/* CHAT */}
            <View style={styles.chatHeader}>
              <Pressable onPress={() => setSelectedChat(null)}>
                <Text style={styles.back}>←</Text>
              </Pressable>

              <Text style={styles.chatTitle}>
                {chats.find(c => c.id === selectedChat)?.name}
              </Text>
            </View>

            <FlatList
              ref={flatListRef}
              data={currentMessages}
              keyExtractor={(_, i) => i.toString()}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageWrapper,
                    item.fromMe ? styles.alignRight : styles.alignLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      item.fromMe
                        ? styles.myMessage
                        : styles.theirMessage,
                    ]}
                  >
                    <Text
                      style={{
                        color: item.fromMe ? '#fff' : '#000',
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
            />

            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Skriv melding..."
                placeholderTextColor="#666"
                style={styles.input}
              />

              <Pressable
                style={styles.sendButton}
                onPress={() => {
                  if (!input.trim()) return;

                  setMessages(prev => ({
                    ...prev,
                    [selectedChat!]: [
                      ...(prev[selectedChat!] || []),
                      { text: input, fromMe: true },
                    ],
                  }));

                  setInput('');

                  setTimeout(() => {
                    setMessages(prev => ({
                      ...prev,
                      [selectedChat!]: [
                        ...(prev[selectedChat!] || []),
                        { text: 'Heihei!', fromMe: false },
                      ],
                    }));
                  }, 800);
                }}
              >
                <Text style={{ color: '#fff' }}>Send</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },

  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },

  newGroupButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  newGroupText: { color: '#fff', textAlign: 'center' },

  createGroupBox: { marginBottom: 10, gap: 6 },

  createButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  member: {
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 6,
  },

  memberSelected: {
    backgroundColor: '#000',
    color: '#fff',
  },

  chatItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 4,
  },

  chatName: { fontWeight: 'bold' },

  lastMessage: { fontSize: 12, color: '#666' },

  memberCount: { fontSize: 12, color: '#888' },

  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 11,
  },

  tagAdmin: { backgroundColor: '#ffe066' },
  tagFadder: { backgroundColor: '#dbeafe' },

  groupInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#000',
  },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  back: { fontSize: 20, marginRight: 10 },

  chatTitle: { fontWeight: 'bold', fontSize: 16 },

  messageWrapper: { marginBottom: 8, maxWidth: '80%' },

  alignLeft: { alignSelf: 'flex-start' },
  alignRight: { alignSelf: 'flex-end' },

  messageBubble: { padding: 10, borderRadius: 12 },

  myMessage: { backgroundColor: '#000' },
  theirMessage: { backgroundColor: '#e5e5ea' },

  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },

  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#000',
  },

  sendButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});