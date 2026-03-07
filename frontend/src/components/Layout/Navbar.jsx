import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAvatarUrl } from "../../services/useAvatarUrl";
import "../../assets/styling/navbar.css";
import { FiSettings } from "react-icons/fi";
import skillForgeLogo from "../../assets/img/skill_forge_logo.png";
import { useAuth } from "../../context/AuthContext";

const USER_API = import.meta.env.VITE_USERS_SERVICE_URL;

export default function Navbar() {
  const { user, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (user?.id) {
      getAvatarUrl(user.id, null, USER_API).then((url) => {
        setAvatarUrl(url);
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="p-0 flex justify-between items-center navbar_bg">
      <div className="font-bold text-lg">
        <Link to="/dashboard" className="p-0 flex flow-row secondary_text">
          <img src={skillForgeLogo} alt="Skill Forge Logo" className="w-12 h-12 inline-block ml-2 mr-4" />
          <p className="p-0 secondary_text">Skill Forge</p>
        </Link>
      </div>
      <div className="space-x-5 flex flex-row items-center">
        <Link to="/admin" className="text-xl">
          <FiSettings className="text-2xl w-10 h-10" title="Admin Panel" />
        </Link>
        <Link to="/profile">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 object-cover cursor-pointer avatar_border"
            />
          )}
        </Link>
        {user && (
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1 rounded secondary_text hover:opacity-75"
            title="Log out"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
