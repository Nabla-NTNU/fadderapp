import { createContext, useContext, useState } from 'react';

type Friend = {
  id: string;
  name: string;
  group: string;
  year: string;
  role?: 'student' | 'fadder' | 'admin';
};

type FriendsContextType = {
  friends: Friend[];
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
};

const FriendsContext = createContext<FriendsContextType | null>(null);

export function FriendsProvider({ children }: any) {
  const [friends, setFriends] = useState<Friend[]>([]);

    const addFriend = (friend: Friend) => {
      setFriends((prev) => {
        const exists = prev.find((f) => f.id === friend.id);
    
        if (exists) {
          return prev.map((f) =>
            f.id === friend.id ? friend : f
          );
        }
    
        return [...prev, friend];
      });
    };

  const removeFriend = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <FriendsContext.Provider value={{ friends, addFriend, removeFriend }}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (!context) throw new Error('useFriends must be used inside provider');
  return context;
}