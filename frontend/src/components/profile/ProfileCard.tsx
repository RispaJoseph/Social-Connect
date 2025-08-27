import React from "react";

type ProfileCardProps = {
  username?: string;
  email?: string;
  avatar_url?: string | null;
  bio?: string;
  website?: string;
  location?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  actions?: React.ReactNode; // place for buttons (follow/edit)
};

const ProfileCard: React.FC<ProfileCardProps> = ({
  username,
  email,
  avatar_url,
  bio,
  website,
  location,
  followers_count = 0,
  following_count = 0,
  posts_count = 0,
  actions,
}) => {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center gap-4">
        <img
          src={avatar_url || "/default-avatar.png"}
          alt="avatar"
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div>
          <h2 className="text-xl font-semibold">{username}</h2>
          {email && <p className="text-sm text-gray-500">{email}</p>}
          {location && <p className="text-sm text-gray-600">📍 {location}</p>}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 text-sm hover:underline"
            >
              {website}
            </a>
          )}
        </div>
      </div>

      {bio && <p className="mt-3 text-gray-700">{bio}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Followers</p>
          <p className="font-semibold">{followers_count}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Following</p>
          <p className="font-semibold">{following_count}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Posts</p>
          <p className="font-semibold">{posts_count}</p>
        </div>
      </div>

      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
};

export default ProfileCard;
