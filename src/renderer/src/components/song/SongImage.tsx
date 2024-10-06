import { Accessor, Component, createEffect, createSignal, JSX, onCleanup, onMount } from "solid-js";
import defaultBackground from "../../assets/osu-default-background.jpg";
import { availableResource, getResourcePath } from "../../lib/tungsten/resource";

const SET_SOURCE_EVENT = "set-source";
const GLOBAL_GROUP = "global-group";

const observers = new Map<string, IntersectionObserver>();

type SongImageProps = {
  src: string | undefined | Accessor<string | undefined>;
  group?: string;
  instantLoad?: boolean;
  onImageLoad?: (imgElement: HTMLImageElement) => void; // Pass a callback when the image is loaded
} & JSX.IntrinsicElements["div"];

const SongImage: Component<SongImageProps> = (props) => {
  const [src, setSrc] = createSignal(defaultBackground);
  let image!: HTMLDivElement;
  let hiddenImage!: HTMLImageElement; // Reference to the hidden image

  const setSource = (evt) => {
    setSrc(evt.detail);
    delete image.dataset.eventHandler;
  };

  createEffect(async () => {
    const b = typeof props.src === "function" ? props.src() : props.src;
    if (props.instantLoad) {
      const resource = await getResourcePath(b);
      const resolvedSrc = await availableResource(resource, defaultBackground);
      setSrc(resolvedSrc);

      if (hiddenImage && props.onImageLoad) {
        hiddenImage.src = resolvedSrc;
        props.onImageLoad(hiddenImage); // Call the callback when image is loaded
      }

      return;
    }

    if (image.dataset.eventHandler !== "YEP") {
      image.dataset.eventHandler = "YEP";
      image.addEventListener(SET_SOURCE_EVENT, setSource, { once: true });
    }
  });

  onMount(async () => {
    const group = props.group ?? GLOBAL_GROUP;
    let observer = observers.get(group);

    if (observer === undefined) {
      observer = new IntersectionObserver(
        async (entries) => {
          for (let i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting === false) {
              return;
            }

            const resource = await getResourcePath(
              String(entries[i].target.getAttribute("data-url"))
            );

            const resolvedSrc = await availableResource(resource, defaultBackground);
            entries[i].target.dispatchEvent(
              new CustomEvent(SET_SOURCE_EVENT, {
                detail: resolvedSrc
              })
            );

            if (hiddenImage && props.onImageLoad) {
              hiddenImage.src = resolvedSrc;
              props.onImageLoad(hiddenImage); // Call the callback when image is loaded
            }

            observer?.unobserve(entries[i].target);
          }
        },
        { rootMargin: "50px" }
      );
      observers.set(group, observer);
    }

    observer.observe(image);
  });

  onCleanup(() => {
    image.removeEventListener(SET_SOURCE_EVENT, setSource);
  });

  return (
    <>
      <div
        {...props}
        ref={image}
        class="song-image"
        style={{
          "background-image": `url('${src().replaceAll("'", "\\'")}')`
        }}
        data-url={props.src ?? ""}
      />
      {/* Hidden img element for extracting color */}
      <img
        ref={hiddenImage} // Reference to the hidden image
        src={src()} // Same source as the background image
        alt="hidden"
        style={{ display: "none" }} // Keep it hidden
      />
    </>
  );
};

export default SongImage;
