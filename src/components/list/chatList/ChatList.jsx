import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore"; 
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
    // sort chat list
    const [chats, setChats] = useState([]);
    // add friend
    const [addMode, setAddMode] = useState(false);
    // search chat
    const [input, setInput] = useState("");

    const { currentUser } = useUserStore();
    const { chatId, changeChat } = useChatStore();

    useEffect(() => {
        const unSub = onSnapshot(
            doc(db, "userchats", currentUser.id), 
            async (res) => {
                // fetch chat data
                const items = res.data().chats;
                // for each chat, fetch user info
                const promises = items.map( async (item) => {
                    const userDocRef = doc(db, "users", item.receiverId);
                    const userDocSnap = await getDoc(userDocRef);
                    const user = userDocSnap.data();
                    return {...item, user};
            });
            // resolve the promises
            const chatData = await Promise.all(promises);
            // sort by descending time order
            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });

        return () => unSub();
    }, [currentUser.id]);

    const handleSelect = async (chat) => {
        const userChats = chats.map((item) => {
            const {user, ...rest} = item;
            return rest;
        });
        // select the current chat and mark it as read
        const chatIndex = userChats.findIndex(
            (item) => item.chatId === chat.chatId
        );
        userChats[chatIndex].isSeen = true;
        // update the current user's record
        const userChatsRef = doc(db, "userchats", currentUser.id);
        try {
            await updateDoc(userChatsRef, {
               chats: userChats, 
            });
            changeChat(chat.chatId, chat.user);
        } catch (err) {
            console.log(err);
        }
        
    }
    // filter the chat list by search bar input
    const filteredChats = chats.filter(
        (c) => c.user.username.toLowerCase().includes(input.toLowerCase())
    );
    
    return (
        <div className="chatList">
            <div className="search">
                <div className="searchBar">
                    <img src="./search.png" alt="" />
                    <input 
                        type="text" 
                        placeholder="Search chat"
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <img className="add" src={addMode ? "./minus.png" : "./plus.png"} alt="" 
                onClick={() => setAddMode(prev => !prev)}/>
            </div>
            
            {filteredChats.map((chat) =>(
                <div 
                    className="dialog" 
                    key={chat.chatId} 
                    onClick={()=>handleSelect(chat)}
                    style={{backgroundColor: chat?.isSeen ? "transparent" : "#5183fe"}}
                >
                    <img src={ chat.user.blocked.includes(currentUser.id) 
                        ? "./avatar.png"
                        : chat.user.avatar || "./avatar.png"} 
                        alt="" 
                    />
                    <div className="message">
                        <span>{ chat.user.blocked.includes(currentUser.id) 
                        ? "User"
                        : chat.user.username}
                        </span>
                        <p>{chat.lastMessage}</p>
                    </div> 
                </div>
            ))}
            
            {addMode && <AddUser/>} 
        </div>
    );
}

export default ChatList;