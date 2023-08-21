export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PublicUserData {
  displayName: string;
  email: string;
  [key: string]: any;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserChatRoomData {
  id: string;
  name: string;
  room: string;
}

export interface JwtDecodedUser {
  displayName: string;
  email: string;
  exp: number;
  iat: number;
}
