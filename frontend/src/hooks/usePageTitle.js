/*
  usePageTitle — sets document.title for the current page on mount.
  Resets to the default app title when the component unmounts so going
  back to the landing page always shows the correct browser tab text.
*/
import { useEffect } from 'react'

const DEFAULT_TITLE = 'PathFinder — AI Career Counselling'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — PathFinder` : DEFAULT_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
