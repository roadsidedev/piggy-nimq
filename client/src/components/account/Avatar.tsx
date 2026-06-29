interface AvatarProps {
  address?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function getInitials(address?: string | null, username?: string | null): string {
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  if (address) {
    return address.slice(2, 4).toUpperCase();
  }
  return "??";
}

export function Avatar({ address, username, avatarUrl, size = "md", className = "" }: AvatarProps) {
  const sizeClass = sizeMap[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? "User avatar"}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-pink-100 font-bold text-pink-600 ring-2 ring-white ${className}`}
    >
      {getInitials(address, username)}
    </div>
  );
}
