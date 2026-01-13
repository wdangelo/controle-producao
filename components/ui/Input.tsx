import { clsx } from 'clsx'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx('border rounded px-3 py-2 w-full', props.className)} />
}
