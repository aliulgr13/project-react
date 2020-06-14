import { createContext } from "react";

export const AuthContext = createContext({
  isLoggedIn: false,
  userId: false,
  token: null,
  login: () => {},
  logout: () => {},
});
