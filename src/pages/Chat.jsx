import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import "./Chat.css";

function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { socket, onlineUsers } = useSocket();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [showUserList, setShowUserList] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUsername, setSearchUsername] = useState("");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/conversations");
        setConversations(res.data);
      } catch (err) {
        console.error("فشل جلب المحادثات", err);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${activeConversation._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("فشل جلب الرسائل", err);
      }
    };

    fetchMessages();
  }, [activeConversation]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (newMessage.conversationId === activeConversation?._id) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, activeConversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;

    try {
      const res = await api.post(`/messages/${activeConversation._id}`, {
        text,
      });
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error("فشل إرسال الرسالة", err);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p._id !== user._id);
  };

  const openUserList = async () => {
    try {
      const res = await api.get("/users");
      setAllUsers(res.data);
      setShowUserList(true);
    } catch (err) {
      console.error("فشل جلب المستخدمين", err);
    }
  };

  const startConversation = async (receiverId) => {
    try {
      const res = await api.post("/conversations", { recId: receiverId });

      setConversations((prev) => {
        const exists = prev.some((c) => c._id === res.data._id);
        return exists ? prev : [res.data, ...prev];
      });

      setActiveConversation(res.data);
      setShowUserList(false);
      setSearchUsername("");
    } catch (err) {
      console.error("فشل بدء المحادثة", err);
    }
  };

  const filteredUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(searchUsername.toLowerCase())
  );

  return (
    /* ربط كلاس التنقل بوجود محادثة نشطة */
    <div className={`chat-page ${activeConversation ? "active-chat" : ""}`}>
      {/* الشريط الجانبي */}
      <div className="sidebar">
        <div className="sidebar-header">
          <strong className="sidebar-username">{user?.username}</strong>
          <div className="sidebar-actions">
            <button className="btn btn-ghost" onClick={handleLogout}>
              تسجيل خروج
            </button>
            <button className="btn btn-accent" onClick={openUserList}>
              + محادثة جديدة
            </button>
          </div>
        </div>

        {showUserList && (
          <div className="user-search">
            <input
              type="text"
              autoFocus
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="اكتب اسم المستخدم..."
            />

            {searchUsername && filteredUsers.length === 0 && (
              <p className="user-search-empty">ما فيه مستخدم بهذا الاسم</p>
            )}

            {filteredUsers.map((u) => (
              <div
                key={u._id}
                className="user-search-item"
                onClick={() => startConversation(u._id)}
              >
                {u.username}
              </div>
            ))}
          </div>
        )}

        <div className="conversation-list">
          {conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isActive = activeConversation?._id === conv._id;
            const isOnline = onlineUsers?.includes(other?._id);

            return (
              <div
                key={conv._id}
                className={`conversation-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveConversation(conv)}
              >
                <span className={`avatar-dot ${isOnline ? "online" : ""}`} />
                {other?.username || "مستخدم محذوف"}
              </div>
            );
          })}
        </div>
      </div>

      {/* منطقة الرسائل */}
      <div className="chat-main">
        {!activeConversation ? (
          <div className="chat-empty">اختر محادثة للبدء</div>
        ) : (
          <>
            {/* الهيدر الجديد للمحادثة مضاف إليه زر الرجوع للجوال */}
            <div className="chat-header">
              <button 
                className="back-button" 
                onClick={() => setActiveConversation(null)}
              >
                ←
              </button>
              <strong>{getOtherParticipant(activeConversation)?.username || "محدثة"}</strong>
            </div>

            <div className="messages-area">
              {messages.map((msg) => {
                const isMine = msg.sender === user._id;
                return (
                  <div
                    key={msg._id}
                    className={`message-row ${isMine ? "sent" : "received"}`}
                  >
                    <span
                      className={`message-bubble ${isMine ? "sent" : "received"}`}
                    >
                      {msg.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <form className="message-form" onSubmit={handleSend}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب رسالة..."
              />
              <button type="submit">إرسال</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
