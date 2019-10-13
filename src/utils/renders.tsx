// tslint:disable
import { useRef } from 'react';

/**
 * Alerts the number of component  rerenders in console.
 * 
 * @param alertAt optional count to alert at.
 */
export function useRenderCount(alertAt: number = 10) {
  const count = useRef(0);
  alertAt = alertAt || 10;
  count.current++
  if (count.current >= alertAt)
    console.log(`%c RENDERS:`, 'color:red; font-weight:bolder', count.current);
  else
    console.log(`%c RENDERS:`, 'color:#cccc00', count.current);
}
