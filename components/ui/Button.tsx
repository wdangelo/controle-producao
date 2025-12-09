import { clsx } from 'clsx'

export default function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx('px-3 py-2 rounded bg-primary text-white disabled:opacity-50', className)}
      {...props}
    >
      {children}
    </button>
  )
}
