import { useState, useEffect } from 'react'
import { Button } from './button'
import { ArrowUp } from 'lucide-react'

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isVisible) return null

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-6 left-6 z-50 rounded-full shadow-lg hover:scale-110 transition-transform"
      aria-label="العودة لأعلى"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
