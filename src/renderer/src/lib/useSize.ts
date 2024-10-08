import { createSignal, onCleanup, onMount } from "solid-js";

export function useSize(ref: HTMLElement | undefined) {
  const [size, setSize] = createSignal({ width: 0, height: 0 });

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    }
  });

  onMount(() => {
    console.log("ref", ref);

    if (!ref) {
      return;
    }

    resizeObserver.observe(ref);
  });

  onCleanup(() => {
    resizeObserver.disconnect();
  });

  return size;
}

export default useSize;
