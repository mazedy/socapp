import { Link } from 'react-router-dom';

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

  const imageEl = src ? (
    <img
      src={src}
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
