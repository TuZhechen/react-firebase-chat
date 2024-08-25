import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { db } from "../../lib/firebase";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc} from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";

const Chat = ({ onInfoClick }) => {
    const [chat, setChat] = useState();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [img, setImg] = useState({
        file: null,
        url: "",
    });

    const { currentUser } = useUserStore();
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = 
        useChatStore();

    const endRef = useRef(null)
    // scroll to the latest message
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior:"smooth" });
    }, []);
    // fetch chat by chatId
    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChat(res.data());
        });
        return () => unSub()
    }, [chatId]);
    // append emoji to the input text
    const handleEmoji = (e) => {
        setText(prev=>prev+e.emoji);
        setOpen(false)
    }
    // when an image is added
    const handleImg = (e) => {
        if(e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]),
            });
        }
    }
    // now it is time to send (to the firestore)!
    const handleSend = async () => {
        if(!img.file && text === "") return;

        let imgUrl = null;

        try {
            // upload the image to the storage
            if(img.file) {
                imgUrl = await upload(img.file);
            }
            // update chat message content
            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion({
                    senderId: currentUser.id,
                    text,
                    createdAt: new Date(),
                    ...(imgUrl && {img: imgUrl}),
                }),
            });
            // update chat doc for each side
            const userIDs = [currentUser.id, user.id];

            userIDs.forEach(async (id) => {
                const userChatsRef = doc(db, "userchats", id);
                const userChatsSnapshot = await getDoc(userChatsRef);
                
                if(userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();
                    // find the chatIndex by matching the selected chatId
                    const chatIndex = userChatsData.chats.findIndex(
                        (c) => c.chatId === chatId
                    );
                    // update the target chat
                    userChatsData.chats[chatIndex].lastMessage = text || "[Image]";
                    userChatsData.chats[chatIndex].isSeen =
                        id === currentUser.id ? true : false;
                    userChatsData.chats[chatIndex].updatedAt = Date.now();

                    // apply the change to corresponding users' chats
                    await updateDoc(userChatsRef, {
                        chats: userChatsData.chats,
                    });
                }
            });

        } catch (err) {
            console.log(err);
        } finally {
            // reset input everytime after sending
            setImg({
                file: null,
                url: "",
            });

            setText("");
        }

    }

    return (
        <div className="chat">
            <div className="top">
                <div className="user">
                    <img src={user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user?.username}</span>
                        <p>Some dummy text</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                    <img src="./info.png" alt="" onClick={onInfoClick}/>
                </div>
            </div>
            <div className="center">
                {chat?.messages?.map((message) => (
                    <div className={
                        // check if the chat message is sent by self
                        message.senderId === currentUser?.id ? "message self" : "message"
                    }
                     key={message?.createAt}
                     >
                        <div className="content">
                            {message.img && <img src={message.img} alt=""/>}
                            {message.text && (<p>{message.text}</p>)}
                            <span></span>
                        </div>
                    </div>
                ))}
                {img.url && (
                    <div className="message self">
                        <div className="content">
                            <img src={img.url} alt="" />
                        </div>
                    </div>
                )}
                
                <div ref={endRef}></div>                                
            </div>
            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="./img.png" alt="" />
                    </label>
                    <input 
                        type="file"
                        id="file"
                        style={{display: "none"}}
                        onChange={handleImg}
                        disabled={isCurrentUserBlocked || isReceiverBlocked}
                    />
                    <img src="./camera.png" alt="" />
                    <img src="./mic.png" alt="" />                    
                </div>
                <input type="text" 
                 placeholder={(isCurrentUserBlocked || isReceiverBlocked)
                    ? "Forbidden"
                    : "Type your message"
                 } 
                 value={text} 
                 onChange={e => setText(e.target.value)}
                 disabled={isCurrentUserBlocked || isReceiverBlocked}
                 />
                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={() => setOpen(prev => !prev)}/>
                    <EmojiPicker className="picker" open={open} onEmojiClick={handleEmoji}/>
                </div>
                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
            </div>
        </div>
    )
}

export default Chat