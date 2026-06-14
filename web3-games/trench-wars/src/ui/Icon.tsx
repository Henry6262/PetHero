import { ICON_PATHS } from './icons/data'

export type IconName = keyof typeof ICON_PATHS

interface Props {
  name: string
  size?: number
  className?: string
  color?: string
  title?: string
}

export function Icon({ name, size = 24, className = '', color = 'currentColor', title }: Props) {
  const d = ICON_PATHS[name]
  if (!d) {
    if (import.meta.env.DEV) console.warn(`<Icon> unknown name: ${name}`)
    return null
  }
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill={color}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  )
}
