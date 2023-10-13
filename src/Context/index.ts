import * as React from 'react';

export type AppContextType = {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string;
  signIn: (data: any) => void;
  signOut: () => undefined;
  signUp: () => undefined;
};

const AppContext = React.createContext<AppContextType>({
  isLoading: false,
  isSignout: true,
  userToken: '',
  signIn: () => undefined,
  signOut: () => undefined,
  signUp: () => undefined,
});

export default AppContext;
