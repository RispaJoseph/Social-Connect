export function Avatar({ src, name, size=32 }: { src?: string|null, name?: string, size?: number }) {
  const initials = (name || '?').slice(0,2).toUpperCase()
  return (
    <div className="inline-flex items-center justify-center rounded-full bg-gray-200 overflow-hidden" style={{ width: size, height: size }}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : <span className="text-xs">{initials}</span>}
    </div>
  )
}
