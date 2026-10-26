import type { GalleryEntry } from '../../dev/gallery/types';
import { PawEntry, type PawEntryProps } from './PawEntry';
const draw=(over:Partial<PawEntryProps>={})=><PawEntry own={false} left={false} onOpen={()=>{}} {...over}/>;
const entry:GalleryEntry={name:'PawEntry',group:'components',states:{default:()=>draw(),selected:()=>draw({left:true}),owner:()=>draw({own:true}),
  loading:()=>draw({loading:true}),locked:()=>draw({locked:true}),unavailable:()=>draw({unavailable:true})}};
export default entry;
