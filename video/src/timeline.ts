// Video timeline, in seconds of the final output. [start, end]
export const T = {
  title: [0, 6],
  q: [6, 15],
  s1: [15, 26],
  s2: [26, 44],
  s3: [44, 60],
  s4: [60, 78],
  ext: [78, 98],
  all: [98, 118],
  end: [118, 130],
} as const;

export const DURATION = T.end[1];
export const FPS = 30;
