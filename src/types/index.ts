export type AccountType = 'Buyer' | 'Seller' | 'Agent' | 'Car Dealer' | 'Business';

export type PostCategory = 'Product' | 'Service' | 'Property' | 'Vehicle';

export type PropertySubType = 'House for Rent' | 'Room to Let' | 'Cars' | undefined;

export type NegotiationType = 'Negotiable' | 'Fixed Price' | 'Agent Fee';

export type PostStatus = 'Active' | 'Sold' | 'Rented' | 'Unavailable';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  accountType: AccountType;
  community: string;
  location: { lat: number; lng: number } | null;
  safetyAccepted: boolean;
  createdAt: number;
}

export interface Post {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhotoURL: string;
  title: string;
  description: string;
  category: PostCategory;
  subType?: PropertySubType;
  price: number | null;
  contactForPrice: boolean;
  negotiation: NegotiationType;
  agentFeeMin?: number;
  agentFeeMax?: number;
  images: string[];
  location: { lat: number; lng: number } | null;
  community: string;
  targetCity?: string;
  status: PostStatus;
  createdAt: number;
  editedAt?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  offerAmount?: number;
  createdAt: number;
}

export interface ChatThread {
  id: string;
  postId: string;
  postTitle: string;
  postImage?: string;
  postPrice: number | null;
  postNegotiation: NegotiationType;
  agentFeeMin?: number;
  agentFeeMax?: number;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  buyerPhoto: string;
  sellerPhoto: string;
  lastMessage: string;
  lastMessageAt: number;
  safetyShown?: boolean;
  participants?: string[];
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'account';
  targetId: string;
  category: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: number;
}
