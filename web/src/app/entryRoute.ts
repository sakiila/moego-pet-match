/** Gallery is a separate preview entry in both development and production. */
export function isGalleryPath(pathname: string): boolean {
  return pathname === '/dev/gallery' || pathname.startsWith('/dev/gallery/');
}
