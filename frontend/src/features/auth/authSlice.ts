import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: unknown | null;
  token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
setCredentials: (
  state,
  action: PayloadAction<{ user: unknown; token: string }>
) => {
  state.user = action.payload.user;
  state.token = action.payload.token;
  state.isAuthenticated = true;

  if (typeof window !== 'undefined') {
    localStorage.setItem('token', action.payload.token);
  }
},
logout: (state) => {
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;

  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
},
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
