import { useEffect } from 'react'
import { Crisp } from 'crisp-sdk-web'

export default function CrispChat() {
  useEffect(() => {
    // web id dari dashboard Crisp
    Crisp.configure('5db0b936-78ba-4a72-bed9-5cd3008164a1')
  }, [])

  return null
}