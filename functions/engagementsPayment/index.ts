import * as apex from 'apex.js';
import {pay} from "./pay";
import {spread} from "../../lib/spread";
import {confirm} from "./confirm";

export default apex(spread(
  pay,
  confirm
));