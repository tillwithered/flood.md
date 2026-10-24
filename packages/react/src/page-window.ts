export function pageWindow(page:number,count:number,siblings:0|1|2):Array<number|"gap-start"|"gap-end"> {
  if(!Number.isSafeInteger(count)||count<1||!Number.isSafeInteger(page)||page<1||page>count)throw new RangeError("Flood Pagination requires a valid page within a positive safe-integer pageCount");
  if(![0,1,2].includes(siblings))throw new RangeError("Flood Pagination siblingCount must be 0, 1 or 2");
  const range=(from:number,to:number)=>Array.from({length:Math.max(0,to-from+1)},(_,index)=>from+index);
  const budget=2*siblings+5;
  if(count<=budget)return range(1,count);
  if(page<=siblings+3)return [...range(1,2*siblings+3),"gap-end",count];
  if(page>=count-siblings-2)return [1,"gap-start",...range(count-2*siblings-2,count)];
  return [1,"gap-start",...range(page-siblings,page+siblings),"gap-end",count];
}
