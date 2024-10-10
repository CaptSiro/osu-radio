import useControllableState from "@renderer/lib/controllable-state";
import { linearScale } from "@renderer/lib/linear-scale";
import { clamp } from "@renderer/lib/tungsten/math";
import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  ParentComponent,
  Setter,
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
  class?: string;
  enableWheelSlide?: boolean;
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
    if (typeof value === "undefined") {
      return;
    }

    sliderContext.thumb()?.focus();
    sliderContext.setValue(value);
    props.onValueStart?.();
  };
  const handleSlideMove = (event: Event) => {
    const value = getValueFromPointer(event.clientX);
    if (typeof value === "undefined") {
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

  const handleStep = (direction: "left" | "right") => {
    const stepDirection = direction === "left" ? -1 : 1;
    const step = (sliderContext.max / 100) * 5;
    const stepInDirection = step * stepDirection;
    const min = sliderContext.min;
    const max = sliderContext.max;
    sliderContext.setValue((value) => clamp(min, max, value + stepInDirection));
    sliderContext.thumb()?.focus();
  };

  return (
    <SliderContext.Provider value={sliderContext}>
      <SlideImplementation
        ref={setSlider}
        onEndKeyDown={handleEndPress}
        onHomeKeyDown={handleHomePress}
        onSlideStart={handleSlideStart}
        onSlideEnd={handleSlideEnd}
        onSlideMove={handleSlideMove}
        onStep={handleStep}
        class={props.class}
        enableWheelSlide={props.enableWheelSlide}
      >
        {props.children}
      </SlideImplementation>
    </SliderContext.Provider>
  );
};

type SlideImplementationProps = {
  onSlideStart(event: Event): void;
  onSlideMove(event: Event): void;
  onSlideEnd(event: Event): void;
  onHomeKeyDown(): void;
  onEndKeyDown(): void;
  onStep(direction: "left" | "right"): void;
  ref: Setter<HTMLElement | undefined>;
} & Pick<Props, "class" | "enableWheelSlide">;
const SlideImplementation: ParentComponent<SlideImplementationProps> = (props) => {
  return (
    <span
      class={props.class}
      style={{
        position: "relative"
      }}
      ref={props.ref}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        target.setPointerCapture(event.pointerId);
        event.preventDefault();

        props.onSlideStart(event);
      }}
      onPointerMove={(event) => {
        const target = event.target as HTMLElement;
        if (!target.hasPointerCapture(event.pointerId)) {
          return;
        }

        props.onSlideMove(event);
      }}
      onPointerUp={(event) => {
        const target = event.target as HTMLElement;
        if (target.hasPointerCapture(event.pointerId)) {
          target.releasePointerCapture(event.pointerId);
          props.onSlideEnd(event);
        }
      }}
      onWheel={(event) => {
        if (!props.enableWheelSlide) {
          return;
        }

        props.onStep(event.deltaY > 0 ? "left" : "right");
      }}
      onKeyDown={(event) => {
        switch (event.key) {
          case "ArrowLeft":
            props.onStep("left");
            break;
          case "ArrowRight":
            props.onStep("right");
            break;
          case "Home":
            props.onHomeKeyDown();
            break;
          case "End":
            props.onEndKeyDown();
            break;

          default:
            break;
        }
      }}
    >
      {props.children}
    </span>
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
