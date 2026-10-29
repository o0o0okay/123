import { createContext, useContext, type ImgHTMLAttributes, type ReactNode } from "react";
import { paintFilter, type Paints } from "@/data/paints";

const PaintCtx = createContext<Paints>({});

/** Makes the per-car paints available to every component that draws a car sprite. */
export function PaintProvider({ paints, children }: { paints: Paints; children: ReactNode }) {
  return <PaintCtx.Provider value={paints}>{children}</PaintCtx.Provider>;
}

/** CSS filter that recolours the sprite of `carId` according to its paint ("" when stock). */
export function usePaintFilter(carId: string): string {
  return paintFilter(useContext(PaintCtx)[carId]);
}

/**
 * A car sprite that follows the paint of `carId`.
 * `shadow` keeps a CSS drop-shadow working even when a paint filter is applied.
 */
export function PaintedImg({
  carId,
  shadow,
  style,
  ...rest
}: { carId: string; shadow?: string } & ImgHTMLAttributes<HTMLImageElement>) {
  const paint = usePaintFilter(carId);
  const filter = [paint, shadow].filter(Boolean).join(" ") || undefined;
  return <img {...rest} style={{ ...style, filter }} />;
}
