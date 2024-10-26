// src/features/socket/socketSlice.ts
import { ChatroomModel } from '@/models/chatroom';
import { MessageModel } from '@/models/message';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import MessageService from '../message/messageService';
import { message } from 'antd';
import AbstractPayload from '@/utils/abtractPayloadType';

interface SocketState {
  chatrooms: ChatroomModel[];
  isEstablishingConnection: boolean;
  isConnected: boolean;
}

const initialState: SocketState = {
  chatrooms: [],
  isEstablishingConnection: false,
  isConnected: false,
};

export const fetchMessagesByChatroomId = createAsyncThunk(
  'socket/fetchMessagesByChatroomId',
  async (chatroomId: number, { rejectWithValue }) => {
    try {
      const response = await MessageService.getMessagesByChatroomId(chatroomId);
      return { chatroomId, messages: response.messages };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    startConnecting: (state) => {
      state.isEstablishingConnection = true;
    },
    connectionEstablished: (state) => {
      state.isConnected = true;
      state.isEstablishingConnection = false;
    },
    receiveAllChatrooms: (state, action: PayloadAction<ChatroomModel[]>) => {
      state.chatrooms = action.payload;
    },
    receiveMessage: (
      state,
      action: PayloadAction<{ chatroomId: number; message: MessageModel }>
    ) => {
      const chatroom = state.chatrooms.find(
        (room) => room.id === action.payload.chatroomId
      );
      if (chatroom) {
        chatroom.messages.push(action.payload.message);
      }
    },
    recallMessage: (
      state,
      action: PayloadAction<{ chatroomId: number; message: MessageModel }>
    ) => {
      const chatroom = state.chatrooms.find(
        (room) => room.id === action.payload.chatroomId
      );
      if (chatroom) {
        // Filter out the recalled message from the messages array
        chatroom.messages = chatroom.messages.filter(
          (msg: MessageModel) => msg.id !== action.payload.message.id
        );
      }
    },
    submitMessage: (
      state,
      action: PayloadAction<{ chatroomId: number; message: string }>
    ) => {
      return;
    },
    setChatrooms(state, action: PayloadAction<ChatroomModel[]>) {
      state.chatrooms = action.payload;
    },
    // joinChatroom: (state, action: PayloadAction<ChatroomModel>) => {
    //   const exists = state.chatrooms.find(
    //     (room) => room.id === action.payload.id
    //   );
    //   if (!exists) {
    //     state.chatrooms.push(action.payload);
    //   }
    // },
    // leaveChatroom: (state, action: PayloadAction<number>) => {
    //   state.chatrooms = state.chatrooms.filter(
    //     (room) => room.id !== action.payload
    //   );
    // },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchMessagesByChatroomId.fulfilled,
        (
          state,
          action: PayloadAction<{
            chatroomId: number;
            messages: MessageModel[];
          }>
        ) => {
          const { chatroomId, messages } = action.payload;
          const chatroom = state.chatrooms.find(
            (room) => room.id === chatroomId
          );
          if (chatroom) {
            if (!chatroom.messages) {
              chatroom.messages = [];
            }
            chatroom.messages.push(...messages);
          }
        }
      )
      .addCase(fetchMessagesByChatroomId.rejected, (state, action: any) => {
        const errorMessage = action.payload.mes || 'Failed to fetch messages';
        message.error(errorMessage);
      });
  },
});

export const {
  startConnecting,
  connectionEstablished,
  receiveAllChatrooms,
  submitMessage,
  receiveMessage,
  // joinChatroom,
  // leaveChatroom,
  setChatrooms,
} = socketSlice.actions;

export default socketSlice.reducer;
export type InitStateSocketType = SocketState;
