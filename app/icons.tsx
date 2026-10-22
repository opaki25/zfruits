import type {ReactNode} from 'react';
function Icon({size=20,children}:{size?:number,children:ReactNode}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>}
type Props={size?:number};
export const ArrowUpRight=(p:Props)=><Icon {...p}><path d="M6 18 18 6M6 6h12v12"/></Icon>;
export const ArrowRight=(p:Props)=><Icon {...p}><path d="M4 12h16m-6-6 6 6-6 6"/></Icon>;
export const Minus=(p:Props)=><Icon {...p}><path d="M5 12h14"/></Icon>;
export const Plus=(p:Props)=><Icon {...p}><path d="M5 12h14M12 5v14"/></Icon>;
export const Check=(p:Props)=><Icon {...p}><path d="m5 12 4 4L19 6"/></Icon>;
export const Leaf=(p:Props)=><Icon {...p}><path d="M20 3C8 2 2 9 6 16c7 5 15-1 14-13ZM4 21 15 10"/></Icon>;
export const MapPin=(p:Props)=><Icon {...p}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></Icon>;
export const Clock=(p:Props)=><Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></Icon>;
export const ShoppingBag=(p:Props)=><Icon {...p}><path d="M5 7h14l1 14H4L5 7Zm4 1V6a3 3 0 0 1 6 0v2"/></Icon>;
