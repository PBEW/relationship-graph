export type Gender = "male" | "female" | "non_binary" | "other" | "unspecified";

export type RelationshipStatus = "active" | "ended";

export interface Person {
  id: string;
  avatar: string | null;
  display_name: string;
  nickname: string | null;
  vrchat_name: string | null;
  discord: string | null;
  steam: string | null;
  twitter: string | null;
  country: string | null;
  gender: Gender | null;
  birthday: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type PersonInput = Partial<
  Omit<Person, "id" | "created_at" | "updated_at">
> &
  Pick<Person, "display_name">;

export interface RelationshipType {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
}

export type RelationshipTypeInput = Omit<RelationshipType, "id">;

export interface Relationship {
  id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type_id: string;
  status: RelationshipStatus;
  start_date: string | null;
  end_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  person_a: Person;
  person_b: Person;
  relationship_type: RelationshipType;
}

export interface RelationshipInput {
  person_a_id: string;
  person_b_id: string;
  relationship_type_id: string;
  status?: RelationshipStatus;
  start_date?: string | null;
  end_date?: string | null;
  note?: string | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TimelineEvent {
  relationship_id: string;
  relationship_type: string;
  color: string;
  icon: string;
  with_person_id: string;
  with_person_name: string;
  note: string | null;
  date: string;
  event: "started" | "ended";
}

export interface PersonProfile {
  person: Person;
  relationships: Relationship[];
  timeline: TimelineEvent[];
  stats: {
    total_relationships: number;
    active_relationships: number;
    ended_relationships: number;
    by_type: Record<string, number>;
  };
}

export interface DashboardStats {
  total_people: number;
  total_relationships: number;
  relationship_distribution: { name: string; color: string; count: number }[];
  most_connected: {
    person_id: string;
    display_name: string;
    avatar: string | null;
    relationship_count: number;
  }[];
  recently_added: {
    person_id: string;
    display_name: string;
    avatar: string | null;
    created_at: string;
  }[];
}

export interface GraphNode {
  id: string;
  display_name: string;
  nickname: string | null;
  avatar: string | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  status: RelationshipStatus;
  start_date: string | null;
  end_date: string | null;
  note: string | null;
  relationship_type: RelationshipType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export type UserRole = "super_admin" | "member";

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export type ActivityAction = "login" | "logout" | "create" | "update" | "delete";

export type ActivityEntityType =
  | "session"
  | "person"
  | "relationship"
  | "relationship_type"
  | "user";

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  username: string;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  summary: string | null;
  created_at: string;
  /** False once the account behind the entry has been deleted. */
  user_exists: boolean;
}

export interface UserAccountInput {
  username: string;
  password: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}
