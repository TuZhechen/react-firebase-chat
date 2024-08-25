import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css"
import { useEffect, useState } from "react";

const Detail = () => {
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, resetChat } = useChatStore();
    const { currentUser } = useUserStore();
    const [sharedPhotos, setSharedPhotos] = useState([]);

    useEffect(() => {
        const fetchSharedPhotos = async () => {
            if(!chatId) return;
            try{
                const chatDoc = await getDoc(doc(db, "chats", chatId));
                if(chatDoc.exists()) {
                    const chatData = chatDoc.data();
                    const photos = chatData.messages
                    // filter messages with images
                    .filter((msg) => msg.img)
                    .map((msg) => ({
                        img: msg.img,
                        text: msg.txt || `${msg.createdAt}.png`
                    }));
                    // apply the fetch result
                    setSharedPhotos(photos);
                }
            } catch (err) {
                console.log("Error fetching shared photos: ", err)
            }
        }

        fetchSharedPhotos();
    }, [chatId]);

    const handleBlock = async () => {
        // if we are blocked
        if(!user) return;
        const userDocRef = doc(db, "users", currentUser.id);

        try {
            // update the block list
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            });
            changeBlock();
        } catch(err) {
            console.log(err);
        }
    }

    const handleLogout = () => {
        auth.signOut();
        resetChat();
    }

    return (
        <div className="detail">
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="" />
                <h2>{user?.username}</h2>
                <p>Some dummy text</p>
            </div>
            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Chat Settings</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Privacy and help</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared photos</span>
                        <img src="./arrowDown.png" alt="" />
                    </div>
                    <div className="photos">
                        {sharedPhotos.map((photo, index) => (
                          <div className="photoItem" key={index}>
                            <div className="photoDetail">
                                <img src={photo.img} alt={photo.text} />
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared Files</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <button onClick={handleBlock}>
                    {
                        isCurrentUserBlocked
                        ? "Sorry, you are blocked..."
                        : isReceiverBlocked
                        ? "This user is blocked!"
                        : "Block User"
                    }
                </button>
                <button className="logout" onClick={handleLogout}>Log out</button>
            </div>
        </div>
    )
}

export default Detail;