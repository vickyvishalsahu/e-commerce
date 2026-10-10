import { useNavigation } from 'react-router'

export function NavigationProgress() {
  const navigation = useNavigation()
  if (navigation.state === 'idle') return null

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-primary motion-safe:animate-pulse"
    />
  )
}
