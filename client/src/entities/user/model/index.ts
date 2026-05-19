export type UserType = {
  id: number;
  name: string;
  email: string;
  phone: string,
  avatar: string,
  role: 'client' | 'master' | 'admin',
  createdAt: string;
  updatedAt: string;
};


export type UserWithTokenType = {
  user: UserType;
  accessToken: string;
};

export type UserLoginData = {
  email: string;
  password: string;
}

export type UserRegisterData = UserLoginData & {
  name: string
}

export type UserProfileUpdateData = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  avatarFile?: {
    name: string;
    type: string;
    data: string;
  };
}

export type UserStateType = {
  user: UserType | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const initialUserState: UserStateType = {
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false
}
