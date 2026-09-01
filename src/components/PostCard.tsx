import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { Post } from '@/types';
import { formatDistance, formatPrice } from '@/lib/utils';
import { NegotiationBadge, CategoryBadge } from './Badges';
import { haversineKm } from '@/lib/utils';

export function PostCard({
  post,
  userLat,
  userLng,
}: {
  post: Post;
  userLat?: number;
  userLng?: number;
}) {
  const distance =
    userLat != null && userLng != null && post.location
      ? haversineKm(userLat, userLng, post.location.lat, post.location.lng)
      : null;

  return (
    <Link
      to={`/post/${post.id}`}
      className="card overflow-hidden block hover:shadow-md transition-shadow animate-fade-in"
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        {post.images[0] ? (
          <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <MapPin size={32} />
          </div>
        )}
        {distance != null && (
          <span className="absolute bottom-2 left-2 badge bg-black/70 text-white backdrop-blur-sm">
            <MapPin size={11} /> {formatDistance(distance)}
          </span>
        )}
        {post.status !== 'Active' && (
          <span className="absolute top-2 right-2 badge bg-black/70 text-white">
            {post.status}
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={post.category} subType={post.subType} />
        </div>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{post.title}</h3>
        <p className="text-brand-primary font-bold text-base">
          {formatPrice(post.price, post.contactForPrice)}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <NegotiationBadge
            type={post.negotiation}
            agentFeeMin={post.agentFeeMin}
            agentFeeMax={post.agentFeeMax}
          />
        </div>
      </div>
    </Link>
  );
}
