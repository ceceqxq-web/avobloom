import type {Metadata} from 'next';
import DemoPreview from '@/components/DemoPreview';
export const metadata:Metadata={title:'免登录 Demo',description:'仅供浏览的 Avobloom 示例界面，不连接个人记录，不保存数据。'};
export default function DemoPage(){return <DemoPreview/>}
