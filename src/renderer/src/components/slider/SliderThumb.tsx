import { useSlider } from "./Slider";
import { Component, createMemo, JSX } from "solid-js";
import { linearScale } from "@renderer/lib/linear-scale";

export function getThumbInBoundsOffset(width: number, left: number) {
  const halfWidth = width / 2;
  const halfPercent = 50;
  const offset = linearScale([0, halfPercent], [0, halfWidth]);
  return halfWidth - offset(left);
}

const SliderThumb: Component<JSX.IntrinsicElements["span"]> = (props) => {
  const state = useSlider();

  const thumbInBoundsOffset = createMemo(() => {
    return getThumbInBoundsOffset(state.thumbWidth(), state.percentage());
  });

  return (
    <span
      style={{
        position: "absolute",
        left: `calc(${state.percentage()}% + ${thumbInBoundsOffset()}px)`,
        top: "0px"
      }}
    >
      <span
        {...props}
        style={{
          transform: "translate(-50%)"
        }}
        tabIndex={0}
        ref={state.setThumb}
      />
    </span>
  );
};

export default SliderThumb;
