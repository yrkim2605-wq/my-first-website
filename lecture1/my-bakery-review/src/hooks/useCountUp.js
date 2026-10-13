import { useEffect, useState } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'

// 0에서 target까지 숫자가 올라가는 효과 (보상 화면의 "+EXP"에 써요).
// 움직임 줄이기 설정이면 올라가지 않고 바로 target을 보여줘요.
export const useCountUp = (target, { duration = 900, active = true } = {}) => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active || prefersReducedMotion) return undefined
    let frame
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      // 끝에서 천천히 멈추는 ease-out
      setValue(Math.round(target * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, active, prefersReducedMotion])

  return prefersReducedMotion || !active ? target : value
}
