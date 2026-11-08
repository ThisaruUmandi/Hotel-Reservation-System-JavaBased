# Images

## Already added
`hero/hero.jpg`, `rooms/single.jpg`, `rooms/double.jpg`, `rooms/suite.jpg`, `rooms/single-2.jpg`, `rooms/double-2.jpg`,
`rooms/suite-2.jpg`, `about/story.jpg`, `about/cta.jpg`.

## Not used right now
`about/cta.jpg` (the closing banner was removed in the redesign). Keep it or delete it.

## Still optional
`hotel/pool.jpg`, `hotel/dining.jpg`, `hotel/garden.jpg` (used by the room detail page and later sections).
`hero/hero.jpg` is 1408 px wide, which is a little soft on very large or retina screens. Replace it with a 2400 px
version whenever you have one.

## Full guide

Put files in `frontend/public/images/` using exactly these names. Until a file exists, the site shows a neutral
placeholder frame, so nothing breaks. Use JPG or WebP, keep each file under about 400 KB, and avoid text or logos in photos.

| File | Used for | Size (px) | What to shoot |
|---|---|---|---|
| `hero/hero.jpg` | Home page hero, full width, text on top | 2400 x 1400 | Wide, calm scene of the property: pool, lagoon, garden or beach at golden hour. Keep the lower-left third quiet (sky, water, lawn) because headline text sits there. |
| `rooms/single.jpg` | Single room card and page | 1600 x 1070 (3:2) | Bed facing a window, soft natural light, one small styled corner. |
| `rooms/double.jpg` | Double room | 1600 x 1070 | Larger bed, balcony or garden view in frame. |
| `rooms/suite.jpg` | Suite | 1600 x 1070 | Living area plus bed, the most generous angle you have. |
| `rooms/single-2.jpg`, `double-2.jpg`, `suite-2.jpg` | Second photo per room (detail page) | 1600 x 1070 | Bathroom, view from the window or a detail like linen, a lamp or a tray. |
| `hotel/pool.jpg` | "The property" section | 1200 x 800 | Pool or outdoor seating, no crowds. |
| `hotel/dining.jpg` | Dining | 1200 x 800 | Breakfast table or a set restaurant table. |
| `hotel/garden.jpg` | Grounds | 1200 x 800 | Garden path, trees, courtyard. |
| `about/story.jpg` | Overview next to the intro text | 900 x 1100 (portrait) | A human detail: hands pouring tea, a hallway, a doorway with light. |
| `about/cta.jpg` | Full-width banner above the footer | 2400 x 900 | Wide nature shot: cliffs, palms, water or a sunset. |

Tips
- Warm light photographs best with this palette (clay, sand, moss). Avoid heavy filters.
- Real photos of the real rooms beat stock photos. The design only works if the images feel true.
- Export at the sizes above. Larger files only slow the site down.
