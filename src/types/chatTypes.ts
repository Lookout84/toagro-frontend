export interface User {
    id: string;
    name: string;
    avatar?: string;
    phoneNumber?: string;
    email?: string;
  }
  
  export interface Message {
    id: string;
    content: string;
    sender: User;
    createdAt: string;
  }
  
  export interface Chat {
    id: string;
    participants: User[];
    lastMessage?: {
      content: string;
      createdAt: string;
    };
    messages?: Message[];
  }