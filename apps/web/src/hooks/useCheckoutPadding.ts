import { useEffect, useState } from 'react'

export function useCheckoutPadding() {
	const [pad, setPad] = useState({ y: 24, x: 16 })
	useEffect(() => {
		const up = () => {
			if (typeof window === 'undefined') return
			const w = window.innerWidth
			setPad(w >= 991 ? { y: 64, x: 80 } : w >= 640 ? { y: 40, x: 24 } : { y: 24, x: 16 })
		}
		up()
		window.addEventListener('resize', up)
		return () => window.removeEventListener('resize', up)
	}, [])
	return pad
}
