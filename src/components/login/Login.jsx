import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore"

import { db, auth } from "../../lib/firebase";
import upload from "../../lib/upload";

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [loading, setLoading] = useState(false);

    const handleAvatar = (e) => {
        if(e.target.files[0]){
            setAvatar({
            file: e.target.files[0],
            url: URL.createObjectURL(e.target.files[0])
            }); 
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);
    
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
          console.log(err);
          toast.error(err.message);
        } finally {
          setLoading(false);
        }
        
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);

        // validate inputs
        if(!username || !email || !password) {
          toast.warn("All field are required!");
          setLoading(false);
          return;
        }
            
        // validate unique username
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if(!querySnapshot.empty) {
          toast.warn("This username has been used! Try another one~");
          setLoading(false);
          return;
        }
          

        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            const imgUrl = await upload(avatar.file);
            await setDoc(doc(db, "users", res.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: res.user.uid,
                blocked: [],
              });
            await setDoc(doc(db, "userchats", res.user.uid), {
                chats: [],
              });
            toast.success("Account created! Try to log in now!");
        } catch(err) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    return  (
    <div className="login">
      <div className="item">
        <h2>Welcome Back</h2>
        <form onSubmit={handleLogin}>
            <input type="text" placeholder="Email" name="email"/>
            <input type="password" placeholder="Password" name="password"/>
            <button disabled={loading}>Log in</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
            <label htmlFor="file">
                <img src={avatar.url || "./avatar.png"} alt="" />
                Upload an image
            </label>
            <input type="file" id="file" style={{display:"none"}} onChange={handleAvatar}/>
            <input type="text" placeholder="Username" name="username"/>
            <input type="text" placeholder="Email" name="email"/>
            <input type="password" placeholder="Password" name="password"/>
            <button disabled={loading}>Sign up</button>
        </form>
      </div>
    </div>
    );
};

export default Login;