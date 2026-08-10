import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRouter({children}) {
    const {user} = useAuth()

    if (!user) {
        return <Navigate to="/register"/>



    }
    return children
}
export default PrivateRouter