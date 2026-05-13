export type GroupListItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  role: "owner" | "member";
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  createdAt: string;
  role: "owner" | "member";
};
