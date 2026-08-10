import { createContext,useState,useContext } from "react";
import api from "../api/axios"

const AuthContext = createContext()

export const AuthProvider = ({ children }) =>{
    const [user,setUser] = useState(()=>{
        const savedUser = localStorage.getItem('user')
        return savedUser ? JSON.parse(savedUser) :  null
    })
    const login = async (email,password) =>{
        const res = await api.post("/auth/login",{email,password})
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data))
        setUser(res.data)

    }
    const register = async (username,email,password)=>{
        const res = await api.post("/auth/register",{
            username,
            email,
            password,
        })
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data))
        setUser(res.data)
    }
    const logout = async ()=>{
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
    }
    return(
        <AuthContext.Provider value={{user,login,register,logout}}>
            {children}
        </AuthContext.Provider>
    )
    


}
export const useAuth =  ()=> useContext(AuthContext)