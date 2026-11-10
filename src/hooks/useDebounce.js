import { useEffect, useState } from 'react'

// 값이 바뀐 뒤 delay(ms) 동안 다시 안 바뀌면 그때 그 값을 돌려준다.
// 글자를 칠 때마다 API 를 부르지 않게 하려는 것.
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    // 다음 글자가 오면 이전 타이머를 지운다(cleanup)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
