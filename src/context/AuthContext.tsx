import { createContext, useContext, useState } from 'react';

type User = {
  id: string;
  name: string;
  role: 'admin' | 'fadder' | 'student';
  group: string;
};

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<User | null>({  
    id: '4',
    name: 'Sondre Steidel',
    role: 'admin',
    group: 'Gruppe 3',
    });

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}