import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set initial value
    checkDevice()

    // Add event listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    if (mql.addEventListener) {
      mql.addEventListener("change", checkDevice)
    } else {
      // Fallback for older browsers
      mql.addListener(checkDevice)
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", checkDevice)
      } else {
        mql.removeListener(checkDevice)
      }
    }
  }, [])

  return isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }

    // Set initial value
    checkDevice()

    // Add event listener
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)

    if (mql.addEventListener) {
      mql.addEventListener("change", checkDevice)
    } else {
      mql.addListener(checkDevice)
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", checkDevice)
      } else {
        mql.removeListener(checkDevice)
      }
    }
  }, [])

  return isTablet
}
