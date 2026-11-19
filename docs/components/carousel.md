# Carousel

Use Carousel when people should see a continuous collection of slides and
move through it by swipe, trackpad, keyboard or arrows. Use CardDeck when the
experience should show one active card from a stack and the host owns its ID.

```tsx
import {Carousel, Card} from "@flood-md/react";

const items = [
  {id: "alpha", label: "Alpha", content: <Card>Alpha</Card>},
  {id: "beta", label: "Beta", content: <Card>Beta</Card>},
  {id: "gamma", label: "Gamma", content: <Card>Gamma</Card>},
];

export function ProjectCarousel() {
  return <Carousel label="Recent projects" slideSize="min(14rem, 85%)" items={items} />;
}
```

Each slide has a stable ID and accessible label. The layout defaults to one
slide per viewport. Set `slideSize` to a percentage or bounded CSS length to
show more than one slide. Name the collection and localize control names and
the visible range through `labels` where required.

Arrow keys move one stop when the scroll viewport owns focus. Home and End go
to either edge. Buttons stay focused when the collection reaches an edge.
Focus and keyboard shortcuts inside slide content remain with that content.
Carousel scrolls only in response to user interaction.
