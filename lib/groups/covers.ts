const GROUP_COVER_IMAGES = [
  "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
];

function hashGroupId(groupId: string): number {
  let hash = 0;
  for (let index = 0; index < groupId.length; index += 1) {
    hash = (hash * 31 + groupId.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getGroupCoverImageUrl(groupId: string): string {
  const index = hashGroupId(groupId) % GROUP_COVER_IMAGES.length;
  return GROUP_COVER_IMAGES[index];
}
