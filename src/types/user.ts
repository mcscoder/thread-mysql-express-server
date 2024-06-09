import { DateTimeEntity } from "./common";

export type UserEntity = DateTimeEntity & {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  image_id: number;
};

export type UserFollowEntity = DateTimeEntity & {
  current_id: number | undefined;
  target_id: number;
};

export type UserWatchedThreadEntity = DateTimeEntity & {
  user_id: number;
  thread_id: number;
};

export type UserFavoriteThreadEntity = DateTimeEntity & {
  user_id: number;
  thread_id: number;
};

export type User = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
};

export type UserOverview = {
  follow: {
    isFollowing: boolean;
    count: number;
  };
};

export type UserResponse = {
  user: User;
  overview: UserOverview;
};

export type UserLoginRequest = Pick<User, "username"> & {
  password: string;
};
