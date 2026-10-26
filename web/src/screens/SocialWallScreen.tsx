import { SocialWall, type SocialWallProps } from '../components/social/SocialWall';

/** 当前由独立开发预览注入数据；真实服务接入时复用同一组界面组件。 */
export function SocialWallScreen(props: SocialWallProps) {
  return <SocialWall {...props} />;
}
