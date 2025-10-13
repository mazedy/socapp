import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/api/axios';

export default function Avatar({
  src,
  alt = 'avatar',
  username,
  name,
  size = 48,
  to, // optional link target; if provided, wraps in Link
  className = '',
  showBorder = true,
}) {
  const placeholder = '/avatar-placeholder.svg';
  const fallbackInitial = (name?.[0] || username?.[0] || 'U').toUpperCase();
  const dim = typeof size === 'number' ? `${size}px` : size;
  const borderCls = showBorder ? 'border-2 border-purple-300' : '';

  // Resolve image URL: if src is relative (e.g., /uploads/...), prefix with API_BASE_URL
  const resolvedSrc = (() => {
    if (!src) return null;
    const s = String(src);
    const isAbsolute = /^https?:\/\//i.test(s) || s.startsWith('data:');
    if (isAbsolute) return s;
    if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
    return `${API_BASE_URL}/${s}`;
  })();

  const imageEl = resolvedSrc ? (
    <img
      src={resolvedSrc}
      alt={alt}
      style={{ width: dim, height: dim }}
      className={`rounded-full object-cover ${borderCls} ${className}`}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = placeholder;
      }}
    />
  ) : (
    <div
      style={{ width: dim, height: dim }}
      className={`rounded-full ${borderCls} ${className} bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center font-semibold`}
    >
      {fallbackInitial}
    </div>
  );

  if (to) return <Link to={to}>{imageEl}</Link>;
  return imageEl;
}
