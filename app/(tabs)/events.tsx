import { supabase } from '../../src/lib/supabase';

import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function EventsScreen() {
  const { user } = useAuth();
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'group' | 'public'>('all');

  const [events, setEvents] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);

  const [attending, setAttending] = useState<{
    [key: string]: 'going' | 'not-going' | null;
  }>({});

  // 🔥 FETCH EVENTS
  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('type', 'event')
      .eq('is_official', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('FEIL EVENTS:', error);
      return;
    }

    setEvents(data || []);
  };

  // 🔥 FETCH ATTENDEES
  const fetchAttendees = async () => {
    const { data } = await supabase
      .from('attendees')
      .select('*');

    setAttendees(data || []);
  };

  useEffect(() => {
    fetchEvents();
    fetchAttendees();
  }, []);

  // 🔒 safety AFTER hooks
  if (!user) return null;

  // 🔥 FILTER
  const visibleEvents = events.filter((e) => {
    if (e.type !== 'event') return false;
    if (!e.is_official) return false;

    // 🔥 filter-knapp
    if (visibilityFilter === 'group') {
      return e.group === user.group;
    }

    if (visibilityFilter === 'public') {
      return e.visibility === 'public';
    }

    // default = all
    if (e.visibility === 'public') return true;
    return e.group === user.group;
  });

  // 🔥 SORT
  const sortedEvents = [...visibleEvents].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <View style={styles.filters}>
        <Pressable onPress={() => setVisibilityFilter('all')}>
          <Text style={[
            styles.filter,
            visibilityFilter === 'all' && styles.activeFilter
          ]}>
            Alle
          </Text>
        </Pressable>
        
        <Pressable onPress={() => setVisibilityFilter('group')}>
          <Text style={[
            styles.filter,
            visibilityFilter === 'group' && styles.activeFilter
          ]}>
            🔒 Min gruppe
          </Text>
        </Pressable>
        
        <Pressable onPress={() => setVisibilityFilter('public')}>
          <Text style={[
            styles.filter,
            visibilityFilter === 'public' && styles.activeFilter
          ]}>
            🌍 Offentlig
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={sortedEvents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const status = attending[item.id];

          // 🔥 attendees for dette eventet
          const eventAttendees = attendees.filter(
            (a) => String(a.event_id) === String(item.id)
          );

          const goingList = eventAttendees.filter(
            (a) => a.status === 'going'
          );

          // 👉 sorter så du vises først
          const names = goingList
            .map((a) => a.user_name)
            .sort((a) => (a === user.name ? -1 : 1));

          const visibleNames = names.slice(0, 5);
          const remaining = names.length - 5;

          return (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.content}</Text>

              <Text style={styles.meta}>
                <Text style={styles.boldDate}>{item.date}</Text> • {item.location}
              </Text>

              {/* TAGS */}
              <View style={styles.tagsRow}>
                <Text style={styles.tag}>📅 Event</Text>

                <Text style={styles.tag}>
                  {item.visibility === 'public'
                    ? '🌍 Offentlig'
                    : `🔒 ${item.group}`}
                </Text>
              </View>

              {/* ACTIONS */}
              <View style={styles.actions}>
                <Pressable
                  style={[
                    styles.button,
                    status === 'going' && styles.activeButton,
                  ]}
                  onPress={async () => {
                    const newStatus =
                      status === 'going' ? null : 'going';

                    setAttending((prev) => ({
                      ...prev,
                      [item.id]: newStatus,
                    }));

                    await supabase.from('attendees').upsert(
                      [
                        {
                          event_id: item.id,
                          user_name: user.name,
                          status: newStatus,
                        },
                      ],
                      {
                        onConflict: 'event_id,user_name',
                      }
                    );

                    fetchAttendees();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      status === 'going' && styles.activeText,
                    ]}
                  >
                    Skal
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.button,
                    status === 'not-going' && styles.activeButton,
                  ]}
                  onPress={async () => {
                    const newStatus =
                      status === 'not-going'
                        ? null
                        : 'not-going';

                    setAttending((prev) => ({
                      ...prev,
                      [item.id]: newStatus,
                    }));

                    await supabase.from('attendees').upsert(
                      [
                        {
                          event_id: item.id,
                          user_name: user.name,
                          status: newStatus,
                        },
                      ],
                      {
                        onConflict: 'event_id,user_name',
                      }
                    );

                    fetchAttendees();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      status === 'not-going' &&
                        styles.activeText,
                    ]}
                  >
                    Skal ikke
                  </Text>
                </Pressable>
              </View>

              {/* STATUS */}
              <Text style={styles.attending}>
                {status === 'going'
                  ? '✅ Du skal'
                  : status === 'not-going'
                  ? '❌ Du skal ikke'
                  : '— Ikke svart'}
              </Text>

              {/* 👥 ANTALL */}
              <Text style={styles.attending}>
                👥 {names.length} skal
              </Text>

              {/* 👇 NAVN + +X */}
              <Text style={styles.attending}>
                {names.length === 0
                  ? 'Ingen enda'
                  : `${visibleNames.join(', ')}${
                      remaining > 0 ? ` +${remaining}` : ''
                    }`}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },

  eventTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  meta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },

  button: {
    backgroundColor: '#ffffffac',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  buttonText: {
    color: '#000',
  },

  activeButton: {
    backgroundColor: '#000',
  },

  activeText: {
    color: '#fff',
  },

  attending: {
    marginTop: 6,
    fontSize: 12,
    color: '#555',
  },

  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },

  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
  },
  boldDate: {
    fontWeight: 'bold',
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
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
});