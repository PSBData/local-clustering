import {loadFont} from '@remotion/fonts';
import {continueRender, delayRender, staticFile} from 'remotion';

const faces: {family: string; file: string; weight: string; style?: string}[] = [
  {family: 'Montserrat', file: 'Montserrat-SemiBold.ttf', weight: '600'},
  {family: 'Montserrat', file: 'Montserrat-Bold.ttf', weight: '700'},
  {family: 'Montserrat', file: 'Montserrat-ExtraBold.ttf', weight: '800'},
  {family: 'Lato', file: 'lato-latin-400-normal.woff2', weight: '400'},
  {family: 'Lato', file: 'lato-latin-700-normal.woff2', weight: '700'},
  {family: 'Lato', file: 'lato-latin-400-italic.woff2', weight: '400', style: 'italic'},
];

const handle = delayRender('Loading fonts');

Promise.all([
  ...faces.map((f) =>
    loadFont({family: f.family, url: staticFile(f.file), weight: f.weight, style: f.style ?? 'normal'}),
  ),
  // KaTeX declares its faces in CSS: force them before the first frame.
  document.fonts.load('40px KaTeX_Main'),
  document.fonts.load('italic 40px KaTeX_Math'),
  document.fonts.load('40px KaTeX_Size1'),
  document.fonts.load('40px KaTeX_Size2'),
]).then(() => continueRender(handle));
