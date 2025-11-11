import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface User {
  token: string;
  refreshToken?: string;
  email: string;
  username?: string;
}

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logoutUser: (state) => {
      state.user = null;
      localStorage.removeItem('user');
      localStorage.removeItem('userDetailEnabled');
      localStorage.removeItem('companyDetailEnabled');
      localStorage.removeItem('userDetailId');
      localStorage.removeItem('companyDetailId');
      localStorage.removeItem('projectDetailEnabled');
      localStorage.removeItem('projectDetailId');
    },
    updateUserRedux: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { loginUser, logoutUser, updateUserRedux } = userSlice.actions;
export default userSlice.reducer;
