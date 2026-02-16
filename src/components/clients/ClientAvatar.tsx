import { useClientAvatarUrl } from "@/hooks/useClientAvatarUrl";

interface ClientAvatarProps {
  avatarUrl: string | null;
  clientName: string;
  className?: string;
}

/**
 * Component to display a client avatar with signed URL support.
 * Falls back to showing the first letter of the client name if no avatar.
 */
export function ClientAvatar({ avatarUrl, clientName, className = "" }: ClientAvatarProps) {
  const signedUrl = useClientAvatarUrl(avatarUrl);

  if (signedUrl) {
    return (
      <img
        src={signedUrl}
        alt={clientName}
        className={`h-full w-full object-cover ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return <>{clientName.charAt(0).toUpperCase()}</>;
}
