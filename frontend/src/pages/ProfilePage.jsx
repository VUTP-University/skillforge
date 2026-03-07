/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import ProfileHeader from "../components/UserProfile/ProfileHeader";
import ProfileMain from "../components/UserProfile/ProfileMain";
import Achievements from "../components/UserProfile/Achievements";
import UserStats from "../components/UserProfile/UserStats";
import Modal from "../components/Layout/Modal";
import { getUserById } from "../services/usersService";
import { useAuth } from "../context/AuthContext";
import { authFetch, checkValidToken } from "../services/authService";

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const USER_API = import.meta.env.VITE_USERS_SERVICE_URL;

  useEffect(() => {
    if (!authUser?.id) return;

    const fetchUserData = async () => {
      try {
        const userData = await getUserById(authUser.id);
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user data:", err.message);
      }
    };

    const fetchAvatarUrl = async () => {
      try {
        // authFetch automatically sends the JWT cookie and CSRF header
        const response = await authFetch(`${USER_API}/users/${authUser.id}/avatar`);

        const isTokenValid = await checkValidToken(response.status);
        if (!isTokenValid) return;

        if (!response.ok) {
          throw new Error("Failed to fetch avatar");
        }

        const imageBlob = await response.blob();
        setAvatarUrl(URL.createObjectURL(imageBlob));
      } catch (err) {
        console.error("Error fetching avatar URL:", err.message);
      }
    };

    fetchUserData();
    fetchAvatarUrl();
  }, [authUser, USER_API]);

  if (!user) return <div className="text-white">No user data...</div>;

  return (
    <>
      <Navbar />
      <div className="mx-auto min-h-screen p-10 bg-gradient-to-b from-[#141e30] to-[#123556] text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: ProfileHeader + Achievements */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <ProfileHeader user={user} avatarUrl={avatarUrl} />
            {/* <Achievements /> */}
          </div>

          {/* Right column: ProfileMain + UserStats */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <ProfileMain user={user} setModalOpen={setModalOpen} setModalMessage={setModalMessage} />
            <UserStats user={user} />
          </div>
        </div>
      </div>

      {/* Modal for profile update */}
      <Modal isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Profile Update"
        message={modalMessage}
      />
    </>
  );
};

export default ProfilePage;
