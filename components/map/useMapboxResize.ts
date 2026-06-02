"use client";

import { useEffect, type RefObject } from "react";
import type mapboxgl from "mapbox-gl";

export function resizeMapboxAfterLayout(map: mapboxgl.Map): () => void {
  let firstFrame: number | null = null;
  let secondFrame: number | null = null;
  const timeouts: Array<ReturnType<typeof setTimeout>> = [];

  const resize = () => {
    map.resize();
  };

  firstFrame = window.requestAnimationFrame(() => {
    resize();
    secondFrame = window.requestAnimationFrame(resize);
  });
  timeouts.push(setTimeout(resize, 180));
  timeouts.push(setTimeout(resize, 300));
  timeouts.push(setTimeout(resize, 600));

  return () => {
    if (firstFrame !== null) {
      window.cancelAnimationFrame(firstFrame);
    }
    if (secondFrame !== null) {
      window.cancelAnimationFrame(secondFrame);
    }
    timeouts.forEach((timeout) => clearTimeout(timeout));
  };
}

function resizeMapboxWhenContainerHasSize(map: mapboxgl.Map, container: HTMLElement): () => void {
  const cleanupCallbacks: Array<() => void> = [];
  let lastWidth = 0;
  let lastHeight = 0;
  let resizeObserver: ResizeObserver | null = null;

  const scheduleResize = () => {
    cleanupCallbacks.push(resizeMapboxAfterLayout(map));
  };

  const resizeIfSized = (width: number, height: number) => {
    if (width <= 0 || height <= 0) {
      return;
    }

    if (width === lastWidth && height === lastHeight) {
      return;
    }

    lastWidth = width;
    lastHeight = height;
    scheduleResize();
  };

  scheduleResize();
  const rect = container.getBoundingClientRect();
  resizeIfSized(Math.round(rect.width), Math.round(rect.height));

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      resizeIfSized(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height));
    });
    resizeObserver.observe(container);
  }

  const handleViewportResize = () => {
    const nextRect = container.getBoundingClientRect();
    resizeIfSized(Math.round(nextRect.width), Math.round(nextRect.height));
    scheduleResize();
  };

  window.visualViewport?.addEventListener("resize", handleViewportResize);
  window.addEventListener("orientationchange", handleViewportResize);

  return () => {
    cleanupCallbacks.forEach((cleanup) => cleanup());
    resizeObserver?.disconnect();
    window.visualViewport?.removeEventListener("resize", handleViewportResize);
    window.removeEventListener("orientationchange", handleViewportResize);
  };
}

export function useMapboxResizeOnVisible(
  mapRef: RefObject<mapboxgl.Map | null>,
  containerRef: RefObject<HTMLElement | null>,
  isVisible: boolean
): void {
  useEffect(() => {
    if (!isVisible || !mapRef.current || !containerRef.current) {
      return;
    }

    const map = mapRef.current;
    const container = containerRef.current;
    return resizeMapboxWhenContainerHasSize(map, container);
  }, [containerRef, isVisible, mapRef]);
}
