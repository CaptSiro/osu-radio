import { Component, JSX } from "solid-js";
import { useSlider } from "./Slider";

const SliderRange: Component<JSX.IntrinsicElements["span"]> = (props) => {
  const state = useSlider();

  return (
    <span
      {...props}
      style={{
        width: `${state.percentage()}%`
      }}
    />
  );
};

export default SliderRange;
