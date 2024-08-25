import { doc, getDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "./firebase";
import { useUserStore } from "./userStore";

// chat state management
export const useChatStore = create(
    (set) => ({
        chatId: null,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
        changeChat: (chatId, user) => {
            const currentUser = useUserStore.getState().currentUser;
            // check if current user is blocked
            if(user.blocked.includes(currentUser.id)) {
                return set({
                    chatId,
                    user: null,
                    isCurrentUserBlocked: true,
                    isReceiverBlocked: false,
                });
            }
            // check if receiver is blocked
            if(currentUser.blocked.includes(user.id)) {
                return set({
                    chatId,
                    user: user,
                    isCurrentUserBlocked: false,
                    isReceiverBlocked: true,
                });
            }
            // when both okay, just display
            return set({
                chatId,
                user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
            });
        },
        // toggle the block state of receiver
        changeBlock: () => {
            set(state => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
        }, 

        resetChat: () => {
            set({
                chatId: null,
                user: null,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
            });
        },
    })
);