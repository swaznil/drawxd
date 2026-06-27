import { registerShape } from "../registry";

import rect from "./rect";
import diamond from "./diamond";
import ellipse from "./ellipse";
import hexagon from "./hexagon";
import heart from "./heart";
import arrow from "./arrow";
import star from "./star";

import line from "./line";
import pencil from "./pencil";
import text from "./text";

[
  rect,
  diamond,
  ellipse,
  hexagon,
  heart,
  arrow,
  star,
  line,
  pencil,
  text,
].forEach(registerShape);
