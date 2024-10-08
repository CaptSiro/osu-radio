import { Accessor, createSignal } from "solid-js";

type UseControllableStateParams<T> = {
  prop?: Accessor<T> | undefined;
  defaultProp: T;
  onChange?: (state: T) => void;
};

type SetStateFn<T> = (prevState?: T) => T;

function useControllableState<T>({
  prop,
  defaultProp,
  onChange = () => {}
}: UseControllableStateParams<T>) {
  const [uncontrolledProp, setUncontrolledProp] = createSignal(prop?.() ?? defaultProp);
  const isControlled = typeof prop !== "undefined";
  const value = isControlled ? prop : uncontrolledProp;

  const setValue = (nextValue: T | ((newValue: T) => T)) => {
    if (!isControlled) {
      setUncontrolledProp(nextValue as any);
    }

    const setter = nextValue as SetStateFn<T>;
    const value = typeof nextValue === "function" ? setter(prop?.() ?? defaultProp) : nextValue;
    if (value !== prop) onChange(value as T);
  };

  return [value, setValue] as const;
}

export default useControllableState;
