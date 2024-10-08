import useControllableState from "@renderer/lib/controllable-state";
import { linearScale } from "@renderer/lib/linear-scale";
import { clamp } from "@renderer/lib/tungsten/math";
import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  ParentComponent,
  useContext
} from "solid-js";
import { DOMElement } from "solid-js/jsx-runtime";
import SliderRange from "./SliderRange";
import SliderTrack from "./SliderTrack";
import SliderThumb from "./SliderThumb";
import SliderTime from "./SliderTime";

const DEFAULT_SLIDER_VALUE = 0;
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;

export type Props = {
  defaultValue?: number;
  value?: Accessor<number>;
  onValueChange?: (newValue: number) => void;
  onValueCommit?: () => void;
  onValueStart?: () => void;
  min?: number;
  max?: number;
};

type Event = PointerEvent & {
  currentTarget: HTMLSpanElement;
  target: DOMElement;
};

export type Context = ReturnType<typeof useProviderValue>;

function convertValueToPercentage(value: number, min: number, max: number) {
  const maxSteps = max - min;
  const percentPerStep = 100 / maxSteps;
  const percentage = percentPerStep * (value - min);
  return clamp(percentage, 100, 0);
}

function useProviderValue(props: Props) {
  const [thumbWidth, setThumbWidth] = createSignal<number>(0);
  const [thumb, _setThumb] = createSignal<HTMLElement>();
  const [value, setValue] = useControllableState({
    defaultProp: props.defaultValue ?? DEFAULT_SLIDER_VALUE,
    prop: props.value,
    onChange: props.onValueChange
  });

  const setThumb = (node: HTMLElement) => {
    _setThumb(node);
    setThumbWidth(node.getBoundingClientRect().width);
  };

  const min = props.min ?? DEFAULT_MIN;
  const max = props.max ?? DEFAULT_MAX;

  const percentage = createMemo(() => convertValueToPercentage(value(), min, max));

  return {
    thumbWidth,
    percentage,
    value,
    setValue,
    thumb,
    setThumb,
    min,
    max
  };
}

export const SliderContext = createContext<Context>();
const SliderRoot: ParentComponent<Props> = (props) => {
  const sliderContext = useProviderValue(props);
  const [slider, setSlider] = createSignal<HTMLElement>();
  const [lastRect, setLastRect] = createSignal<DOMRect | undefined>();

  const getValueFromPointer = (pointerPosition: number) => {
    const sliderElement = slider();
    if (!sliderElement) {
      return;
    }

    const sliderRect = sliderElement.getBoundingClientRect();
    const rect = lastRect() || sliderRect;

    const min = sliderContext.min;
    const max = sliderContext.max;
    const input: [number, number] = [0, rect.width];
    const output: [number, number] = [min, max];
    const value = linearScale(input, output);

    setLastRect(sliderRect);
    return clamp(min, max, value(pointerPosition - rect.left));
  };

  const handleSlideStart = (event: Event) => {
    const value = getValueFromPointer(event.clientX);
    if (!value) {
      return;
    }

    sliderContext.thumb()?.focus();
    sliderContext.setValue(value);
    props.onValueStart?.();
  };
  const handleSlideMove = (event: Event) => {
    const value = getValueFromPointer(event.clientX);
    if (!value) {
      return;
    }

    sliderContext.setValue(value);
  };
  const handleSlideEnd = () => {
    props.onValueCommit?.();
  };

  const handleHomePress = () => {
    sliderContext.setValue(sliderContext.min);
  };

  const handleEndPress = () => {
    sliderContext.setValue(sliderContext.max);
  };

  const move = (direction: "left" | "right") => {
    const stepDirection = direction === "left" ? -1 : 1;
    const step = (sliderContext.max / 100) * 5;
    const stepInDirection = step * stepDirection;
    sliderContext.setValue((value) => value + stepInDirection);
  };

  return (
    <SliderContext.Provider value={sliderContext}>
      <span
        style={{
          position: "relative"
        }}
        ref={setSlider}
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          target.setPointerCapture(event.pointerId);
          event.preventDefault();

          handleSlideStart(event);
        }}
        onPointerMove={(event) => {
          const target = event.target as HTMLElement;
          if (target.hasPointerCapture(event.pointerId)) {
            handleSlideMove(event);
          }
        }}
        onPointerUp={(event) => {
          const target = event.target as HTMLElement;
          if (target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId);
            handleSlideEnd();
          }
        }}
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowLeft":
              move("left");
              break;
            case "ArrowRight":
              move("right");
              break;
            case "Home":
              handleHomePress();
              break;
            case "End":
              handleEndPress();
              break;

            default:
              break;
          }
        }}
      >
        {props.children}
      </span>
    </SliderContext.Provider>
  );
};

export function useSlider(): Context {
  const state = useContext(SliderContext);
  if (!state) {
    throw new Error("useSlider needs to be used inisde of the `SliderContext.Provider` component.");
  }
  return state;
}

const Slider = Object.assign(SliderRoot, {
  Range: SliderRange,
  Track: SliderTrack,
  Thumb: SliderThumb,
  Time: SliderTime
});

export default Slider;
