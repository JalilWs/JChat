import { useContext,createContext,useEffect,useState,useRef } from "react";
import {io} from 'socket.io-client'
import {useAuth} from "./AuthContext"


const SocketContext = createContext()

export const SocketProvider = ({children}) => {
    const {user} = useAuth()
    const [onlineUsers,setOnlineUsers] = useState([])
    const socketRef = useRef(null)

    useEffect(()=>{
        if (!user) {
            if(socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
            return
        }

        const socket = io("http://localhost:3001",{
            query: {userId: user._id}
        })
        socketRef.current = socket

        socket.on("getOnlineUsers", (userIds)=>{
            setOnlineUsers(userIds)
        })
        return ()=> {
            socket.disconnect()
        }
    },[user])


    return (
        <SocketContext.Provider value={{socket: socketRef.current,onlineUsers}}>
            {children}

        </SocketContext.Provider>
    )


}
export const useSocket = () => useContext(SocketContext)