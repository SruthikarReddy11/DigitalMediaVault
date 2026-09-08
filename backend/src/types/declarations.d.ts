declare module 'exif-parser' {
  export interface ExifParser {
    enableSimpleValues(enable: boolean): ExifParser;
    enableImageSize(enable: boolean): ExifParser;
    enableReturnTags(enable: boolean): ExifParser;
    parse(): {
      imageSize?: {
        width: number;
        height: number;
      };
      tags?: Record<string, any>;
      hasExif?: boolean;
    };
  }

  export function create(buffer: Buffer): ExifParser;
}
