import type { ButtonHTMLAttributes, ReactNode } from 'react'
import s from './ui.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  icon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', block, icon, className, children, ...rest }: Props) {
  const cls = [s.button, s[variant], size !== 'md' && s[size], block && s.block, className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} {...rest}>
      {icon}
      {children}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; pressed?: boolean }

/** Square icon-only button; `label` becomes both the accessible name and the tooltip. */
export function IconButton({ label, pressed, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={[s.iconButton, className].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      {...rest}
    >
      {children}
    </button>
  )
}
