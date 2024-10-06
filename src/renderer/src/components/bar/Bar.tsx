import { Component, createEffect, createSignal, onMount } from "solid-js";
import { clamp } from "../../lib/tungsten/math";

import "./styles.css";

type BarAlignment = "vertical" | "v" | "horizontal" | "h";

function isVertical(alignment?: BarAlignment): boolean {
  return alignment === "vertical" || alignment === "v";
}

type BarProps = {
  alignment?: BarAlignment;
  fill: number;
  setFill?: (fill: number) => any;
  disabled?: boolean;
  color?: string;
};

const Bar: Component<BarProps> = (props) => {
  const [fill, setFill] = createSignal(props.fill);
  let bar: HTMLDivElement | undefined;
  let handle: HTMLDivElement | undefined;

  onMount(() => {
    createEffect(() => {
      const f = fill();
      bar?.style.setProperty("--fill-per", `${clamp(0, 1, f) * 100}%`);

      if (props.setFill !== undefined) {
        props.setFill(clamp(0, 1, f));
      }
    });
  });

  const calculateFill = (evt: PointerEvent) => {
    if (props.disabled === true) {
      return;
    }

    const rect = bar?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    if (isVertical(props.alignment)) {
      setFill(clamp(0, 1, -(evt.clientY - rect.top) / rect.height + 1));
      return;
    }

    setFill(clamp(0, 1, (evt.clientX - rect.left) / rect.width));
  };

  const onDown = (evt: PointerEvent) => {
    if (props.disabled === true) {
      return;
    }

    handle?.setPointerCapture(evt.pointerId);

    handle?.addEventListener("pointermove", calculateFill);
    handle?.addEventListener(
      "pointerup",
      () => handle.removeEventListener("pointermove", calculateFill),
      { once: true }
    );
  };

  return (
    <div
      ref={bar}
      class="bar"
      classList={{
        vertical: props.alignment !== undefined,
        editable: props.setFill !== undefined
      }}
      style={{
        "--fill-per": clamp(0, 1, props.fill) * 100 + "%",
        "--fill-color": props.color || "black"
      }}
      onPointerDown={calculateFill}
      data-disabled={props.disabled}
    >
      <div class="filling-container">
        <div class="filling" />
      </div>

      <div ref={handle} class="handle" onPointerDown={onDown}></div>
    </div>
  );
};

export default Bar;