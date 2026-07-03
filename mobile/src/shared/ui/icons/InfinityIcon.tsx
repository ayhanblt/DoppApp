import React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";

export function InfinityIcon({ size = 64, color = "currentColor", ...props }: SvgProps & { size?: number | string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path
        fill="none"
        stroke={color}
        strokeLinecap="round"
        d="M6.5 12.2q-.75.3-1.5.3C2.5 12.5.5 10.5.5 8s2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 .7-.2 1.4-.5 2m.6-6.3c.4-.1.9-.2 1.4-.2c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5s-4.5-2-4.5-4.5c0-.7.2-1.4.5-2"
      />
    </Svg>
  );
}
