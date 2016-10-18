import * as apex from 'apex.js';
import {spread} from "../../lib/spread";
import {profileCreate} from "./create";
import {profileUpdate} from "./update";
import {profileRemove} from "./remove";

export default apex(
  spread(profileCreate, profileUpdate, profileRemove)
)