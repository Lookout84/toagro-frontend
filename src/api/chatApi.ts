import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define or import the Chat type
interface Chat {
  id: string;
  name: string;
  lastMessage?: string;
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Chat'],
  endpoints: (builder) => ({
    getChats: builder.query<Chat[], void>({
      query: () => '/chats',
      providesTags: ['Chat']
    }),
    getChat: builder.query<Chat, string>({
      query: (chatId) => `/chats/${chatId}`,
      providesTags: (result) =>
        result?.id ? [{ type: 'Chat', id: result.id }] : []
    }),
    sendMessage: builder.mutation<void, { chatId: string; content: string }>({
      query: ({ chatId, ...body }) => ({
        url: `/chats/${chatId}/messages`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: 'Chat', id: chatId }
      ]
    })
  })
});

export const { 
  useGetChatsQuery, 
  useGetChatQuery, 
  useSendMessageMutation 
} = chatApi;