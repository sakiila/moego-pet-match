import type { GalleryEntry } from '../../dev/gallery/types';
import { PawNotices } from './PawNotices';
const items=[{petId:'maodu',petName:'Maodu 毛肚',count:2}];
const entry:GalleryEntry={name:'PawNotices',group:'components',states:{
  messages:()=> <PawNotices items={items} kind="message" onOpen={()=>{}} />,
  replies:()=> <PawNotices items={items} kind="reply" onOpen={()=>{}} />,
  empty:()=> <PawNotices items={[]} kind="reply" onOpen={()=>{}} />,
  'long name':()=> <PawNotices items={[{...items[0],petName:'Sir Fluffington the Third of Shanghai'}]} kind="reply" onOpen={()=>{}} />,
}};
export default entry;
