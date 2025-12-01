import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Company {
  id: string;
  name: string;
}

interface User {
  token: string;
  refreshToken?: string;
  email: string;
  username?: string;
  role?: string;
  companies?: Company[]; 
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
      localStorage.removeItem('projectRequestDetailEnabled');
      localStorage.removeItem('projectRequestId');
      localStorage.removeItem('ticketDetailEnabled');
      localStorage.removeItem('ticketDetailId');
    },
    updateUserRedux: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    setUserCompanies: (state, action: PayloadAction<Company[]>) => {
      if (state.user) {
        state.user.companies = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { loginUser, logoutUser, updateUserRedux, setUserCompanies } = userSlice.actions;
export default userSlice.reducer;
