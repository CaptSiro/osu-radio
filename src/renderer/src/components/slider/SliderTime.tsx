import { Component, createMemo, JSX } from "solid-js";
import { useSlider } from "./Slider";

const SliderTime: Component<JSX.IntrinsicElements["span"]> = (props) => {
  const state = useSlider();

  // const thumbInBoundsOffset = createMemo(() => {
  //   return getThumbInBoundsOffset(state.thumbWidth(), state.percentage());
  // });

  return (
    <span
      style={{
        position: "absolute",
        right: `calc(${100 - state.percentage()}%)`,
        left: "0px",
        top: "0px"
      }}
    >
      <span {...props} />
    </span>
  );
};

export default SliderTime;
