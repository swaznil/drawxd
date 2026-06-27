import { registerShape } from "../registry";

import rect from "./rect";
import diamond from "./diamond";
import ellipse from "./ellipse";
import hexagon from "./hexagon";
import heart from "./heart";
import arrow from "./arrow";
import star from "./star";

[
  rect,
  diamond,
  ellipse,
  hexagon,
  heart,
  arrow,
  star,
].forEach(registerShape);