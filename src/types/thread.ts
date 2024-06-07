import { DateTime, DateTimeEntity } from "./common";
import { UserResponse } from "./user";

export type ThreadEntity = DateTimeEntity & {
  thread_id: number;
  type: number;
  text: string | undefined;
  user_id: number;
};

export type ThreadReplyEntity = {
  main_id: number;
  reply_id: number;
};

export type ThreadImageEntity = {
  thread_id: number;
  image_id: number;
};

export enum ThreadType {
  POST,
  COMMENT,
  REPLY,
}

export type ThreadOverviewResponse = {
  favorite: {
    count: number;
    isFavorited: boolean;
  };
  reply: {
    count: number;
  };
};

export type Thread = {
  threadId: number;
  text: string;
  imageUrls: string[];
} & DateTime;

export type ThreadContentResponse = Thread;

export type ThreadResponse = {
  content: ThreadContentResponse;
  user: UserResponse;
  overview: ThreadOverviewResponse;
};

export type PostThreadRequest = Pick<Thread, "text" | "imageUrls"> & {
  type: number;
  mainId: number | undefined;
};
