export type MobileCartItem={id:string;productId:string;variantId:string;name:string;variantLabel:string;priceCents:number;quantity:number;image?:string};
export function add(items:MobileCartItem[],item:MobileCartItem){const found=items.find(x=>x.id===item.id);return found?items.map(x=>x.id===item.id?{...x,quantity:Math.min(12,x.quantity+item.quantity)}:x):[...items,item]}
export function setQty(items:MobileCartItem[],id:string,quantity:number){return quantity<=0?items.filter(x=>x.id!==id):items.map(x=>x.id===id?{...x,quantity:Math.min(12,quantity)}:x)}
export function subtotal(items:MobileCartItem[]){return items.reduce((n,x)=>n+x.priceCents*x.quantity,0)}
