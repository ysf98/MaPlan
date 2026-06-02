"use client";

import { useEffect, type RefObject } from "react";
import type mapboxgl from "mapbox-gl";

export function resizeMapboxAfterLayout(map: mapboxgl.Map): () => void {
  let firstFrame: number | null = null;
  let secondFrame: number | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const resize = () => {
    map.resize();
  };

  firstFrame = window.requestAnimationFrame(() => {
    resize();
    secondFrame = window.requestAnimationFrame(resize);
  });
  timeout = setTimeout(resize, 180);

  return () => {
    if (firstFrame !== null) {
      window.cancelAnimationFrame(firstFrame);
    }
    if (secondFrame !== null) {
      window.cancelAnimationFrame(secondFrame);
    }
    if (timeout) {
      clearTimeout(timeout);
    }
  };
}

export function useMapboxResizeOnVisible(mapRef: RefObject<mapboxgl.Map | null>, isVisible: boolean): void {
  useEffect(() => {
    if (!isVisible || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    return resizeMapboxAfterLayout(map);
  }, [isVisible, mapRef]);
}
